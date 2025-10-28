import React, { useMemo, useState } from 'react';
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { TrendingUp, TrendingDown } from 'lucide-react';

type TimeFrame = 'week' | 'month' | 'year';

const TrendAnalysisChart: React.FC = () => {
    const { records } = useFinancialRecords();
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');

    // Calculate trend data based on timeframe
    const trendData = useMemo(() => {
        const now = new Date();
        const data: Array<{ period: string; income: number; expenses: number; balance: number }> = [];

        if (timeFrame === 'week') {
            // Last 12 weeks
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                const weekRecords = records.filter(r => {
                    const date = new Date(r.date);
                    return date >= weekStart && date <= weekEnd;
                });

                const income = weekRecords
                    .filter(r => r.category === 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                const expenses = weekRecords
                    .filter(r => r.category !== 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                data.push({
                    period: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                    income,
                    expenses,
                    balance: income - expenses
                });
            }
        } else if (timeFrame === 'month') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

                const monthRecords = records.filter(r => {
                    const date = new Date(r.date);
                    return date >= month && date <= monthEnd;
                });

                const income = monthRecords
                    .filter(r => r.category === 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                const expenses = monthRecords
                    .filter(r => r.category !== 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                data.push({
                    period: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    income,
                    expenses,
                    balance: income - expenses
                });
            }
        } else {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                const yearStart = new Date(year, 0, 1);
                const yearEnd = new Date(year, 11, 31);

                const yearRecords = records.filter(r => {
                    const date = new Date(r.date);
                    return date >= yearStart && date <= yearEnd;
                });

                const income = yearRecords
                    .filter(r => r.category === 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                const expenses = yearRecords
                    .filter(r => r.category !== 'Salary')
                    .reduce((sum, r) => sum + r.amount, 0);

                data.push({
                    period: year.toString(),
                    income,
                    expenses,
                    balance: income - expenses
                });
            }
        }

        return data;
    }, [records, timeFrame]);

    // Calculate trend statistics
    const stats = useMemo(() => {
        if (trendData.length < 2) return null;

        const lastPeriod = trendData[trendData.length - 1];
        const prevPeriod = trendData[trendData.length - 2];

        const incomeChange = prevPeriod.income !== 0
            ? ((lastPeriod.income - prevPeriod.income) / prevPeriod.income) * 100
            : 0;

        const expenseChange = prevPeriod.expenses !== 0
            ? ((lastPeriod.expenses - prevPeriod.expenses) / prevPeriod.expenses) * 100
            : 0;

        const avgIncome = trendData.reduce((sum, d) => sum + d.income, 0) / trendData.length;
        const avgExpenses = trendData.reduce((sum, d) => sum + d.expenses, 0) / trendData.length;

        return {
            incomeChange,
            expenseChange,
            avgIncome,
            avgExpenses,
            currentIncome: lastPeriod.income,
            currentExpenses: lastPeriod.expenses
        };
    }, [trendData]);

    return (
        <div style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <TrendingUp size={22} />
                    </div>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Financial Trends
                    </h2>
                </div>

                {/* Timeframe Selector */}
                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    background: 'var(--background-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.25rem'
                }}>
                    {(['week', 'month', 'year'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: timeFrame === tf ? 'var(--primary-color)' : 'transparent',
                                color: timeFrame === tf ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tf}ly
                        </button>
                    ))}
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05))',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.25rem'
                        }}>
                            Income Trend
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--success-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {stats.incomeChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {Math.abs(stats.incomeChange).toFixed(1)}%
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.05))',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.25rem'
                        }}>
                            Expense Trend
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--danger-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {stats.expenseChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {Math.abs(stats.expenseChange).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="period"
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                        />
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
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#incomeGradient)"
                            name="Income"
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#expenseGradient)"
                            name="Expenses"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <p style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '2rem'
                }}>
                    No data available for the selected timeframe
                </p>
            )}
        </div>
    );
};

export default TrendAnalysisChart;