import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react'; // CORRECTED: Import useAuth instead of useUser
import {
    Target, CreditCard, TrendingUp, Calendar,
    Plus, X, Edit2, Trash2,
    Sparkles, BarChart3, Clock, Zap, Flame, Trophy
} from 'lucide-react';
import './goals.css';
import { LoadingSpinner } from '../../components/LoadingSpinner';

// --- Types ---
interface IGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
}

interface IDebt {
    id: string;
    name: string;
    principal: number;
    remaining: number;
    interestRate: number;
    monthlyPayment: number;
    minimumPayment: number;
}

type DebtStrategy = 'snowball' | 'avalanche';

type NewGoalData = Omit<IGoal, 'id'>;
type NewDebtData = Omit<IDebt, 'id'>;

// --- Helper Components ---

// AddGoalForm
const AddGoalForm: React.FC<{
    onClose: () => void;
    onAddGoal: (goal: IGoal) => void;
}> = ({ onClose, onAddGoal }) => {
    const { getToken, userId } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        target: '',
        current: '',
        deadline: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch("/api/savings-goals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    name: formData.name,
                    targetAmount: parseFloat(formData.target),
                    currentAmount: parseFloat(formData.current) || 0,
                    deadline: formData.deadline,
                    priority: formData.priority,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to add goal");
            }

            const newGoalFromServer = await res.json();

            const newGoal: IGoal = {
                id: newGoalFromServer._id,
                name: newGoalFromServer.name,
                target: newGoalFromServer.targetAmount,
                current: newGoalFromServer.currentAmount,
                deadline: new Date(newGoalFromServer.deadline).toISOString(),
                priority: newGoalFromServer.priority,
            };

            onAddGoal(newGoal);
            onClose();

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="form-overlay" onClick={onClose}>
            <div className="form-card" onClick={(e) => e.stopPropagation()}>
                <div className="form-header">
                    <h3 className="form-title">Add New Goal</h3>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Goal Name</label>
                        <input className="input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Emergency Fund" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Target Amount (₹)</label>
                        <input className="input" type="number" name="target" value={formData.target} onChange={handleChange} placeholder="100000" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Current Amount (₹)</label>
                        <input className="input" type="number" name="current" value={formData.current} onChange={handleChange} placeholder="0" />
                    </div>
                    <div className="form-group">
                        <label className="label">Deadline</label>
                        <input className="input" type="date" name="deadline" value={formData.deadline} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="label">Priority</label>
                        <select className="input" name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="submit-btn">Save Goal</button>
                </form>
            </div>
        </div>
    );
};

// AddDebtForm
const AddDebtForm: React.FC<{
    onClose: () => void;
    onAddDebt: (debt: IDebt) => void;
}> = ({ onClose, onAddDebt }) => {
    const { getToken, userId } = useAuth(); // CORRECTED: Use useAuth()
    const [formData, setFormData] = useState({
        name: '',
        principal: '',
        remaining: '',
        interestRate: '',
        monthlyPayment: '',
        minimumPayment: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch("/api/debts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    name: formData.name,
                    principal: parseFloat(formData.principal),
                    remaining: parseFloat(formData.remaining),
                    interestRate: parseFloat(formData.interestRate),
                    monthlyPayment: parseFloat(formData.monthlyPayment),
                    minimumPayment: parseFloat(formData.minimumPayment),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to add debt");
            }

            const newDebtFromServer = await res.json();

            const newDebt: IDebt = {
                id: newDebtFromServer._id,
                name: newDebtFromServer.name,
                principal: newDebtFromServer.principal,
                remaining: newDebtFromServer.remaining,
                interestRate: newDebtFromServer.interestRate,
                monthlyPayment: newDebtFromServer.monthlyPayment,
                minimumPayment: newDebtFromServer.minimumPayment,
            };

            onAddDebt(newDebt);
            onClose();

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="form-overlay" onClick={onClose}>
            <div className="form-card" onClick={(e) => e.stopPropagation()}>
                <div className="form-header">
                    <h3 className="form-title">Add New Debt</h3>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Debt Name</label>
                        <input className="input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Credit Card" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Principal Amount (₹)</label>
                        <input className="input" type="number" name="principal" value={formData.principal} onChange={handleChange} placeholder="50000" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Remaining Amount (₹)</label>
                        <input className="input" type="number" name="remaining" value={formData.remaining} onChange={handleChange} placeholder="45000" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Interest Rate (%)</label>
                        <input className="input" type="number" step="0.1" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="18" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Monthly Payment (₹)</label>
                        <input className="input" type="number" name="monthlyPayment" value={formData.monthlyPayment} onChange={handleChange} placeholder="5000" required />
                    </div>
                    <div className="form-group">
                        <label className="label">Minimum Payment (₹)</label>
                        <input className="input" type="number" name="minimumPayment" value={formData.minimumPayment} onChange={handleChange} placeholder="2000" required />
                    </div>
                    {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="submit-btn">Save Debt</button>
                </form>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export const GoalsPage = () => {
    const { getToken, userId } = useAuth(); // CORRECTED: Use useAuth()
    const [activeTab, setActiveTab] = useState('overview');

    const [goals, setGoals] = useState<IGoal[]>([]);
    const [debts, setDebts] = useState<IDebt[]>([]);

    const [debtStrategy, setDebtStrategy] = useState<DebtStrategy>('snowball');
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [showAddDebt, setShowAddDebt] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = await getToken();
                const [goalsResponse, debtsResponse] = await Promise.all([
                    fetch(`/api/savings-goals/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`/api/debts/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (!goalsResponse.ok || !debtsResponse.ok) {
                    throw new Error("Failed to fetch data");
                }

                const goalsData = await goalsResponse.json();
                const debtsData = await debtsResponse.json();

                setGoals(goalsData);
                setDebts(debtsData);
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            loadData();
        }
    }, [getToken, userId]);


    // --- Memos (Calculations) ---
    const goalStats = useMemo(() => {
        const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
        const totalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
        const completed = goals.filter(g => g.current >= g.target).length;
        const active = goals.filter(g => g.current < g.target).length;

        return {
            totalTarget,
            totalCurrent,
            totalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
            completed,
            active,
            atRisk: goals.filter(g => {
                const daysLeft = Math.floor((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 0 || g.current >= g.target) return false;
                const monthlyNeeded = (g.target - g.current) / (daysLeft / 30);
                // Simple at-risk logic: needs more than 1/6th of remaining amount per month
                return monthlyNeeded > (g.target - g.current) / 6;
            }).length
        };
    }, [goals]);

    const debtStats = useMemo(() => {
        const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);
        const totalPrincipal = debts.reduce((sum, d) => sum + d.principal, 0);
        const totalPaid = totalPrincipal - totalDebt;
        const totalMonthly = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);

        const weightedRate = debts.length > 0
            ? debts.reduce((sum, d) => sum + (d.interestRate * d.remaining), 0) / (totalDebt || 1)
            : 0;

        const calculatePayoff = (debt: IDebt) => {
            if (debt.monthlyPayment <= 0) return Infinity;
            if (debt.interestRate <= 0) {
                return Math.ceil(debt.remaining / debt.monthlyPayment);
            }
            const monthlyRate = debt.interestRate / 100 / 12;
            if (debt.monthlyPayment <= debt.remaining * monthlyRate) {
                return Infinity; // Doesn't get paid off
            }
            const months = Math.ceil(
                Math.log(debt.monthlyPayment / (debt.monthlyPayment - debt.remaining * monthlyRate))
                / Math.log(1 + monthlyRate)
            );
            return isFinite(months) ? months : Infinity;
        };

        const monthsToPayoff = debts.length > 0 ? Math.max(...debts.map(calculatePayoff)) : 0;

        return {
            totalDebt,
            totalPaid,
            totalMonthly,
            weightedRate,
            monthsToPayoff: isFinite(monthsToPayoff) ? monthsToPayoff : -1, // -1 for infinity
            progress: totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0
        };
    }, [debts]);

    const optimizedDebts = useMemo(() => {
        return [...debts].sort((a, b) => {
            if (debtStrategy === 'snowball') return a.remaining - b.remaining;
            return b.interestRate - a.interestRate; // Avalanche
        }).map((debt, idx) => ({
            ...debt,
            order: idx + 1,
            progress: (debt.principal > 0 ? ((debt.principal - debt.remaining) / debt.principal) : 0) * 100,
            isPriority: idx === 0
        }));
    }, [debts, debtStrategy]);

    // --- Render Functions ---

    // Overview Tab Content
    const OverviewContent = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-before" />
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#dbeafe' }}>💰</div>
                        <div style={{ flex: 1 }}>
                            <div className="stat-label">Total Goal Target</div>
                            <div className="stat-value">₹{goalStats.totalTarget.toLocaleString()}</div>
                            <div className="stat-subtext">
                                ₹{goalStats.totalCurrent.toLocaleString()} saved ({goalStats.totalProgress.toFixed(0)}%)
                            </div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-before" />
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#ddd6fe' }}>🎯</div>
                        <div style={{ flex: 1 }}>
                            <div className="stat-label">Active Goals</div>
                            <div className="stat-value">{goalStats.active}</div>
                            <div className="stat-subtext">{goalStats.completed} completed</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-before" />
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#fee2e2' }}>💳</div>
                        <div style={{ flex: 1 }}>
                            <div className="stat-label">Total Debt</div>
                            <div className="stat-value">₹{debtStats.totalDebt.toLocaleString()}</div>
                            <div className="stat-subtext">{debtStats.progress.toFixed(0)}% paid off</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-before" />
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#d1fae5' }}>📅</div>
                        <div style={{ flex: 1 }}>
                            <div className="stat-label">Debt-Free In</div>
                            <div className="stat-value">{debtStats.monthsToPayoff === -1 ? "N/A" : `${debtStats.monthsToPayoff}m`}</div>
                            <div className="stat-subtext">
                                {debtStats.monthsToPayoff === -1
                                    ? "Check payments"
                                    : `~${Math.floor(debtStats.monthsToPayoff / 12)}y ${debtStats.monthsToPayoff % 12}m`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // Goals Tab Content
    const GoalsContent = () => (
        <div className="content-card">
            <div className="section-header">
                <h2 className="section-title">
                    <Target size={24} />
                    Savings Goals
                </h2>
                <button className="add-button" onClick={() => setShowAddGoal(true)}>
                    <Plus size={20} />
                    Add Goal
                </button>
            </div>

            <div className="goals-grid">
                {goals.length === 0 && <p>No goals added yet. Click "Add Goal" to start!</p>}
                {goals.map(goal => {
                    const progress = (goal.target > 0 ? (goal.current / goal.target) : 0) * 100;
                    const daysLeft = Math.floor((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                        <div key={goal.id} className="goal-card">
                            <div className="goal-header">
                                <h3 className="goal-name">{goal.name}</h3>
                                <span className={`priority-badge priority-${goal.priority}`}>
                                    {goal.priority}
                                </span>
                            </div>

                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>

                            <div className="goal-amount">
                                <span className="current-amount">₹{goal.current.toLocaleString()}</span>
                                <span>₹{goal.target.toLocaleString()}</span>
                            </div>

                            <div className="goal-meta">
                                <div className="goal-meta-item">
                                    <Calendar size={14} />
                                    <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                                </div>
                                <div className="goal-meta-item">
                                    <Clock size={14} />
                                    <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Overdue'}</span>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button className="icon-btn edit-btn" title="Edit (Not Implemented)">
                                    <Edit2 size={16} />
                                </button>
                                <button className="icon-btn delete-btn" title="Delete (Not Implemented)">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Debt Tab Content
    const DebtContent = () => (
        <div className="content-card">
            <div className="section-header">
                <h2 className="section-title">
                    <CreditCard size={24} />
                    Debt Payoff Plan
                </h2>
                <button className="add-button" onClick={() => setShowAddDebt(true)}>
                    <Plus size={20} />
                    Add Debt
                </button>
            </div>

            <div className="strategy-bar">
                <span className="strategy-label">
                    <Sparkles size={16} />
                    Strategy:
                </span>
                <button
                    className={`strategy-btn ${debtStrategy === 'snowball' ? 'strategy-btn-active' : ''}`}
                    onClick={() => setDebtStrategy('snowball')}
                >
                    <span>❄️ Snowball</span>
                    <span className="strategy-desc">Smallest first</span>
                </button>
                <button
                    className={`strategy-btn ${debtStrategy === 'avalanche' ? 'strategy-btn-active' : ''}`}
                    onClick={() => setDebtStrategy('avalanche')}
                >
                    <span>🔥 Avalanche</span>
                    <span className="strategy-desc">Highest interest</span>
                </button>
            </div>

            {optimizedDebts.length === 0 && <p>No debts added yet. Click "Add Debt" to start!</p>}
            {optimizedDebts.map(debt => (
                <div
                    key={debt.id}
                    className={`debt-card ${debt.isPriority ? 'debt-card-priority' : ''}`}
                >
                    <div className="debt-header">
                        <h3 className="debt-name">
                            {debt.isPriority && <Flame size={20} color="#ef4444" />}
                            {debt.name}
                        </h3>
                        <div className="debt-badges">
                            {debt.isPriority && (
                                <span className="badge focus-badge">Focus</span>
                            )}
                            <span className="badge order-badge">#{debt.order}</span>
                        </div>
                    </div>

                    <div className="debt-info">
                        <div className="debt-info-item">
                            <span className="debt-label">Remaining</span>
                            <span className="debt-value">₹{debt.remaining.toLocaleString()}</span>
                        </div>
                        <div className="debt-info-item">
                            <span className="debt-label">Interest Rate</span>
                            <span className="debt-value">{debt.interestRate}%</span>
                        </div>
                        <div className="debt-info-item">
                            <span className="debt-label">Monthly Payment</span>
                            <span className="debt-value">₹{debt.monthlyPayment.toLocaleString()}</span>
                        </div>
                        <div className="debt-info-item">
                            <span className="debt-label">Min. Payment</span>
                            <span className="debt-value">₹{debt.minimumPayment.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="progress-bar">
                        <div className="progress-fill debt" style={{ width: `${debt.progress.toFixed(2)}%` }} />
                    </div>
                    <div className="debt-progress-text">
                        <span>₹{(debt.principal - debt.remaining).toLocaleString()} paid</span>
                        <span>{debt.progress.toFixed(0)}%</span>
                    </div>


                    {debt.isPriority && (
                        <div className="recommendation">
                            <Zap size={16} />
                            <span>Pay extra towards this debt to get free faster!</span>
                        </div>
                    )}

                    <div className="action-buttons">
                        <button className="icon-btn edit-btn" title="Edit (Not Implemented)">
                            <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete-btn" title="Delete (Not Implemented)">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    // --- Main Component Return ---
    return (
        <div className="goals-container">
            <div className="goals-wrapper">
                <div className="goals-header">
                    <div className="goals-header-top">
                        <div className="title-section">
                            <div className="icon-circle">
                                <Trophy size={32} color="white" />
                            </div>
                            <div>
                                <h1 className="title-text">Goals &amp; Financial Planning</h1>
                                <p className="subtitle">Plan your savings and eliminate your debt.</p>
                            </div>
                        </div>
                    </div>
                    <div className="tab-bar">
                        <button
                            className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <BarChart3 size={18} /> Overview
                        </button>
                        <button
                            className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('goals')}
                        >
                            <Target size={18} /> Savings Goals
                        </button>
                        <button
                            className={`tab ${activeTab === 'debts' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('debts')}
                        >
                            <CreditCard size={18} /> Debt Payoff
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <main>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="content-card" style={{ color: 'var(--danger-color)', textAlign: 'center' }}>
                            {error}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <OverviewContent />}
                            {activeTab === 'goals' && <GoalsContent />}
                            {activeTab === 'debts' && <DebtContent />}
                        </>
                    )}
                </main>
            </div>

            {/* Modals */}
            {showAddGoal && <AddGoalForm
                onClose={() => setShowAddGoal(false)}
                onAddGoal={(newGoal) => {
                    setGoals(prevGoals => [newGoal, ...prevGoals]);
                }}
            />}
            {showAddDebt && <AddDebtForm
                onClose={() => setShowAddDebt(false)}
                onAddDebt={(newDebt) => {
                    setDebts(prevDebts => [newDebt, ...prevDebts]);
                }}
            />}
        </div>
    );
};

