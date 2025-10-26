// server/src/schema/category.ts - ENHANCED VERSION
import mongoose from "mongoose";

interface Category {
    userId: string;
    name: string;
    icon: string; // Emoji or unicode character
    isDefault?: boolean; // Track if it's a default category
}

const categorySchema = new mongoose.Schema<Category>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    },
    {
        timestamps: true,
    }
);

// Compound index for faster userId + name lookups (prevents duplicates)
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Text index for searching category names
categorySchema.index({ name: "text" });

const CategoryModel = mongoose.model<Category>("Category", categorySchema);

export default CategoryModel;