import express, { Request, Response } from "express";
import FinancialRecordModel from "../schema/financial-record";
import { getCategory } from "../ai/geminiCategorizer";
import mongoose from "mongoose"; // Import mongoose

const router = express.Router();

router.get("/getAllByUserID/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const records = await FinancialRecordModel.find({ userId: userId }).sort({ date: -1 }); // Sort by date descending
    if (records.length === 0) {
      // It's okay if a user has no records yet, send an empty array
      return res.status(200).send([]);
    }
    res.status(200).send(records);
  } catch (err) {
    console.error("Error fetching records:", err); // Log the error
    res.status(500).send("Error fetching financial records.");
  }
});

// POST endpoint now handles single or multiple records (for splits)
router.post("/", async (req: Request, res: Response) => {
  try {
    const recordsData = Array.isArray(req.body) ? req.body : [req.body]; // Handle single or array
    const savedRecords = [];
    const parentRecordId = new mongoose.Types.ObjectId().toString(); // Generate one ID for all splits

    for (const recordData of recordsData) {
      // Use the Gemini API to get the category if not provided or empty
      const category = recordData.category || await getCategory(recordData.description);

      const newRecord = new FinancialRecordModel({
        ...recordData,
        category: category,
        isSplit: recordsData.length > 1, // Mark as split if multiple records are sent
        parentRecordId: recordsData.length > 1 ? parentRecordId : undefined, // Assign parent ID only if split
      });

      const savedRecord = await newRecord.save();
      savedRecords.push(savedRecord);
    }

    res.status(200).send(savedRecords.length === 1 ? savedRecords[0] : savedRecords); // Send back single or array
  } catch (err) {
    console.error("Error saving record(s):", err); // Log the error
    res.status(500).send("Error saving financial record(s).");
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const newRecordBody = req.body;
    const record = await FinancialRecordModel.findByIdAndUpdate(
      id,
      newRecordBody,
      { new: true, runValidators: true } // Added runValidators
    );

    if (!record) return res.status(404).send("Record not found.");

    res.status(200).send(record);
  } catch (err) {
    console.error("Error updating record:", err); // Log the error
    res.status(500).send("Error updating financial record.");
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const record = await FinancialRecordModel.findByIdAndDelete(id);
    if (!record) return res.status(404).send("Record not found.");
    res.status(200).send(record);
  } catch (err) {
    console.error("Error deleting record:", err); // Log the error
    res.status(500).send("Error deleting financial record.");
  }
});

// Category Suggestion (no changes needed here for split)
router.post("/suggest-category", async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).send("Description is required.");
  }
  try {
    const category = await getCategory(description);
    res.status(200).send({ category });
  } catch (err) {
    console.error("Error suggesting category:", err); // Log the error
    res.status(500).send("Error suggesting category.");
  }
});

export default router;
