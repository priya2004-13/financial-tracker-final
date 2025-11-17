import express from "express";
import DebtModel from "../schema/debt";

const router = express.Router();

// GET debts for a user
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const debts = await DebtModel.find({ userId });
        res.status(200).send(debts);
    } catch (err) {
        console.error("GET /debts/:userId error", err);
        res.status(500).send(err);
    }
});

// POST a new debt
router.post("/", async (req, res) => {
    try {
        const newDebt = new DebtModel(req.body);
        const saved = await newDebt.save();
        res.status(200).send(saved);
    } catch (err) {
        console.error("POST /debts error", err);
        res.status(500).send(err);
    }
});

// PUT update a debt
router.put("/:debtId", async (req, res) => {
    try {
        const { debtId } = req.params;
        const updated = await DebtModel.findByIdAndUpdate(debtId, req.body, { new: true });
        if (!updated) return res.status(404).send({ message: "Debt not found" });
        res.status(200).send(updated);
    } catch (err) {
        console.error("PUT /debts/:debtId error", err);
        res.status(500).send(err);
    }
});

// PUT pay an amount towards a debt -> reduces remaining
router.put("/:debtId/pay", async (req, res) => {
    try {
        const { debtId } = req.params;
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) return res.status(400).send({ message: "Invalid payment amount" });

        const debt = await DebtModel.findById(debtId);
        if (!debt) return res.status(404).send({ message: "Debt not found" });

        debt.remaining = Math.max(0, debt.remaining - amount);
        await debt.save();
        res.status(200).send(debt);
    } catch (err) {
        console.error("PUT /debts/:debtId/pay error", err);
        res.status(500).send(err);
    }
});

// DELETE a debt
router.delete("/:debtId", async (req, res) => {
    try {
        const { debtId } = req.params;
        const deleted = await DebtModel.findByIdAndDelete(debtId);
        if (!deleted) return res.status(404).send({ message: "Debt not found" });
        res.status(200).send(deleted);
    } catch (err) {
        console.error("DELETE /debts/:debtId error", err);
        res.status(500).send(err);
    }
});

export default router;
