// client/src/components/SplitTransactionModal.tsx
import React, { useState, useEffect } from 'react';
import { Split, Plus, Trash2, X, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import './SplitTransactionModal.css';

interface SplitItem {
    id: number;
    description: string;
    amount: string;
    category: string;
}

interface SplitTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalDescription: string;
    originalAmount: string;
    onSubmit: (splits: SplitItem[]) => void;
    allCategories: string[];
}

export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
    isOpen,
    onClose,
    originalDescription,
    originalAmount,
    onSubmit,
    allCategories
}) => {
    const [splits, setSplits] = useState<SplitItem[]>([
        { id: 1, description: '', amount: '', category: '' },
    ]);
    const [autoDistribute, setAutoDistribute] = useState(false);
console.log(autoDistribute)
    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
        } else {
            // Unlock body scroll
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    useEffect(() => {
        if (isOpen && originalDescription && originalAmount) {
            // Pre-fill first item with original data
            setSplits([{
                id: 1,
                description: originalDescription,
                amount: originalAmount,
                category: ''
            }]);
        }
    }, [isOpen, originalDescription, originalAmount]);

    const totalAmount = parseFloat(originalAmount) || 0;
    const splitTotal = splits.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const remaining = totalAmount - splitTotal;
    const isValid = Math.abs(remaining) < 0.01 && splits.every(s => s.description && s.amount && s.category);

    const addSplit = () => {
        setSplits([...splits, { id: Date.now(), description: '', amount: '', category: '' }]);
    };

    const removeSplit = (id: number) => {
        if (splits.length <= 1) return;
        setSplits(splits.filter(s => s.id !== id));
    };

    const updateSplit = (id: number, field: keyof SplitItem, value: string) => {
        setSplits(splits.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleAutoDistribute = () => {
        if (splits.length === 0) return;
        const amountPerSplit = totalAmount / splits.length;
        setSplits(splits.map(s => ({ ...s, amount: amountPerSplit.toFixed(2) })));
        setAutoDistribute(true);
    };

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit(splits);
        onClose();
    };

    const handleQuickSplit = (percentage: number) => {
        if (splits.length < 2) return;
        const firstAmount = totalAmount * (percentage / 100);
        const secondAmount = totalAmount - firstAmount;

        const updatedSplits = [...splits];
        updatedSplits[0] = { ...updatedSplits[0], amount: firstAmount.toFixed(2) };
        if (updatedSplits[1]) {
            updatedSplits[1] = { ...updatedSplits[1], amount: secondAmount.toFixed(2) };
        }
        setSplits(updatedSplits);
    };

    if (!isOpen) return null;

    return (
        <div className="split-modal-overlay" onClick={onClose}>
            <div className="split-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="split-modal-header">
                    <div className="header-title">
                        <Split size={24} />
                        <h2>Split Transaction</h2>
                    </div>
                    <button onClick={onClose} className="btn-close-modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Original Amount Info */}
                <div className="original-amount-card">
                    <div className="amount-info">
                        <span className="amount-label">Total to Split</span>
                        <span className="amount-value">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="amount-info">
                        <span className="amount-label">Remaining</span>
                        <span className={`amount-value ${remaining < 0 ? 'negative' : 'positive'}`}>
                            ₹{Math.abs(remaining).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Quick Split Options */}
                {splits.length === 2 && (
                    <div className="quick-split-options">
                        <span className="quick-split-label">Quick Split:</span>
                        <button onClick={() => handleQuickSplit(50)} className="btn-quick-split">50/50</button>
                        <button onClick={() => handleQuickSplit(60)} className="btn-quick-split">60/40</button>
                        <button onClick={() => handleQuickSplit(70)} className="btn-quick-split">70/30</button>
                        <button onClick={handleAutoDistribute} className="btn-quick-split">Equal</button>
                    </div>
                )}

                {/* Split Items */}
                <div className="split-items-container">
                    {splits.map((item, index) => (
                        <div key={item.id} className="split-item">
                            <div className="split-item-header">
                                <span className="split-item-number">Split {index + 1}</span>
                                {splits.length > 1 && (
                                    <button
                                        onClick={() => removeSplit(item.id)}
                                        className="btn-remove-split"
                                        title="Remove split"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="split-item-fields">
                                <div className="field-group full-width">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateSplit(item.id, 'description', e.target.value)}
                                        placeholder="What was this for?"
                                        className="split-input"
                                    />
                                </div>

                                <div className="field-row">
                                    <div className="field-group">
                                        <label>Amount</label>
                                        <div className="input-with-icon">
                                            <DollarSign size={16} />
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateSplit(item.id, 'amount', e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0.01"
                                                className="split-input amount-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label>Category</label>
                                        <select
                                            value={item.category}
                                            onChange={(e) => updateSplit(item.id, 'category', e.target.value)}
                                            className="split-input"
                                        >
                                            <option value="">Select</option>
                                            {allCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Split Button */}
                <button onClick={addSplit} className="btn-add-split">
                    <Plus size={16} />
                    Add Another Split
                </button>

                {/* Validation Messages */}
                {Math.abs(remaining) >= 0.01 && (
                    <div className="validation-message warning">
                        <AlertCircle size={16} />
                        <span>
                            {remaining > 0
                                ? `You still need to allocate ₹${remaining.toFixed(2)}`
                                : `You've exceeded the total by ₹${Math.abs(remaining).toFixed(2)}`}
                        </span>
                    </div>
                )}

                {isValid && (
                    <div className="validation-message success">
                        <CheckCircle size={16} />
                        <span>Split amounts match the total!</span>
                    </div>
                )}

                {/* Use Case Examples */}
                <div className="use-case-examples">
                    <h4>💡 Common Use Cases:</h4>
                    <ul>
                        <li><strong>Grocery Shopping:</strong> Split between Food and Household items</li>
                        <li><strong>Online Shopping:</strong> Separate clothing, electronics, and books</li>
                        <li><strong>Restaurant Bill:</strong> Divide food and drinks</li>
                        <li><strong>Utility Bill:</strong> Split between Utilities and Internet</li>
                    </ul>
                </div>

                {/* Footer Actions */}
                <div className="split-modal-footer">
                    <button onClick={onClose} className="btn-cancel">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="btn-submit-split"
                    >
                        <Split size={16} />
                        Create {splits.length} Transactions
                    </button>
                </div>
            </div>
        </div>
    );
};