import express, { Request, Response } from "express";
import FinancialRecordModel from "../schema/financial-record";
import { getCategory } from "../ai/geminiCategorizer"; // Updated import

const router = express.Router();

router.get("/getAllByUserID/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const records = await FinancialRecordModel.find({ userId: userId });
    if (records.length === 0) {
      return res.status(404).send("No records found for the user.");
    }
    res.status(200).send(records);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const newRecordBody = req.body;

    // Use the Gemini API to get the category
    const category = await getCategory(newRecordBody.description);

    const newRecord = new FinancialRecordModel({
      ...newRecordBody,
      category: category,
    });

    const savedRecord = await newRecord.save();
    res.status(200).send(savedRecord);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const newRecordBody = req.body;
    const record = await FinancialRecordModel.findByIdAndUpdate(
      id,
      newRecordBody,
      { new: true }
    );

    if (!record) return res.status(404).send();

    res.status(200).send(record);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const record = await FinancialRecordModel.findByIdAndDelete(id);
    if (!record) return res.status(404).send();
    res.status(200).send(record);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Update the category suggestion route to be async
router.post("/suggest-category", async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).send("Description is required.");
  }
  try {
    const category = await getCategory(description);
    res.status(200).send({ category });
  } catch (err) {
    res.status(500).send("Error suggesting category.");
  }
});

export default router;