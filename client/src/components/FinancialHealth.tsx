// client/src/components/FinancialHealth.tsx
import React, { useMemo } from 'react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { TrendingUp, Target, ShieldCheck, AlertTriangle } from 'lucide-react';
import './FinancialHealth.css';

const MAX_SCORE = 100;

export const FinancialHealth: React.FC = () => {
    const { records, budget, isLoading } = useFinancialRecords();

    const calculateScore = useMemo(() => {
        if (isLoading || !records.length || !budget) {
            return { score: 0, feedback: "Awaiting data...", savingsRate: 0, budgetAdherence: 0 };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate current month's income
        const currentMonthIncomeRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear && record.category === 'Salary';
        });
        const totalMonthIncome = currentMonthIncomeRecords.reduce((sum, r) => sum + r.amount, 0) + (budget.monthlySalary || 0);

        // Calculate current month's expenses
        const currentMonthExpenses = records
            .filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear && record.category !== 'Salary';
            })
            .reduce((sum, r) => sum + r.amount, 0);

        // 1. Savings Rate Score (Max 50 points)
        const savings = totalMonthIncome - currentMonthExpenses;
        const savingsRate = totalMonthIncome > 0 ? (savings / totalMonthIncome) * 100 : 0;
        let savingsScore = 0;
        if (savingsRate >= 20) savingsScore = 50;
        else if (savingsRate >= 10) savingsScore = 35;
        else if (savingsRate >= 0) savingsScore = 20;
        else savingsScore = 0; // Penalize if spending more than earning

        // 2. Budget Adherence Score (Max 50 points)
        const totalBudgeted = Object.values(budget.categoryBudgets).reduce((sum, b) => sum + b, 0);
        let budgetAdherenceScore = 0;
        if (totalBudgeted > 0) {
            const adherenceRatio = currentMonthExpenses / totalBudgeted;
            if (adherenceRatio <= 1) budgetAdherenceScore = 50 * (1 - adherenceRatio); // Max 50 if under budget
             else if (adherenceRatio <= 1.1) budgetAdherenceScore = 15; // Small penalty for slightly over
             else budgetAdherenceScore = 0; // Large penalty if significantly over
        } else {
             budgetAdherenceScore = 25; // Give partial score if no budget is set but expenses exist
             if (currentMonthExpenses === 0) budgetAdherenceScore = 50; // Max score if no budget and no expenses
        }

        const totalScore = Math.max(0, Math.min(MAX_SCORE, Math.round(savingsScore + budgetAdherenceScore)));

        // Generate Feedback
        let feedback = "Keep tracking to see your score!";
        if (totalMonthIncome > 0 || currentMonthExpenses > 0 || totalBudgeted > 0) { // Only give feedback if there's data
            if (totalScore >= 80) feedback = "Excellent! You're managing your finances very well.";
            else if (totalScore >= 60) feedback = "Good job! You're on the right track.";
            else if (totalScore >= 40) feedback = "Fair. There's room for improvement in savings or budgeting.";
            else feedback = "Needs attention. Review your spending and budget goals.";
        }


        return { score: totalScore, feedback, savingsRate, budgetAdherence: totalBudgeted > 0 ? Math.max(0, 100 - (currentMonthExpenses/totalBudgeted)*100) : null };

    }, [records, budget, isLoading]);

    const { score, feedback, savingsRate, budgetAdherence } = calculateScore;

    // Calculate circle dash offset
    const circumference = 2 * Math.PI * 45; // 2 * pi * radius (radius is 45 for a 100x100 SVG viewbox with stroke-width 10)
    const offset = circumference - (score / MAX_SCORE) * circumference;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'var(--success-color)';
        if (s >= 60) return '#6366f1'; // Primary color for good
        if (s >= 40) return 'var(--warning-color)';
        return 'var(--danger-color)';
    };

    return (
        <div className="financial-health-container">
            <div className="health-header">
                <div className="header-left">
                    <div className="health-icon">
                       {score >= 60 ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <h2 className="health-title">Financial Health Score</h2>
                </div>
            </div>

            {isLoading ? (
                <div className="health-loading">Loading score...</div>
            ) : (
                <div className="health-content">
                    <div className="score-visual">
                        <svg viewBox="0 0 100 100" className="score-circle-svg">
                            <circle
                                className="score-circle-bg"
                                cx="50" cy="50" r="45"
                            />
                            <circle
                                className="score-circle-progress"
                                cx="50" cy="50" r="45"
                                stroke={getScoreColor(score)}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                            />
                        </svg>
                        <span className="score-value" style={{ color: getScoreColor(score) }}>
                            {score}
                        </span>
                        <span className="score-max">/ {MAX_SCORE}</span>
                    </div>
                    <p className="health-feedback">{feedback}</p>
                    <div className="health-details">
                         <div className="detail-item">
                            <TrendingUp size={16} />
                            <span>Savings Rate: {savingsRate.toFixed(1)}%</span>
                         </div>
                         {budgetAdherence !== null && (
                            <div className="detail-item">
                                <Target size={16} />
                                <span>Budget Adherence: {budgetAdherence >= 0 ? `${budgetAdherence.toFixed(0)}% Left` : `Over Budget`}</span>
                            </div>
                         )}

                    </div>
                </div>
            )}
             <p className="health-note">
                 💡 Score is based on this month's savings rate & budget adherence.
             </p>
        </div>
    );
};
