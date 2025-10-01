import { useState, useEffect } from "react";
import { useFinancialRecords } from '../contexts/financial-record-context'
import { DollarSign, Target, TrendingUp, AlertCircle } from "lucide-react";
import "./BudgetManager.css";

export const BudgetManager = () => {
  const { budget, updateBudget, isLoading } = useFinancialRecords();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    monthlySalary: 0,
    categoryBudgets: {
      Food: 0,
      Rent: 0,
      Utilities: 0,
      Entertainment: 0,
      Other: 0,
    },
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        monthlySalary: budget.monthlySalary,
        categoryBudgets: budget.categoryBudgets,
      });
    }
  }, [budget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget({
      userId: budget?.userId || "",
      monthlySalary: formData.monthlySalary,
      categoryBudgets: formData.categoryBudgets,
    });
    setIsEditing(false);
  };

  const handleCategoryBudgetChange = (category: string, value: string) => {
    setFormData({
      ...formData,
      categoryBudgets: {
        ...formData.categoryBudgets,
        [category]: parseFloat(value) || 0,
      },
    });
  };

  const totalBudgetAllocated = Object.values(formData.categoryBudgets).reduce(
    (sum, val) => sum + val,
    0
  );

  const remainingBudget = formData.monthlySalary - totalBudgetAllocated;

  if (isLoading) {
    return (
      <div className="budget-container">
        <div className="loading-state">Loading budget...</div>
      </div>
    );
  }

  if (!budget && !isEditing) {
    return (
      <div className="budget-container">
        <div className="empty-budget">
          <AlertCircle size={48} />
          <h3>No Budget Set</h3>
          <p>Set up your monthly salary and budget to track your expenses effectively.</p>
          <button className="btn-primary" onClick={() => setIsEditing(true)}>
            <Target size={16} />
            Set Up Budget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-container">
      <div className="budget-header">
        <div className="budget-header-left">
          <div className="budget-icon">
            <Target size={20} />
          </div>
          <h2 className="budget-title">Monthly Budget</h2>
        </div>
        {!isEditing && (
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={16} />
              Monthly Salary
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.monthlySalary}
              onChange={(e) =>
                setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) })
              }
              placeholder="Enter your monthly salary"
              step="0.01"
              required
            />
          </div>

          <div className="budget-categories">
            <h3 className="budget-subtitle">Category Budgets</h3>
            {Object.entries(formData.categoryBudgets).map(([category, value]) => (
              <div key={category} className="form-group">
                <label className="form-label">{category}</label>
                <input
                  type="number"
                  className="form-input"
                  value={value}
                  onChange={(e) => handleCategoryBudgetChange(category, e.target.value)}
                  placeholder={`Budget for ₹{category}`}
                  step="0.01"
                    required
                />
              </div>
            ))}
          </div>

          <div className="budget-summary">
            <div className="summary-row">
              <span>Total Allocated:</span>
              <span className="summary-value">₹{totalBudgetAllocated.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Remaining:</span>
              <span className={`summary-value ₹{remainingBudget < 0 ? 'negative' : 'positive'}`}>
                ₹{remainingBudget.toFixed(2)}
              </span>
            </div>
          </div>

          {remainingBudget < 0 && (
            <div className="alert alert-warning">
              <AlertCircle size={16} />
              Warning: Your budget allocation exceeds your monthly salary!
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <TrendingUp size={16} />
              Save Budget
            </button>
          </div>
        </form>
      ) : (
        <div className="budget-display">
          <div className="budget-stat main-stat">
            <div className="stat-label">Monthly Salary</div>
            <div className="stat-value">₹{budget?.monthlySalary.toFixed(2)}</div>
          </div>

          <div className="budget-categories-display">
            {Object.entries(budget?.categoryBudgets || {}).map(([category, value]) => (
              <div key={category} className="category-budget-item">
                <span className="category-name">{category}</span>
                <span className="category-value">₹{value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};