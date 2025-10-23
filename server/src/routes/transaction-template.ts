import express, { Request, Response } from "express";
import TransactionTemplateModel from "../schema/transaction-template";
import mongoose from "mongoose";

const router = express.Router();

// GET all templates for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const templates = await TransactionTemplateModel.find({ userId: userId }).sort({ templateName: 1 });
    res.status(200).send(templates);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).send("Error fetching transaction templates.");
  }
});

// POST a new template
router.post("/", async (req: Request, res: Response) => {
  try {
    const newTemplateData = req.body;
    // Basic validation
    if (!newTemplateData.userId || !newTemplateData.templateName || !newTemplateData.description || typeof newTemplateData.amount !== 'number' || !newTemplateData.category || !newTemplateData.paymentMethod) {
        return res.status(400).send("Missing required fields for template.");
    }
     // Check if template name already exists for the user
     const existingTemplate = await TransactionTemplateModel.findOne({ userId: newTemplateData.userId, templateName: newTemplateData.templateName });
     if (existingTemplate) {
       return res.status(409).send("Template with this name already exists.");
     }

    const newTemplate = new TransactionTemplateModel(newTemplateData);
    const savedTemplate = await newTemplate.save();
    res.status(201).send(savedTemplate);
  } catch (err) {
    console.error("Error adding template:", err);
     if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).send(`Validation Error: ${err.message}`);
      }
    res.status(500).send("Error adding transaction template.");
  }
});

// DELETE a template
router.delete("/:templateId", async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = await TransactionTemplateModel.findByIdAndDelete(templateId);
    if (!template) return res.status(404).send("Template not found.");
    res.status(200).send(template);
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).send("Error deleting transaction template.");
  }
});

export default router;
