// server/src/schema/recurring-payment.ts
import mongoose from "mongoose";

interface RecurringPayment {
  userId: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextPaymentDate: Date;
  category: string;
  isActive: boolean;
}

const recurringPaymentSchema = new mongoose.Schema<RecurringPayment>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: { 
      type: String, 
      required: true, 
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    nextPaymentDate: { type: Date, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
  }
);

const RecurringPaymentModel = mongoose.model<RecurringPayment>(
  "RecurringPayment",
  recurringPaymentSchema
);

export default RecurringPaymentModel;