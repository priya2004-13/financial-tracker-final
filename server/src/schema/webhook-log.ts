// server/src/schema/webhook-log.ts
import mongoose from "mongoose";

export interface WebhookLog {
    eventId: string;
    eventType: string;
    clerkUserId: string;
    status: 'success' | 'failure' | 'pending' | 'retrying';
    attempt: number;
    maxRetries: number;
    payload: any;
    error?: string;
    processedAt?: Date;
    nextRetry?: Date;
}

const webhookLogSchema = new mongoose.Schema<WebhookLog>(
    {
        eventId: { type: String, required: true, unique: true, index: true },
        eventType: { type: String, required: true, index: true },
        clerkUserId: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: ['success', 'failure', 'pending', 'retrying'],
            default: 'pending',
            index: true
        },
        attempt: { type: Number, default: 1 },
        maxRetries: { type: Number, default: 5 },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        error: { type: String },
        processedAt: { type: Date },
        nextRetry: { type: Date, index: true }
    },
    {
        timestamps: true
    }
);

// Index for finding retryable webhooks
webhookLogSchema.index({ status: 1, nextRetry: 1 });

const WebhookLogModel = mongoose.model<WebhookLog>("WebhookLog", webhookLogSchema);

export default WebhookLogModel;
