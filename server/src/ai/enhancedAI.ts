// server/src/ai/enhancedAI.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export interface FinancialData {
    totalIncome: number;
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
    budget?: {
        monthlySalary: number;
        categoryBudgets: Record<string, number>;
    };
    savingsGoals?: Array<{
        name: string;
        targetAmount: number;
        currentAmount: number;
        deadline: Date;
    }>;
    timeframe: string;
}

export interface AIInsight {
    type: 'success' | 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    category?: string;
    actionable?: string;
}

/**
 * Generate comprehensive AI insights from financial data
 */
export const generateComprehensiveInsights = async (
    data: FinancialData
): Promise<AIInsight[]> => {
    const insights: AIInsight[] = [];

    // Analyze savings rate
    const savingsRate = ((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100;

    if (savingsRate >= 20) {
        insights.push({
            type: 'success',
            title: 'Excellent Savings Rate',
            message: `You're saving ${savingsRate.toFixed(1)}% of your income! Keep up the great work.`,
            actionable: 'Consider investing your surplus in mutual funds or FDs for better returns.'
        });
    } else if (savingsRate >= 10) {
        insights.push({
            type: 'info',
            title: 'Good Savings Habit',
            message: `You're saving ${savingsRate.toFixed(1)}% of your income. Aim for 20% for optimal financial health.`,
            actionable: 'Try to reduce discretionary spending by 5-10% to boost savings.'
        });
    } else if (savingsRate > 0) {
        insights.push({
            type: 'warning',
            title: 'Low Savings Rate',
            message: `Your savings rate is ${savingsRate.toFixed(1)}%. This is below recommended levels.`,
            actionable: 'Review your expenses and identify areas to cut back. Start with entertainment and dining.'
        });
    } else {
        insights.push({
            type: 'danger',
            title: 'No Savings This Period',
            message: `Your expenses exceed or equal your income. Immediate action needed.`,
            actionable: 'Create an emergency budget focusing only on essentials. Consider additional income sources.'
        });
    }

    // Analyze category spending
    const topCategories = Object.entries(data.expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    if (topCategories.length > 0) {
        const [topCategory, topAmount] = topCategories[0];
        const percentOfIncome = (topAmount / data.totalIncome) * 100;

        insights.push({
            type: 'info',
            title: 'Top Spending Category',
            message: `${topCategory}: ₹${topAmount.toFixed(2)} (${percentOfIncome.toFixed(1)}% of income)`,
            category: topCategory,
            actionable: percentOfIncome > 30
                ? `This seems high. Review ${topCategory} expenses for potential savings.`
                : 'This is within reasonable limits.'
        });
    }

    // Compare with budget
    if (data.budget) {
        const budgetUsage = (data.totalExpenses / data.budget.monthlySalary) * 100;

        if (budgetUsage > 100) {
            insights.push({
                type: 'danger',
                title: 'Budget Exceeded',
                message: `You've spent ${budgetUsage.toFixed(1)}% of your budget!`,
                actionable: 'Review all non-essential expenses immediately. Consider a spending freeze.'
            });
        } else if (budgetUsage > 90) {
            insights.push({
                type: 'warning',
                title: 'Approaching Budget Limit',
                message: `You've used ${budgetUsage.toFixed(1)}% of your budget.`,
                actionable: 'Be cautious with remaining expenses this month.'
            });
        } else if (budgetUsage < 70) {
            insights.push({
                type: 'success',
                title: 'Well Within Budget',
                message: `You've only used ${budgetUsage.toFixed(1)}% of your budget.`,
                actionable: 'Consider allocating extra funds to savings or investments.'
            });
        }

        // Category-wise budget analysis
        Object.entries(data.budget.categoryBudgets).forEach(([category, budgetAmount]) => {
            const spent = data.expensesByCategory[category] || 0;
            const usage = (spent / budgetAmount) * 100;

            if (usage > 100) {
                insights.push({
                    type: 'danger',
                    title: `${category} Over Budget`,
                    message: `Spent ₹${spent.toFixed(2)} against budget of ₹${budgetAmount.toFixed(2)} (${usage.toFixed(1)}%)`,
                    category,
                    actionable: `Reduce ${category} spending next month by ${(usage - 100).toFixed(1)}%`
                });
            }
        });
    }

    // Analyze savings goals
    if (data.savingsGoals && data.savingsGoals.length > 0) {
        data.savingsGoals.forEach(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const monthlyRequired = daysRemaining > 0 ? (remainingAmount / daysRemaining) * 30 : 0;

            if (progress >= 100) {
                insights.push({
                    type: 'success',
                    title: `Goal Achieved: ${goal.name}`,
                    message: `Congratulations! You've reached your target of ₹${goal.targetAmount.toFixed(2)}`,
                    actionable: 'Mark this goal as complete and set a new one.'
                });
            } else if (daysRemaining < 30 && progress < 90) {
                insights.push({
                    type: 'warning',
                    title: `Goal at Risk: ${goal.name}`,
                    message: `Only ${daysRemaining} days left and ${progress.toFixed(1)}% completed.`,
                    actionable: `You need to save ₹${monthlyRequired.toFixed(2)}/month to reach this goal.`
                });
            } else if (progress >= 75) {
                insights.push({
                    type: 'success',
                    title: `Goal on Track: ${goal.name}`,
                    message: `${progress.toFixed(1)}% complete with ${daysRemaining} days remaining.`,
                    actionable: 'Keep up the momentum!'
                });
            }
        });
    }

    return insights;
};

/**
 * Generate personalized financial advice using AI
 */
export const generatePersonalizedAdvice = async (
    data: FinancialData
): Promise<string> => {
    const prompt = `You are an expert financial advisor. Based on the following financial data, provide 3-5 specific, actionable recommendations to improve financial health. Be encouraging but realistic.

Income: ₹${data.totalIncome.toFixed(2)}
Expenses: ₹${data.totalExpenses.toFixed(2)}
Timeframe: ${data.timeframe}

Expenses by Category:
${Object.entries(data.expensesByCategory)
            .map(([cat, amt]) => `- ${cat}: ₹${amt.toFixed(2)} (${((amt / data.totalExpenses) * 100).toFixed(1)}%)`)
            .join('\n')}

${data.budget ? `Budget: ₹${data.budget.monthlySalary.toFixed(2)}` : 'No budget set'}

${data.savingsGoals && data.savingsGoals.length > 0
            ? `Savings Goals:\n${data.savingsGoals.map(g =>
                `- ${g.name}: ₹${g.currentAmount.toFixed(2)}/₹${g.targetAmount.toFixed(2)} (${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%)`
            ).join('\n')}`
            : 'No savings goals set'
        }

Provide recommendations in a numbered list format. Focus on:
1. Immediate actions for this month
2. Category-specific spending optimizations
3. Savings and investment opportunities
4. Budget adjustments if needed
5. Goal achievement strategies`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return await response.text();
    } catch (error) {
        console.error("Error generating personalized advice:", error);
        return "Unable to generate personalized advice at this time. Please try again later.";
    }
};

/**
 * Predict next month's expenses using AI
 */
export const predictNextMonthExpenses = async (
    historicalData: Array<{ month: string; expenses: Record<string, number> }>
): Promise<Record<string, number>> => {
    if (historicalData.length < 2) {
        return {};
    }

    const predictions: Record<string, number> = {};
    const allCategories = new Set<string>();

    historicalData.forEach(month => {
        Object.keys(month.expenses).forEach(cat => allCategories.add(cat));
    });

    // Simple moving average prediction
    allCategories.forEach(category => {
        const values = historicalData
            .map(month => month.expenses[category] || 0)
            .filter(val => val > 0);

        if (values.length > 0) {
            const average = values.reduce((sum, val) => sum + val, 0) / values.length;
            // Add 5% buffer for inflation/uncertainty
            predictions[category] = average * 1.05;
        }
    });

    return predictions;
};

/**
 * Analyze spending patterns and identify trends
 */
export const analyzeSpendingTrends = async (
    monthlyData: Array<{ month: string; totalExpenses: number; expensesByCategory: Record<string, number> }>
): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    insights: string[];
}> => {
    if (monthlyData.length < 2) {
        return {
            trend: 'stable',
            percentageChange: 0,
            insights: ['Not enough data to analyze trends. Track expenses for at least 2 months.']
        };
    }

    const insights: string[] = [];
    const recentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    const percentageChange = ((recentMonth.totalExpenses - previousMonth.totalExpenses) / previousMonth.totalExpenses) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (percentageChange > 5) {
        trend = 'increasing';
        insights.push(`Your spending increased by ${percentageChange.toFixed(1)}% compared to last month.`);
    } else if (percentageChange < -5) {
        trend = 'decreasing';
        insights.push(`Great job! Your spending decreased by ${Math.abs(percentageChange).toFixed(1)}% compared to last month.`);
    } else {
        trend = 'stable';
        insights.push('Your spending is stable compared to last month.');
    }

    // Category-wise analysis
    Object.keys(recentMonth.expensesByCategory).forEach(category => {
        const currentAmount = recentMonth.expensesByCategory[category];
        const previousAmount = previousMonth.expensesByCategory[category] || 0;

        if (previousAmount > 0) {
            const categoryChange = ((currentAmount - previousAmount) / previousAmount) * 100;

            if (Math.abs(categoryChange) > 20) {
                insights.push(
                    `${category} spending ${categoryChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(categoryChange).toFixed(1)}%`
                );
            }
        }
    });

    return { trend, percentageChange, insights };
};

/**
 * Generate smart budget recommendations
 */
export const generateBudgetRecommendations = async (
    income: number,
    currentExpenses: Record<string, number>,
    financialGoals?: string[]
): Promise<Record<string, number>> => {
    const recommendations: Record<string, number> = {};

    // 50/30/20 rule as baseline
    const needs = income * 0.50;  // Essentials
    const wants = income * 0.30;  // Discretionary
    const savings = income * 0.20; // Savings & Investments

    // Essential categories (needs)
    const essentialCategories = ['Food & Dining', 'Rent', 'Utilities', 'Bills & Utilities', 'Transportation', 'Healthcare'];
    // Discretionary categories (wants)
    const discretionaryCategories = ['Entertainment', 'Shopping', 'Travel', 'Personal Care'];

    const totalEssentials = essentialCategories.reduce((sum, cat) => sum + (currentExpenses[cat] || 0), 0);
    const totalDiscretionary = discretionaryCategories.reduce((sum, cat) => sum + (currentExpenses[cat] || 0), 0);

    // If goals include aggressive savings, adjust to 40/30/30
    const isAggressiveSaver = financialGoals?.some(goal =>
        goal.toLowerCase().includes('save') || goal.toLowerCase().includes('invest')
    );

    const needsTarget = isAggressiveSaver ? income * 0.40 : needs;
    const savingsTarget = isAggressiveSaver ? income * 0.30 : savings;

    // Distribute needs budget
    essentialCategories.forEach(category => {
        const currentSpend = currentExpenses[category] || 0;
        if (currentSpend > 0) {
            recommendations[category] = Math.max(currentSpend * 0.95, (needsTarget / essentialCategories.length));
        }
    });

    // Distribute wants budget
    discretionaryCategories.forEach(category => {
        const currentSpend = currentExpenses[category] || 0;
        if (currentSpend > 0) {
            recommendations[category] = Math.min(currentSpend, (wants / discretionaryCategories.length));
        }
    });

    // Add savings category
    recommendations['Savings & Investments'] = savingsTarget;

    return recommendations;
};
