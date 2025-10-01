import { useMemo } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";

const CATEGORY_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Food: '#f97316',
  Rent: '#ef4444',
  Utilities: '#3b82f6',
  Entertainment: '#ec4899',
  Other: '#a855f7',
};

export const CategoryChart = () => {
  const { records } = useFinancialRecords();

  const categoryData = useMemo(() => {
    const data = records.reduce((acc, record) => {
      if (record.category !== 'Salary') {
        const category = record.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += record.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(data).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total * 100).toFixed(1) : 0,
      color: CATEGORY_COLORS[category] || '#a855f7',
    }));
  }, [records]);

  return (
    <div className="chart-container">
      <h2 className="chart-title">Spending by Category</h2>
      <div className="chart-items">
        {categoryData.length > 0 ? (
          categoryData.map((item) => (
            <div key={item.category} className="chart-item">
              <div className="chart-item-header">
                <span className="chart-item-category">{item.category}</span>
                <span className="chart-item-value">
                  ₹{item.amount.toFixed(2)} ({item.percentage}%)
                </span>
              </div>
              <div className="chart-progress-bar">
                <div
                  className="chart-progress-fill"
                  style={{
                    width: `₹{item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No expense data to display
          </p>
        )}
      </div>
    </div>
  );
};