import mongoose from "mongoose";

interface Category {
    userId: string;
    name: string;
    icon: string; // Emoji or unicode character
}

const categorySchema = new mongoose.Schema<Category>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const CategoryModel = mongoose.model<Category>("Category", categorySchema);

export default CategoryModel;
