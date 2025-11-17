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

    console.log('📥 Received budget update request:', {
      userId,
      budgetData,
      hasIncomeSources: !!budgetData.incomeSources,
      incomeSourcesCount: budgetData.incomeSources?.length || 0
    });

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

    // Validate income sources
    if (budgetData.incomeSources) {
      if (!Array.isArray(budgetData.incomeSources)) {
        return res.status(400).send("Invalid income sources format - must be an array");
      }

      for (const source of budgetData.incomeSources) {
        if (!source.name || typeof source.name !== 'string') {
          return res.status(400).send("Each income source must have a valid name");
        }
        if (typeof source.amount !== 'number' || source.amount < 0) {
          return res.status(400).send(`Invalid amount for income source: ${source.name}`);
        }
        if (!['fixed', 'variable'].includes(source.type)) {
          return res.status(400).send(`Invalid type for income source: ${source.name}`);
        }
        if (typeof source.isActive !== 'boolean') {
          return res.status(400).send(`Invalid isActive value for income source: ${source.name}`);
        }
      }
    }

    // Find existing budget or create new one
    const updateData: any = {
      userId: userId,
      monthlySalary: budgetData.monthlySalary,
      categoryBudgets: budgetData.categoryBudgets,
    };

    // Include incomeSources if provided
    if (budgetData.incomeSources !== undefined) {
      updateData.incomeSources = budgetData.incomeSources;
      // If income sources provided, compute monthly salary as total of active income sources
      if (Array.isArray(budgetData.incomeSources)) {
        const total = (budgetData.incomeSources as any[])
          .filter(s => s.isActive)
          .reduce((sum, s) => sum + (s.amount || 0), 0);
        if (total > 0) {
          updateData.monthlySalary = total;
        }
      }
    }

    const budget = await BudgetModel.findOneAndUpdate(
      { userId: userId },
      updateData,
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    console.log('📤 Sending updated budget response:', {
      userId: budget.userId,
      hasIncomeSources: !!budget.incomeSources,
      incomeSourcesCount: budget.incomeSources?.length || 0,
      incomeSources: budget.incomeSources
    });

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