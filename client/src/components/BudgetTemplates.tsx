// client/src/components/BudgetTemplates.tsx - FIXED VERSION
import React, { useState, useMemo } from 'react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import './BudgetTemplates.css';

interface Template {
    name: string;
    description: string;
    calculate: (salary: number, categories: string[]) => Record<string, number>;
}

const templates: Template[] = [
    {
        name: "50/30/20 Rule",
        description: "50% Needs, 30% Wants, 20% Savings/Debt",
        calculate: (salary, categories) => {
            const needs = salary * 0.5;
            const wants = salary * 0.3;
            const result: Record<string, number> = {};

            // Distribute needs among essential categories
            const essentialCategories = categories.filter(c =>
                ['Rent', 'Utilities', 'Food'].some(e => c.toLowerCase().includes(e.toLowerCase()))
            );
            const otherCategories = categories.filter(c =>
                !essentialCategories.includes(c) && c !== 'Salary'
            );

            if (essentialCategories.length > 0) {
                const needsPerCategory = needs / essentialCategories.length;
                essentialCategories.forEach(cat => result[cat] = needsPerCategory);
            }

            if (otherCategories.length > 0) {
                const wantsPerCategory = wants / otherCategories.length;
                otherCategories.forEach(cat => result[cat] = wantsPerCategory);
            }

            return result;
        }
    },
    {
        name: "Zero-Based Budget",
        description: "Allocate every dollar to a category (Needs manual adjustment after applying)",
        calculate: (_salary: number, categories: string[]) => {
            const result: Record<string, number> = {};
            categories.forEach(cat => {
                if (cat !== 'Salary') result[cat] = 0;
            });
            return result;
        }
    },
    {
        name: "Basic Needs First",
        description: "Prioritizes Rent, Food, Utilities, then allocates remainder.",
        calculate: (salary, categories) => {
            const result: Record<string, number> = {};
            let remaining = salary;

            // Allocate fixed percentages to essential categories
            const allocations = [
                { pattern: 'rent', percentage: 0.4 },
                { pattern: 'food', percentage: 0.15 },
                { pattern: 'utilities', percentage: 0.1 }
            ];

            allocations.forEach(({ pattern, percentage }) => {
                const cat = categories.find(c => c.toLowerCase().includes(pattern));
                if (cat) {
                    const amount = Math.min(salary * percentage, remaining);
                    result[cat] = amount;
                    remaining -= amount;
                }
            });

            // Distribute remaining among other categories
            const otherCategories = categories.filter(c =>
                !Object.keys(result).includes(c) && c !== 'Salary'
            );

            if (otherCategories.length > 0 && remaining > 0) {
                const amountPerCategory = remaining / otherCategories.length;
                otherCategories.forEach(cat => result[cat] = amountPerCategory);
            }

            return result;
        }
    },
    {
        name: "Equal Distribution",
        description: "Distribute salary equally across all categories",
        calculate: (salary, categories) => {
            const result: Record<string, number> = {};
            const expenseCategories = categories.filter(c => c !== 'Salary');

            if (expenseCategories.length > 0) {
                const amountPerCategory = salary / expenseCategories.length;
                expenseCategories.forEach(cat => result[cat] = amountPerCategory);
            }

            return result;
        }
    }
];

export const BudgetTemplates: React.FC = () => {
    const { budget, updateBudget, categories, isLoading } = useFinancialRecords();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get all available categories (default + custom)
    const allCategories = useMemo(() => {
        const defaultCategories = ["Food", "Rent", "Utilities", "Entertainment", "Other"];
        const customCategoryNames = categories.map(c => c.name);
        return [...new Set([...defaultCategories, ...customCategoryNames])].sort();
    }, [categories]);

    const handleApplyTemplate = () => {
        setError(null);
        setConfirmation(null);

        if (!selectedTemplate || !budget) {
            setError("Please select a template and ensure a budget exists.");
            return;
        }

        if (budget.monthlySalary <= 0) {
            setError("Please set your Monthly Salary in the Budget Manager before applying a template.");
            return;
        }

        if (!window.confirm(`Applying "${selectedTemplate.name}" will overwrite your current category budgets based on your salary of ₹${budget.monthlySalary.toFixed(2)}. Are you sure?`)) {
            return;
        }

        try {
            // Calculate new budgets using all available categories
            const newCategoryBudgets = selectedTemplate.calculate(budget.monthlySalary, allCategories);

            // Ensure all categories have a budget entry (even if 0)
            const fullNewBudgets: Record<string, number> = {};
            allCategories.forEach(cat => {
                if (cat !== 'Salary') {
                    fullNewBudgets[cat] = newCategoryBudgets[cat] || 0;
                }
            });

            updateBudget({
                ...budget,
                categoryBudgets: fullNewBudgets,
            });

            setConfirmation(`Successfully applied "${selectedTemplate.name}" template!`);
            setSelectedTemplate(null);
        } catch (err) {
            console.error("Error applying template:", err);
            setError("Failed to apply the template.");
        }
    };

    if (isLoading) {
        return null;
    }

    if (!budget) {
        return (
            <div className="budget-templates-container disabled-overlay">
                <p>Set up your main budget first to use templates.</p>
            </div>
        );
    }

    return (
        <div className="budget-templates-container">
            <div className="templates-header">
                <div className="header-left">
                    <div className="templates-icon">
                        <Layers size={20} />
                    </div>
                    <h3 className="templates-title">Apply Budget Template</h3>
                </div>
            </div>

            {error && <div className="template-message error"><AlertTriangle size={16} /> {error}</div>}
            {confirmation && <div className="template-message success"><CheckCircle size={16} /> {confirmation}</div>}

            <div className="template-selector">
                <select
                    value={selectedTemplate?.name || ''}
                    onChange={(e) => {
                        const template = templates.find(t => t.name === e.target.value) || null;
                        setSelectedTemplate(template);
                        setError(null);
                        setConfirmation(null);
                    }}
                    className='form-input form-input-animated'
                    disabled={budget.monthlySalary <= 0}
                >
                    <option value="" disabled>-- Select a Template --</option>
                    {templates.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                </select>

                {selectedTemplate && (
                    <p className="template-description">{selectedTemplate.description}</p>
                )}
            </div>

            <button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate || budget.monthlySalary <= 0}
                className="btn-apply-template btn-primary ripple-button"
            >
                Apply Template
            </button>

            {budget.monthlySalary <= 0 && (
                <p className='template-warning'>Set Monthly Salary above to enable templates.</p>
            )}
        </div>
    );
};