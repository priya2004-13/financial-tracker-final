import express, { Request, Response } from "express";
import SavingsGoalModel from "../schema/savings-goal";

const router = express.Router();

// GET all savings goals for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const goals = await SavingsGoalModel.find({ userId: userId });
    res.status(200).send(goals);
  } catch (err) {
    res.status(500).send(err);
  }
});

// POST a new savings goal
router.post("/", async (req: Request, res: Response) => {
  try {
    const newGoal = new SavingsGoalModel(req.body);
    const savedGoal = await newGoal.save();
    res.status(200).send(savedGoal);
  } catch (err) {
    res.status(500).send(err);
  }
});

// PUT (contribute to) a savings goal
router.put("/:goalId/contribute", async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).send("Contribution amount must be a positive number.");
    }

    const goal = await SavingsGoalModel.findById(goalId);
    if (!goal) {
      return res.status(404).send("Goal not found.");
    }

    goal.currentAmount += amount;
    await goal.save();
    res.status(200).send(goal);
  } catch (err) {
    res.status(500).send(err);
  }
});


// DELETE a savings goal
router.delete("/:goalId", async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const goal = await SavingsGoalModel.findByIdAndDelete(goalId);
    if (!goal) return res.status(404).send();
    res.status(200).send(goal);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;