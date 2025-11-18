// client/src/components/FinancialSummary.tsx
import { useState } from 'react';
import { useAuth} from "../contexts/AuthContext";
import { getFinancialSummary } from '../../services/api';
import { Sparkles, TrendingUp, TrendingDown, IndianRupee, Loader } from 'lucide-react';
import './FinancialSummary.css';

export const FinancialSummary = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);
            const result = await getFinancialSummary(user._id);
            setSummary(result.summary);
            setData(result.data);
        } catch (err) {
            console.error('Failed to generate summary:', err);
            setError('Failed to generate financial summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="financial-summary-container">
            <div className="summary-header">
                <div className="header-left">
                    <div className="summary-icon">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h2 className="summary-title">AI Financial Advisor</h2>
                        <p className="summary-subtitle">Get personalized insights about your finances</p>
                    </div>
                </div>
            </div>

            {!summary && !isLoading && (
                <div className="summary-prompt">
                    <p>Click the button below to get a personalized analysis of your financial health for the past 30 days.</p>
                    <button
                        className="btn-generate"
                        onClick={generateSummary}
                        disabled={isLoading}
                    >
                        <Sparkles size={16} />
                        Generate My Summary
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="summary-loading">
                    <Loader size={32} className="spinner" />
                    <p>Analyzing your financial data...</p>
                </div>
            )}

            {error && (
                <div className="summary-error">
                    <p>{error}</p>
                    <button className="btn-retry" onClick={generateSummary}>
                        Try Again
                    </button>
                </div>
            )}

            {summary && data && !isLoading && (
                <div className="summary-content">
                    <div className="ai-response">
                        <div className="ai-badge">
                            <Sparkles size={14} />
                            AI Insight
                        </div>
                        <p className="ai-text">{summary}</p>
                    </div>

                    <div className="summary-stats">
                        <div className="stat-card income">
                            <div className="stat-icon">
                                <TrendingUp size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Income</span>
                                <span className="stat-value">₹{data.totalIncome.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="stat-card expenses">
                            <div className="stat-icon">
                                <TrendingDown size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Expenses</span>
                                <span className="stat-value">₹{data.totalExpenses.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={`stat-card balance ${data.balance >= 0 ? 'positive' : 'negative'}`}>
                            <div className="stat-icon">
                                <IndianRupee size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Net Balance</span>
                                <span className="stat-value">₹{data.balance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-regenerate"
                        onClick={generateSummary}
                        disabled={isLoading}
                    >
                        <Sparkles size={16} />
                        Regenerate Summary
                    </button>
                </div>
            )}
        </div>
    );
};