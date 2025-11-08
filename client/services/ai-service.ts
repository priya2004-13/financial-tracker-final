// client/services/ai-service.ts
import { apiPost } from './api-utils';

export interface AIInsight {
    type: 'success' | 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    category?: string;
    actionable?: string;
}

export interface ComprehensiveInsightsResponse {
    insights: AIInsight[];
    summary: {
        totalIncome: number;
        totalExpenses: number;
        savingsRate: number;
    };
}

export interface PersonalizedAdviceResponse {
    advice: string;
}

export interface ExpensePrediction {
    predictions: Record<string, number>;
    totalPredicted: number;
}

export interface SpendingTrend {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    insights: string[];
    monthlyData: Array<{
        month: string;
        totalExpenses: number;
        expensesByCategory: Record<string, number>;
    }>;
}

export interface BudgetRecommendation {
    recommendations: Record<string, number>;
    currentIncome: number;
    currentExpenses: number;
}

export interface AnomalyDetection {
    isAnomaly: boolean;
    average: string;
    currentAmount: number;
    message: string;
}

// ============================================
// AI INSIGHTS API
// ============================================

/**
 * Get comprehensive AI-powered financial insights
 */
export const getComprehensiveInsights = async (
    userId: string,
    startDate?: string,
    endDate?: string
): Promise<ComprehensiveInsightsResponse> => {
    return apiPost<ComprehensiveInsightsResponse>('/ai/comprehensive-insights', {
        userId,
        startDate,
        endDate
    });
};

/**
 * Get personalized financial advice from AI
 */
export const getPersonalizedAdvice = async (
    userId: string,
    startDate?: string,
    endDate?: string
): Promise<PersonalizedAdviceResponse> => {
    return apiPost<PersonalizedAdviceResponse>('/ai/personalized-advice', {
        userId,
        startDate,
        endDate
    });
};

/**
 * Predict next month's expenses using AI
 */
export const predictExpenses = async (
    userId: string
): Promise<ExpensePrediction> => {
    return apiPost<ExpensePrediction>('/ai/predict-expenses', {
        userId
    });
};

/**
 * Analyze spending trends over time
 */
export const analyzeSpendingTrends = async (
    userId: string,
    months: number = 6
): Promise<SpendingTrend> => {
    return apiPost<SpendingTrend>('/ai/spending-trends', {
        userId,
        months
    });
};

/**
 * Get smart budget recommendations
 */
export const getBudgetRecommendations = async (
    userId: string,
    financialGoals?: string[]
): Promise<BudgetRecommendation> => {
    return apiPost<BudgetRecommendation>('/ai/budget-recommendations', {
        userId,
        financialGoals
    });
};

/**
 * Detect spending anomalies
 */
export const detectAnomaly = async (
    userId: string,
    amount: number,
    category: string
): Promise<AnomalyDetection> => {
    return apiPost<AnomalyDetection>('/ai/anomaly-detection', {
        userId,
        amount,
        category
    });
};

/**
 * Get financial summary (legacy endpoint)
 */
export const getFinancialSummary = async (
    userId: string
): Promise<{ summary: string; data: any }> => {
    return apiPost('/ai/financial-summary', { userId });
};
