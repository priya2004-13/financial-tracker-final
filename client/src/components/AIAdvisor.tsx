// client/src/components/AIAdvisor.tsx
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getPersonalizedAdvice } from '../../services/ai-service';
import './AIAdvisor.css';

interface AIAdvisorProps {
    startDate?: string;
    endDate?: string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ startDate, endDate }) => {
    const { user } = useUser();
    const [advice, setAdvice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const getAdvice = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getPersonalizedAdvice(user.id, startDate, endDate);
            setAdvice(data.advice);
            setIsOpen(true);
        } catch (err) {
            console.error('Error getting AI advice:', err);
            setError('Failed to get personalized advice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatAdviceText = (text: string) => {
        // Split advice into sections based on common patterns
        const lines = text.split('\n').filter(line => line.trim());
        return lines.map((line, index) => {
            // Check if line is a heading (starts with number or capital letters)
            if (/^[0-9]+\./.test(line) || /^[A-Z\s]+:/.test(line)) {
                return <h4 key={index} className="advice-heading">{line}</h4>;
            }
            // Check if line is a bullet point
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                return <li key={index} className="advice-bullet">{line.replace(/^[•\-]\s*/, '')}</li>;
            }
            // Regular paragraph
            return <p key={index} className="advice-text">{line}</p>;
        });
    };

    return (
        <div className="ai-advisor-container">
            <button
                onClick={getAdvice}
                className="get-advice-btn"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner-small"></span>
                        Getting Advice...
                    </>
                ) : (
                    <>
                        <span className="advisor-icon">🎯</span>
                        Get AI Financial Advice
                    </>
                )}
            </button>

            {error && (
                <div className="advice-error">
                    <p>{error}</p>
                </div>
            )}

            {isOpen && advice && (
                <div className="advice-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="advice-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="advice-modal-header">
                            <h2>
                                <span className="advisor-icon">🤖</span>
                                Your Personal Financial Advisor
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="close-modal-btn"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="advice-content">
                            {formatAdviceText(advice)}
                        </div>

                        <div className="advice-modal-footer">
                            <button onClick={getAdvice} className="refresh-advice-btn" disabled={loading}>
                                {loading ? 'Loading...' : '🔄 Get New Advice'}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="close-advice-btn">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAdvisor;
