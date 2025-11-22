import mongoose from "mongoose";

interface SavingsGoal {
    userId: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    priority?: 'high' | 'medium' | 'low';
}

const savingsGoalSchema = new mongoose.Schema<SavingsGoal>(
    {
        userId: { type: String, required: true },
        goalName: { type: String, required: true },
        targetAmount: { type: Number, required: true, min: 0 },
        currentAmount: { type: Number, required: true, default: 0, min: 0 },
        targetDate: { type: Date, required: true },
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'  // ✅ Add this
        },
    },
    {
        timestamps: true,
    }
);

const SavingsGoalModel = mongoose.model<SavingsGoal>(
    "SavingsGoal",
    savingsGoalSchema
);

export default SavingsGoalModel;