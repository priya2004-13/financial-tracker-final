// client/src/components/CategoryChart.tsx - Bar Chart Visualizer
import { useMemo } from "react";
import { useFinancialRecords } from "../contexts/financial-record-context";
import './CategoryChart.css';

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', // Orange
  Rent: '#ef4444', // Red
  Utilities: '#3b82f6', // Blue
  Entertainment: '#ec4899', // Pink
  Salary: '#10b981', // Green (Income - usually excluded from expense charts)
  Other: '#a855f7', // Purple
  // Add more default colors if needed
};

export const CategoryChart = () => {
  const { records } = useFinancialRecords();

  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = records.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear &&
        record.category !== 'Salary'
      );
    });

    const expenseData = currentMonthExpenses.reduce((acc, record) => {
      const category = record.category;
      acc[category] = (acc[category] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpense = Object.values(expenseData).reduce((sum, val) => sum + val, 0);

    return Object.entries(expenseData)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: DEFAULT_CATEGORY_COLORS[name] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="bar-chart-container">
        <div className="chart-empty-state">
          <p>No expense data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bar-chart-container">
      <div className="bar-chart-list">
        {chartData.map((item, index) => (
          <div key={index} className="bar-chart-item">
            <div className="bar-item-header">
              <div className="bar-item-label">
                <span className="bar-item-icon" style={{ backgroundColor: item.color }}></span>
                <span className="bar-item-name">{item.name}</span>
              </div>
              <div className="bar-item-values">
                <span className="bar-item-amount">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="bar-item-percent">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="bar-item-progress">
              <div
                className="bar-item-fill"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
