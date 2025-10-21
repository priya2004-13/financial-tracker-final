import mongoose from "mongoose";

interface SavingsGoal {
    userId: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
}

const savingsGoalSchema = new mongoose.Schema<SavingsGoal>(
    {
        userId: { type: String, required: true },
        goalName: { type: String, required: true },
        targetAmount: { type: Number, required: true, min: 0 },
        currentAmount: { type: Number, required: true, default: 0, min: 0 },
        targetDate: { type: Date, required: true },
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