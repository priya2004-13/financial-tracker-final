// server/src/schema/budget.ts - FIXED FOR DYNAMIC CATEGORIES
import mongoose from "mongoose";

interface Budget {
  userId: string;
  monthlySalary: number;
  categoryBudgets: { [key: string]: number }; // Changed to allow dynamic categories
}

const budgetSchema = new mongoose.Schema<Budget>(
  {
    userId: { type: String, required: true, unique: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    categoryBudgets: {
      type: Map,
      of: Number,
      default: () => ({
        Food: 0,
        Rent: 0,
        Utilities: 0,
        Entertainment: 0,
        Other: 0,
      })
    }
  },
  {
    timestamps: true,
  }
);

// Convert Map to plain object for JSON responses
budgetSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.categoryBudgets instanceof Map) {
      ret.categoryBudgets = Object.fromEntries(ret.categoryBudgets);
    }
    return ret;
  }
});

const BudgetModel = mongoose.model<Budget>("Budget", budgetSchema);

export default BudgetModel;