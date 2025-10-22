// server/src/routes/recurring-payments.ts
import express, { Request, Response } from "express";
import RecurringPaymentModel from "../schema/recurring-payment";

const router = express.Router();

// GET all recurring payments for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const payments = await RecurringPaymentModel.find({ userId: userId });
    res.status(200).send(payments);
  } catch (err) {
    res.status(500).send(err);
  }
});

// POST a new recurring payment
router.post("/", async (req: Request, res: Response) => {
  try {
    const newPayment = new RecurringPaymentModel(req.body);
    const savedPayment = await newPayment.save();
    res.status(200).send(savedPayment);
  } catch (err) {
    res.status(500).send(err);
  }
});

// PUT update a recurring payment
router.put("/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await RecurringPaymentModel.findByIdAndUpdate(
      paymentId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!payment) return res.status(404).send("Payment not found");
    res.status(200).send(payment);
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE a recurring payment
router.delete("/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await RecurringPaymentModel.findByIdAndDelete(paymentId);
    if (!payment) return res.status(404).send();
    res.status(200).send(payment);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;