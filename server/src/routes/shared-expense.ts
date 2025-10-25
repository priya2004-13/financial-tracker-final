// server/src/routes/shared-expenses.ts - NEW FEATURE
import express, { Request, Response } from "express";
import SharedExpenseModel from "../schema/shared-expense";

const router = express.Router();

// GET all shared expenses for a user (across all groups)
router.get("/user/:userId", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const expenses = await SharedExpenseModel.find({
            $or: [
                { createdBy: userId },
                { paidBy: userId },
                { 'participants.userId': userId }
            ]
        }).sort({ date: -1 });
        res.status(200).send(expenses);
    } catch (err) {
        console.error("Error fetching shared expenses:", err);
        res.status(500).send("Error fetching shared expenses");
    }
});

// GET shared expenses for a specific group
router.get("/group/:groupId", async (req: Request, res: Response) => {
    try {
        const groupId = req.params.groupId;
        const expenses = await SharedExpenseModel.find({ groupId }).sort({ date: -1 });
        res.status(200).send(expenses);
    } catch (err) {
        console.error("Error fetching group expenses:", err);
        res.status(500).send("Error fetching group expenses");
    }
});

// GET balance summary for a user in a group
router.get("/balance/:groupId/:userId", async (req: Request, res: Response) => {
    try {
        const { groupId, userId } = req.params;

        const expenses = await SharedExpenseModel.find({ groupId });

        let totalOwed = 0; // Amount this user owes to others
        let totalOwedToUser = 0; // Amount others owe to this user

        expenses.forEach(expense => {
            if (expense.paidBy === userId) {
                // User paid for others
                expense.participants.forEach(p => {
                    if (p.userId !== userId && !p.hasPaid) {
                        totalOwedToUser += p.amountOwed;
                    }
                });
            } else {
                // Someone else paid
                const participant = expense.participants.find(p => p.userId === userId);
                if (participant && !participant.hasPaid) {
                    totalOwed += participant.amountOwed;
                }
            }
        });

        res.status(200).send({
            groupId,
            userId,
            totalOwed,
            totalOwedToUser,
            netBalance: totalOwedToUser - totalOwed
        });
    } catch (err) {
        console.error("Error calculating balance:", err);
        res.status(500).send("Error calculating balance");
    }
});

// POST create a shared expense
router.post("/", async (req: Request, res: Response) => {
    try {
        const expenseData = req.body;

        // Validate
        if (!expenseData.groupId || !expenseData.totalAmount || !expenseData.participants || expenseData.participants.length === 0) {
            return res.status(400).send("Missing required fields");
        }

        // Calculate splits based on type
        let participants = expenseData.participants;

        if (expenseData.splitType === 'equal') {
            const amountPerPerson = expenseData.totalAmount / participants.length;
            participants = participants.map((p: any) => ({
                ...p,
                amountOwed: amountPerPerson
            }));
        } else if (expenseData.splitType === 'percentage') {
            // Validate percentages add up to 100
            const totalPercentage = participants.reduce((sum: number, p: any) => sum + (p.percentage || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                return res.status(400).send("Percentages must add up to 100");
            }
            participants = participants.map((p: any) => ({
                ...p,
                amountOwed: (expenseData.totalAmount * p.percentage) / 100
            }));
        }
        // For 'custom', amounts should already be set

        const newExpense = new SharedExpenseModel({
            ...expenseData,
            participants
        });

        const savedExpense = await newExpense.save();
        res.status(201).send(savedExpense);
    } catch (err) {
        console.error("Error creating shared expense:", err);
        res.status(500).send("Error creating shared expense");
    }
});

// PUT mark participant as paid
router.put("/:expenseId/mark-paid/:userId", async (req: Request, res: Response) => {
    try {
        const { expenseId, userId } = req.params;

        const expense = await SharedExpenseModel.findById(expenseId);
        if (!expense) {
            return res.status(404).send("Expense not found");
        }

        const participant = expense.participants.find(p => p.userId === userId);
        if (!participant) {
            return res.status(404).send("Participant not found");
        }

        participant.hasPaid = true;
        await expense.save();

        res.status(200).send(expense);
    } catch (err) {
        console.error("Error marking as paid:", err);
        res.status(500).send("Error marking as paid");
    }
});

// DELETE a shared expense
router.delete("/:expenseId", async (req: Request, res: Response) => {
    try {
        const { expenseId } = req.params;
        const expense = await SharedExpenseModel.findByIdAndDelete(expenseId);
        if (!expense) {
            return res.status(404).send("Expense not found");
        }
        res.status(200).send(expense);
    } catch (err) {
        console.error("Error deleting shared expense:", err);
        res.status(500).send("Error deleting shared expense");
    }
});

// GET detailed breakdown of who owes whom in a group
router.get("/breakdown/:groupId", async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const expenses = await SharedExpenseModel.find({ groupId });

        // Create a map of net balances between users
        const balances: { [key: string]: { [key: string]: number } } = {};

        expenses.forEach(expense => {
            const payer = expense.paidBy;

            expense.participants.forEach(participant => {
                if (participant.userId !== payer && !participant.hasPaid) {
                    if (!balances[participant.userId]) {
                        balances[participant.userId] = {};
                    }
                    if (!balances[participant.userId][payer]) {
                        balances[participant.userId][payer] = 0;
                    }
                    balances[participant.userId][payer] += participant.amountOwed;
                }
            });
        });

        // Simplify balances (net out mutual debts)
        const simplifiedBalances: Array<{
            from: string;
            fromName: string;
            to: string;
            toName: string;
            amount: number;
        }> = [];

        Object.keys(balances).forEach(debtor => {
            Object.keys(balances[debtor]).forEach(creditor => {
                const amount = balances[debtor][creditor];

                // Check if there's a reverse debt to net out
                if (balances[creditor] && balances[creditor][debtor]) {
                    const reverseAmount = balances[creditor][debtor];
                    if (amount > reverseAmount) {
                        simplifiedBalances.push({
                            from: debtor,
                            fromName: "", // Will need to be filled from user data
                            to: creditor,
                            toName: "",
                            amount: amount - reverseAmount
                        });
                    }
                    delete balances[creditor][debtor]; // Prevent duplicate
                } else if (amount > 0) {
                    simplifiedBalances.push({
                        from: debtor,
                        fromName: "",
                        to: creditor,
                        toName: "",
                        amount: amount
                    });
                }
            });
        });

        res.status(200).send(simplifiedBalances);
    } catch (err) {
        console.error("Error getting breakdown:", err);
        res.status(500).send("Error getting breakdown");
    }
});

export default router;