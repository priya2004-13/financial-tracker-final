import React, { useMemo } from 'react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { TrendingUp, Calendar as CalendarIcon } from 'lucide-react';

const SpendingHeatmap: React.FC = () => {
    const { records } = useFinancialRecords();

    // Calculate spending by day for last 90 days
    const heatmapData = useMemo(() => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 89); // 90 days including today

        const dailySpending: Record<string, number> = {};

        // Initialize all days with 0
        for (let i = 0; i < 90; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            dailySpending[dateKey] = 0;
        }

        // Sum expenses by day (exclude income)
        records.forEach(record => {
            if (record.category !== 'Salary') {
                const dateKey = new Date(record.date).toISOString().split('T')[0];
                if (dailySpending.hasOwnProperty(dateKey)) {
                    dailySpending[dateKey] += record.amount;
                }
            }
        });

        // Calculate statistics
        const amounts = Object.values(dailySpending);
        const max = Math.max(...amounts, 1);
        const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

        return { dailySpending, max, avg };
    }, [records]);

    // Get color intensity based on spending
    const getColor = (amount: number): string => {
        if (amount === 0) return '#f3f4f6';

        const intensity = Math.min((amount / heatmapData.max) * 100, 100);

        if (intensity < 20) return '#dbeafe';
        if (intensity < 40) return '#93c5fd';
        if (intensity < 60) return '#60a5fa';
        if (intensity < 80) return '#3b82f6';
        return '#1e40af';
    };

    // Organize days into weeks
    const weeks = useMemo(() => {
        const days = Object.entries(heatmapData.dailySpending)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({ date, amount }));

        const organized: typeof days[][] = [];
        let currentWeek: typeof days = [];

        days.forEach((day, index) => {
            currentWeek.push(day);
            if (currentWeek.length === 7 || index === days.length - 1) {
                organized.push([...currentWeek]);
                currentWeek = [];
            }
        });

        return organized;
    }, [heatmapData]);

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
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                }}>
                    <CalendarIcon size={22} />
                </div>
                <div>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Spending Heatmap
                    </h2>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        margin: '0.25rem 0 0 0'
                    }}>
                        Last 90 days • Avg: ₹{heatmapData.avg.toFixed(2)}/day
                    </p>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflowX: 'auto',
                padding: '0.5rem 0'
            }}>
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} style={{
                        display: 'flex',
                        gap: '4px'
                    }}>
                        {week.map((day) => {
                            const date = new Date(day.date);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                            return (
                                <div
                                    key={day.date}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: getColor(day.amount),
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0,
                                        position: 'relative'
                                    }}
                                    title={`${dateStr}\n₹${day.amount.toFixed(2)}`}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.2)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    <span>Less</span>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#f3f4f6', borderRadius: '3px' }} />
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#dbeafe', borderRadius: '3px' }} />
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#93c5fd', borderRadius: '3px' }} />
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#60a5fa', borderRadius: '3px' }} />
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '3px' }} />
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#1e40af', borderRadius: '3px' }} />
                    <span>More</span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    <TrendingUp size={14} />
                    <span>Max: ₹{heatmapData.max.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default SpendingHeatmap;