import { useMemo } from "react";
import { useFinancialRecords } from "../contexts/financial-record-context";
import { TrendingDown, AlertTriangle } from "lucide-react";
import "./BudgetTracking.css";

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Rent: '#ef4444',
  Utilities: '#3b82f6',
  Entertainment: '#ec4899',
  Other: '#a855f7',
};

export const BudgetTracking = () => {
  const { records, budget } = useFinancialRecords();

  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.category !== 'Salary'
        );
      })
      .reduce((acc, record) => {
        if (!acc[record.category]) {
          acc[record.category] = 0;
        }
        acc[record.category] += record.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [records]);

  if (!budget) {
    return null;
  }

  const trackingData = Object.entries(budget.categoryBudgets).map(([category, budgetAmount]) => {
    const spent = currentMonthSpending[category] || 0;
    const remaining = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    return {
      category,
      budgetAmount,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      status,
      color: CATEGORY_COLORS[category] || '#a855f7',
    };
  });

  const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
  const totalSpent = Object.values(currentMonthSpending).reduce((sum, val) => sum + val, 0);
  const totalRemaining = totalBudget - totalSpent;
  const monthlySalary = budget.monthlySalary;
  const savingsAfterExpenses = monthlySalary - totalSpent;

  return (
    <div className="budget-tracking-container">
      <div className="tracking-header">
        <h2 className="tracking-title">Budget Tracking (This Month)</h2>
        <div className="tracking-overview">
          <div className="overview-stat">
            <span className="overview-label">Monthly Salary</span>
            <span className="overview-value income">${monthlySalary.toFixed(2)}</span>
          </div>
          <div className="overview-stat">
            <span className="overview-label">Total Spent</span>
            <span className="overview-value spent">${totalSpent.toFixed(2)}</span>
          </div>
          <div className="overview-stat">
            <span className="overview-label">Remaining</span>
            <span className={`overview-value ${savingsAfterExpenses < 0 ? 'negative' : 'positive'}`}>
              ${Math.abs(savingsAfterExpenses).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="tracking-items">
        {trackingData.map((item) => (
          <div key={item.category} className={`tracking-item ${item.status}`}>
            <div className="tracking-item-header">
              <div className="tracking-category">
                <span className="category-dot" style={{ backgroundColor: item.color }} />
                <span className="category-name">{item.category}</span>
              </div>
              {item.status === 'exceeded' && (
                <div className="status-badge exceeded">
                  <AlertTriangle size={12} />
                  Over Budget
                </div>
              )}
              {item.status === 'warning' && (
                <div className="status-badge warning">
                  <TrendingDown size={12} />
                  80%+ Used
                </div>
              )}
            </div>

            <div className="tracking-amounts">
              <div className="amount-row">
                <span className="amount-label">Spent:</span>
                <span className="amount-value">${item.spent.toFixed(2)}</span>
              </div>
              <div className="amount-row">
                <span className="amount-label">Budget:</span>
                <span className="amount-value">${item.budgetAmount.toFixed(2)}</span>
              </div>
              <div className="amount-row">
                <span className="amount-label">Remaining:</span>
                <span className={`amount-value ${item.remaining < 0 ? 'negative' : ''}`}>
                  ${Math.abs(item.remaining).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="tracking-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="progress-percentage">{item.percentage.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};