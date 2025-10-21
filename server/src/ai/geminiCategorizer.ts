// server/src/ai/geminiCategorizer.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
// Initialize the generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const categories = [
    "Food",
    "Rent",
    "Salary",
    "Utilities",
    "Entertainment",
    "Other",
].join(", ");
// Function to get a category from a description using the Gemini API
export const getCategory = async (description: string): Promise<string> => {
    const prompt = `Based on the following expense description, please categorize it into one of the following categories: ${categories}. Description: "${description}"`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        // Basic validation to ensure the response is one of the categories
        const foundCategory = categories.split(', ').find(c => text.includes(c));
        return foundCategory || "Other";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Other"; // Fallback category in case of an error
    }
};