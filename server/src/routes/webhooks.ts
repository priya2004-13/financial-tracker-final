// server/src/routes/webhooks.ts - ENHANCED VERSION
import express, { Request, Response } from "express";
import { Webhook } from "svix";
import UserModel from "../schema/user";

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

        // Handle events
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

        return res.status(200).json({
            status: "success",
            event: event.type,
            userId: event.data.id,
            timestamp: new Date().toISOString()
        });
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

// Handle user.created event
async function handleUserCreated(data: ClerkUserData) {
    try {
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) {
            console.warn("⚠️ No email found for user", data.id);
            throw new Error("No email address found");
        }

        // Check for duplicate
        const existingUser = await UserModel.findOne({
            $or: [{ clerkId: data.id }, { email: email }]
        });

        if (existingUser) {
            console.log(`ℹ️ User already exists: ${data.id}`);
            return existingUser;
        }

        const user = new UserModel({
            clerkId: data.id,
            email: email,
            firstName: data.first_name || "User",
            lastName: data.last_name || "",
            phoneNumber: data.phone_numbers?.[0]?.phone_number,
            avatar: data.image_url,
            username: data.username,
            isOnboarded: false,
            lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : undefined
        });

        await user.save();
        console.log(`✅ User created in database: ${data.id} (${email})`);
        return user;
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
            { new: true, upsert: true } // Create if doesn't exist
        );

        console.log(`✅ User updated/created: ${data.id}`);
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