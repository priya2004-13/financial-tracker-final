// server/src/routes/ai-insights.ts
import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import FinancialRecordModel from "../schema/financial-record";
import BudgetModel from "../schema/budget";
import NotificationModel from "../schema/notification";
import 'dotenv/config';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// POST generate financial summary
router.post("/financial-summary", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Get records from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await FinancialRecordModel.find({
      userId: userId,
      date: { $gte: thirtyDaysAgo }
    });

    const budget = await BudgetModel.findOne({ userId: userId });

    // Calculate totals
    const totalIncome = records
      .filter(r => r.category === 'Salary')
      .reduce((sum, r) => sum + r.amount, 0);

    const expensesByCategory = records
      .filter(r => r.category !== 'Salary')
      .reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

    // Create prompt for Gemini
    const prompt = `You are a friendly financial advisor. Based on the following financial data for the past 30 days, provide a short, encouraging summary of this user's financial health. Highlight one area where they did well and suggest one area for improvement. Keep it concise (3-4 sentences).

Income: ₹${totalIncome.toFixed(2)}
Expenses by Category: ${JSON.stringify(expensesByCategory, null, 2)}
Total Expenses: ₹${totalExpenses.toFixed(2)}
${budget ? `Monthly Budget: ₹${budget.monthlySalary.toFixed(2)}` : 'No budget set'}
${budget ? `Category Budgets: ${JSON.stringify(budget.categoryBudgets, null, 2)}` : ''}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = await response.text();

    res.status(200).send({ 
      summary,
      data: {
        totalIncome,
        totalExpenses,
        expensesByCategory,
        balance: totalIncome - totalExpenses
      }
    });

  } catch (err) {
    console.error("Error generating financial summary:", err);
    res.status(500).send("Error generating summary");
  }
});

// POST detect spending anomaly
router.post("/anomaly-detection", async (req: Request, res: Response) => {
  try {
    const { userId, amount, category } = req.body;

    if (!userId || !amount || !category) {
      return res.status(400).send("userId, amount, and category are required");
    }

    // Get past 6 months of data for this category
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalRecords = await FinancialRecordModel.find({
      userId: userId,
      category: category,
      date: { $gte: sixMonthsAgo }
    });

    if (historicalRecords.length < 3) {
      return res.status(200).send({ 
        isAnomaly: false, 
        message: "Not enough data for anomaly detection" 
      });
    }

    // Calculate average and standard deviation
    const amounts = historicalRecords.map(r => r.amount);
    const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Check if current amount is more than 2 standard deviations above average
    const isAnomaly = amount > (average + (2 * stdDev));

    res.status(200).send({
      isAnomaly,
      average: average.toFixed(2),
      currentAmount: amount,
      message: isAnomaly 
        ? `This expense of ₹${amount.toFixed(2)} is significantly higher than your usual ₹${average.toFixed(2)} in ${category}`
        : "This expense is within your normal spending range"
    });

  } catch (err) {
    console.error("Error detecting anomaly:", err);
    res.status(500).send("Error detecting anomaly");
  }
});

export default router;