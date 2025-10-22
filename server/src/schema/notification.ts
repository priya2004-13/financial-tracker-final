// server/src/schema/notification.ts
import mongoose from "mongoose";

interface Notification {
    userId: string;
    type: 'anomaly' | 'budget_warning' | 'recurring_payment' | 'goal_achieved';
    title: string;
    message: string;
    isRead: boolean;
    severity: 'info' | 'warning' | 'error' | 'success';
    metadata?: any;
}

const notificationSchema = new mongoose.Schema<Notification>(
    {
        userId: { type: String, required: true, index: true },
        type: {
            type: String,
            required: true,
            enum: ['anomaly', 'budget_warning', 'recurring_payment', 'goal_achieved']
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        severity: {
            type: String,
            required: true,
            enum: ['info', 'warning', 'error', 'success'],
            default: 'info'
        },
        metadata: { type: mongoose.Schema.Types.Mixed }
    },
    {
        timestamps: true,
    }
);

const NotificationModel = mongoose.model<Notification>(
    "Notification",
    notificationSchema
);

export default NotificationModel;