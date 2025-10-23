import express, { Request, Response } from "express";
import CategoryModel from "../schema/category";

const router = express.Router();

// GET all categories for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const categories = await CategoryModel.find({ userId: userId }).sort({ name: 1 }); // Sort alphabetically
    res.status(200).send(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories.");
  }
});

// POST a new category
router.post("/", async (req: Request, res: Response) => {
  try {
    const newCategoryData = req.body;
    // Basic validation
    if (!newCategoryData.userId || !newCategoryData.name || !newCategoryData.icon) {
        return res.status(400).send("Missing required fields: userId, name, icon.");
    }
     // Check if category already exists for the user
     const existingCategory = await CategoryModel.findOne({ userId: newCategoryData.userId, name: newCategoryData.name });
     if (existingCategory) {
       return res.status(409).send("Category with this name already exists.");
     }

    const newCategory = new CategoryModel(newCategoryData);
    const savedCategory = await newCategory.save();
    res.status(201).send(savedCategory); // Use 201 for created
  } catch (err) {
    console.error("Error adding category:", err);

    res.status(500).send("Error adding category.");
  }
});

// DELETE a category
router.delete("/:categoryId", async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const category = await CategoryModel.findByIdAndDelete(categoryId);
    if (!category) return res.status(404).send("Category not found.");
    res.status(200).send(category);
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).send("Error deleting category.");
  }
});

// Note: Update category functionality could be added here if needed.

export default router;
