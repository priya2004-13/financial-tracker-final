// server/src/routes/financial-records.ts - ENHANCED FOR SPLITS
import express, { Request, Response } from "express";
import FinancialRecordModel from "../schema/financial-record";
import { getCategory } from "../ai/geminiCategorizer";
import mongoose from "mongoose";

const router = express.Router();

// GET all records for a user with pagination
router.get("/getAllByUserID/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50; // Default 50 records per page
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalRecords = await FinancialRecordModel.countDocuments({ userId: userId });

    // Fetch paginated records
    const records = await FinancialRecordModel
      .find({ userId: userId })
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;
    const hasPrevious = page > 1;

    res.status(200).json({
      records,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
        hasMore,
        hasPrevious
      }
    });
  } catch (err) {
    console.error("Error fetching records:", err);
    res.status(500).send("Error fetching financial records.");
  }
});

// POST endpoint - handles single or multiple records (for splits)
router.post("/", async (req: Request, res: Response) => {
  try {
    const recordsData = Array.isArray(req.body) ? req.body : [req.body];
    const savedRecords = [];

    // Generate one parent ID for all splits
    const isSplit = recordsData.length > 1;
    const parentRecordId = isSplit ? new mongoose.Types.ObjectId().toString() : undefined;

    // Validation
    for (const recordData of recordsData) {
      if (!recordData.userId || !recordData.description || typeof recordData.amount !== 'number' || recordData.amount <= 0) {
        return res.status(400).send("Invalid record data: missing required fields or invalid amount");
      }
    }

    // If split, validate total matches
    if (isSplit && req.body[0].originalAmount) {
      const totalSplitAmount = recordsData.reduce((sum: number, r: any) => sum + r.amount, 0);
      const originalAmount = parseFloat(req.body[0].originalAmount);

      if (Math.abs(totalSplitAmount - originalAmount) > 0.01) {
        return res.status(400).send(`Split amounts (${totalSplitAmount}) don't match original (${originalAmount})`);
      }
    }

    // Process each record
    for (const recordData of recordsData) {
      // Use AI to get category if not provided or empty
      const category = recordData.category || await getCategory(recordData.description);

      const newRecord = new FinancialRecordModel({
        ...recordData,
        category: category,
        isSplit: isSplit,
        parentRecordId: parentRecordId,
      });

      const savedRecord = await newRecord.save();
      savedRecords.push(savedRecord);
    }

    // Log split transaction for analytics
    if (isSplit) {
      console.log(`Split transaction created: ${savedRecords.length} parts, parent ID: ${parentRecordId}`);
    }

    res.status(201).send(savedRecords.length === 1 ? savedRecords[0] : savedRecords);
  } catch (err) {
    console.error("Error saving record(s):", err);
    res.status(500).send("Error saving financial record(s).");
  }
});

// GET split records by parent ID
router.get("/split/:parentRecordId", async (req: Request, res: Response) => {
  try {
    const { parentRecordId } = req.params;
    const splitRecords = await FinancialRecordModel.find({ parentRecordId: parentRecordId }).sort({ date: 1 });

    if (splitRecords.length === 0) {
      return res.status(404).send("No split records found");
    }

    res.status(200).send(splitRecords);
  } catch (err) {
    console.error("Error fetching split records:", err);
    res.status(500).send("Error fetching split records");
  }
});

// DELETE - handle cascade delete for splits
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const record = await FinancialRecordModel.findById(id);

    if (!record) {
      return res.status(404).send("Record not found.");
    }

    // If this is a split transaction, delete all related splits
    if (record.isSplit && record.parentRecordId) {
      const deleteResult = await FinancialRecordModel.deleteMany({
        parentRecordId: record.parentRecordId
      });

      console.log(`Deleted split transaction: ${deleteResult.deletedCount} records`);
      return res.status(200).send({
        message: `Deleted ${deleteResult.deletedCount} split records`,
        deletedCount: deleteResult.deletedCount
      });
    }

    // Single record delete
    await FinancialRecordModel.findByIdAndDelete(id);
    res.status(200).send(record);
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).send("Error deleting financial record.");
  }
});

// PUT update record
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const newRecordBody = req.body;

    // Validation
    if (newRecordBody.amount && (typeof newRecordBody.amount !== 'number' || newRecordBody.amount <= 0)) {
      return res.status(400).send("Invalid amount value");
    }

    const record = await FinancialRecordModel.findByIdAndUpdate(
      id,
      newRecordBody,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).send("Record not found.");
    }

    res.status(200).send(record);
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).send("Error updating financial record.");
  }
});

// POST Category Suggestion
router.post("/suggest-category", async (req: Request, res: Response) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).send("Description is required.");
  }

  try {
    const category = await getCategory(description);
    res.status(200).send({ category });
  } catch (err) {
    console.error("Error suggesting category:", err);
    res.status(500).send("Error suggesting category.");
  }
});

export default router;