// server/src/utils/webhook-retry.ts
import WebhookLogModel from "../schema/webhook-log";
import UserModel from "../schema/user";

interface ClerkUserData {
    id: string;
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

// Calculate exponential backoff delay with jitter
export function getRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 1000; // Random 0-1 second
    return delay + jitter;
}

// Log webhook event
export async function logWebhookEvent(
    eventId: string,
    eventType: string,
    clerkUserId: string,
    payload: any,
    status: 'success' | 'failure' | 'pending' = 'pending'
) {
    try {
        const log = await WebhookLogModel.findOneAndUpdate(
            { eventId },
            {
                eventId,
                eventType,
                clerkUserId,
                payload,
                status,
                attempt: 1,
                processedAt: status === 'success' ? new Date() : undefined
            },
            { upsert: true, new: true }
        );
        return log;
    } catch (error) {
        console.error("Error logging webhook:", error);
        return null;
    }
}

// Update webhook log status
export async function updateWebhookStatus(
    eventId: string,
    status: 'success' | 'failure' | 'retrying',
    error?: string,
    nextRetry?: Date
) {
    try {
        await WebhookLogModel.findOneAndUpdate(
            { eventId },
            {
                status,
                error,
                nextRetry,
                processedAt: status === 'success' ? new Date() : undefined,
                $inc: { attempt: status === 'retrying' ? 1 : 0 }
            }
        );
    } catch (error) {
        console.error("Error updating webhook status:", error);
    }
}

// Process user creation with retry
export async function processUserCreation(data: ClerkUserData): Promise<boolean> {
    try {
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) {
            throw new Error("No email address found");
        }

        // Check for duplicate
        const existingUser = await UserModel.findOne({
            $or: [{ clerkId: data.id }, { email: email }]
        });

        if (existingUser) {
            console.log(`✅ User already exists: ${data.id}`);
            return true;
        }

        // Create new user
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
        console.log(`✅ User created: ${data.id} (${email})`);
        return true;
    } catch (error) {
        console.error("❌ Error processing user creation:", error);
        throw error;
    }
}

// Process user update with retry
export async function processUserUpdate(data: ClerkUserData): Promise<boolean> {
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

        console.log(`✅ User updated/created: ${data.id}`);
        return true;
    } catch (error) {
        console.error("❌ Error processing user update:", error);
        throw error;
    }
}

// Process user deletion with retry
export async function processUserDeletion(data: ClerkUserData): Promise<boolean> {
    try {
        await UserModel.deleteOne({ clerkId: data.id });
        console.log(`✅ User deleted: ${data.id}`);
        return true;
    } catch (error) {
        console.error("❌ Error processing user deletion:", error);
        throw error;
    }
}

// Retry failed webhooks
export async function retryFailedWebhooks() {
    try {
        const now = new Date();

        // Find webhooks that need retry
        const failedWebhooks = await WebhookLogModel.find({
            status: { $in: ['retrying', 'failure'] },
            nextRetry: { $lte: now },
            attempt: { $lt: 5 } // Max 5 attempts
        }).limit(10);

        console.log(`🔄 Found ${failedWebhooks.length} webhooks to retry`);

        for (const webhook of failedWebhooks) {
            try {
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
                    await updateWebhookStatus(webhook.eventId, 'success');
                    console.log(`✅ Retry successful: ${webhook.eventId}`);
                } else {
                    throw new Error("Processing returned false");
                }
            } catch (error: any) {
                const newAttempt = webhook.attempt + 1;
                const nextRetry = new Date(Date.now() + getRetryDelay(newAttempt));

                if (newAttempt >= webhook.maxRetries) {
                    await updateWebhookStatus(webhook.eventId, 'failure', error.message);
                    console.error(`❌ Max retries reached for ${webhook.eventId}`);
                } else {
                    await updateWebhookStatus(webhook.eventId, 'retrying', error.message, nextRetry);
                    console.log(`⏳ Retry scheduled for ${webhook.eventId} at ${nextRetry.toISOString()}`);
                }
            }
        }
    } catch (error) {
        console.error("Error in retry mechanism:", error);
    }
}

// Start retry worker (call this in server startup)
export function startWebhookRetryWorker(intervalMs: number = 60000) {
    console.log(`🔄 Starting webhook retry worker (interval: ${intervalMs}ms)`);

    setInterval(async () => {
        await retryFailedWebhooks();
    }, intervalMs);

    // Initial run
    retryFailedWebhooks();
}
