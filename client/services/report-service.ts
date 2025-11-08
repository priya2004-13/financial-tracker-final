// client/services/report-service.ts
import { apiPost } from './api-utils';

export interface ReportSummaryData {
    period: {
        start: string;
        end: string;
    };
    summary: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
    };
    expensesByCategory: Record<string, number>;
    budget: {
        monthlySalary: number;
        budgetUsage: number;
    } | null;
    savingsGoals: Array<{
        name: string;
        targetAmount: number;
        currentAmount: number;
        progress: number;
        deadline: string;
    }>;
    insights: Array<{
        type: string;
        title: string;
        message: string;
    }>;
    transactionCount: number;
}

// ============================================
// PDF REPORT API
// ============================================

/**
 * Generate and download comprehensive financial report PDF
 */
export const generateFinancialReport = async (
    userId: string,
    userName: string,
    userEmail: string,
    startDate?: string,
    endDate?: string,
    includeTransactions: boolean = true
): Promise<Blob> => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const response = await fetch(`${API_BASE_URL}/reports/generate-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            userName,
            userEmail,
            startDate,
            endDate,
            includeTransactions
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate report');
    }

    return response.blob();
};

/**
 * Generate and download monthly summary PDF
 */
export const generateMonthlySummary = async (
    userId: string,
    userName: string,
    userEmail: string,
    month?: number,
    year?: number
): Promise<Blob> => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const response = await fetch(`${API_BASE_URL}/reports/monthly-summary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            userName,
            userEmail,
            month,
            year
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate summary');
    }

    return response.blob();
};

/**
 * Get report summary data (JSON preview without PDF generation)
 */
export const getReportSummaryData = async (
    userId: string,
    startDate?: string,
    endDate?: string
): Promise<ReportSummaryData> => {
    return apiPost<ReportSummaryData>('/reports/summary-data', {
        userId,
        startDate,
        endDate
    });
};

/**
 * Helper function to download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

/**
 * Generate and download financial report with automatic filename
 */
export const downloadFinancialReport = async (
    userId: string,
    userName: string,
    userEmail: string,
    startDate?: string,
    endDate?: string
): Promise<void> => {
    const blob = await generateFinancialReport(userId, userName, userEmail, startDate, endDate);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `financial-report-${timestamp}.pdf`);
};

/**
 * Generate and download monthly summary with automatic filename
 */
export const downloadMonthlySummary = async (
    userId: string,
    userName: string,
    userEmail: string,
    month?: number,
    year?: number
): Promise<void> => {
    const blob = await generateMonthlySummary(userId, userName, userEmail, month, year);
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    const targetYear = year || new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    downloadBlob(blob, `monthly-summary-${monthNames[targetMonth]}-${targetYear}.pdf`);
};
