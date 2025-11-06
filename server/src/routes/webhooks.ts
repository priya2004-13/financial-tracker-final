// server/src/routes/webhooks.ts - ENHANCED WITH RETRY LOGIC
import express, { Request, Response } from "express";
import { Webhook } from "svix";
import UserModel from "../schema/user";
import {
    logWebhookEvent,
    updateWebhookStatus,
    processUserCreation,
    processUserUpdate,
    processUserDeletion,
    getRetryDelay
} from "../utils/webhook-retry";
import WebhookLogModel from "../schema/webhook-log";

const router = express.Router();
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set!");
}

interface ClerkWebhookEvent {
    type: string;
    data: ClerkUserData;
}

interface ClerkUserData {
    id: string;
    object: string;
    email_addresses?: Array<{ email_address: string }>;
    phone_numbers?: Array<{ phone_number: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    username?: string;
    created_at?: number;
    updated_at?: number;
    last_sign_in_at?: number;
}

// POST webhook endpoint
router.post("/", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    try {
        console.log("🔔 Webhook received at:", new Date().toISOString());

        const svixId = req.headers["svix-id"] as string;
        const svixTimestamp = req.headers["svix-timestamp"] as string;
        const svixSignature = req.headers["svix-signature"] as string;

        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("❌ Missing Svix headers");
            return res.status(400).json({ error: "Missing required headers" });
        }

        const body = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

        const webhook = new Webhook(WEBHOOK_SECRET);
        let event: ClerkWebhookEvent;

        try {
            event = webhook.verify(body, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            }) as ClerkWebhookEvent;
        } catch (err) {
            console.error("❌ Webhook verification failed:", err);
            return res.status(400).json({ error: "Webhook verification failed" });
        }

        console.log(`✅ Webhook verified - Event: ${event.type}, User: ${event.data.id}`);

        // Log webhook event
        const eventId = req.headers["svix-id"] as string;
        await logWebhookEvent(eventId, event.type, event.data.id, event.data);

        // Handle events with retry logic
        try {
            let success = false;

            switch (event.type) {
                case "user.created":
                    success = await processUserCreation(event.data);
                    break;
                case "user.updated":
                    success = await processUserUpdate(event.data);
                    break;
                case "user.deleted":
                    success = await processUserDeletion(event.data);
                    break;
                default:
                    console.log(`ℹ️ Unhandled event type: ${event.type}`);
                    success = true; // Don't retry unknown events
            }

            if (success) {
                await updateWebhookStatus(eventId, 'success');
                return res.status(200).json({
                    status: "success",
                    event: event.type,
                    userId: event.data.id,
                    timestamp: new Date().toISOString()
                });
            } else {
                throw new Error("Event processing returned false");
            }
        } catch (processingError: any) {
            console.error("❌ Event processing error:", processingError);

            // Schedule retry
            const nextRetry = new Date(Date.now() + getRetryDelay(1));
            await updateWebhookStatus(eventId, 'retrying', processingError.message, nextRetry);

            // Still return 200 to acknowledge receipt
            return res.status(200).json({
                status: "acknowledged",
                message: "Event received but processing failed, scheduled for retry",
                event: event.type,
                userId: event.data.id,
                nextRetry: nextRetry.toISOString(),
                timestamp: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error("❌ Webhook processing error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// NEW: Fallback manual user creation endpoint
router.post("/create-fallback", express.json(), async (req: Request, res: Response) => {
    try {
        const { clerkId, email, firstName, lastName, phoneNumber, avatar, username } = req.body;

        if (!clerkId || !email) {
            return res.status(400).json({ error: "clerkId and email are required" });
        }

        console.log(`⚠️ Manual fallback creation for user: ${clerkId}`);

        // Check if user already exists
        const existingUser = await UserModel.findOne({ clerkId });
        if (existingUser) {
            console.log(`✅ User already exists: ${clerkId}`);
            return res.status(200).json({
                status: "exists",
                user: existingUser
            });
        }

        // Create new user
        const newUser = new UserModel({
            clerkId,
            email,
            firstName: firstName || "User",
            lastName: lastName || "",
            phoneNumber,
            avatar,
            username,
            isOnboarded: false
        });

        await newUser.save();

        console.log(`✅ Manual user creation successful: ${clerkId} (${email})`);

        return res.status(201).json({
            status: "created",
            user: newUser
        });
    } catch (err) {
        console.error("❌ Manual creation error:", err);
        return res.status(500).json({ error: "Failed to create user" });
    }
});

// GET webhook health/status endpoint
router.get("/health", async (req: Request, res: Response) => {
    try {
        const stats = await WebhookLogModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentFailures = await WebhookLogModel
            .find({ status: { $in: ['failure', 'retrying'] } })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('eventId eventType clerkUserId status attempt error createdAt nextRetry');

        const statusMap: Record<string, number> = {};
        stats.forEach(stat => {
            statusMap[stat._id] = stat.count;
        });

        res.status(200).json({
            healthy: (statusMap.failure || 0) < 10, // Consider unhealthy if 10+ failures
            stats: {
                success: statusMap.success || 0,
                failure: statusMap.failure || 0,
                retrying: statusMap.retrying || 0,
                pending: statusMap.pending || 0
            },
            recentFailures,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error fetching webhook health:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET webhook logs with filtering
router.get("/logs", async (req: Request, res: Response) => {
    try {
        const {
            status,
            eventType,
            clerkUserId,
            page = 1,
            limit = 50
        } = req.query;

        const query: any = {};
        if (status) query.status = status;
        if (eventType) query.eventType = eventType;
        if (clerkUserId) query.clerkUserId = clerkUserId;

        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            WebhookLogModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .select('-payload'), // Exclude full payload for performance
            WebhookLogModel.countDocuments(query)
        ]);

        res.status(200).json({
            logs,
            pagination: {
                currentPage: Number(page),
                limit: Number(limit),
                totalRecords: total,
                totalPages: Math.ceil(total / Number(limit)),
                hasMore: skip + logs.length < total
            }
        });
    } catch (err) {
        console.error("❌ Error fetching webhook logs:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST manual retry for specific webhook
router.post("/retry/:eventId", async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;

        const webhook = await WebhookLogModel.findOne({ eventId });
        if (!webhook) {
            return res.status(404).json({ error: "Webhook event not found" });
        }

        if (webhook.status === 'success') {
            return res.status(400).json({ error: "Webhook already processed successfully" });
        }

        let success = false;
        switch (webhook.eventType) {
            case 'user.created':
                success = await processUserCreation(webhook.payload);
                break;
            case 'user.updated':
                success = await processUserUpdate(webhook.payload);
                break;
            case 'user.deleted':
                success = await processUserDeletion(webhook.payload);
                break;
        }

        if (success) {
            await updateWebhookStatus(eventId, 'success');
            res.status(200).json({
                status: "success",
                message: "Webhook retried successfully",
                eventId
            });
        } else {
            throw new Error("Manual retry failed");
        }
    } catch (err: any) {
        console.error("❌ Manual retry error:", err);
        res.status(500).json({ error: err.message || "Retry failed" });
    }
});

export default router;