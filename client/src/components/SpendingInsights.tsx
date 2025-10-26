// client/src/components/SpendingInsights.tsx 
import React, { useMemo, useEffect, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Loader } from 'lucide-react';
import './SpendingInsights.css';

export const SpendingInsights: React.FC = () => {
    const { records, isLoading } = useFinancialRecords();
    const [dataReady, setDataReady] = useState(false);

    // Filter out income records
    const expenseRecords = useMemo(() => {
        return records.filter(r => r.category !== 'Salary');
    }, [records]);

    useEffect(() => {
        // Simulate data processing delay
        if (expenseRecords.length > 0 && !isLoading) {
            const timer = setTimeout(() => setDataReady(true), 300);
            return () => clearTimeout(timer);
        }
    }, [expenseRecords, isLoading]);

    // Week-over-week comparison (last 8 weeks)
    const weeklyComparison = useMemo(() => {
        const weeks: Array<{ week: string; spending: number; weekNum: number }> = [];
        const now = new Date();

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekSpending = expenseRecords
                .filter(r => {
                    const date = new Date(r.date);
                    return date >= weekStart && date <= weekEnd;
                })
                .reduce((sum, r) => sum + r.amount, 0);

            weeks.push({
                week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                spending: weekSpending,
                weekNum: 7 - i
            });
        }

        return weeks;
    }, [expenseRecords]);

    // Calculate week-over-week change
    const weekOverWeekChange = useMemo(() => {
        if (weeklyComparison.length < 2) return 0;
        const currentWeek = weeklyComparison[weeklyComparison.length - 1].spending;
        const lastWeek = weeklyComparison[weeklyComparison.length - 2].spending;
        if (lastWeek === 0) return 0;
        return ((currentWeek - lastWeek) / lastWeek) * 100;
    }, [weeklyComparison]);

    // Category trends (last 30 days)
    const categoryTrends = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRecords = expenseRecords.filter(r => new Date(r.date) >= thirtyDaysAgo);

        const categoryData: Record<string, number> = {};
        recentRecords.forEach(r => {
            categoryData[r.category] = (categoryData[r.category] || 0) + r.amount;
        });

        return Object.entries(categoryData)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8); // Top 8 categories
    }, [expenseRecords]);

    // Best/Worst spending days (last 30 days)
    const spendingByDay = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailySpending: Record<string, number> = {};

        expenseRecords
            .filter(r => new Date(r.date) >= thirtyDaysAgo)
            .forEach(r => {
                const dateKey = new Date(r.date).toLocaleDateString();
                dailySpending[dateKey] = (dailySpending[dateKey] || 0) + r.amount;
            });

        const sortedDays = Object.entries(dailySpending)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => b.amount - a.amount);

        return {
            worst: sortedDays.slice(0, 3),
            best: sortedDays.slice(-3).reverse(),
            average: sortedDays.length > 0
                ? sortedDays.reduce((sum, d) => sum + d.amount, 0) / sortedDays.length
                : 0
        };
    }, [expenseRecords]);

    // Average spending by day of week
    const dayOfWeekSpending = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
        const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

        expenseRecords.forEach(r => {
            const dayOfWeek = new Date(r.date).getDay();
            dayTotals[dayOfWeek] += r.amount;
            dayCounts[dayOfWeek]++;
        });

        return days.map((day, i) => ({
            day,
            average: dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0
        }));
    }, [expenseRecords]);

    if (isLoading || !dataReady) {
        return (
            <div className="insights-container">
                <div className="insights-header">
                    <div className="header-icon">
                        <Loader size={22} className="spinner" />
                    </div>
                    <h2 className="insights-title">Loading Insights...</h2>
                </div>
            </div>
        );
    }

    if (expenseRecords.length === 0) {
        return (
            <div className="insights-container">
                <div className="insights-header">
                    <div className="header-icon">
                        <TrendingUp size={22} />
                    </div>
                    <h2 className="insights-title">Spending Insights</h2>
                </div>
                <div className="empty-insights">
                    <p>Add some transactions to see your spending insights</p>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-container">
            <div className="insights-header">
                <div className="header-icon">
                    <TrendingUp size={22} />
                </div>
                <h2 className="insights-title">Spending Insights</h2>
            </div>

            {/* Week-over-Week Summary */}
            <div className="insight-card highlight-card">
                <div className="card-header">
                    <h3>Week-over-Week Change</h3>
                    <div className={`change-badge ${weekOverWeekChange >= 0 ? 'negative' : 'positive'}`}>
                        {weekOverWeekChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(weekOverWeekChange).toFixed(1)}%
                    </div>
                </div>
                <p className="card-description">
                    {weekOverWeekChange > 0
                        ? `You spent ${weekOverWeekChange.toFixed(1)}% more this week than last week`
                        : weekOverWeekChange < 0
                            ? `You spent ${Math.abs(weekOverWeekChange).toFixed(1)}% less this week than last week`
                            : 'Your spending is unchanged from last week'}
                </p>
            </div>

            {/* Weekly Trend Chart */}
            <div className="insight-card">
                <h3 className="card-title">8-Week Spending Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <Tooltip
                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                            contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f9fafb'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="spending"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Category Trends */}
            <div className="insight-card">
                <h3 className="card-title">Top Categories (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <Tooltip
                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                            contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f9fafb'
                            }}
                        />
                        <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Day of Week Average */}
            <div className="insight-card">
                <h3 className="card-title">Average Spending by Day of Week</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dayOfWeekSpending}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <Tooltip
                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                            contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f9fafb'
                            }}
                        />
                        <Bar dataKey="average" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Best/Worst Days Grid */}
            <div className="days-grid">
                <div className="insight-card">
                    <h3 className="card-title negative">Highest Spending Days</h3>
                    <div className="days-list">
                        {spendingByDay.worst.map((day, i) => (
                            <div key={i} className="day-item">
                                <Calendar size={16} />
                                <span className="day-date">{day.date}</span>
                                <span className="day-amount negative">₹{day.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insight-card">
                    <h3 className="card-title positive">Lowest Spending Days</h3>
                    <div className="days-list">
                        {spendingByDay.best.map((day, i) => (
                            <div key={i} className="day-item">
                                <Calendar size={16} />
                                <span className="day-date">{day.date}</span>
                                <span className="day-amount positive">₹{day.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Average */}
            <div className="insight-card summary-card">
                <div className="summary-content">
                    <DollarSign size={24} className="summary-icon" />
                    <div>
                        <p className="summary-label">Average Daily Spending (Last 30 Days)</p>
                        <p className="summary-value">₹{spendingByDay.average.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};