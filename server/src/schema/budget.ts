import mongoose from "mongoose";

interface Budget {
  userId: string;
  monthlySalary: number;
  categoryBudgets: {
    Food: number;
    Rent: number;
    Utilities: number;
    Entertainment: number;
    Other: number;
  };
}

const budgetSchema = new mongoose.Schema<Budget>(
  {
    userId: { type: String, required: true, unique: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    categoryBudgets: {
      Food: { type: Number, required: true, default: 0 },
      Rent: { type: Number, required: true, default: 0 },
      Utilities: { type: Number, required: true, default: 0 },
      Entertainment: { type: Number, required: true, default: 0 },
      Other: { type: Number, required: true, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const BudgetModel = mongoose.model<Budget>("Budget", budgetSchema);

export default BudgetModel;