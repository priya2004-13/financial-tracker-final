// client/src/components/TransactionTemplates.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    TransactionTemplate as TemplateType,
    fetchTransactionTemplates,
    deleteTransactionTemplate,
    addFinancialRecord, // To add record from template
} from '../../services/api';
import { useFinancialRecords } from '../contexts/financial-record-context'; // To trigger UI update
import { Copy, PlusCircle, Trash2, LayoutTemplate, X, Loader } from 'lucide-react';
import './TransactionTemplates.css';

export const TransactionTemplates: React.FC = () => {
    const { user } = useUser();
    const { addRecord } = useFinancialRecords(); // Get addRecord to update list after applying template
    const [templates, setTemplates] = useState<TemplateType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState<string | null>(null); // Track which template is being applied

    const loadTemplates = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            setError(null);
            const fetchedTemplates = await fetchTransactionTemplates(user.id);
            setTemplates(fetchedTemplates);
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Failed to load templates.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleDelete = async (templateId: string) => {
        if (!templateId || !window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await deleteTransactionTemplate(templateId);
            setTemplates(prev => prev.filter(t => t._id !== templateId));
        } catch (err) {
            console.error("Error deleting template:", err);
            setError("Failed to delete template.");
        }
    };

    const applyTemplate = async (template: TemplateType) => {
        if (!user) return;
        setIsApplying(template._id ?? null);
        try {
            const newRecord = {
                userId: user.id,
                date: new Date(), // Use current date when applying
                description: template.description,
                amount: template.amount,
                category: template.category,
                paymentMethod: template.paymentMethod,
            };
            await addRecord(newRecord); // Use the context function
             // Optionally add a success message here
            console.log(`Applied template: ${template.templateName}`);
        } catch (err) {
            console.error("Error applying template:", err);
            setError("Failed to apply template.");
        } finally {
             setIsApplying(null);
        }
    };

    return (
        <div className="transaction-templates-container">
            <div className="templates-header">
                 <div className="header-left">
                     <div className="templates-icon">
                         <LayoutTemplate size={20} />
                     </div>
                     <h2 className="templates-title">Transaction Templates</h2>
                 </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="templates-list">
                {isLoading ? (
                    <div className="template-loading">Loading templates...</div>
                ) : templates.length === 0 ? (
                    <p className="empty-templates">No templates saved yet. Use the 'Save as Template' option in the transaction form.</p>
                ) : (
                    templates.map((template) => (
                        <div key={template._id} className="template-item">
                            <div className="template-info">
                                <span className="template-name">{template.templateName}</span>
                                <span className="template-details">
                                     {template.description} - ₹{template.amount.toFixed(2)} ({template.category})
                                </span>
                            </div>
                            <div className="template-actions">
                                <button
                                    onClick={() => applyTemplate(template)}
                                    className="btn-apply-template"
                                    title="Apply Template"
                                    disabled={isApplying === template._id}
                                >
                                     {isApplying === template._id ? <Loader size={16} className="spinner"/> : <PlusCircle size={16} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(template._id!)}
                                    className="btn-delete-template"
                                    title="Delete Template"
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
