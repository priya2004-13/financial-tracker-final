import mongoose from "mongoose";

interface TransactionTemplate {
    userId: string;
    templateName: string; // e.g., "Monthly Rent", "Coffee"
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
}

const transactionTemplateSchema = new mongoose.Schema<TransactionTemplate>(
    {
        userId: { type: String, required: true, index: true },
        templateName: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        paymentMethod: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const TransactionTemplateModel = mongoose.model<TransactionTemplate>(
    "TransactionTemplate",
    transactionTemplateSchema
);

export default TransactionTemplateModel;
