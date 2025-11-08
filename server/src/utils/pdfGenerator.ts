// server/src/utils/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface ReportData {
    user: {
        name: string;
        email: string;
        memberId?: string;
    };
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
    };
    transactions: Array<{
        date: Date;
        description: string;
        category: string;
        amount: number;
        paymentMethod?: string;
    }>;
    expensesByCategory: Record<string, number>;
    budget?: {
        monthlySalary: number;
        categoryBudgets: Record<string, number>;
        budgetUsage: number;
    };
    savingsGoals?: Array<{
        name: string;
        targetAmount: number;
        currentAmount: number;
        progress: number;
        deadline: Date;
    }>;
    insights?: Array<{
        type: string;
        title: string;
        message: string;
    }>;
    aiAdvice?: string;
}

/**
 * Generate a comprehensive financial report PDF
 */
export const generateFinancialReportPDF = (data: ReportData, res: Response): void => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
            Title: `Financial Report - ${data.period.start.toLocaleDateString()} to ${data.period.end.toLocaleDateString()}`,
            Author: 'Financi App',
            Subject: 'Personal Financial Report'
        }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=financial-report-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Helper functions
    const drawLine = (y: number) => {
        doc.moveTo(50, y).lineTo(545, y).stroke();
    };

    const addSection = (title: string, y: number) => {
        doc.fontSize(16).font('Helvetica-Bold').text(title, 50, y);
        drawLine(y + 20);
        return y + 30;
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toFixed(2)}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // ============ HEADER ============
    let yPosition = 50;

    doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text('FINANCIAL REPORT', 50, yPosition, { align: 'center' });

    yPosition += 40;

    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
            `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`,
            50,
            yPosition,
            { align: 'center' }
        );

    yPosition += 30;
    drawLine(yPosition);
    yPosition += 20;

    // ============ USER INFO ============
    doc.fontSize(10)
        .font('Helvetica')
        .text(`Generated for: ${data.user.name}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Email: ${data.user.email}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Report Date: ${formatDate(new Date())}`, 50, yPosition);
    yPosition += 30;

    // ============ EXECUTIVE SUMMARY ============
    yPosition = addSection('Executive Summary', yPosition);

    const summaryData = [
        { label: 'Total Income', value: formatCurrency(data.summary.totalIncome), color: '#10b981' },
        { label: 'Total Expenses', value: formatCurrency(data.summary.totalExpenses), color: '#ef4444' },
        { label: 'Net Savings', value: formatCurrency(data.summary.netSavings), color: data.summary.netSavings >= 0 ? '#10b981' : '#ef4444' },
        { label: 'Savings Rate', value: `${data.summary.savingsRate.toFixed(1)}%`, color: data.summary.savingsRate >= 20 ? '#10b981' : '#f59e0b' }
    ];

    summaryData.forEach(item => {
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text(item.label, 50, yPosition, { width: 200, continued: true })
            .font('Helvetica')
            .fillColor(item.color)
            .text(item.value, { align: 'right' });
        yPosition += 20;
    });

    yPosition += 20;

    // ============ BUDGET STATUS ============
    if (data.budget) {
        if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
        }

        yPosition = addSection('Budget Overview', yPosition);

        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Monthly Budget', 50, yPosition, { width: 200, continued: true })
            .font('Helvetica')
            .text(formatCurrency(data.budget.monthlySalary), { align: 'right' });
        yPosition += 20;

        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Budget Utilization', 50, yPosition, { width: 200, continued: true })
            .fillColor(data.budget.budgetUsage > 100 ? '#ef4444' : data.budget.budgetUsage > 90 ? '#f59e0b' : '#10b981')
            .font('Helvetica')
            .text(`${data.budget.budgetUsage.toFixed(1)}%`, { align: 'right' });
        yPosition += 30;
    }

    // ============ EXPENSES BY CATEGORY ============
    if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
    }

    yPosition = addSection('Expenses by Category', yPosition);

    const sortedCategories = Object.entries(data.expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10 categories

    sortedCategories.forEach(([category, amount], index) => {
        const percentage = (amount / data.summary.totalExpenses) * 100;

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${category}`, 50, yPosition, { width: 200, continued: true })
            .text(formatCurrency(amount), { width: 150, align: 'right', continued: true })
            .fillColor('#6b7280')
            .text(`${percentage.toFixed(1)}%`, { align: 'right' });

        yPosition += 18;
    });

    yPosition += 20;

    // ============ SAVINGS GOALS ============
    if (data.savingsGoals && data.savingsGoals.length > 0) {
        if (yPosition > 600) {
            doc.addPage();
            yPosition = 50;
        }

        yPosition = addSection('Savings Goals Progress', yPosition);

        data.savingsGoals.forEach((goal, index) => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#000000')
                .text(`${index + 1}. ${goal.name}`, 50, yPosition);
            yPosition += 18;

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Target: ${formatCurrency(goal.targetAmount)}`, 60, yPosition);
            yPosition += 15;

            doc.text(`Current: ${formatCurrency(goal.currentAmount)}`, 60, yPosition);
            yPosition += 15;

            doc.fillColor(goal.progress >= 100 ? '#10b981' : goal.progress >= 75 ? '#3b82f6' : '#f59e0b')
                .text(`Progress: ${goal.progress.toFixed(1)}%`, 60, yPosition);
            yPosition += 15;

            doc.fillColor('#6b7280')
                .text(`Deadline: ${formatDate(goal.deadline)}`, 60, yPosition);
            yPosition += 25;
        });

        yPosition += 10;
    }

    // ============ TRANSACTIONS ============
    doc.addPage();
    yPosition = 50;
    yPosition = addSection('Transaction History', yPosition);

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Date', 50, yPosition, { width: 70, continued: true })
        .text('Description', 120, yPosition, { width: 150, continued: true })
        .text('Category', 270, yPosition, { width: 100, continued: true })
        .text('Amount', 370, yPosition, { width: 80, align: 'right' });

    yPosition += 18;
    drawLine(yPosition);
    yPosition += 10;

    const transactionsToShow = data.transactions.slice(0, 50); // Limit to 50 transactions

    transactionsToShow.forEach(transaction => {
        if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
        }

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#000000')
            .text(formatDate(transaction.date), 50, yPosition, { width: 70, continued: true })
            .text(transaction.description.substring(0, 25), 120, yPosition, { width: 150, continued: true })
            .text(transaction.category.substring(0, 15), 270, yPosition, { width: 100, continued: true })
            .fillColor(transaction.amount < 0 ? '#ef4444' : '#10b981')
            .text(formatCurrency(Math.abs(transaction.amount)), 370, yPosition, { width: 80, align: 'right' });

        yPosition += 15;
    });

    if (data.transactions.length > 50) {
        yPosition += 10;
        doc.fontSize(9)
            .fillColor('#6b7280')
            .text(`... and ${data.transactions.length - 50} more transactions`, 50, yPosition);
    }

    // ============ AI INSIGHTS ============
    if (data.insights && data.insights.length > 0) {
        doc.addPage();
        yPosition = 50;
        yPosition = addSection('AI-Powered Insights', yPosition);

        data.insights.forEach((insight, index) => {
            if (yPosition > 680) {
                doc.addPage();
                yPosition = 50;
            }

            const iconMap: Record<string, string> = {
                success: '✓',
                warning: '⚠',
                danger: '✕',
                info: 'ℹ'
            };

            const colorMap: Record<string, string> = {
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#3b82f6'
            };

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(colorMap[insight.type] || '#000000')
                .text(`${iconMap[insight.type] || '•'} ${insight.title}`, 50, yPosition);
            yPosition += 18;

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#000000')
                .text(insight.message, 60, yPosition, { width: 480 });
            yPosition += doc.heightOfString(insight.message, { width: 480 }) + 15;
        });
    }

    // ============ AI ADVICE ============
    if (data.aiAdvice) {
        if (yPosition > 600) {
            doc.addPage();
            yPosition = 50;
        }

        yPosition = addSection('Personalized Recommendations', yPosition);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text(data.aiAdvice, 50, yPosition, { width: 495, align: 'justify' });
    }

    // ============ FOOTER ============
    doc.addPage();
    yPosition = 700;

    doc.fontSize(8)
        .fillColor('#6b7280')
        .text(
            'This report is generated by Financi - Your Personal Finance Manager',
            50,
            yPosition,
            { align: 'center' }
        );
    yPosition += 15;
    doc.text(
        'For questions or support, visit https://github.com/priya2004-13/financial-tracker-final',
        50,
        yPosition,
        { align: 'center' }
    );

    // Finalize PDF
    doc.end();
};

/**
 * Generate a simplified monthly summary PDF
 */
export const generateMonthlySummaryPDF = (
    data: Pick<ReportData, 'user' | 'period' | 'summary' | 'expensesByCategory'>,
    res: Response
): void => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=monthly-summary-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('Monthly Financial Summary', 50, 50, { align: 'center' });

    doc.fontSize(12)
        .font('Helvetica')
        .text(
            `${new Date(data.period.start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
            50,
            90,
            { align: 'center' }
        );

    // Summary boxes
    let y = 140;
    const boxWidth = 230;
    const boxHeight = 80;

    // Income Box
    doc.rect(50, y, boxWidth, boxHeight).fillAndStroke('#10b981', '#10b981');
    doc.fillColor('#ffffff')
        .fontSize(14)
        .text('Total Income', 60, y + 20)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(`₹${data.summary.totalIncome.toFixed(2)}`, 60, y + 45);

    // Expenses Box
    doc.rect(315, y, boxWidth, boxHeight).fillAndStroke('#ef4444', '#ef4444');
    doc.fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica')
        .text('Total Expenses', 325, y + 20)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(`₹${data.summary.totalExpenses.toFixed(2)}`, 325, y + 45);

    y += 100;

    // Savings Box
    doc.rect(50, y, boxWidth, boxHeight).fillAndStroke('#3b82f6', '#3b82f6');
    doc.fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica')
        .text('Net Savings', 60, y + 20)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(`₹${data.summary.netSavings.toFixed(2)}`, 60, y + 45);

    // Savings Rate Box
    const savingsRateColor = data.summary.savingsRate >= 20 ? '#10b981' : '#f59e0b';
    doc.rect(315, y, boxWidth, boxHeight).fillAndStroke(savingsRateColor, savingsRateColor);
    doc.fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica')
        .text('Savings Rate', 325, y + 20)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(`${data.summary.savingsRate.toFixed(1)}%`, 325, y + 45);

    // Category breakdown
    y += 120;
    doc.fillColor('#000000')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Top Expense Categories', 50, y);

    y += 30;
    const topCategories = Object.entries(data.expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    topCategories.forEach(([category, amount]) => {
        const percentage = (amount / data.summary.totalExpenses) * 100;

        doc.fontSize(12)
            .font('Helvetica')
            .text(category, 50, y, { width: 250 })
            .text(`₹${amount.toFixed(2)} (${percentage.toFixed(1)}%)`, 300, y, { align: 'right' });

        y += 25;
    });

    doc.end();
};
