// client/src/pages/goals/index.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { useUser } from '@clerk/clerk-react';
import { PageLoader } from "../../components/PageLoader";
import SavingsGoals from "../../components/SavingsGoals";
import { fetchDebts, addDebt, deleteDebt } from '../../../services/api';
import { Subscriptions } from "../../components/Subscriptions";
import { SharedExpenses } from "../../components/SharedExpenses";
import { ArrowLeft, Target, Repeat, Users, TrendingUp, CreditCard, Trophy, Zap, Calendar, IndianRupee, Award, Star, CheckCircle2, AlertCircle, Sparkles, Plus, BarChart3, Percent } from "lucide-react";
import "./goals.css";

export const GoalsPage = () => {
    const navigate = useNavigate();
    const { isLoading, records } = useFinancialRecords();

    // Enhanced state management
    const [selectedGoalType, setSelectedGoalType] = useState<"savings" | "debt" | "investment" | "custom">("savings");
    const [showMilestones, setShowMilestones] = useState(true);
    const [showGamification, setShowGamification] = useState(true);
    const [selectedDebtStrategy, setSelectedDebtStrategy] = useState<"snowball" | "avalanche">("snowball");

    // Real goals will come from the server via the SavingsGoals component
    const [goals, setGoals] = useState<any[]>([]);

    const [debts, setDebts] = useState<any[]>([]);
    const { user } = useUser();

    interface DebtForm { name: string; principal: number; remaining?: number; interestRate: number; minimumPayment?: number; monthlyPayment?: number; type?: string; startDate?: string }
    const [newDebt, setNewDebt] = useState<DebtForm>({ name: '', principal: 0, interestRate: 0, minimumPayment: 0, monthlyPayment: 0, type: '', startDate: '' });
    const [debtFormError, setDebtFormError] = useState<string | null>(null);

    // Calculate goal statistics
    const goalStats = useMemo(() => {
        const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
        const totalCurrent = goals.reduce((sum, goal) => sum + goal.current, 0);
        const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
        const completedGoals = goals.filter(g => g.current >= g.target).length;
        const activeGoals = goals.filter(g => g.current < g.target).length;

        // Calculate on-track status
        const onTrackGoals = goals.filter(goal => {
            const daysUntilDeadline = Math.floor((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const monthsUntilDeadline = daysUntilDeadline / 30;
            const requiredMonthly = monthsUntilDeadline > 0 ? (goal.target - goal.current) / monthsUntilDeadline : 0;
            return goal.monthlyContribution >= requiredMonthly && goal.current < goal.target;
        }).length;

        return {
            totalTarget,
            totalCurrent,
            totalProgress,
            completedGoals,
            activeGoals,
            onTrackGoals,
            atRiskGoals: activeGoals - onTrackGoals
        };
    }, [goals]);

    // Calculate debt payoff stats
    const debtStats = useMemo(() => {
        const totalDebt = debts.reduce((sum, debt) => sum + debt.remaining, 0);
        const totalPrincipal = debts.reduce((sum, debt) => sum + debt.principal, 0);
        const totalPaid = totalPrincipal - totalDebt;
        const progress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;
        const totalMonthlyPayment = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
        const weightedInterestRate = debts.reduce((sum, debt) => sum + (debt.interestRate * debt.remaining), 0) / (totalDebt || 1);

        // Calculate payoff timeline (simplified)
        const avgInterestRate = weightedInterestRate / 100 / 12; // Monthly rate
        const monthsToPayoff = totalMonthlyPayment > 0 ?
            Math.ceil(Math.log(totalMonthlyPayment / (totalMonthlyPayment - totalDebt * avgInterestRate)) / Math.log(1 + avgInterestRate))
            : 0;

        return {
            totalDebt,
            totalPaid,
            progress,
            totalMonthlyPayment,
            avgInterestRate: weightedInterestRate,
            monthsToPayoff: isFinite(monthsToPayoff) ? monthsToPayoff : 0,
            totalInterest: debts.reduce((sum, debt) => {
                const months = debt.monthlyPayment > 0 ? debt.remaining / debt.monthlyPayment : 0;
                return sum + (debt.remaining * (debt.interestRate / 100 / 12) * months);
            }, 0)
        };
    }, [debts]);

    // Debt payoff strategy calculation
    const debtPayoffPlan = useMemo(() => {
        if (selectedDebtStrategy === "snowball") {
            // Snowball: Pay off smallest debt first
            return [...debts].sort((a, b) => a.remaining - b.remaining).map((debt, idx) => ({
                ...debt,
                order: idx + 1,
                recommendation: idx === 0 ? "Focus here first!" : "Pay minimum for now"
            }));
        } else {
            // Avalanche: Pay off highest interest rate first
            return [...debts].sort((a, b) => b.interestRate - a.interestRate).map((debt, idx) => ({
                ...debt,
                order: idx + 1,
                recommendation: idx === 0 ? "Highest interest - prioritize!" : "Pay minimum for now"
            }));
        }
    }, [debts, selectedDebtStrategy]);

    // Fetch debts once on mount
    React.useEffect(() => {
        if (!user?.id) return;

        (async () => {
            try {
                const list = await fetchDebts(user.id);
                setDebts(list);
            } catch (err) {
                console.error('Failed to fetch debts', err);
            }
        })();
    }, [user?.id]);

    // Gamification stats
    const gamificationStats = useMemo(() => {
        const streakDays = 45; // Mock data
        const totalPoints = goals.reduce((sum, goal) => {
            const milestonesPassed = goal.milestones.filter((m: any) => goal.current >= m).length;
            return sum + (milestonesPassed * 100) + (goal.current >= goal.target ? 500 : 0);
        }, 0);

        const level = Math.floor(totalPoints / 1000) + 1;
        const nextLevelPoints = level * 1000;
        const pointsToNextLevel = nextLevelPoints - totalPoints;

        // Achievements
        const achievements = [
            {
                id: 1,
                name: "First Goal",
                description: "Create your first savings goal",
                unlocked: goals.length > 0,
                icon: "target",
                points: 100
            },
            {
                id: 2,
                name: "Goal Getter",
                description: "Complete your first goal",
                unlocked: goalStats.completedGoals > 0,
                icon: "trophy",
                points: 500
            },
            {
                id: 3,
                name: "Debt Destroyer",
                description: "Pay off 50% of total debt",
                unlocked: debtStats.progress >= 50,
                icon: "zap",
                points: 300
            },
            {
                id: 4,
                name: "Consistent Saver",
                description: "30 day saving streak",
                unlocked: streakDays >= 30,
                icon: "star",
                points: 200
            },
            {
                id: 5,
                name: "Milestone Master",
                description: "Reach 10 milestones",
                unlocked: false,
                icon: "award",
                points: 250
            }
        ];

        const unlockedAchievements = achievements.filter(a => a.unlocked).length;

        return {
            level,
            totalPoints,
            pointsToNextLevel,
            nextLevelPoints,
            streakDays,
            achievements,
            unlockedAchievements,
            levelProgress: ((totalPoints % 1000) / 1000) * 100
        };
    }, [goals, goalStats, debtStats]);

    // Auto-save recommendations
    const autoSaveRecommendations = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthIncome = records
            .filter(r => {
                const date = new Date(r.date);
                return date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear &&
                    r.category === "Salary";
            })
            .reduce((sum, r) => sum + r.amount, 0);

        const currentMonthExpenses = records
            .filter(r => {
                const date = new Date(r.date);
                return date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear &&
                    r.category !== "Salary";
            })
            .reduce((sum, r) => sum + r.amount, 0);

        const availableToSave = currentMonthIncome - currentMonthExpenses;
        const currentGoalContributions = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
        const extraAvailable = availableToSave - currentGoalContributions;

        const recommendations = [];

        if (extraAvailable > 5000) {
            recommendations.push({
                type: "increase",
                message: `You have ₹${extraAvailable.toFixed(0)} extra available this month!`,
                action: "Consider increasing your goal contributions",
                amount: Math.floor(extraAvailable * 0.5)
            });
        }

        // Recommend which goals need more attention
        goals.forEach(goal => {
            const daysRemaining = Math.floor((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const monthsRemaining = daysRemaining / 30;
            const amountNeeded = goal.target - goal.current;
            const requiredMonthly = monthsRemaining > 0 ? amountNeeded / monthsRemaining : amountNeeded;

            if (goal.monthlyContribution < requiredMonthly && daysRemaining > 0) {
                recommendations.push({
                    type: "urgent",
                    message: `"${goal.name}" needs ₹${(requiredMonthly - goal.monthlyContribution).toFixed(0)} more per month`,
                    action: `Increase contribution from ₹${goal.monthlyContribution} to ₹${requiredMonthly.toFixed(0)}`,
                    goalId: goal.id
                });
            }
        });

        return recommendations;
    }, [records, goals]);

    if (isLoading) {
        return <PageLoader message="Loading goals and subscriptions..." variant="minimal" />;
    }

    return (
        <div className="goals-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <Target size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Goals & Financial Planning</h1>
                        <p>Track savings, manage debt, and achieve your financial milestones</p>
                    </div>
                </div>
            </div>

            <div className="goals-content">
                {/* Gamification Stats Dashboard */}
                {!showGamification && (
                    <section className="gamification-dashboard">
                        <div className="gamification-header">
                            <Trophy size={24} />
                            <h2>Your Progress</h2>
                            <button
                                className="toggle-gamification"
                                onClick={() => setShowGamification(!showGamification)}
                            >
                                Hide
                            </button>
                        </div>
                        <div className="gamification-grid">
                            {/* Level Card */}
                            <div className="gamification-card level-card">
                                <div className="card-icon">
                                    <Star size={32} />
                                </div>
                                <div className="card-content">
                                    <h3>Level {gamificationStats.level}</h3>
                                    <div className="level-progress-bar">
                                        <div
                                            className="level-fill"
                                            style={{ width: `${gamificationStats.levelProgress}%` }}
                                        />
                                    </div>
                                    <p>{gamificationStats.pointsToNextLevel} XP to Level {gamificationStats.level + 1}</p>
                                </div>
                            </div>

                            {/* Points Card */}
                            <div className="gamification-card points-card">
                                <div className="card-icon">
                                    <Sparkles size={32} />
                                </div>
                                <div className="card-content">
                                    <h3>{gamificationStats.totalPoints} Points</h3>
                                    <p>Total earned</p>
                                </div>
                            </div>

                            {/* Streak Card */}
                            <div className="gamification-card streak-card">
                                <div className="card-icon">
                                    <Zap size={32} />
                                </div>
                                <div className="card-content">
                                    <h3>{gamificationStats.streakDays} Days</h3>
                                    <p>🔥 Saving streak</p>
                                </div>
                            </div>

                            {/* Achievements Card */}
                            <div className="gamification-card achievements-card">
                                <div className="card-icon">
                                    <Award size={32} />
                                </div>
                                <div className="card-content">
                                    <h3>{gamificationStats.unlockedAchievements}/{gamificationStats.achievements.length}</h3>
                                    <p>Achievements unlocked</p>
                                </div>
                            </div>
                        </div>

                        {/* Achievements List */}
                        <div className="achievements-list">
                            <h3>Achievements</h3>
                            <div className="achievements-grid">
                                {gamificationStats.achievements.map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                                    >
                                        <div className="badge-icon">
                                            {achievement.icon === 'target' && <Target size={24} />}
                                            {achievement.icon === 'trophy' && <Trophy size={24} />}
                                            {achievement.icon === 'zap' && <Zap size={24} />}
                                            {achievement.icon === 'star' && <Star size={24} />}
                                            {achievement.icon === 'award' && <Award size={24} />}
                                        </div>
                                        <div className="badge-content">
                                            <h4>{achievement.name}</h4>
                                            <p>{achievement.description}</p>
                                            <span className="badge-points">+{achievement.points} XP</span>
                                        </div>
                                        {achievement.unlocked && (
                                            <CheckCircle2 className="unlocked-check" size={20} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Goal Statistics Overview */}
                <section className="goals-section stats-overview">
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <IndianRupee size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Total Goal Target</span>
                                <span className="stat-value">₹{goalStats.totalTarget.toLocaleString()}</span>
                                <span className="stat-progress">₹{goalStats.totalCurrent.toLocaleString()} saved ({goalStats.totalProgress.toFixed(0)}%)</span>
                            </div>
                        </div>

                        <div className="stat-card active">
                            <div className="stat-icon">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Active Goals</span>
                                <span className="stat-value">{goalStats.activeGoals}</span>
                                <span className="stat-progress">{goalStats.onTrackGoals} on track</span>
                            </div>
                        </div>

                        <div className="stat-card completed">
                            <div className="stat-icon">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Completed</span>
                                <span className="stat-value">{goalStats.completedGoals}</span>
                                <span className="stat-progress">🎉 Goals achieved</span>
                            </div>
                        </div>

                        <div className="stat-card at-risk">
                            <div className="stat-icon">
                                <AlertCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">At Risk</span>
                                <span className="stat-value">{goalStats.atRiskGoals}</span>
                                <span className="stat-progress">Need attention</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Auto-Save Recommendations */}
                {autoSaveRecommendations.length > 0 && (
                    <section className="goals-section recommendations">
                        <div className="section-header">
                            <Sparkles size={20} />
                            <h3>Smart Recommendations</h3>
                        </div>
                        <div className="recommendations-list">
                            {autoSaveRecommendations.map((rec, idx) => (
                                <div key={idx} className={`recommendation-card type-${rec.type}`}>
                                    <div className="rec-icon">
                                        {rec.type === 'increase' ? <TrendingUp size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="rec-content">
                                        <p className="rec-message">{rec.message}</p>
                                        <p className="rec-action">💡 {rec.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {/* Debt Payoff Tracker */}
                <section className="goals-section debt-section">
                    <div className="section-header">
                        <div className="section-icon debt">
                            <CreditCard size={24} />
                        </div>
                        <div className="section-text">
                            <h2>Debt Payoff Plan</h2>
                            <p>Strategic debt elimination tracking</p>
                        </div>
                        <div className="strategy-selector">
                            <button
                                className={`strategy-btn ${selectedDebtStrategy === 'snowball' ? 'active' : ''}`}
                                onClick={() => setSelectedDebtStrategy('snowball')}
                            >
                                Snowball
                            </button>
                            <button
                                className={`strategy-btn ${selectedDebtStrategy === 'avalanche' ? 'active' : ''}`}
                                onClick={() => setSelectedDebtStrategy('avalanche')}
                            >
                                Avalanche
                            </button>
                        </div>
                    </div>
                    <div className="add-debt-form-wrapper">
                        <form className="add-debt-form" onSubmit={async (e) => {
                            e.preventDefault();
                            if (!user?.id) return;
                            // Basic validation
                            if (!newDebt.name || newDebt.principal <= 0 || newDebt.interestRate < 0) {
                                setDebtFormError('Please fill name, principal and interest rate correctly.');
                                return;
                            }
                            setDebtFormError(null);
                            try {
                                const created = await addDebt({
                                    userId: user.id,
                                    name: newDebt.name,
                                    principal: Number(newDebt.principal),
                                    remaining: newDebt.remaining ? Number(newDebt.remaining) : Number(newDebt.principal),
                                    interestRate: Number(newDebt.interestRate),
                                    minimumPayment: Number(newDebt.minimumPayment),
                                    monthlyPayment: Number(newDebt.monthlyPayment),
                                    type: newDebt.type,
                                    startDate: newDebt.startDate ? new Date(newDebt.startDate) : undefined
                                });
                                setDebts(prev => [...prev, created]);
                                setNewDebt({ name: '', principal: 0, interestRate: 0, minimumPayment: 0, monthlyPayment: 0, type: '', startDate: '' });
                            } catch (err) {
                                console.error('Add debt failed', err);
                            }
                        }}>
                            <div className="form-grid">
                                <div className="form-row">
                                    <label className="form-label" htmlFor="debt-name">Debt Name</label>
                                    <input id="debt-name" className="form-input" type="text" placeholder="e.g., Credit Card" value={newDebt.name} onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))} required />
                                </div>

                                <div className="form-row">
                                    <label className="form-label" htmlFor="principal">Principal (₹)</label>
                                    <input id="principal" className="form-input" type="number" placeholder="Enter principal amount" value={newDebt.principal} onChange={(e) => setNewDebt(prev => ({ ...prev, principal: Number(e.target.value || 0) }))} required />
                                </div>

                                <div className="form-row">
                                    <label className="form-label" htmlFor="remaining">Remaining (₹)</label>
                                    <input id="remaining" className="form-input" type="number" placeholder="Optional remaining amount" value={newDebt.remaining ?? ''} onChange={(e) => setNewDebt(prev => ({ ...prev, remaining: e.target.value ? Number(e.target.value) : undefined }))} />
                                </div>

                                <div className="form-row">
                                    <label className="form-label" htmlFor="interest-rate">Interest Rate (%)</label>
                                    <input id="interest-rate" className="form-input" type="number" step="0.01" placeholder="Enter interest rate" value={newDebt.interestRate} onChange={(e) => setNewDebt(prev => ({ ...prev, interestRate: Number(e.target.value || 0) }))} required />
                                </div>

                                <div className="form-row">
                                    <label className="form-label" htmlFor="minimum-payment">Minimum Payment (₹)</label>
                                    <input id="minimum-payment" className="form-input" type="number" placeholder="Enter minimum payment" value={newDebt.minimumPayment} onChange={(e) => setNewDebt(prev => ({ ...prev, minimumPayment: Number(e.target.value || 0) }))} />
                                </div>

                                <div className="form-row">
                                    <label className="form-label" htmlFor="monthly-payment">Monthly Payment (₹)</label>
                                    <input id="monthly-payment" className="form-input" type="number" placeholder="Enter monthly payment" value={newDebt.monthlyPayment} onChange={(e) => setNewDebt(prev => ({ ...prev, monthlyPayment: Number(e.target.value || 0) }))} />
                                </div>

                            </div>
                            {debtFormError && <div className="form-error">{debtFormError}</div>}
                            <div className="add-debt-actions">
                                <button className="button" type="submit" disabled={!newDebt.name || newDebt.principal <= 0}>Add debt</button>
                            </div>
                        </form>
                    </div>

                    {/* Debt Overview Stats */}
                    <div className="debt-stats-grid">
                        <div className="debt-stat-card">
                            <span className="debt-stat-label">Total Debt</span>
                            <span className="debt-stat-value">₹{debtStats.totalDebt.toLocaleString()}</span>
                        </div>
                        <div className="debt-stat-card">
                            <span className="debt-stat-label">Paid Off</span>
                            <span className="debt-stat-value positive">₹{debtStats.totalPaid.toLocaleString()}</span>
                            <span className="debt-stat-progress">{debtStats.progress.toFixed(0)}%</span>
                        </div>
                        <div className="debt-stat-card">
                            <span className="debt-stat-label">Monthly Payment</span>
                            <span className="debt-stat-value">₹{debtStats.totalMonthlyPayment.toLocaleString()}</span>
                        </div>
                        <div className="debt-stat-card">
                            <span className="debt-stat-label">Debt-Free In</span>
                            <span className="debt-stat-value">{debtStats.monthsToPayoff} months</span>
                            <span className="debt-stat-progress">~{Math.floor(debtStats.monthsToPayoff / 12)}y {debtStats.monthsToPayoff % 12}m</span>
                        </div>
                    </div>

                    {/* Debt List with Strategy */}
                    <div className="debts-grid">
                        {debtPayoffPlan.map(debt => {
                            const progress = ((debt.principal - debt.remaining) / debt.principal) * 100;
                            const monthsToPayoff = debt.monthlyPayment > 0 ?
                                Math.ceil(debt.remaining / debt.monthlyPayment) : 0;

                            return (
                                <div key={debt.id} className={`debt-card ${debt.order === 1 ? 'priority-debt' : ''}`}>
                                    <div className="debt-header">
                                        <h3>{debt.name}</h3>
                                        <div className="debt-badges">
                                            {debt.order === 1 && (
                                                <span className="focus-badge">Focus</span>
                                            )}
                                            <span className="order-badge">#{debt.order}</span>
                                        </div>
                                    </div>

                                    <div className="debt-info-grid">
                                        <div className="debt-info-item">
                                            <span className="info-label">Remaining</span>
                                            <span className="info-value">₹{debt.remaining.toLocaleString()}</span>
                                        </div>
                                        <div className="debt-info-item">
                                            <span className="info-label">Interest Rate</span>
                                            <span className="info-value">{debt.interestRate}%</span>
                                        </div>
                                        <div className="debt-info-item">
                                            <span className="info-label">Monthly Payment</span>
                                            <span className="info-value">₹{debt.monthlyPayment.toLocaleString()}</span>
                                        </div>
                                        <div className="debt-info-item">
                                            <span className="info-label">Payoff Time</span>
                                            <span className="info-value">{monthsToPayoff} months</span>
                                        </div>
                                    </div>

                                    <div className="debt-progress">
                                        <div className="debt-progress-bar">
                                            <div
                                                className="debt-progress-fill"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="debt-progress-text">{progress.toFixed(0)}% paid off</span>
                                    </div>

                                    <div className="debt-recommendation">
                                        <Sparkles size={16} />
                                        <span>{debt.recommendation}</span>
                                    </div>
                                    <div className="debt-controls">
                                        <button className="button small" onClick={async () => {
                                            try {
                                                await deleteDebt(debt._id || debt.id);
                                                setDebts(prev => prev.filter(d => (d._id || d.id) !== (debt._id || debt.id)));
                                            } catch (err) {
                                                console.error('Delete debt failed', err);
                                            }
                                        }}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Original sections */}
                <div className="original-sections">
                    {/* Savings Goals Component */}
                    <section className="goals-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <Target size={24} />
                            </div>
                            <div className="section-text">
                                <h2>Original Savings Goals</h2>
                                <p>Track progress towards your financial objectives</p>
                            </div>
                        </div>
                        <div className="section-content">
                            <SavingsGoals onGoalsChange={(list: any) => setGoals(list)} />
                        </div>
                    </section>

                    {/* Shared Expenses Section */}
                    <section className="goals-section">
                        <div className="section-header">
                            <div className="section-icon shared">
                                <Users size={24} />
                            </div>
                            <div className="section-text">
                                <h2>Shared Expenses</h2>
                                <p>Split bills and track shared costs with others</p>
                            </div>
                        </div>
                        <div className="section-content">
                            <SharedExpenses />
                        </div>
                    </section>

                    {/* Subscriptions Section */}
                    <section className="goals-section">
                        <div className="section-header">
                            <div className="section-icon recurring">
                                <Repeat size={24} />
                            </div>
                            <div className="section-text">
                                <h2>Recurring Payments & Subscriptions</h2>
                                <p>Monitor your regular expenses and subscription services</p>
                            </div>
                        </div>
                        <div className="section-content">
                            <Subscriptions />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
