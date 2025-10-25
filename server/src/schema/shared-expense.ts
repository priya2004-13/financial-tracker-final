// server/src/schema/shared-expense.ts - NEW FEATURE
import mongoose from "mongoose";

interface Participant {
    userId: string;
    userName: string;
    amountOwed: number;
    hasPaid: boolean;
}

interface SharedExpense {
    groupId: string; // ID of the expense group (e.g., "family", "roommates")
    groupName: string;
    createdBy: string;
    createdByName: string;
    date: Date;
    description: string;
    totalAmount: number;
    category: string;
    paymentMethod: string;
    paidBy: string; // userId of who paid
    paidByName: string;
    splitType: 'equal' | 'custom' | 'percentage';
    participants: Participant[];
}

const sharedExpenseSchema = new mongoose.Schema<SharedExpense>(
    {
        groupId: { type: String, required: true, index: true },
        groupName: { type: String, required: true },
        createdBy: { type: String, required: true },
        createdByName: { type: String, required: true },
        date: { type: Date, required: true, default: Date.now },
        description: { type: String, required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        category: { type: String, required: true },
        paymentMethod: { type: String, required: true },
        paidBy: { type: String, required: true },
        paidByName: { type: String, required: true },
        splitType: {
            type: String,
            required: true,
            enum: ['equal', 'custom', 'percentage'],
            default: 'equal'
        },
        participants: [{
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            amountOwed: { type: Number, required: true, min: 0 },
            hasPaid: { type: Boolean, default: false }
        }]
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
sharedExpenseSchema.index({ groupId: 1, createdBy: 1 });
sharedExpenseSchema.index({ 'participants.userId': 1 });

const SharedExpenseModel = mongoose.model<SharedExpense>(
    "SharedExpense",
    sharedExpenseSchema
);

export default SharedExpenseModel;