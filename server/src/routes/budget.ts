// server/src/routes/budget.ts
import express, { Request, Response } from "express";
import BudgetModel from "../schema/budget";

const router = express.Router();

// Get budget by user ID
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const budget = await BudgetModel.findOne({ userId: userId });

    if (!budget) {
      return res.status(404).send("No budget found for the user.");
    }

    res.status(200).send(budget);
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).send(err);
  }
});

// Create or update budget with validation
router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const budgetData = req.body;

    // Validation
    if (typeof budgetData.monthlySalary !== 'number' || budgetData.monthlySalary < 0) {
      return res.status(400).send("Invalid monthly salary value");
    }

    // Validate category budgets
    if (budgetData.categoryBudgets) {
      for (const [category, amount] of Object.entries(budgetData.categoryBudgets)) {
        if (typeof amount !== 'number' || amount < 0) {
          return res.status(400).send(`Invalid budget amount for category: ${category}`);
        }
      }

      // Check if total allocated exceeds salary (warning, not error)
      const totalAllocated = Object.values(budgetData.categoryBudgets).reduce(
        (sum: number, val: any) => sum + (val || 0), 0
      );

      if (totalAllocated > budgetData.monthlySalary) {
        console.warn(`User ${userId}: Budget allocation (${totalAllocated}) exceeds salary (${budgetData.monthlySalary})`);
      }
    }

    // Find existing budget or create new one
    const budget = await BudgetModel.findOneAndUpdate(
      { userId: userId },
      {
        userId: userId,
        monthlySalary: budgetData.monthlySalary,
        categoryBudgets: budgetData.categoryBudgets,
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    res.status(200).send(budget);
  } catch (err) {
    console.error("Error updating budget:", err);
    res.status(500).send(err);
  }
});

// Delete budget
router.delete("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const budget = await BudgetModel.findOneAndDelete({ userId: userId });

    if (!budget) {
      return res.status(404).send("No budget found for the user.");
    }

    res.status(200).send(budget);
  } catch (err) {
    console.error("Error deleting budget:", err);
    res.status(500).send(err);
  }
});

export default router;