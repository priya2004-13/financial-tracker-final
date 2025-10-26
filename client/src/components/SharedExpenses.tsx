// client/src/components/SharedExpenses.tsx - 
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Users, Plus, Check, X, TrendingUp, TrendingDown, Loader } from 'lucide-react';
import './SharedExpenses.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Types
interface Participant {
    userId: string;
    userName: string;
    amountOwed: number;
    hasPaid: boolean;
    percentage?: number;
    customAmount?: string;
}

interface SharedExpense {
    _id: string;
    groupId: string;
    groupName: string;
    createdBy: string;
    createdByName: string;
    date: Date;
    description: string;
    totalAmount: number;
    category: string;
    paymentMethod: string;
    paidBy: string;
    paidByName: string;
    splitType: 'equal' | 'custom' | 'percentage';
    participants: Participant[];
}

interface BalanceSummary {
    totalOwed: number;
    totalOwedToUser: number;
    netBalance: number;
}

export const SharedExpenses: React.FC = () => {
    const { user } = useUser();
    const [expenses, setExpenses] = useState<SharedExpense[]>([]);
    const [balance, setBalance] = useState<BalanceSummary>({
        totalOwed: 0,
        totalOwedToUser: 0,
        netBalance: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('default');
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        groupName: 'Family',
        description: '',
        totalAmount: '',
        category: 'Other',
        paymentMethod: 'Cash',
        splitType: 'equal' as 'equal' | 'custom' | 'percentage',
        participants: [
            {
                userId: user?.id || '',
                userName: user?.firstName || 'Me',
                percentage: 50,
                customAmount: ''
            }
        ]
    });

    useEffect(() => {
        if (user) {
            loadExpenses();
            loadBalance();
        }
    }, [user, selectedGroup]);

    const loadExpenses = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/shared-expenses/group/${selectedGroup}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setExpenses([]);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setExpenses(data);
        } catch (err: any) {
            console.error('Error loading expenses:', err);
            setError(err.message || 'Failed to load shared expenses');
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadBalance = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE_URL}/shared-expenses/balance/${selectedGroup}/${user.id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setBalance({ totalOwed: 0, totalOwedToUser: 0, netBalance: 0 });
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setBalance(data);
        } catch (err: any) {
            console.error('Error loading balance:', err);
            setBalance({ totalOwed: 0, totalOwedToUser: 0, netBalance: 0 });
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        // Validation
        if (!formData.description || !formData.totalAmount) {
            setError('Please fill in all required fields');
            return;
        }

        const totalAmount = parseFloat(formData.totalAmount);
        if (isNaN(totalAmount) || totalAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Validate participants
        if (formData.participants.some(p => !p.userName)) {
            setError('Please fill in all participant names');
            return;
        }

        // Validate percentages
        if (formData.splitType === 'percentage') {
            const totalPercentage = formData.participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                setError('Percentages must add up to 100%');
                return;
            }
        }

        // Validate custom amounts
        if (formData.splitType === 'custom') {
            const customTotal = formData.participants.reduce((sum, p) => {
                const amount = parseFloat(p.customAmount || '0');
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

            if (Math.abs(customTotal - totalAmount) > 0.01) {
                setError(`Custom amounts (₹${customTotal.toFixed(2)}) must equal total (₹${totalAmount.toFixed(2)})`);
                return;
            }
        }

        try {
            setError(null);
            const newExpense = {
                groupId: selectedGroup,
                groupName: formData.groupName,
                createdBy: user.id,
                createdByName: user.firstName || 'User',
                date: new Date(),
                description: formData.description,
                totalAmount: totalAmount,
                category: formData.category,
                paymentMethod: formData.paymentMethod,
                paidBy: user.id,
                paidByName: user.firstName || 'User',
                splitType: formData.splitType,
                participants: formData.participants.map(p => ({
                    userId: p.userId || `guest_${Date.now()}_${Math.random()}`,
                    userName: p.userName,
                    amountOwed: formData.splitType === 'custom'
                        ? parseFloat(p.customAmount || '0')
                        : 0, // Backend will calculate for equal/percentage
                    percentage: formData.splitType === 'percentage' ? p.percentage : undefined,
                    hasPaid: p.userId === user.id
                }))
            };

            const response = await fetch(`${API_BASE_URL}/shared-expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData || 'Failed to create expense');
            }

            await loadExpenses();
            await loadBalance();
            setShowForm(false);
            resetForm();
        } catch (err: any) {
            console.error('Error creating expense:', err);
            setError(`Failed to create shared expense: ${err.message}`);
        }
    };

    const markAsPaid = async (expenseId: string, userId: string) => {
        try {
            setError(null);
            const response = await fetch(
                `${API_BASE_URL}/shared-expenses/${expenseId}/mark-paid/${userId}`,
                { method: 'PUT' }
            );

            if (!response.ok) {
                throw new Error('Failed to mark as paid');
            }

            await loadExpenses();
            await loadBalance();
        } catch (err: any) {
            console.error('Error marking as paid:', err);
            setError('Failed to mark as paid');
        }
    };

    const resetForm = () => {
        setFormData({
            groupName: 'Family',
            description: '',
            totalAmount: '',
            category: 'Other',
            paymentMethod: 'Cash',
            splitType: 'equal',
            participants: [
                {
                    userId: user?.id || '',
                    userName: user?.firstName || 'Me',
                    percentage: 50,
                    customAmount: ''
                }
            ]
        });
    };

    const addParticipant = () => {
        setFormData({
            ...formData,
            participants: [
                ...formData.participants,
                { userId: '', userName: '', percentage: 0, customAmount: '' }
            ]
        });
    };

    const removeParticipant = (index: number) => {
        if (formData.participants.length <= 1) return;
        setFormData({
            ...formData,
            participants: formData.participants.filter((_, i) => i !== index)
        });
    };

    const updateParticipant = (index: number, field: string, value: any) => {
        const updated = [...formData.participants];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, participants: updated });
    };

    if (!user) return null;

    return (
        <div className="shared-expenses-container">
            {/* Header */}
            <div className="shared-expenses-header">
                <div className="shared-header-left">
                    <div className="shared-expenses-icon">
                        <Users size={22} />
                    </div>
                    <h2 className="shared-expenses-title">Shared Expenses</h2>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`btn-toggle-expense-form ${showForm ? 'active' : ''}`}
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add Expense'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-banner" style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--danger-color)',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Balance Summary */}
            <div className="balance-summary">
                <div className="balance-card owed">
                    <div className="balance-label">You Owe</div>
                    <div className="balance-value red">
                        ₹{balance.totalOwed.toFixed(2)}
                    </div>
                </div>
                <div className="balance-card owed-to-you">
                    <div className="balance-label">Owed to You</div>
                    <div className="balance-value green">
                        ₹{balance.totalOwedToUser.toFixed(2)}
                    </div>
                </div>
                <div className="balance-card net">
                    <div className="balance-label">Net Balance</div>
                    <div className={`balance-value ${balance.netBalance >= 0 ? 'green' : 'red'}`}>
                        ₹{Math.abs(balance.netBalance).toFixed(2)}
                        {balance.netBalance >= 0 ?
                            <TrendingUp size={20} /> :
                            <TrendingDown size={20} />
                        }
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="shared-expense-form">
                    <div className="form-grid">
                        <div className="form-group-shared">
                            <label className="form-label-shared">Description *</label>
                            <input
                                type="text"
                                className="form-input-shared"
                                placeholder="e.g., Dinner at restaurant"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group-shared">
                            <label className="form-label-shared">Total Amount *</label>
                            <input
                                type="number"
                                className="form-input-shared"
                                placeholder="0.00"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                required
                                step="0.01"
                                min="0.01"
                            />
                        </div>

                        <div className="form-group-shared">
                            <label className="form-label-shared">Split Type</label>
                            <select
                                className="form-input-shared"
                                value={formData.splitType}
                                onChange={(e) => setFormData({ ...formData, splitType: e.target.value as any })}
                            >
                                <option value="equal">Split Equally</option>
                                <option value="percentage">Split by Percentage</option>
                                <option value="custom">Custom Amounts</option>
                            </select>
                        </div>

                        {/* Participants */}
                        <div className="participants-section">
                            <div className="participants-header">
                                Participants ({formData.participants.length})
                            </div>
                            {formData.participants.map((p, index) => (
                                <div key={index} className="participant-row">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={p.userName}
                                        onChange={(e) => updateParticipant(index, 'userName', e.target.value)}
                                        required
                                    />
                                    {formData.splitType === 'percentage' && (
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={p.percentage}
                                            onChange={(e) => updateParticipant(index, 'percentage', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            max="100"
                                        />
                                    )}
                                    {formData.splitType === 'custom' && (
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={p.customAmount}
                                            onChange={(e) => updateParticipant(index, 'customAmount', e.target.value)}
                                            step="0.01"
                                            min="0"
                                        />
                                    )}
                                    {formData.participants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(index)}
                                            className="btn-remove-participant"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addParticipant}
                                className="btn-add-participant"
                            >
                                + Add Person
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="btn-submit-expense"
                        >
                            Create Shared Expense
                        </button>
                    </div>
                </div>
            )}

            {/* Expenses List */}
            <div className="expenses-section">
                <h3 className="expenses-section-title">Recent Expenses</h3>
                {isLoading ? (
                    <div className="expenses-loading">
                        <Loader size={32} className="spinner" />
                        <p>Loading expenses...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="expenses-empty">
                        No shared expenses yet. Create one to get started!
                    </div>
                ) : (
                    <div className="expenses-list">
                        {expenses.map(expense => (
                            <div key={expense._id} className="expense-card">
                                <div className="expense-header">
                                    <div className="expense-info">
                                        <div className="expense-description">{expense.description}</div>
                                        <div className="expense-meta">
                                            Paid by {expense.paidByName} • {new Date(expense.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="expense-amount">
                                        ₹{expense.totalAmount.toFixed(2)}
                                    </div>
                                </div>
                                <div className="expense-participants">
                                    {expense.participants.map((p, i) => (
                                        <div key={i} className="participant-item">
                                            <span className="participant-name">{p.userName}</span>
                                            <div className="participant-right">
                                                <span className="participant-amount">
                                                    ₹{p.amountOwed.toFixed(2)}
                                                </span>
                                                {p.hasPaid ? (
                                                    <span className="status-badge paid">
                                                        <Check size={12} /> Paid
                                                    </span>
                                                ) : p.userId === user.id ? (
                                                    <button
                                                        onClick={() => markAsPaid(expense._id, p.userId)}
                                                        className="btn-mark-paid"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                ) : (
                                                    <span className="status-badge unpaid">
                                                        Unpaid
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};