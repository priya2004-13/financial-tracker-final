// server/src/routes/reports.ts
import express, { Request, Response } from "express";
import FinancialRecordModel from "../schema/financial-record";
import BudgetModel from "../schema/budget";
import SavingsGoalModel from "../schema/savings-goal";
import { generateFinancialReportPDF, generateMonthlySummaryPDF, ReportData } from "../utils/pdfGenerator";
import {
    generateComprehensiveInsights,
    generatePersonalizedAdvice,
    FinancialData
} from "../ai/enhancedAI";

const router = express.Router();

/**
 * POST /reports/generate-pdf
 * Generate comprehensive financial report PDF
 */
router.post("/generate-pdf", async (req: Request, res: Response) => {
    try {
        const { userId, startDate, endDate, includeTransactions = true } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Parse dates
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        // Fetch financial records
        const records = await FinancialRecordModel.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });

        // Fetch budget
        const budget = await BudgetModel.findOne({ userId });

        // Fetch savings goals
        const savingsGoals = await SavingsGoalModel.find({ userId });

        // Calculate summary
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
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Prepare financial data for AI insights
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

        // Generate AI insights
        const insights = await generateComprehensiveInsights(financialData);
        const aiAdvice = await generatePersonalizedAdvice(financialData);

        // Prepare report data
        const reportData: ReportData = {
            user: {
                name: req.body.userName || 'User',
                email: req.body.userEmail || 'user@example.com',
                memberId: userId
            },
            period: {
                start,
                end
            },
            summary: {
                totalIncome,
                totalExpenses,
                netSavings,
                savingsRate
            },
            transactions: includeTransactions ? records.map(r => ({
                date: r.date,
                description: r.description,
                category: r.category,
                amount: r.amount,
                paymentMethod: r.paymentMethod
            })) : [],
            expensesByCategory,
            budget: budget ? {
                monthlySalary: budget.monthlySalary,
                categoryBudgets: budget.categoryBudgets,
                budgetUsage: (totalExpenses / budget.monthlySalary) * 100
            } : undefined,
            savingsGoals: savingsGoals.map((goal: any) => ({
                name: goal.goalName,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                progress: (goal.currentAmount / goal.targetAmount) * 100,
                deadline: goal.targetDate
            })),
            insights: insights.map(insight => ({
                type: insight.type,
                title: insight.title,
                message: insight.message + (insight.actionable ? ` ${insight.actionable}` : '')
            })),
            aiAdvice
        };

        // Generate PDF
        generateFinancialReportPDF(reportData, res);

    } catch (err) {
        console.error("Error generating PDF report:", err);
        res.status(500).json({ error: "Error generating report" });
    }
});

/**
 * POST /reports/monthly-summary
 * Generate simplified monthly summary PDF
 */
router.post("/monthly-summary", async (req: Request, res: Response) => {
    try {
        const { userId, month, year } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const targetMonth = month !== undefined ? month : new Date().getMonth();
        const targetYear = year || new Date().getFullYear();

        const start = new Date(targetYear, targetMonth, 1);
        const end = new Date(targetYear, targetMonth + 1, 0);

        // Fetch records for the month
        const records = await FinancialRecordModel.find({
            userId,
            date: { $gte: start, $lte: end }
        });

        // Calculate summary
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
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        const reportData = {
            user: {
                name: req.body.userName || 'User',
                email: req.body.userEmail || 'user@example.com',
            },
            period: {
                start,
                end
            },
            summary: {
                totalIncome,
                totalExpenses,
                netSavings,
                savingsRate
            },
            expensesByCategory
        };

        generateMonthlySummaryPDF(reportData, res);

    } catch (err) {
        console.error("Error generating monthly summary:", err);
        res.status(500).json({ error: "Error generating summary" });
    }
});

/**
 * POST /reports/summary-data
 * Get report data without generating PDF (for preview)
 */
router.post("/summary-data", async (req: Request, res: Response) => {
    try {
        const { userId, startDate, endDate } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

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
            period: { start, end },
            summary: {
                totalIncome,
                totalExpenses,
                netSavings,
                savingsRate
            },
            expensesByCategory,
            budget: budget ? {
                monthlySalary: budget.monthlySalary,
                budgetUsage: (totalExpenses / budget.monthlySalary) * 100
            } : null,
            savingsGoals: savingsGoals.map((goal: any) => ({
                name: goal.goalName,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                progress: (goal.currentAmount / goal.targetAmount) * 100,
                deadline: goal.targetDate
            })),
            insights,
            transactionCount: records.length
        });

    } catch (err) {
        console.error("Error fetching summary data:", err);
        res.status(500).json({ error: "Error fetching data" });
    }
});

export default router;
