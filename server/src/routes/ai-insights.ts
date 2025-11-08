// server/src/routes/ai-insights.ts
import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import FinancialRecordModel from "../schema/financial-record";
import BudgetModel from "../schema/budget";
import SavingsGoalModel from "../schema/savings-goal";

import {
  generateComprehensiveInsights,
  generatePersonalizedAdvice,
  predictNextMonthExpenses,
  analyzeSpendingTrends,
  generateBudgetRecommendations,
  FinancialData
} from "../ai/enhancedAI";
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

// POST get comprehensive AI insights
router.post("/comprehensive-insights", async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const records = await FinancialRecordModel.find({
      userId,
      date: { $gte: start, $lte: end }
    });

    const budget = await BudgetModel.findOne({ userId });
    const savingsGoals = await SavingsGoalModel.find({ userId });

    const totalIncome = records
      .filter(r => r.category === 'Salary' || r.amount > 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    records
      .filter(r => r.category !== 'Salary' && r.amount < 0)
      .forEach(r => {
        expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + Math.abs(r.amount);
      });

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

    const financialData: FinancialData = {
      totalIncome,
      totalExpenses,
      expensesByCategory,
      budget: budget ? {
        monthlySalary: budget.monthlySalary,
        categoryBudgets: budget.categoryBudgets
      } : undefined,
      savingsGoals: savingsGoals.map((goal: any) => ({
        name: goal.goalName,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.targetDate
      })),
      timeframe: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    };

    const insights = await generateComprehensiveInsights(financialData);

    res.status(200).json({
      insights,
      summary: {
        totalIncome,
        totalExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      }
    });

  } catch (err) {
    console.error("Error generating comprehensive insights:", err);
    res.status(500).send("Error generating insights");
  }
});

// POST get personalized financial advice
router.post("/personalized-advice", async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const records = await FinancialRecordModel.find({
      userId,
      date: { $gte: start, $lte: end }
    });

    const budget = await BudgetModel.findOne({ userId });
    const savingsGoals = await SavingsGoalModel.find({ userId });

    const totalIncome = records
      .filter(r => r.category === 'Salary' || r.amount > 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    records
      .filter(r => r.category !== 'Salary' && r.amount < 0)
      .forEach(r => {
        expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + Math.abs(r.amount);
      });

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

    const financialData: FinancialData = {
      totalIncome,
      totalExpenses,
      expensesByCategory,
      budget: budget ? {
        monthlySalary: budget.monthlySalary,
        categoryBudgets: budget.categoryBudgets
      } : undefined,
      savingsGoals: savingsGoals.map((goal: any) => ({
        name: goal.goalName,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.targetDate
      })),
      timeframe: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    };

    const advice = await generatePersonalizedAdvice(financialData);

    res.status(200).json({ advice });

  } catch (err) {
    console.error("Error generating personalized advice:", err);
    res.status(500).send("Error generating advice");
  }
});

// POST predict next month expenses
router.post("/predict-expenses", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Get last 6 months of data
    const monthlyData: Array<{ month: string; expenses: Record<string, number> }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const records = await FinancialRecordModel.find({
        userId,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const expenses: Record<string, number> = {};
      records
        .filter(r => r.category !== 'Salary' && r.amount < 0)
        .forEach(r => {
          expenses[r.category] = (expenses[r.category] || 0) + Math.abs(r.amount);
        });

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        expenses
      });
    }

    const predictions = await predictNextMonthExpenses(monthlyData);

    res.status(200).json({
      predictions,
      totalPredicted: Object.values(predictions).reduce((sum, val) => sum + val, 0)
    });

  } catch (err) {
    console.error("Error predicting expenses:", err);
    res.status(500).send("Error predicting expenses");
  }
});

// POST analyze spending trends
router.post("/spending-trends", async (req: Request, res: Response) => {
  try {
    const { userId, months = 6 } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    const monthlyData: Array<{
      month: string;
      totalExpenses: number;
      expensesByCategory: Record<string, number>;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const records = await FinancialRecordModel.find({
        userId,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const expensesByCategory: Record<string, number> = {};
      records
        .filter(r => r.category !== 'Salary' && r.amount < 0)
        .forEach(r => {
          expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + Math.abs(r.amount);
        });

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalExpenses,
        expensesByCategory
      });
    }

    const trendAnalysis = await analyzeSpendingTrends(monthlyData);

    res.status(200).json({
      ...trendAnalysis,
      monthlyData
    });

  } catch (err) {
    console.error("Error analyzing spending trends:", err);
    res.status(500).send("Error analyzing trends");
  }
});

// POST get budget recommendations
router.post("/budget-recommendations", async (req: Request, res: Response) => {
  try {
    const { userId, financialGoals } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Get last 30 days of expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await FinancialRecordModel.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });

    const budget = await BudgetModel.findOne({ userId });

    const totalIncome = records
      .filter(r => r.category === 'Salary' || r.amount > 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    const currentExpenses: Record<string, number> = {};
    records
      .filter(r => r.category !== 'Salary' && r.amount < 0)
      .forEach(r => {
        currentExpenses[r.category] = (currentExpenses[r.category] || 0) + Math.abs(r.amount);
      });

    const income = budget?.monthlySalary || totalIncome || 50000; // Default fallback

    const recommendations = await generateBudgetRecommendations(
      income,
      currentExpenses,
      financialGoals
    );

    res.status(200).json({
      recommendations,
      currentIncome: income,
      currentExpenses: Object.values(currentExpenses).reduce((sum, val) => sum + val, 0)
    });

  } catch (err) {
    console.error("Error generating budget recommendations:", err);
    res.status(500).send("Error generating recommendations");
  }
});

export default router;