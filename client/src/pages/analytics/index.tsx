// client/src/pages/analytics/index.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { PageLoader } from "../../components/PageLoader";
import { useScreenSize } from "../../hooks/useScreenSize";
import { FinancialRecordChart as SpendingBarChart } from "../dashboard/financial-record-chart";
import { CategoryChart } from "../../components/CategoryChart";
import { SpendingInsights } from "../../components/SpendingInsights";
import TrendAnalysisChart from "../../components/TrendAnalysisChart";
import { FinancialHealth } from "../../components/FinancialHealth";
import { FinancialSummary } from "../../components/FinancialSummary";
import { ArrowLeft, BarChart3, TrendingUp, PieChart, IndianRupee, Flame, Calendar as CalendarIcon, Percent, TrendingDown, ArrowUpCircle, ArrowDownCircle, Zap, Activity, Target, AlertTriangle, Brain, Sparkles, TrendingUpIcon, Filter } from "lucide-react";
import "./analytics.css";

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const { isLoading, records, budget } = useFinancialRecords();
    const screenSize = useScreenSize();
    const isMobile = screenSize === "xs";
    const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("month");

    // Phase 2 state
    const [selectedChart, setSelectedChart] = useState<"radar" | "sankey">("radar");
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
    const [showPredictions, setShowPredictions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Phase 1: Calculate financial metrics
    const financialMetrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month data
        const currentMonthRecords = records.filter((record) => {
            const recordDate = new Date(record.date);
            return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear
            );
        });

        const income = currentMonthRecords
            .filter(r => r.category === "Salary")
            .reduce((sum, r) => sum + r.amount, 0);

        const expenses = currentMonthRecords
            .filter(r => r.category !== "Salary")
            .reduce((sum, r) => sum + r.amount, 0);

        const savings = income - expenses;

        // Savings Rate: (Savings / Income) * 100
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        // Burn Rate: Average daily spending
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const burnRate = expenses / daysInMonth;

        // Financial Runway: How many months can you survive with current savings
        const totalSavings = records
            .filter(r => r.category === "Salary")
            .reduce((sum, r) => sum + r.amount, 0) -
            records
                .filter(r => r.category !== "Salary")
                .reduce((sum, r) => sum + r.amount, 0);
        const runway = burnRate > 0 ? totalSavings / expenses : 0;

        // Debt-to-Income Ratio (using budget if available)
        const monthlyIncome = budget?.monthlySalary || income;
        const debtPayments = 0; // Would need debt tracking feature
        const debtToIncomeRatio = monthlyIncome > 0 ? (debtPayments / monthlyIncome) * 100 : 0;

        // Expense Ratios by Category
        const expenseRatios: Record<string, number> = {};
        currentMonthRecords
            .filter(r => r.category !== "Salary")
            .forEach(record => {
                if (!expenseRatios[record.category]) {
                    expenseRatios[record.category] = 0;
                }
                expenseRatios[record.category] += record.amount;
            });

        Object.keys(expenseRatios).forEach(category => {
            expenseRatios[category] = expenses > 0 ? (expenseRatios[category] / expenses) * 100 : 0;
        });

        return {
            income,
            expenses,
            savings,
            savingsRate,
            burnRate,
            runway,
            debtToIncomeRatio,
            expenseRatios
        };
    }, [records, budget]);

    // Phase 1: Comparative Analytics (Month-over-Month)
    const monthOverMonthAnalytics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Current month
        const currentData = records.filter((record) => {
            const recordDate = new Date(record.date);
            return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear
            );
        });

        // Previous month
        const prevData = records.filter((record) => {
            const recordDate = new Date(record.date);
            return (
                recordDate.getMonth() === prevMonth &&
                recordDate.getFullYear() === prevYear
            );
        });

        const currentIncome = currentData.filter(r => r.category === "Salary").reduce((sum, r) => sum + r.amount, 0);
        const currentExpenses = currentData.filter(r => r.category !== "Salary").reduce((sum, r) => sum + r.amount, 0);

        const prevIncome = prevData.filter(r => r.category === "Salary").reduce((sum, r) => sum + r.amount, 0);
        const prevExpenses = prevData.filter(r => r.category !== "Salary").reduce((sum, r) => sum + r.amount, 0);

        const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
        const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

        return {
            currentIncome,
            currentExpenses,
            prevIncome,
            prevExpenses,
            incomeChange,
            expenseChange,
            incomeGrowth: currentIncome - prevIncome,
            expenseGrowth: currentExpenses - prevExpenses
        };
    }, [records]);

    // Phase 1: Year-over-Year Analytics
    const yearOverYearAnalytics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastYear = currentYear - 1;

        // Current year, current month
        const currentData = records.filter((record) => {
            const recordDate = new Date(record.date);
            return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear
            );
        });

        // Last year, same month
        const lastYearData = records.filter((record) => {
            const recordDate = new Date(record.date);
            return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === lastYear
            );
        });

        const currentIncome = currentData.filter(r => r.category === "Salary").reduce((sum, r) => sum + r.amount, 0);
        const currentExpenses = currentData.filter(r => r.category !== "Salary").reduce((sum, r) => sum + r.amount, 0);

        const lastYearIncome = lastYearData.filter(r => r.category === "Salary").reduce((sum, r) => sum + r.amount, 0);
        const lastYearExpenses = lastYearData.filter(r => r.category !== "Salary").reduce((sum, r) => sum + r.amount, 0);

        const incomeChange = lastYearIncome > 0 ? ((currentIncome - lastYearIncome) / lastYearIncome) * 100 : 0;
        const expenseChange = lastYearExpenses > 0 ? ((currentExpenses - lastYearExpenses) / lastYearExpenses) * 100 : 0;

        return {
            currentIncome,
            currentExpenses,
            lastYearIncome,
            lastYearExpenses,
            incomeChange,
            expenseChange,
            incomeGrowth: currentIncome - lastYearIncome,
            expenseGrowth: currentExpenses - lastYearExpenses
        };
    }, [records]);

    // Phase 2: Radar Chart Data (Category distribution)
    const radarChartData = useMemo(() => {
        const categoryTotals: { [key: string]: number } = {};
        const daysInRange = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInRange);

        records
            .filter(r => r.category !== 'Salary' && new Date(r.date) >= cutoffDate)
            .forEach(record => {
                categoryTotals[record.category] = (categoryTotals[record.category] || 0) + record.amount;
            });

        const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

        return Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            amount,
            percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
    }, [records, timeRange]);

    // Phase 2: Sankey Flow Data (Income → Categories → Subcategories)
    const sankeyFlowData = useMemo(() => {
        const daysInRange = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInRange);

        const income = records
            .filter(r => r.category === 'Salary' && new Date(r.date) >= cutoffDate)
            .reduce((sum, r) => sum + r.amount, 0);

        const categoryFlows: { [key: string]: number } = {};
        records
            .filter(r => r.category !== 'Salary' && new Date(r.date) >= cutoffDate)
            .forEach(record => {
                categoryFlows[record.category] = (categoryFlows[record.category] || 0) + record.amount;
            });

        const totalExpenses = Object.values(categoryFlows).reduce((sum, val) => sum + val, 0);
        const savings = income - totalExpenses;

        return {
            income,
            expenses: totalExpenses,
            savings: Math.max(0, savings),
            categoryFlows: Object.entries(categoryFlows).map(([category, amount]) => ({
                category,
                amount,
                percentage: income > 0 ? (amount / income) * 100 : 0
            })).sort((a, b) => b.amount - a.amount)
        };
    }, [records, timeRange]);

    // Phase 3: Predictive Analytics (Next month forecast)
    const predictiveAnalytics = useMemo(() => {
        // Get last 3 months data for trend analysis
        const months = [];
        for (let i = 2; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth();
            const year = date.getFullYear();

            const monthRecords = records.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === month && rDate.getFullYear() === year;
            });

            const income = monthRecords.filter(r => r.category === 'Salary').reduce((sum, r) => sum + r.amount, 0);
            const expenses = monthRecords.filter(r => r.category !== 'Salary').reduce((sum, r) => sum + r.amount, 0);

            months.push({ month: date.toLocaleString('default', { month: 'short' }), income, expenses });
        }

        // Simple linear regression for prediction
        const avgIncome = months.reduce((sum, m) => sum + m.income, 0) / months.length;
        const avgExpenses = months.reduce((sum, m) => sum + m.expenses, 0) / months.length;

        // Calculate trend (positive/negative/stable)
        const expenseTrend = months.length >= 2 ?
            ((months[months.length - 1].expenses - months[0].expenses) / months[0].expenses) * 100 : 0;

        return {
            forecastedIncome: avgIncome,
            forecastedExpenses: avgExpenses,
            forecastedSavings: avgIncome - avgExpenses,
            trend: expenseTrend > 5 ? 'increasing' : expenseTrend < -5 ? 'decreasing' : 'stable',
            confidence: months.length >= 3 ? 85 : 70,
            recommendation: expenseTrend > 10 ? 'Consider reducing spending' :
                expenseTrend < -10 ? 'Great job controlling expenses!' :
                    'Maintain current spending patterns'
        };
    }, [records]);

    // Phase 3: Anomaly Detection
    const anomalies = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate average spending per category over last 3 months
        const categoryAverages: { [key: string]: number[] } = {};

        for (let i = 3; i >= 1; i--) {
            const date = new Date(currentYear, currentMonth - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();

            records
                .filter(r => {
                    const rDate = new Date(r.date);
                    return rDate.getMonth() === month && rDate.getFullYear() === year && r.category !== 'Salary';
                })
                .forEach(r => {
                    if (!categoryAverages[r.category]) categoryAverages[r.category] = [];
                    categoryAverages[r.category].push(r.amount);
                });
        }

        // Current month spending by category
        const currentMonthSpending: { [key: string]: number } = {};
        records
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear && r.category !== 'Salary';
            })
            .forEach(r => {
                currentMonthSpending[r.category] = (currentMonthSpending[r.category] || 0) + r.amount;
            });

        // Detect anomalies (spending > 150% of average)
        const detectedAnomalies = Object.entries(currentMonthSpending)
            .map(([category, amount]) => {
                const avgSpending = categoryAverages[category]
                    ? categoryAverages[category].reduce((sum, val) => sum + val, 0) / categoryAverages[category].length
                    : 0;

                const deviation = avgSpending > 0 ? ((amount - avgSpending) / avgSpending) * 100 : 0;

                return {
                    category,
                    currentSpending: amount,
                    averageSpending: avgSpending,
                    deviation,
                    isAnomaly: deviation > 50 || deviation < -50,
                    severity: Math.abs(deviation) > 100 ? 'high' : Math.abs(deviation) > 50 ? 'medium' : 'low'
                };
            })
            .filter(a => a.isAnomaly)
            .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

        return detectedAnomalies;
    }, [records]);

    // Phase 3: AI Insights
    const aiInsights = useMemo(() => {
        const insights = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get current month data
        const currentMonthRecords = records.filter(r => {
            const rDate = new Date(r.date);
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
        });

        const currentIncome = currentMonthRecords.filter(r => r.category === 'Salary').reduce((sum, r) => sum + r.amount, 0);
        const currentExpenses = currentMonthRecords.filter(r => r.category !== 'Salary').reduce((sum, r) => sum + r.amount, 0);
        const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;

        // Insight 1: Savings rate analysis
        if (savingsRate < 10) {
            insights.push({
                type: 'warning',
                title: 'Low Savings Rate',
                message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% to build wealth.`,
                action: 'Review your expenses and find areas to cut back.',
                icon: 'alert'
            });
        } else if (savingsRate > 30) {
            insights.push({
                type: 'success',
                title: 'Excellent Savings!',
                message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep it up!`,
                action: 'Consider investing your surplus for long-term growth.',
                icon: 'trophy'
            });
        }

        // Insight 2: Top spending category
        const categoryTotals: { [key: string]: number } = {};
        currentMonthRecords
            .filter(r => r.category !== 'Salary')
            .forEach(r => {
                categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
            });

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        if (sortedCategories.length > 0) {
            const [topCategory, topAmount] = sortedCategories[0];
            const percentage = currentExpenses > 0 ? (topAmount / currentExpenses) * 100 : 0;

            if (percentage > 40) {
                insights.push({
                    type: 'info',
                    title: 'Spending Concentration',
                    message: `${percentage.toFixed(0)}% of your spending goes to ${topCategory}.`,
                    action: 'Consider if this aligns with your priorities and budget.',
                    icon: 'target'
                });
            }
        }

        // Insight 3: Budget comparison
        if (budget) {
            const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
            const budgetUtilization = totalBudget > 0 ? (currentExpenses / totalBudget) * 100 : 0;

            if (budgetUtilization > 90) {
                insights.push({
                    type: 'warning',
                    title: 'Budget Alert',
                    message: `You've used ${budgetUtilization.toFixed(0)}% of your monthly budget.`,
                    action: 'Be cautious with remaining expenses this month.',
                    icon: 'alert'
                });
            }
        }

        // Insight 4: Spending trend
        if (predictiveAnalytics.trend === 'increasing') {
            insights.push({
                type: 'warning',
                title: 'Rising Expenses',
                message: 'Your spending has been trending upward recently.',
                action: predictiveAnalytics.recommendation,
                icon: 'trending-up'
            });
        } else if (predictiveAnalytics.trend === 'decreasing') {
            insights.push({
                type: 'success',
                title: 'Spending Under Control',
                message: 'Your expenses are trending downward. Great discipline!',
                action: 'Keep maintaining your spending habits.',
                icon: 'trending-down'
            });
        }

        return insights;
    }, [records, budget, predictiveAnalytics]);

    if (isLoading) {
        return <PageLoader message="Loading analytics..." variant="minimal" />;
    }

    return (
        <div className="analytics-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <BarChart3 size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Financial Analytics</h1>
                        <p>Comprehensive insights into your spending patterns and financial health</p>
                    </div>
                </div>
            </div>

            <div className="analytics-content">
                {/* Phase 1: Financial Metrics Dashboard */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <IndianRupee size={24} />
                        <h2>Key Financial Metrics</h2>
                    </div>
                    <div className="metrics-grid">
                        {/* Savings Rate */}
                        <div className="metric-card savings-rate">
                            <div className="metric-icon">
                                <IndianRupee size={32} />
                            </div>
                            <div className="metric-content">
                                <h3>Savings Rate</h3>
                                <div className="metric-value">
                                    <span className="value">{financialMetrics.savingsRate.toFixed(1)}</span>
                                    <span className="unit">%</span>
                                </div>
                                <p className="metric-description">
                                    {financialMetrics.savingsRate >= 20 ? '🌟 Excellent! Keep it up!' :
                                        financialMetrics.savingsRate >= 10 ? '👍 Good progress' :
                                            financialMetrics.savingsRate >= 5 ? '⚠️ Could be better' :
                                                '🚨 Consider saving more'}
                                </p>
                                <div className="metric-detail">
                                    Saving ₹{financialMetrics.savings.toFixed(0)} this month
                                </div>
                            </div>
                        </div>

                        {/* Burn Rate */}
                        <div className="metric-card burn-rate">
                            <div className="metric-icon">
                                <Flame size={32} />
                            </div>
                            <div className="metric-content">
                                <h3>Daily Burn Rate</h3>
                                <div className="metric-value">
                                    <span className="currency">₹</span>
                                    <span className="value">{financialMetrics.burnRate.toFixed(0)}</span>
                                    <span className="unit">/day</span>
                                </div>
                                <p className="metric-description">
                                    Average daily spending
                                </p>
                                <div className="metric-detail">
                                    ₹{financialMetrics.expenses.toFixed(0)} total this month
                                </div>
                            </div>
                        </div>

                        {/* Financial Runway */}
                        <div className="metric-card runway">
                            <div className="metric-icon">
                                <CalendarIcon size={32} />
                            </div>
                            <div className="metric-content">
                                <h3>Financial Runway</h3>
                                <div className="metric-value">
                                    <span className="value">{financialMetrics.runway.toFixed(1)}</span>
                                    <span className="unit">months</span>
                                </div>
                                <p className="metric-description">
                                    {financialMetrics.runway >= 6 ? '🎯 Great emergency fund!' :
                                        financialMetrics.runway >= 3 ? '✅ Decent buffer' :
                                            financialMetrics.runway >= 1 ? '⚠️ Build your cushion' :
                                                '🚨 Need emergency fund'}
                                </p>
                                <div className="metric-detail">
                                    Survival time with current savings
                                </div>
                            </div>
                        </div>

                        {/* Debt-to-Income Ratio */}
                        <div className="metric-card debt-ratio">
                            <div className="metric-icon">
                                <Percent size={32} />
                            </div>
                            <div className="metric-content">
                                <h3>Debt-to-Income</h3>
                                <div className="metric-value">
                                    <span className="value">{financialMetrics.debtToIncomeRatio.toFixed(1)}</span>
                                    <span className="unit">%</span>
                                </div>
                                <p className="metric-description">
                                    {financialMetrics.debtToIncomeRatio <= 20 ? '🌟 Excellent ratio!' :
                                        financialMetrics.debtToIncomeRatio <= 35 ? '👍 Manageable' :
                                            '⚠️ High debt burden'}
                                </p>
                                <div className="metric-detail">
                                    Debt payments vs income
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Phase 1: Expense Ratios */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <PieChart size={24} />
                        <h2>Expense Distribution</h2>
                    </div>
                    <div className="expense-ratios-grid">
                        {Object.entries(financialMetrics.expenseRatios)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, percentage]) => (
                                <div key={category} className="ratio-card">
                                    <div className="ratio-header">
                                        <span className="ratio-category">{category}</span>
                                        <span className="ratio-percentage">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="ratio-bar">
                                        <div
                                            className="ratio-fill"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="ratio-footer">
                                        <span className="ratio-amount">
                                            ₹{((percentage / 100) * financialMetrics.expenses).toFixed(0)}
                                        </span>
                                        <span className="ratio-label">of total expenses</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>

                {/* Phase 1: Month-over-Month Comparison */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <ArrowUpCircle size={24} />
                        <h2>Month-over-Month Growth</h2>
                    </div>
                    <div className="comparison-grid-mom">
                        {/* Income Comparison */}
                        <div className="comparison-card">
                            <h3>Income Comparison</h3>
                            <div className="comparison-values">
                                <div className="value-item current">
                                    <span className="label">This Month</span>
                                    <span className="amount">₹{monthOverMonthAnalytics.currentIncome.toFixed(0)}</span>
                                </div>
                                <div className="comparison-arrow">
                                    {monthOverMonthAnalytics.incomeChange >= 0 ?
                                        <ArrowUpCircle size={32} className="up" /> :
                                        <ArrowDownCircle size={32} className="down" />
                                    }
                                </div>
                                <div className="value-item previous">
                                    <span className="label">Last Month</span>
                                    <span className="amount">₹{monthOverMonthAnalytics.prevIncome.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className={`change-indicator ${monthOverMonthAnalytics.incomeChange >= 0 ? 'positive' : 'negative'}`}>
                                {monthOverMonthAnalytics.incomeChange >= 0 ? '↑' : '↓'}
                                {Math.abs(monthOverMonthAnalytics.incomeChange).toFixed(1)}%
                                ({monthOverMonthAnalytics.incomeChange >= 0 ? '+' : ''}₹{monthOverMonthAnalytics.incomeGrowth.toFixed(0)})
                            </div>
                        </div>

                        {/* Expense Comparison */}
                        <div className="comparison-card">
                            <h3>Expense Comparison</h3>
                            <div className="comparison-values">
                                <div className="value-item current">
                                    <span className="label">This Month</span>
                                    <span className="amount">₹{monthOverMonthAnalytics.currentExpenses.toFixed(0)}</span>
                                </div>
                                <div className="comparison-arrow">
                                    {monthOverMonthAnalytics.expenseChange >= 0 ?
                                        <ArrowUpCircle size={32} className="up" /> :
                                        <ArrowDownCircle size={32} className="down" />
                                    }
                                </div>
                                <div className="value-item previous">
                                    <span className="label">Last Month</span>
                                    <span className="amount">₹{monthOverMonthAnalytics.prevExpenses.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className={`change-indicator ${monthOverMonthAnalytics.expenseChange <= 0 ? 'positive' : 'negative'}`}>
                                {monthOverMonthAnalytics.expenseChange >= 0 ? '↑' : '↓'}
                                {Math.abs(monthOverMonthAnalytics.expenseChange).toFixed(1)}%
                                ({monthOverMonthAnalytics.expenseChange >= 0 ? '+' : ''}₹{monthOverMonthAnalytics.expenseGrowth.toFixed(0)})
                            </div>
                        </div>
                    </div>
                </section>

                {/* Phase 1: Year-over-Year Comparison */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <TrendingUp size={24} />
                        <h2>Year-over-Year Growth</h2>
                    </div>
                    <div className="comparison-grid-yoy">
                        {/* Income YoY */}
                        <div className="yoy-card">
                            <div className="yoy-header">
                                <h3>Income Growth</h3>
                                <span className={`yoy-badge ${yearOverYearAnalytics.incomeChange >= 0 ? 'positive' : 'negative'}`}>
                                    {yearOverYearAnalytics.incomeChange >= 0 ? '↑' : '↓'}
                                    {Math.abs(yearOverYearAnalytics.incomeChange).toFixed(1)}%
                                </span>
                            </div>
                            <div className="yoy-comparison">
                                <div className="yoy-bar-container">
                                    <div className="bar-label">This Year</div>
                                    <div className="yoy-bar current">
                                        <div
                                            className="yoy-bar-fill"
                                            style={{
                                                width: `${Math.max(yearOverYearAnalytics.currentIncome, yearOverYearAnalytics.lastYearIncome) > 0 ?
                                                    (yearOverYearAnalytics.currentIncome / Math.max(yearOverYearAnalytics.currentIncome, yearOverYearAnalytics.lastYearIncome)) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value">₹{yearOverYearAnalytics.currentIncome.toFixed(0)}</div>
                                </div>
                                <div className="yoy-bar-container">
                                    <div className="bar-label">Last Year</div>
                                    <div className="yoy-bar previous">
                                        <div
                                            className="yoy-bar-fill"
                                            style={{
                                                width: `${Math.max(yearOverYearAnalytics.currentIncome, yearOverYearAnalytics.lastYearIncome) > 0 ?
                                                    (yearOverYearAnalytics.lastYearIncome / Math.max(yearOverYearAnalytics.currentIncome, yearOverYearAnalytics.lastYearIncome)) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value">₹{yearOverYearAnalytics.lastYearIncome.toFixed(0)}</div>
                                </div>
                            </div>
                            <div className="yoy-footer">
                                <span className={yearOverYearAnalytics.incomeGrowth >= 0 ? 'positive' : 'negative'}>
                                    {yearOverYearAnalytics.incomeGrowth >= 0 ? '+' : ''}₹{yearOverYearAnalytics.incomeGrowth.toFixed(0)} change
                                </span>
                            </div>
                        </div>

                        {/* Expense YoY */}
                        <div className="yoy-card">
                            <div className="yoy-header">
                                <h3>Expense Growth</h3>
                                <span className={`yoy-badge ${yearOverYearAnalytics.expenseChange <= 0 ? 'positive' : 'negative'}`}>
                                    {yearOverYearAnalytics.expenseChange >= 0 ? '↑' : '↓'}
                                    {Math.abs(yearOverYearAnalytics.expenseChange).toFixed(1)}%
                                </span>
                            </div>
                            <div className="yoy-comparison">
                                <div className="yoy-bar-container">
                                    <div className="bar-label">This Year</div>
                                    <div className="yoy-bar current">
                                        <div
                                            className="yoy-bar-fill expense"
                                            style={{
                                                width: `${Math.max(yearOverYearAnalytics.currentExpenses, yearOverYearAnalytics.lastYearExpenses) > 0 ?
                                                    (yearOverYearAnalytics.currentExpenses / Math.max(yearOverYearAnalytics.currentExpenses, yearOverYearAnalytics.lastYearExpenses)) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value">₹{yearOverYearAnalytics.currentExpenses.toFixed(0)}</div>
                                </div>
                                <div className="yoy-bar-container">
                                    <div className="bar-label">Last Year</div>
                                    <div className="yoy-bar previous">
                                        <div
                                            className="yoy-bar-fill expense"
                                            style={{
                                                width: `${Math.max(yearOverYearAnalytics.currentExpenses, yearOverYearAnalytics.lastYearExpenses) > 0 ?
                                                    (yearOverYearAnalytics.lastYearExpenses / Math.max(yearOverYearAnalytics.currentExpenses, yearOverYearAnalytics.lastYearExpenses)) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value">₹{yearOverYearAnalytics.lastYearExpenses.toFixed(0)}</div>
                                </div>
                            </div>
                            <div className="yoy-footer">
                                <span className={yearOverYearAnalytics.expenseGrowth <= 0 ? 'positive' : 'negative'}>
                                    {yearOverYearAnalytics.expenseGrowth >= 0 ? '+' : ''}₹{yearOverYearAnalytics.expenseGrowth.toFixed(0)} change
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Phase 2: Interactive Chart Selector */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <Activity size={24} />
                        <h2>Interactive Visualizations</h2>
                        <div className="chart-controls">
                            <div className="time-range-selector">
                                <button
                                    className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('7d')}
                                >
                                    7D
                                </button>
                                <button
                                    className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('30d')}
                                >
                                    30D
                                </button>
                                <button
                                    className={`range-btn ${timeRange === '90d' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('90d')}
                                >
                                    90D
                                </button>
                                <button
                                    className={`range-btn ${timeRange === '1y' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('1y')}
                                >
                                    1Y
                                </button>
                            </div>
                            <div className="chart-type-selector">
                                <button
                                    className={`chart-btn ${selectedChart === 'radar' ? 'active' : ''}`}
                                    onClick={() => setSelectedChart('radar')}
                                >
                                    <Target size={16} />
                                    Radar
                                </button>
                                <button
                                    className={`chart-btn ${selectedChart === 'sankey' ? 'active' : ''}`}
                                    onClick={() => setSelectedChart('sankey')}
                                >
                                    <TrendingUpIcon size={16} />
                                    Flow
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Phase 2: Radar Chart */}
                    {selectedChart === 'radar' && (
                        <div className="interactive-chart-container">
                            <h3>Category Distribution Radar</h3>
                            <p className="chart-description">Visual representation of spending across categories</p>
                            <div className="radar-chart">
                                {radarChartData.slice(0, 6).map((item, idx) => {
                                    const angle = (idx * 360) / Math.min(radarChartData.length, 6);
                                    const maxPercentage = Math.max(...radarChartData.slice(0, 6).map(d => d.percentage));
                                    const radius = (item.percentage / maxPercentage) * 120;

                                    return (
                                        <div
                                            key={item.category}
                                            className="radar-segment"
                                            style={{
                                                transform: `rotate(${angle}deg)`,
                                            }}
                                        >
                                            <div className="radar-axis">
                                                <div
                                                    className="radar-point"
                                                    style={{ width: `${radius}px` }}
                                                />
                                            </div>
                                            <div className="radar-label" style={{ transform: `rotate(-${angle}deg)` }}>
                                                <span className="category-name">{item.category}</span>
                                                <span className="category-percent">{item.percentage.toFixed(1)}%</span>
                                                <span className="category-amount">₹{item.amount.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="radar-legend">
                                {radarChartData.map((item, idx) => (
                                    <div
                                        key={item.category}
                                        className={`legend-item ${selectedCategory === item.category ? 'selected' : ''}`}
                                        onClick={() => setSelectedCategory(selectedCategory === item.category ? null : item.category)}
                                    >
                                        <div className="legend-color" style={{ backgroundColor: `hsl(${idx * 40}, 70%, 50%)` }} />
                                        <span className="legend-name">{item.category}</span>
                                        <span className="legend-value">₹{item.amount.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phase 2: Sankey Flow Diagram */}
                    {selectedChart === 'sankey' && (
                        <div className="interactive-chart-container">
                            <h3>Money Flow Diagram</h3>
                            <p className="chart-description">Visualize how your income flows into expenses and savings</p>
                            <div className="sankey-diagram">
                                {/* Income Node */}
                                <div className="sankey-column source">
                                    <div className="sankey-node income-node">
                                        <div className="node-label">Income</div>
                                        <div className="node-value">₹{sankeyFlowData.income.toFixed(0)}</div>
                                    </div>
                                </div>

                                {/* Flow Lines */}
                                <div className="sankey-flows">
                                    {sankeyFlowData.categoryFlows.map((flow, idx) => {
                                        const heightPercent = (flow.amount / sankeyFlowData.income) * 100;
                                        return (
                                            <div
                                                key={flow.category}
                                                className="flow-line"
                                                style={{
                                                    height: `${heightPercent}%`,
                                                    backgroundColor: `hsl(${idx * 30}, 70%, 50%)`,
                                                    opacity: 0.6
                                                }}
                                                title={`${flow.category}: ₹${flow.amount.toFixed(0)} (${flow.percentage.toFixed(1)}%)`}
                                            />
                                        );
                                    })}
                                    {sankeyFlowData.savings > 0 && (
                                        <div
                                            className="flow-line savings-flow"
                                            style={{
                                                height: `${(sankeyFlowData.savings / sankeyFlowData.income) * 100}%`,
                                                backgroundColor: '#10b981',
                                                opacity: 0.6
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Categories Nodes */}
                                <div className="sankey-column target">
                                    {sankeyFlowData.categoryFlows.map((flow, idx) => (
                                        <div
                                            key={flow.category}
                                            className="sankey-node category-node"
                                            style={{
                                                height: `${(flow.amount / sankeyFlowData.income) * 100}%`,
                                                minHeight: '40px',
                                                backgroundColor: `hsl(${idx * 30}, 70%, 50%)`
                                            }}
                                        >
                                            <div className="node-label">{flow.category}</div>
                                            <div className="node-value">₹{flow.amount.toFixed(0)}</div>
                                            <div className="node-percent">{flow.percentage.toFixed(1)}%</div>
                                        </div>
                                    ))}
                                    {sankeyFlowData.savings > 0 && (
                                        <div
                                            className="sankey-node category-node savings-node"
                                            style={{
                                                height: `${(sankeyFlowData.savings / sankeyFlowData.income) * 100}%`,
                                                minHeight: '40px',
                                                backgroundColor: '#10b981'
                                            }}
                                        >
                                            <div className="node-label">Savings</div>
                                            <div className="node-value">₹{sankeyFlowData.savings.toFixed(0)}</div>
                                            <div className="node-percent">{((sankeyFlowData.savings / sankeyFlowData.income) * 100).toFixed(1)}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Phase 3: Predictive Analytics */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <Brain size={24} />
                        <h2>Predictive Analytics</h2>
                        <button
                            className={`toggle-predictions ${showPredictions ? 'active' : ''}`}
                            onClick={() => setShowPredictions(!showPredictions)}
                        >
                            {showPredictions ? 'Hide' : 'Show'} Predictions
                        </button>
                    </div>

                    {showPredictions && (
                        <div className="predictions-container">
                            <div className="prediction-card">
                                <div className="prediction-header">
                                    <Sparkles size={20} />
                                    <h3>Next Month Forecast</h3>
                                    <span className="confidence-badge">
                                        {predictiveAnalytics.confidence}% confidence
                                    </span>
                                </div>
                                <div className="prediction-metrics">
                                    <div className="prediction-item">
                                        <span className="pred-label">Expected Income</span>
                                        <span className="pred-value income">₹{predictiveAnalytics.forecastedIncome.toFixed(0)}</span>
                                    </div>
                                    <div className="prediction-item">
                                        <span className="pred-label">Expected Expenses</span>
                                        <span className="pred-value expense">₹{predictiveAnalytics.forecastedExpenses.toFixed(0)}</span>
                                    </div>
                                    <div className="prediction-item">
                                        <span className="pred-label">Expected Savings</span>
                                        <span className={`pred-value ${predictiveAnalytics.forecastedSavings >= 0 ? 'positive' : 'negative'}`}>
                                            ₹{predictiveAnalytics.forecastedSavings.toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="prediction-trend">
                                    <div className={`trend-badge ${predictiveAnalytics.trend}`}>
                                        {predictiveAnalytics.trend === 'increasing' ? '📈 Increasing' :
                                            predictiveAnalytics.trend === 'decreasing' ? '📉 Decreasing' :
                                                '➡️ Stable'}
                                    </div>
                                    <p className="trend-description">{predictiveAnalytics.recommendation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Phase 3: Anomaly Detection */}
                {anomalies.length > 0 && (
                    <section className="analytics-section full-width">
                        <div className="section-title">
                            <AlertTriangle size={24} />
                            <h2>Spending Anomalies Detected</h2>
                        </div>
                        <div className="anomalies-grid">
                            {anomalies.map((anomaly) => (
                                <div
                                    key={anomaly.category}
                                    className={`anomaly-card severity-${anomaly.severity}`}
                                >
                                    <div className="anomaly-header">
                                        <span className="anomaly-category">{anomaly.category}</span>
                                        <span className={`anomaly-badge ${anomaly.severity}`}>
                                            {anomaly.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="anomaly-comparison">
                                        <div className="comparison-bar">
                                            <div className="bar-section average">
                                                <div className="bar-fill" style={{ width: '100%' }} />
                                                <span className="bar-label">Avg</span>
                                                <span className="bar-value">₹{anomaly.averageSpending.toFixed(0)}</span>
                                            </div>
                                            <div className="bar-section current">
                                                <div
                                                    className="bar-fill"
                                                    style={{
                                                        width: `${Math.min((anomaly.currentSpending / anomaly.averageSpending) * 100, 200)}%`
                                                    }}
                                                />
                                                <span className="bar-label">Now</span>
                                                <span className="bar-value">₹{anomaly.currentSpending.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="anomaly-footer">
                                        <span className={`deviation ${anomaly.deviation > 0 ? 'negative' : 'positive'}`}>
                                            {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(0)}% from average
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Phase 3: AI Insights */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <Zap size={24} />
                        <h2>AI-Powered Insights</h2>
                    </div>
                    <div className="ai-insights-grid">
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} className={`insight-card type-${insight.type}`}>
                                <div className="insight-icon">
                                    {insight.icon === 'alert' && <AlertTriangle size={24} />}
                                    {insight.icon === 'trophy' && <Target size={24} />}
                                    {insight.icon === 'target' && <Target size={24} />}
                                    {insight.icon === 'trending-up' && <TrendingUp size={24} />}
                                    {insight.icon === 'trending-down' && <TrendingDown size={24} />}
                                </div>
                                <div className="insight-content">
                                    <h3>{insight.title}</h3>
                                    <p className="insight-message">{insight.message}</p>
                                    <p className="insight-action">💡 {insight.action}</p>
                                </div>
                            </div>
                        ))}
                        {aiInsights.length === 0 && (
                            <div className="no-insights">
                                <Sparkles size={48} />
                                <p>Everything looks good! Keep tracking your finances to get personalized insights.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Overview Section */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <TrendingUp size={24} />
                        <h2>Financial Overview</h2>
                    </div>
                    <div className="overview-grid">
                        <FinancialSummary />
                        <FinancialHealth />
                    </div>
                </section>

                {!isMobile && (

                    <section className="analytics-section full-width">
                        <div className="section-title">
                            <PieChart size={24} />
                            <h2>Spending Analysis</h2>
                        </div>
                        <div className="charts-grid">
                            <div className="chart-container">
                                <CategoryChart />
                            </div>
                            <div className="chart-container">
                                <SpendingBarChart />
                            </div>
                        </div>
                    </section>
                )}
                {/* Insights Section */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <BarChart3 size={24} />
                        <h2>AI-Powered Insights</h2>
                    </div>
                    <SpendingInsights />
                </section>

                {/* Trends & Patterns */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <TrendingUp size={24} />
                        <h2>Trends & Patterns</h2>
                    </div>
                    <div className="trends-grid">
                        <div className="trend-item">
                            <h3>Monthly Trends</h3>
                            <TrendAnalysisChart />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
