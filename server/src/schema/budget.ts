// server/src/schema/budget.ts - FIXED FOR DYNAMIC CATEGORIES + INCOME SOURCES
import mongoose from "mongoose";

interface IncomeSource {
  name: string;
  amount: number;
  type: 'fixed' | 'variable'; // fixed (salary) or variable (freelance, gig)
  isActive: boolean;
}

interface Budget {
  userId: string;
  monthlySalary: number;
  incomeSources: IncomeSource[]; // New field for multiple income sources
  categoryBudgets: { [key: string]: number }; // Changed to allow dynamic categories
}

const incomeSourceSchema = new mongoose.Schema<IncomeSource>({
  name: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  type: { type: String, enum: ['fixed', 'variable'], required: true },
  isActive: { type: Boolean, default: true }
}, { _id: true });

const budgetSchema = new mongoose.Schema<Budget>(
  {
    userId: { type: String, required: true, unique: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    incomeSources: { type: [incomeSourceSchema], default: [] },
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
export type { IncomeSource };