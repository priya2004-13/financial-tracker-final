// server/src/routes/webhooks.ts
// ============================================
import express, { Request, Response } from "express";
import { Webhook } from "svix";
import UserModel from "../schema/user";

const router = express.Router();
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set!");
}

// Type for Clerk webhook event
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
        console.log("🔔 Webhook received");

        // Get Svix headers
        const svixId = req.headers["svix-id"] as string;
        const svixTimestamp = req.headers["svix-timestamp"] as string;
        const svixSignature = req.headers["svix-signature"] as string;

        // Verify all headers are present
        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("❌ Missing Svix headers");
            return res.status(400).json({ error: "Missing required headers" });
        }

        // Get body as string for verification
        const body = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

        // Verify webhook using Svix
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

        console.log(`✅ Webhook verified - Event Type: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            case "user.created":
                await handleUserCreated(event.data);
                break;
            case "user.updated":
                await handleUserUpdated(event.data);
                break;
            case "user.deleted":
                await handleUserDeleted(event.data);
                break;
            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ status: "success", event: event.type });
    } catch (err) {
        console.error("❌ Webhook processing error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Handle user.created event
async function handleUserCreated(data: ClerkUserData) {
    try {
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) {
            console.warn("⚠️ No email found for user", data.id);
            return;
        }

        const user = new UserModel({
            clerkId: data.id,
            email: email,
            firstName: data.first_name || "User",
            lastName: data.last_name || "",
            phoneNumber: data.phone_numbers?.[0]?.phone_number,
            avatar: data.image_url,
            username: data.username,
        });

        await user.save();
        console.log(`✅ User created in database: ${data.id} (${email})`);
    } catch (err) {
        console.error("❌ Error in handleUserCreated:", err);
        throw err;
    }
}

// Handle user.updated event
async function handleUserUpdated(data: ClerkUserData) {
    try {
        const email = data.email_addresses?.[0]?.email_address;

        const updateData: any = {
            firstName: data.first_name || "User",
            lastName: data.last_name || "",
            avatar: data.image_url,
            username: data.username,
        };

        if (email) {
            updateData.email = email;
        }

        if (data.last_sign_in_at) {
            updateData.lastSignInAt = new Date(data.last_sign_in_at);
        }

        if (data.phone_numbers?.[0]) {
            updateData.phoneNumber = data.phone_numbers[0].phone_number;
        }

        const result = await UserModel.findOneAndUpdate(
            { clerkId: data.id },
            updateData,
            { new: true, upsert: true }
        );

        console.log(`✅ User updated in database: ${data.id}`);
        return result;
    } catch (err) {
        console.error("❌ Error in handleUserUpdated:", err);
        throw err;
    }
}

// Handle user.deleted event
async function handleUserDeleted(data: ClerkUserData) {
    try {
        await UserModel.deleteOne({ clerkId: data.id });
        console.log(`✅ User deleted from database: ${data.id}`);
    } catch (err) {
        console.error("❌ Error in handleUserDeleted:", err);
        throw err;
    }
}

export default router;
