import mongoose from "mongoose";

interface Debt {
    userId: string;
    name: string;
    principal: number;
    remaining: number;
    interestRate: number; // yearly percentage
    minimumPayment: number;
    monthlyPayment: number;
    priority?: 'high' | 'medium' | 'low';
    type?: string;
    startDate?: Date;
}

const debtSchema = new mongoose.Schema<Debt>(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        principal: { type: Number, required: true, min: 0 },
        remaining: { type: Number, required: true, min: 0 },
        interestRate: { type: Number, required: true, min: 0 },
        minimumPayment: { type: Number, required: true, min: 0 },
        monthlyPayment: { type: Number, required: true, min: 0 },
        type: { type: String, required: false },
        startDate: { type: Date, required: false },
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'   
        },

    },
    {
        timestamps: true,
    }
);

const DebtModel = mongoose.model<Debt>("Debt", debtSchema);

export default DebtModel;
export { Debt };
