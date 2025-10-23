// client/src/components/BudgetTemplates.tsx
import React, { useState } from 'react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import './BudgetTemplates.css'; // Create this CSS file

interface Template {
    name: string;
    description: string;
    calculate: (salary: number) => Record<string, number>;
}

const templates: Template[] = [
    {
        name: "50/30/20 Rule",
        description: "50% Needs, 30% Wants, 20% Savings/Debt",
        calculate: (salary) => {
            // Note: This is a simplified allocation. Needs/Wants/Savings aren't direct categories.
            // We'll allocate roughly to existing categories for demonstration.
            const needs = salary * 0.5;
            const wants = salary * 0.3;
            // Savings (20%) isn't a direct expense category here.
            return {
                Rent: needs * 0.6, // Example allocation within Needs
                Food: needs * 0.2,
                Utilities: needs * 0.2,
                Entertainment: wants, // Example allocation for Wants
                Other: 0, // Allocate remaining if necessary, or leave for user
            };
        }
    },
    {
        name: "Zero-Based Budget",
        description: "Allocate every dollar to a category (Needs manual input after applying)",
        calculate: (salary) => {
            // Provides structure, user fills amounts
            return { Food: 0, Rent: 0, Utilities: 0, Entertainment: 0, Other: 0 };
        }
    },
     {
        name: "Basic Needs First",
        description: "Prioritizes Rent, Food, Utilities, then allocates remainder.",
        calculate: (salary) => {
            // Example fixed amounts/percentages - adjust as needed
            const rent = Math.min(salary * 0.4, 15000); // Max rent budget example
            const food = Math.min(salary * 0.15, 5000);
            const utilities = Math.min(salary * 0.1, 3000);
            const remaining = salary - rent - food - utilities;
            return {
                Rent: rent > 0 ? rent : 0,
                Food: food > 0 ? food : 0,
                Utilities: utilities > 0 ? utilities : 0,
                Entertainment: Math.max(0, remaining * 0.5), // Allocate half of remainder to Entertainment
                Other: Math.max(0, remaining * 0.5),      // Allocate other half to Other
            };
        }
    },
    // Add more templates as needed
];

export const BudgetTemplates: React.FC = () => {
    const { budget, updateBudget, isLoading } = useFinancialRecords();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            const newCategoryBudgets = selectedTemplate.calculate(budget.monthlySalary);

             // Ensure all default categories exist in the new budgets, even if zero
            const fullNewBudgets = {
                Food: 0,
                Rent: 0,
                Utilities: 0,
                Entertainment: 0,
                Other: 0,
                ...newCategoryBudgets // Overwrite with calculated values
            };


            updateBudget({
                ...budget,
                categoryBudgets: fullNewBudgets,
            });
            setConfirmation(`Successfully applied "${selectedTemplate.name}" template!`);
            setSelectedTemplate(null); // Deselect after applying
        } catch (err) {
            console.error("Error applying template:", err);
            setError("Failed to apply the template.");
        }
    };

     if (isLoading) {
         return null; // Don't show while main budget is loading
     }
     if (!budget) {
         // Optionally show a message prompting user to set up budget first
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

            {error && <div className="template-message error"><AlertTriangle size={16}/> {error}</div>}
            {confirmation && <div className="template-message success"><CheckCircle size={16}/> {confirmation}</div>}

            <div className="template-selector">
                <select
                    value={selectedTemplate?.name || ''}
                    onChange={(e) => {
                        const template = templates.find(t => t.name === e.target.value) || null;
                        setSelectedTemplate(template);
                         setError(null); // Clear errors on selection change
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
             {budget.monthlySalary <= 0 && <p className='template-warning'>Set Monthly Salary above to enable templates.</p>}

        </div>
    );
};
