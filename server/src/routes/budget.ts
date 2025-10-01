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
    res.status(500).send(err);
  }
});

// Create or update budget
router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const budgetData = req.body;
    
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
    res.status(500).send(err);
  }
});

export default router;