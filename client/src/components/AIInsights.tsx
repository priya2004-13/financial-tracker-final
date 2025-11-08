// client/src/components/AIInsights.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    getComprehensiveInsights,
    AIInsight,
    ComprehensiveInsightsResponse
} from '../../services/ai-service';
import './AIInsights.css';

interface AIInsightsProps {
    startDate?: string;
    endDate?: string;
    autoLoad?: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ startDate, endDate, autoLoad = true }) => {
    const { user } = useUser();
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [summary, setSummary] = useState<ComprehensiveInsightsResponse['summary'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInsights = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getComprehensiveInsights(user.id, startDate, endDate);
            setInsights(data.insights);
            setSummary(data.summary);
        } catch (err) {
            console.error('Error loading AI insights:', err);
            setError('Failed to load AI insights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoLoad) {
            loadInsights();
        }
    }, [user, startDate, endDate, autoLoad]);

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'danger': return '✕';
            case 'info': return 'ℹ';
            default: return '•';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    if (loading) {
        return (
            <div className="ai-insights-container">
                <div className="insights-loading">
                    <div className="spinner"></div>
                    <p>Analyzing your financial data with AI...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-insights-container">
                <div className="insights-error">
                    <p>{error}</p>
                    <button onClick={loadInsights} className="refresh-insights-btn" style={{ marginTop: '15px' }}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-insights-container">
            <div className="ai-insights-header">
                <h2 className="ai-insights-title">
                    <span className="ai-icon">🤖</span>
                    AI Financial Insights
                </h2>
                <button
                    onClick={loadInsights}
                    className="refresh-insights-btn"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {summary && (
                <div className="insights-summary">
                    <div className="summary-item">
                        <div className="summary-label">Total Income</div>
                        <div className="summary-value positive">
                            {formatCurrency(summary.totalIncome)}
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Total Expenses</div>
                        <div className="summary-value negative">
                            {formatCurrency(summary.totalExpenses)}
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Savings Rate</div>
                        <div className={`summary-value ${summary.savingsRate >= 20 ? 'positive' : 'negative'}`}>
                            {summary.savingsRate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            {insights.length > 0 ? (
                <div className="insights-list">
                    {insights.map((insight, index) => (
                        <div key={index} className={`insight-card ${insight.type}`}>
                            <div className="insight-header">
                                <span className="insight-icon">{getInsightIcon(insight.type)}</span>
                                <h3 className="insight-title">{insight.title}</h3>
                            </div>

                            {insight.category && (
                                <span className="insight-category">{insight.category}</span>
                            )}

                            <p className="insight-message">{insight.message}</p>

                            {insight.actionable && (
                                <div className="insight-actionable">
                                    <strong>💡 Action:</strong> {insight.actionable}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-insights">
                    <div className="no-insights-icon">📊</div>
                    <p>No insights available yet. Add some transactions to get AI-powered recommendations!</p>
                </div>
            )}
        </div>
    );
};

export default AIInsights;
