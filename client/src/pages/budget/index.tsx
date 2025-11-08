// client/src/pages/budget/index.tsx

import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { BudgetManager } from "../../components/BudgetManager";
import { BudgetTracking } from "../../components/BudgetTracking";
import { BudgetTemplates } from "../../components/BudgetTemplates";
import { PageLoader } from "../../components/PageLoader";
import { ArrowLeft, PiggyBank, TrendingUp, AlertCircle, Activity, Calendar, Award, History, ChevronLeft, ChevronRight, BarChart3, Zap, Target, TrendingDown, Calculator, GitCompare, Download, Upload, Sparkles } from "lucide-react";
import "./budget.css";

export const BudgetPage = () => {
    const navigate = useNavigate();
    const { budget, records, isLoading } = useFinancialRecords();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [timePeriod, setTimePeriod] = useState<"week" | "month" | "quarter" | "year">("month");

    // Phase 3 state
    const [showScenarioCalculator, setShowScenarioCalculator] = useState(false);
    const [scenarioAdjustments, setScenarioAdjustments] = useState<Record<string, number>>({});
    const [comparisonMonth, setComparisonMonth] = useState<Date | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Calculate spending for selected month
    const monthlySpending = useMemo(() => {
        const month = selectedMonth.getMonth();
        const year = selectedMonth.getFullYear();

        return records
            .filter((record) => {
                const recordDate = new Date(record.date);
                return (
                    recordDate.getMonth() === month &&
                    recordDate.getFullYear() === year &&
                    record.category !== 'Salary'
                );
            })
            .reduce((acc, record) => {
                if (!acc[record.category]) {
                    acc[record.category] = 0;
                }
                acc[record.category] += record.amount;
                return acc;
            }, {} as Record<string, number>);
    }, [records, selectedMonth]);

    // Calculate budget health score (0-100)
    const budgetHealthScore = useMemo(() => {
        if (!budget) return 0;

        const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
        const totalSpent = Object.values(monthlySpending).reduce((sum, val) => sum + val, 0);

        if (totalBudget === 0) return 0;

        const categories = Object.keys(budget.categoryBudgets);
        let scoreSum = 0;

        categories.forEach(category => {
            const budgetAmount = budget.categoryBudgets[category];
            const spent = monthlySpending[category] || 0;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

            // Score calculation: 100 if under 80%, decreases as it goes over
            if (percentage <= 80) {
                scoreSum += 100;
            } else if (percentage <= 100) {
                scoreSum += 100 - ((percentage - 80) * 2); // Decrease score from 100 to 60
            } else {
                scoreSum += Math.max(0, 60 - (percentage - 100)); // Continue decreasing below 60
            }
        });

        const averageScore = categories.length > 0 ? scoreSum / categories.length : 0;

        // Overall spending ratio bonus/penalty
        const overallRatio = totalSpent / totalBudget;
        let finalScore = averageScore;

        if (overallRatio < 0.8) {
            finalScore = Math.min(100, finalScore + 10); // Bonus for being well under budget
        } else if (overallRatio > 1.0) {
            finalScore = Math.max(0, finalScore - 15); // Penalty for exceeding total budget
        }

        return Math.round(finalScore);
    }, [budget, monthlySpending]);

    // Get budget history for the last 6 months
    const budgetHistory = useMemo(() => {
        if (!budget) return [];

        const history = [];
        const currentDate = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();

            const spending = records
                .filter((record) => {
                    const recordDate = new Date(record.date);
                    return (
                        recordDate.getMonth() === month &&
                        recordDate.getFullYear() === year &&
                        record.category !== 'Salary'
                    );
                })
                .reduce((sum, record) => sum + record.amount, 0);

            const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
            const percentage = totalBudget > 0 ? (spending / totalBudget) * 100 : 0;

            history.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                spending,
                budget: totalBudget,
                percentage: Math.min(percentage, 100),
                status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good'
            });
        }

        return history;
    }, [budget, records]);

    // Calculate rollover amount (unused budget from previous month)
    const rolloverAmount = useMemo(() => {
        if (!budget) return 0;

        const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
        const month = prevMonth.getMonth();
        const year = prevMonth.getFullYear();

        const prevMonthSpending = records
            .filter((record) => {
                const recordDate = new Date(record.date);
                return (
                    recordDate.getMonth() === month &&
                    recordDate.getFullYear() === year &&
                    record.category !== 'Salary'
                );
            })
            .reduce((sum, record) => sum + record.amount, 0);

        const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
        const unused = totalBudget - prevMonthSpending;

        return unused > 0 ? unused : 0;
    }, [budget, records, selectedMonth]);

    // Phase 2: Budget vs Actual data for selected time period
    const budgetVsActual = useMemo(() => {
        if (!budget) return [];

        const now = new Date();
        const categories = Object.keys(budget.categoryBudgets);

        return categories.map(category => {
            const budgetAmount = budget.categoryBudgets[category];
            const actualSpent = monthlySpending[category] || 0;
            const difference = budgetAmount - actualSpent;
            const percentage = budgetAmount > 0 ? (actualSpent / budgetAmount) * 100 : 0;

            return {
                category,
                budget: budgetAmount,
                actual: actualSpent,
                difference,
                percentage: Math.min(percentage, 100),
                status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
            };
        });
    }, [budget, monthlySpending]);

    // Phase 2: Spending velocity (rate of spending per day)
    const spendingVelocity = useMemo(() => {
        if (!budget) return { dailyRate: 0, projectedTotal: 0, status: 'normal' };

        const month = selectedMonth.getMonth();
        const year = selectedMonth.getFullYear();
        const now = new Date();
        const isCurrentMonthCheck = month === now.getMonth() && year === now.getFullYear();

        if (!isCurrentMonthCheck) {
            // For past months, calculate actual velocity
            const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
            const totalSpent = Object.values(monthlySpending).reduce((sum, val) => sum + val, 0);
            return {
                dailyRate: totalSpent / totalDaysInMonth,
                projectedTotal: totalSpent,
                status: 'complete'
            };
        }

        // For current month, calculate velocity and projection
        const dayOfMonth = now.getDate();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const totalSpent = Object.values(monthlySpending).reduce((sum, val) => sum + val, 0);
        const dailyRate = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
        const projectedTotal = dailyRate * totalDaysInMonth;
        const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);

        let status: 'slow' | 'normal' | 'fast' | 'critical' = 'normal';
        const projectedPercentage = totalBudget > 0 ? (projectedTotal / totalBudget) * 100 : 0;

        if (projectedPercentage < 80) status = 'slow';
        else if (projectedPercentage >= 80 && projectedPercentage < 100) status = 'normal';
        else if (projectedPercentage >= 100 && projectedPercentage < 120) status = 'fast';
        else status = 'critical';

        return { dailyRate, projectedTotal, status, daysElapsed: dayOfMonth, totalDays: totalDaysInMonth };
    }, [budget, monthlySpending, selectedMonth]);

    // Phase 2: Budget adherence score (how well staying within budget)
    const adherenceScore = useMemo(() => {
        if (!budget) return 0;

        const categories = Object.keys(budget.categoryBudgets);
        let adherenceSum = 0;

        categories.forEach(category => {
            const budgetAmount = budget.categoryBudgets[category];
            const spent = monthlySpending[category] || 0;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

            // Perfect adherence is 70-90% of budget (not too little, not too much)
            if (percentage >= 70 && percentage <= 90) {
                adherenceSum += 100;
            } else if (percentage < 70) {
                adherenceSum += 70 + percentage; // Reward for not overspending but penalize for not using budget
            } else if (percentage <= 100) {
                adherenceSum += 100 - (percentage - 90); // Slightly penalize for approaching limit
            } else {
                adherenceSum += Math.max(0, 50 - (percentage - 100)); // Heavy penalty for exceeding
            }
        });

        return categories.length > 0 ? Math.round(adherenceSum / categories.length) : 0;
    }, [budget, monthlySpending]);

    // Phase 2: Spending forecast (predict end of month spending)
    const spendingForecast = useMemo(() => {
        if (!budget) return { categories: [], totalForecast: 0 };

        const month = selectedMonth.getMonth();
        const year = selectedMonth.getFullYear();
        const now = new Date();
        const isCurrentMonthCheck = month === now.getMonth() && year === now.getFullYear();

        if (!isCurrentMonthCheck) {
            return { categories: [], totalForecast: 0 };
        }

        const dayOfMonth = now.getDate();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const daysRemaining = totalDaysInMonth - dayOfMonth;

        const categoryForecasts = Object.keys(budget.categoryBudgets).map(category => {
            const budgetAmount = budget.categoryBudgets[category];
            const currentSpent = monthlySpending[category] || 0;
            const dailyAverage = dayOfMonth > 0 ? currentSpent / dayOfMonth : 0;
            const forecastedTotal = currentSpent + (dailyAverage * daysRemaining);
            const likelihood = budgetAmount > 0 ? (forecastedTotal / budgetAmount) * 100 : 0;

            return {
                category,
                currentSpent,
                forecastedTotal,
                budgetAmount,
                likelihood: Math.min(likelihood, 150),
                status: likelihood >= 100 ? 'over' : likelihood >= 90 ? 'warning' : 'safe'
            };
        });

        const totalForecast = categoryForecasts.reduce((sum, cat) => sum + cat.forecastedTotal, 0);

        return { categories: categoryForecasts, totalForecast };
    }, [budget, monthlySpending, selectedMonth]);

    // Phase 3: Budget Scenario Calculator
    const scenarioResults = useMemo(() => {
        if (!budget || Object.keys(scenarioAdjustments).length === 0) return null;

        const categories = Object.keys(budget.categoryBudgets);
        const results = categories.map(category => {
            const originalBudget = budget.categoryBudgets[category];
            const adjustment = scenarioAdjustments[category] || 0;
            const newBudget = originalBudget + adjustment;
            const currentSpent = monthlySpending[category] || 0;
            const impact = newBudget - currentSpent;
            const percentage = newBudget > 0 ? (currentSpent / newBudget) * 100 : 0;

            return {
                category,
                originalBudget,
                adjustment,
                newBudget,
                currentSpent,
                impact,
                percentage,
                status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
            };
        });

        const totalOriginal = categories.reduce((sum, cat) => sum + budget.categoryBudgets[cat], 0);
        const totalAdjustment = Object.values(scenarioAdjustments).reduce((sum, val) => sum + val, 0);
        const totalNew = totalOriginal + totalAdjustment;
        const totalSpent = Object.values(monthlySpending).reduce((sum, val) => sum + val, 0);

        return {
            categories: results,
            totalOriginal,
            totalAdjustment,
            totalNew,
            totalSpent,
            savings: totalNew - totalSpent
        };
    }, [budget, scenarioAdjustments, monthlySpending]);

    // Phase 3: Comparison data for selected months
    const comparisonData = useMemo(() => {
        if (!budget || !comparisonMonth) return null;

        const currentMonth = selectedMonth.getMonth();
        const currentYear = selectedMonth.getFullYear();
        const compareMonth = comparisonMonth.getMonth();
        const compareYear = comparisonMonth.getFullYear();

        const compareSpending = records
            .filter((record) => {
                const recordDate = new Date(record.date);
                return (
                    recordDate.getMonth() === compareMonth &&
                    recordDate.getFullYear() === compareYear &&
                    record.category !== 'Salary'
                );
            })
            .reduce((acc, record) => {
                if (!acc[record.category]) {
                    acc[record.category] = 0;
                }
                acc[record.category] += record.amount;
                return acc;
            }, {} as Record<string, number>);

        const categories = Object.keys(budget.categoryBudgets);
        const comparison = categories.map(category => {
            const currentSpent = monthlySpending[category] || 0;
            const compareSpent = compareSpending[category] || 0;
            const difference = currentSpent - compareSpent;
            const percentageChange = compareSpent > 0 ? ((difference / compareSpent) * 100) : 0;

            return {
                category,
                currentSpent,
                compareSpent,
                difference,
                percentageChange,
                trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
            };
        });

        const totalCurrent = Object.values(monthlySpending).reduce((sum, val) => sum + val, 0);
        const totalCompare = Object.values(compareSpending).reduce((sum, val) => sum + val, 0);
        const totalDifference = totalCurrent - totalCompare;
        const totalPercentageChange = totalCompare > 0 ? ((totalDifference / totalCompare) * 100) : 0;

        return {
            categories: comparison,
            totalCurrent,
            totalCompare,
            totalDifference,
            totalPercentageChange
        };
    }, [budget, comparisonMonth, selectedMonth, monthlySpending, records]);

    // Phase 3: Export budget data
    const exportBudgetData = () => {
        if (!budget) return;

        const data = {
            budget: budget,
            monthlySpending: monthlySpending,
            exportDate: new Date().toISOString(),
            month: selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Phase 3: Import budget data
    const importBudgetData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // In a real app, you would update the budget through your context/API
                console.log('Imported budget data:', data);
                alert('Budget data imported successfully! (This is a demo - actual import would update your budget)');
            } catch (error) {
                alert('Error importing budget data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    // Month navigation
    const goToPreviousMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
        const now = new Date();
        if (nextMonth <= now) {
            setSelectedMonth(nextMonth);
        }
    };

    const isCurrentMonth = () => {
        const now = new Date();
        return selectedMonth.getMonth() === now.getMonth() &&
            selectedMonth.getFullYear() === now.getFullYear();
    };

    if (isLoading) {
        return <PageLoader message="Loading budget data..." variant="minimal" />;
    }

    return (
        <div className="budget-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <PiggyBank size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Budget Management</h1>
                        <p>Set and track your budget across different categories</p>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            {!budget && (
                <div className="info-banner">
                    <AlertCircle size={20} />
                    <div>
                        <h3>Get Started with Budgeting</h3>
                        <p>Create your first budget to start tracking your spending and managing your finances better.</p>
                    </div>
                </div>
            )}

            {/* Budget Progress Dashboard */}
            {budget && (
                <>
                    {/* Month Selector */}
                    <div className="month-selector">
                        <button
                            className="month-nav-btn"
                            onClick={goToPreviousMonth}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="selected-month">
                            <Calendar size={18} />
                            <span>{selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            {isCurrentMonth() && <span className="current-badge">Current</span>}
                        </div>
                        <button
                            className="month-nav-btn"
                            onClick={goToNextMonth}
                            disabled={isCurrentMonth()}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Progress Dashboard Cards */}
                    <div className="progress-dashboard">
                        {/* Budget Health Score */}
                        <div className="dashboard-card health-score-card">
                            <div className="card-header">
                                <Activity size={20} />
                                <h3>Budget Health Score</h3>
                            </div>
                            <div className="health-score-display">
                                <div className={`score-circle score-${budgetHealthScore >= 80 ? 'excellent' : budgetHealthScore >= 60 ? 'good' : budgetHealthScore >= 40 ? 'fair' : 'poor'}`}>
                                    <span className="score-number">{budgetHealthScore}</span>
                                    <span className="score-label">/100</span>
                                </div>
                                <div className="score-info">
                                    <p className="score-status">
                                        {budgetHealthScore >= 80 ? '🌟 Excellent!' :
                                            budgetHealthScore >= 60 ? '👍 Good' :
                                                budgetHealthScore >= 40 ? '⚠️ Fair' :
                                                    '🚨 Needs Attention'}
                                    </p>
                                    <p className="score-description">
                                        {budgetHealthScore >= 80 ? 'Your spending is well within budget' :
                                            budgetHealthScore >= 60 ? 'Spending is mostly on track' :
                                                budgetHealthScore >= 40 ? 'Some categories need attention' :
                                                    'Multiple categories over budget'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rollover Budget */}
                        {rolloverAmount > 0 && (
                            <div className="dashboard-card rollover-card">
                                <div className="card-header">
                                    <Award size={20} />
                                    <h3>Rollover Budget</h3>
                                </div>
                                <div className="rollover-display">
                                    <div className="rollover-amount">
                                        <span className="currency">₹</span>
                                        <span className="amount">{rolloverAmount.toFixed(2)}</span>
                                    </div>
                                    <p className="rollover-info">
                                        💰 Unused budget from last month available for this month
                                    </p>
                                    <div className="rollover-breakdown">
                                        <span>Previous Budget: ₹{Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
                                        <span className="rollover-bonus">+ Rollover Bonus</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="dashboard-card quick-stats-card">
                            <div className="card-header">
                                <TrendingUp size={20} />
                                <h3>This Month Overview</h3>
                            </div>
                            <div className="quick-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Total Budget</span>
                                    <span className="stat-value">₹{Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Spent</span>
                                    <span className="stat-value spent">₹{Object.values(monthlySpending).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Remaining</span>
                                    <span className="stat-value remaining">
                                        ₹{(Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0) -
                                            Object.values(monthlySpending).reduce((sum, val) => sum + val, 0) +
                                            rolloverAmount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Categories</span>
                                    <span className="stat-value">{Object.keys(budget.categoryBudgets).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Budget History Timeline */}
                    <div className="budget-history-section">
                        <div className="section-header">
                            <History size={20} />
                            <h3>Budget History (Last 6 Months)</h3>
                        </div>
                        <div className="history-timeline">
                            {budgetHistory.map((item, index) => (
                                <div key={index} className={`history-item status-${item.status}`}>
                                    <div className="history-month">{item.month}</div>
                                    <div className="history-bar-container">
                                        <div
                                            className="history-bar"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="history-details">
                                        <span className="history-spent">₹{item.spending.toFixed(0)}</span>
                                        <span className="history-percentage">{item.percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="history-status">
                                        {item.status === 'exceeded' ? '🚨' :
                                            item.status === 'warning' ? '⚠️' : '✅'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase 2: Budget vs Actual Comparison Chart */}
                    <div className="budget-vs-actual-section">
                        <div className="section-header">
                            <BarChart3 size={20} />
                            <h3>Budget vs Actual Spending</h3>
                        </div>
                        <div className="comparison-grid">
                            {budgetVsActual.map((item) => (
                                <div key={item.category} className={`comparison-item status-${item.status}`}>
                                    <div className="comparison-header">
                                        <span className="comparison-category">{item.category}</span>
                                        <span className={`comparison-status-badge ${item.status}`}>
                                            {item.status === 'over' ? 'Over Budget' :
                                                item.status === 'warning' ? 'Near Limit' : 'On Track'}
                                        </span>
                                    </div>
                                    <div className="comparison-bars">
                                        <div className="comparison-bar-row">
                                            <span className="bar-label">Budget</span>
                                            <div className="bar-track">
                                                <div className="bar-fill budget-bar" style={{ width: '100%' }} />
                                            </div>
                                            <span className="bar-value">₹{item.budget.toFixed(0)}</span>
                                        </div>
                                        <div className="comparison-bar-row">
                                            <span className="bar-label">Actual</span>
                                            <div className="bar-track">
                                                <div
                                                    className={`bar-fill actual-bar ${item.status}`}
                                                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className="bar-value">₹{item.actual.toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div className="comparison-footer">
                                        <span className={`difference ${item.difference >= 0 ? 'positive' : 'negative'}`}>
                                            {item.difference >= 0 ? '↓' : '↑'} ₹{Math.abs(item.difference).toFixed(0)}
                                            {item.difference >= 0 ? ' remaining' : ' over'}
                                        </span>
                                        <span className="percentage">{item.percentage.toFixed(1)}% used</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase 2: Advanced Metrics Row */}
                    <div className="advanced-metrics-row">
                        {/* Spending Velocity */}
                        <div className={`metric-card velocity-card status-${spendingVelocity.status}`}>
                            <div className="metric-header">
                                <Zap size={20} />
                                <h3>Spending Velocity</h3>
                            </div>
                            <div className="metric-content">
                                <div className="velocity-gauge">
                                    <div className={`gauge-indicator ${spendingVelocity.status}`}>
                                        {spendingVelocity.status === 'slow' ? '🐢' :
                                            spendingVelocity.status === 'normal' ? '✅' :
                                                spendingVelocity.status === 'fast' ? '⚡' :
                                                    spendingVelocity.status === 'critical' ? '🚨' : '✓'}
                                    </div>
                                    <div className="gauge-value">
                                        ₹{spendingVelocity.dailyRate.toFixed(0)}<span className="gauge-unit">/day</span>
                                    </div>
                                </div>
                                <div className="velocity-details">
                                    <div className="velocity-stat">
                                        <span className="stat-label">Projected Total</span>
                                        <span className="stat-value">₹{spendingVelocity.projectedTotal.toFixed(0)}</span>
                                    </div>
                                    {spendingVelocity.daysElapsed && (
                                        <div className="velocity-progress">
                                            <div className="progress-bar-mini">
                                                <div
                                                    className="progress-fill-mini"
                                                    style={{ width: `${(spendingVelocity.daysElapsed / spendingVelocity.totalDays!) * 100}%` }}
                                                />
                                            </div>
                                            <span className="progress-text">
                                                Day {spendingVelocity.daysElapsed} of {spendingVelocity.totalDays}
                                            </span>
                                        </div>
                                    )}
                                    <p className="velocity-status">
                                        {spendingVelocity.status === 'slow' ? 'Spending slower than expected' :
                                            spendingVelocity.status === 'normal' ? 'Spending at healthy rate' :
                                                spendingVelocity.status === 'fast' ? 'Spending faster than budget' :
                                                    spendingVelocity.status === 'critical' ? 'Critical: Will exceed budget!' :
                                                        'Month completed'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Budget Adherence Score */}
                        <div className="metric-card adherence-card">
                            <div className="metric-header">
                                <Target size={20} />
                                <h3>Budget Adherence</h3>
                            </div>
                            <div className="metric-content">
                                <div className={`adherence-circle score-${adherenceScore >= 80 ? 'excellent' : adherenceScore >= 60 ? 'good' : adherenceScore >= 40 ? 'fair' : 'poor'}`}>
                                    <span className="adherence-number">{adherenceScore}</span>
                                    <span className="adherence-label">Score</span>
                                </div>
                                <div className="adherence-info">
                                    <p className="adherence-status">
                                        {adherenceScore >= 80 ? '🎯 Excellent Adherence' :
                                            adherenceScore >= 60 ? '👍 Good Tracking' :
                                                adherenceScore >= 40 ? '⚠️ Needs Improvement' :
                                                    '🚨 Poor Adherence'}
                                    </p>
                                    <p className="adherence-description">
                                        {adherenceScore >= 80 ? 'Staying within budget across all categories' :
                                            adherenceScore >= 60 ? 'Most categories on track' :
                                                adherenceScore >= 40 ? 'Several categories off track' :
                                                    'Multiple categories exceeding limits'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Spending Forecast */}
                        {spendingForecast.totalForecast > 0 && (
                            <div className="metric-card forecast-card">
                                <div className="metric-header">
                                    <TrendingDown size={20} />
                                    <h3>End of Month Forecast</h3>
                                </div>
                                <div className="metric-content">
                                    <div className="forecast-total">
                                        <span className="forecast-label">Projected Spending</span>
                                        <span className="forecast-value">₹{spendingForecast.totalForecast.toFixed(0)}</span>
                                    </div>
                                    <div className="forecast-categories">
                                        {spendingForecast.categories
                                            .filter(cat => cat.forecastedTotal > 0)
                                            .sort((a, b) => b.likelihood - a.likelihood)
                                            .slice(0, 3)
                                            .map((cat) => (
                                                <div key={cat.category} className={`forecast-item ${cat.status}`}>
                                                    <div className="forecast-item-header">
                                                        <span className="forecast-category">{cat.category}</span>
                                                        <span className="forecast-likelihood">{cat.likelihood.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="forecast-mini-bar">
                                                        <div
                                                            className={`forecast-bar-fill ${cat.status}`}
                                                            style={{ width: `${Math.min(cat.likelihood, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Phase 3: Action Buttons Row */}
                    <div className="phase3-actions-row">
                        <button
                            className={`action-btn scenario-btn ${showScenarioCalculator ? 'active' : ''}`}
                            onClick={() => setShowScenarioCalculator(!showScenarioCalculator)}
                        >
                            <Calculator size={20} />
                            Budget Scenarios
                        </button>
                        <button
                            className={`action-btn comparison-btn ${showComparison ? 'active' : ''}`}
                            onClick={() => setShowComparison(!showComparison)}
                        >
                            <GitCompare size={20} />
                            Compare Months
                        </button>
                        <button
                            className="action-btn export-btn"
                            onClick={exportBudgetData}
                        >
                            <Download size={20} />
                            Export Budget
                        </button>
                        <label className="action-btn import-btn">
                            <Upload size={20} />
                            Import Budget
                            <input
                                type="file"
                                accept=".json"
                                onChange={importBudgetData}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Phase 3: Budget Scenario Calculator */}
                    {showScenarioCalculator && (
                        <div className="scenario-calculator">
                            <div className="scenario-header">
                                <div className="header-left">
                                    <Calculator size={24} />
                                    <h3>Budget Scenario Calculator</h3>
                                </div>
                                <button
                                    className="close-scenario"
                                    onClick={() => {
                                        setShowScenarioCalculator(false);
                                        setScenarioAdjustments({});
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="scenario-description">
                                🧮 Adjust category budgets to see the impact on your overall budget
                            </p>

                            <div className="scenario-controls">
                                {budget && Object.keys(budget.categoryBudgets).map(category => (
                                    <div key={category} className="scenario-control-item">
                                        <label className="scenario-label">
                                            <span className="category-name">{category}</span>
                                            <span className="original-amount">
                                                Original: ₹{budget.categoryBudgets[category].toFixed(0)}
                                            </span>
                                        </label>
                                        <div className="scenario-input-group">
                                            <input
                                                type="number"
                                                placeholder="Adjustment (+/-)"
                                                value={scenarioAdjustments[category] || ''}
                                                onChange={(e) => setScenarioAdjustments({
                                                    ...scenarioAdjustments,
                                                    [category]: parseFloat(e.target.value) || 0
                                                })}
                                                className="scenario-input"
                                            />
                                            {scenarioAdjustments[category] && (
                                                <span className={`adjustment-badge ${scenarioAdjustments[category] > 0 ? 'positive' : 'negative'}`}>
                                                    {scenarioAdjustments[category] > 0 ? '+' : ''}
                                                    ₹{scenarioAdjustments[category].toFixed(0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {scenarioResults && (
                                <div className="scenario-results">
                                    <div className="results-header">
                                        <Sparkles size={20} />
                                        <h4>Scenario Impact</h4>
                                    </div>
                                    <div className="results-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">Current Total Budget</span>
                                            <span className="summary-value">₹{scenarioResults.totalOriginal.toFixed(0)}</span>
                                        </div>
                                        <div className="summary-item adjustment">
                                            <span className="summary-label">Total Adjustment</span>
                                            <span className={`summary-value ${scenarioResults.totalAdjustment >= 0 ? 'positive' : 'negative'}`}>
                                                {scenarioResults.totalAdjustment >= 0 ? '+' : ''}
                                                ₹{scenarioResults.totalAdjustment.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="summary-item new-total">
                                            <span className="summary-label">New Total Budget</span>
                                            <span className="summary-value highlight">₹{scenarioResults.totalNew.toFixed(0)}</span>
                                        </div>
                                        <div className="summary-item savings">
                                            <span className="summary-label">Projected Savings</span>
                                            <span className={`summary-value ${scenarioResults.savings >= 0 ? 'positive' : 'negative'}`}>
                                                ₹{scenarioResults.savings.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="results-categories">
                                        {scenarioResults.categories.map(cat => (
                                            <div key={cat.category} className={`result-category-item ${cat.status}`}>
                                                <div className="result-category-header">
                                                    <span className="cat-name">{cat.category}</span>
                                                    <span className="cat-new-budget">₹{cat.newBudget.toFixed(0)}</span>
                                                </div>
                                                <div className="result-bar">
                                                    <div
                                                        className={`result-bar-fill ${cat.status}`}
                                                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="result-category-footer">
                                                    <span className="cat-spent">Spent: ₹{cat.currentSpent.toFixed(0)}</span>
                                                    <span className={`cat-impact ${cat.impact >= 0 ? 'positive' : 'negative'}`}>
                                                        {cat.impact >= 0 ? '+' : ''}₹{cat.impact.toFixed(0)} remaining
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase 3: Month Comparison */}
                    {showComparison && (
                        <div className="month-comparison">
                            <div className="comparison-header-section">
                                <div className="header-left">
                                    <GitCompare size={24} />
                                    <h3>Month Comparison</h3>
                                </div>
                                <button
                                    className="close-comparison"
                                    onClick={() => {
                                        setShowComparison(false);
                                        setComparisonMonth(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="comparison-description">
                                📊 Compare spending patterns between different months
                            </p>

                            <div className="comparison-month-selector">
                                <div className="month-select-group">
                                    <label>Current Month</label>
                                    <div className="selected-month-display">
                                        {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="comparison-arrow">⟷</div>
                                <div className="month-select-group">
                                    <label>Compare With</label>
                                    <input
                                        type="month"
                                        value={comparisonMonth ? `${comparisonMonth.getFullYear()}-${String(comparisonMonth.getMonth() + 1).padStart(2, '0')}` : ''}
                                        onChange={(e) => {
                                            const [year, month] = e.target.value.split('-');
                                            setComparisonMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                                        }}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                        className="month-input"
                                    />
                                </div>
                            </div>

                            {comparisonData && (
                                <div className="comparison-results">
                                    <div className="comparison-summary">
                                        <div className="summary-card current">
                                            <span className="card-label">Current Month</span>
                                            <span className="card-value">₹{comparisonData.totalCurrent.toFixed(0)}</span>
                                        </div>
                                        <div className="summary-card difference">
                                            <span className="card-label">Difference</span>
                                            <span className={`card-value ${comparisonData.totalDifference >= 0 ? 'negative' : 'positive'}`}>
                                                {comparisonData.totalDifference >= 0 ? '+' : ''}
                                                ₹{comparisonData.totalDifference.toFixed(0)}
                                                <small>({comparisonData.totalPercentageChange.toFixed(1)}%)</small>
                                            </span>
                                        </div>
                                        <div className="summary-card compare">
                                            <span className="card-label">Compare Month</span>
                                            <span className="card-value">₹{comparisonData.totalCompare.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <div className="comparison-categories">
                                        {comparisonData.categories.map(cat => (
                                            <div key={cat.category} className={`comparison-category-item trend-${cat.trend}`}>
                                                <div className="comparison-cat-header">
                                                    <span className="cat-name">{cat.category}</span>
                                                    <span className={`trend-indicator ${cat.trend}`}>
                                                        {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                                                        {Math.abs(cat.percentageChange).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="comparison-bars-dual">
                                                    <div className="dual-bar-row">
                                                        <span className="bar-label">Current</span>
                                                        <div className="bar-track-dual">
                                                            <div
                                                                className="bar-fill-dual current"
                                                                style={{ width: `${Math.max(cat.currentSpent, cat.compareSpent) > 0 ? (cat.currentSpent / Math.max(cat.currentSpent, cat.compareSpent)) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="bar-value-dual">₹{cat.currentSpent.toFixed(0)}</span>
                                                    </div>
                                                    <div className="dual-bar-row">
                                                        <span className="bar-label">Compare</span>
                                                        <div className="bar-track-dual">
                                                            <div
                                                                className="bar-fill-dual compare"
                                                                style={{ width: `${Math.max(cat.currentSpent, cat.compareSpent) > 0 ? (cat.compareSpent / Math.max(cat.currentSpent, cat.compareSpent)) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="bar-value-dual">₹{cat.compareSpent.toFixed(0)}</span>
                                                    </div>
                                                </div>
                                                <div className="comparison-cat-footer">
                                                    <span className={`difference-text ${cat.difference >= 0 ? 'negative' : 'positive'}`}>
                                                        {cat.difference >= 0 ? 'Increased' : 'Decreased'} by ₹{Math.abs(cat.difference).toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="budget-content">
                {/* Left Section - Budget Setup */}
                <div className="budget-setup-section">
                    <div className="section-header">
                        <h2>Budget Setup</h2>
                        <p>Configure your monthly budget and category limits</p>
                    </div>

                    <BudgetManager />

                    <div className="templates-section">
                        <h3>Quick Start Templates</h3>
                        <BudgetTemplates />
                    </div>
                </div>

                {/* Right Section - Budget Tracking */}
                <div className="budget-tracking-section">
                    <div className="section-header">
                        <h2>Budget Overview</h2>
                        <p>Track your spending against budget limits</p>
                    </div>

                    {budget ? (
                        <BudgetTracking />
                    ) : (
                        <div className="empty-state">
                            <TrendingUp size={64} />
                            <h3>No Budget Set Yet</h3>
                            <p>Create a budget in the setup section to see your spending overview here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
