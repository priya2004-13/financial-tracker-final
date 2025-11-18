// client/src/components/Subscriptions.tsx - Enhanced for Bill Reminders & Paid Status
import React, { useState, useEffect} from 'react';
 
import {
    RecurringPayment,
    fetchRecurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment
} from '../../services/api';
import { Calendar, Repeat, Trash2, Plus, Edit2, Check, X, Bell } from 'lucide-react'; // Added Bell
import './Subscriptions.css';
import { useAuth } from '../contexts/AuthContext';

export const Subscriptions = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState<RecurringPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        billingCycle: 'monthly' as 'monthly' | 'yearly',
        nextPaymentDate: '',
        category: 'Entertainment', // Default category
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
            const data = await fetchRecurringPayments(user._id);
            setPayments(data.sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())); // Sort by next payment date
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
            const paymentData: Omit<RecurringPayment, '_id' | 'userId'> & { userId: string } = { // Ensure userId is included
                userId: user._id,
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
                await addRecurringPayment(paymentData as RecurringPayment); // Cast might be needed if API requires full object
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
            // Format date correctly for input type="date"
            nextPaymentDate: new Date(payment.nextPaymentDate).toISOString().split('T')[0],
            category: payment.category,
            isActive: payment.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (paymentId: string) => {
        if (!paymentId || !window.confirm('Are you sure you want to delete this subscription?')) return;
        try {
            await deleteRecurringPayment(paymentId);
            await loadPayments();
        } catch (error) {
            console.error('Failed to delete recurring payment:', error);
        }
    };

     const handleMarkAsPaid = async (payment: RecurringPayment) => {
        if (!payment._id) return;
        try {
            const currentDate = new Date(payment.nextPaymentDate);
            let nextDate: Date;

            if (payment.billingCycle === 'monthly') {
                nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
            } else { // yearly
                nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
            }

            await updateRecurringPayment(payment._id, { nextPaymentDate: nextDate });
            await loadPayments(); // Refresh list to show updated date
        } catch (error) {
            console.error('Failed to mark as paid:', error);
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

    // --- Calculations for UI ---
    const calculateMonthlyTotal = () => {
        return payments
            .filter(p => p.isActive)
            .reduce((total, p) => {
                return total + (p.billingCycle === 'monthly' ? p.amount : p.amount / 12);
            }, 0);
    };

     // Check if a payment is due soon (within 7 days)
     const isDueSoon = (paymentDate: Date): boolean => {
        const today = new Date();
        const dueDate = new Date(paymentDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff >= 0 && daysDiff <= 7; // Due in the next 7 days
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
                        <h2 className="subscriptions-title">Bills & Subscriptions</h2>
                        <p className="subscriptions-subtitle">
                            Est. Monthly total: ₹{calculateMonthlyTotal().toFixed(2)}
                        </p>
                    </div>
                </div>
                 <button
                    className={`btn-toggle-form ${showForm ? 'active' : ''}`}
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} // Reset if closing
                    title={showForm ? 'Cancel' : 'Add New Bill/Subscription'}
                 >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                     {showForm ? 'Cancel' : 'Add New'}
                 </button>

            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="subscription-form">
                    {/* Form fields remain largely the same */}
                     <div className="form-row">
                        <div className="form-field">
                            <label>Name</label>
                            <input
                                type="text"
                                className="form-input form-input-animated"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Netflix, Rent, Electricity"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Amount</label>
                            <input
                                type="number"
                                className="form-input form-input-animated"
                                step="0.01"
                                min="0.01"
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
                                className="form-input form-input-animated" // Apply consistent styling
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
                                className="form-input form-input-animated" // Apply consistent styling
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {/* Consider populating this dynamically */}
                                <option value="Entertainment">Entertainment</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Rent">Rent</option>
                                <option value="Food">Food</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Next Payment Date</label>
                        <input
                            type="date"
                            className="form-input form-input-animated"
                            value={formData.nextPaymentDate}
                            onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                            required
                        />
                    </div>
                     <div className="form-field form-field-checkbox">
                        <input
                            type="checkbox"
                            id="isActiveCheckbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActiveCheckbox"> Is Active?</label>
                    </div>


                    <button type="submit" className="btn-primary ripple-button">
                        {editingId ? <Check size={16} /> : <Plus size={16} />}
                        {editingId ? 'Update Item' : 'Add Item'}
                    </button>
                </form>
            )}

            <div className="subscriptions-list">
                {payments.length === 0 ? (
                    <div className="empty-state">
                        <Repeat size={48} />
                        <p>No recurring bills or subscriptions tracked yet.</p>
                    </div>
                ) : (
                    payments.map((payment) => {
                        const dueSoon = payment.isActive && isDueSoon(payment.nextPaymentDate);
                        return (
                            <div
                                key={payment._id}
                                className={`subscription-card ${!payment.isActive ? 'inactive' : ''} ${dueSoon ? 'due-soon' : ''}`}
                            >
                                 {dueSoon && <Bell size={14} className="due-soon-icon"  />}
                                <div className="subscription-info">
                                    <h3>{payment.name} {!payment.isActive && '(Inactive)'}</h3>
                                    <div className="subscription-meta">
                                        <span className="meta-item">
                                            <Calendar size={14} />
                                            Next: {new Date(payment.nextPaymentDate).toLocaleDateString()}
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
                                    {payment.isActive && (
                                         <button
                                            className="action-btn paid ripple-button"
                                            onClick={() => handleMarkAsPaid(payment)}
                                            title="Mark as Paid (Advances next date)"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn edit ripple-button"
                                        onClick={() => handleEdit(payment)}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="action-btn delete ripple-button"
                                        onClick={() => handleDelete(payment._id!)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
