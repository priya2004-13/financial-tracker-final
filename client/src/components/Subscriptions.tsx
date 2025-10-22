// client/src/components/Subscriptions.tsx
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    RecurringPayment,
    fetchRecurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment
} from '../../services/api';
import { Calendar, Repeat, Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import './Subscriptions.css';

export const Subscriptions = () => {
    const { user } = useUser();
    const [payments, setPayments] = useState<RecurringPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        billingCycle: 'monthly' as 'monthly' | 'yearly',
        nextPaymentDate: '',
        category: 'Entertainment',
        isActive: true
    });

    useEffect(() => {
        if (user) {
            loadPayments();
        }
    }, [user]);

    const loadPayments = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await fetchRecurringPayments(user.id);
            setPayments(data);
        } catch (error) {
            console.error('Failed to load recurring payments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const paymentData: RecurringPayment = {
                userId: user.id,
                name: formData.name,
                amount: parseFloat(formData.amount),
                billingCycle: formData.billingCycle,
                nextPaymentDate: new Date(formData.nextPaymentDate),
                category: formData.category,
                isActive: formData.isActive
            };

            if (editingId) {
                await updateRecurringPayment(editingId, paymentData);
            } else {
                await addRecurringPayment(paymentData);
            }

            await loadPayments();
            resetForm();
        } catch (error) {
            console.error('Failed to save recurring payment:', error);
        }
    };

    const handleEdit = (payment: RecurringPayment) => {
        setEditingId(payment._id || null);
        setFormData({
            name: payment.name,
            amount: payment.amount.toString(),
            billingCycle: payment.billingCycle,
            nextPaymentDate: new Date(payment.nextPaymentDate).toISOString().split('T')[0],
            category: payment.category,
            isActive: payment.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (paymentId: string) => {
        if (!window.confirm('Are you sure you want to delete this subscription?')) return;
        try {
            await deleteRecurringPayment(paymentId);
            await loadPayments();
        } catch (error) {
            console.error('Failed to delete recurring payment:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amount: '',
            billingCycle: 'monthly',
            nextPaymentDate: '',
            category: 'Entertainment',
            isActive: true
        });
        setEditingId(null);
        setShowForm(false);
    };

    const calculateMonthlyTotal = () => {
        return payments
            .filter(p => p.isActive)
            .reduce((total, p) => {
                return total + (p.billingCycle === 'monthly' ? p.amount : p.amount / 12);
            }, 0);
    };

    if (isLoading) {
        return (
            <div className="subscriptions-container">
                <div className="loading-state">Loading subscriptions...</div>
            </div>
        );
    }

    return (
        <div className="subscriptions-container">
            <div className="subscriptions-header">
                <div className="header-left">
                    <div className="subscriptions-icon">
                        <Repeat size={22} />
                    </div>
                    <div>
                        <h2 className="subscriptions-title">Subscriptions</h2>
                        <p className="subscriptions-subtitle">
                            Monthly total: ₹{calculateMonthlyTotal().toFixed(2)}
                        </p>
                    </div>
                </div>
                <button
                    className="btn-add"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add New'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="subscription-form">
                    <div className="form-row">
                        <div className="form-field">
                            <label>Subscription Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Netflix, Spotify"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Billing Cycle</label>
                            <select
                                value={formData.billingCycle}
                                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Entertainment">Entertainment</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Food">Food</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Next Payment Date</label>
                        <input
                            type="date"
                            value={formData.nextPaymentDate}
                            onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        {editingId ? <Check size={16} /> : <Plus size={16} />}
                        {editingId ? 'Update Subscription' : 'Add Subscription'}
                    </button>
                </form>
            )}

            <div className="subscriptions-list">
                {payments.length === 0 ? (
                    <div className="empty-state">
                        <Repeat size={48} />
                        <p>No subscriptions tracked yet</p>
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div
                            key={payment._id}
                            className={`subscription-card ${!payment.isActive ? 'inactive' : ''}`}
                        >
                            <div className="subscription-info">
                                <h3>{payment.name}</h3>
                                <div className="subscription-meta">
                                    <span className="meta-item">
                                        <Calendar size={14} />
                                        {new Date(payment.nextPaymentDate).toLocaleDateString()}
                                    </span>
                                    <span className="meta-item">
                                        <Repeat size={14} />
                                        {payment.billingCycle}
                                    </span>
                                    <span className={`category-badge ${payment.category.toLowerCase()}`}>
                                        {payment.category}
                                    </span>
                                </div>
                            </div>
                            <div className="subscription-actions">
                                <div className="amount">
                                    ₹{payment.amount.toFixed(2)}
                                    <span className="amount-label">
                                        /{payment.billingCycle === 'monthly' ? 'mo' : 'yr'}
                                    </span>
                                </div>
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEdit(payment)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(payment._id!)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};