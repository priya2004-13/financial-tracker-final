import { Info } from "lucide-react";
import { useFinancialRecords } from "../contexts/financial-record-context";
import { useMemo } from "react";
import "./IncomeInfo.css";

export const IncomeInfo = () => {
  const { records, budget } = useFinancialRecords();

  const additionalIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.category === "Salary"
        );
      })
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const monthlySalary = budget?.monthlySalary || 0;
  const totalIncome = monthlySalary + additionalIncome;

  return (
    <div className="income-info-card">
      <div className="income-info-header">
        <Info size={18} />
        <h3>Monthly Income Breakdown</h3>
      </div>
      <div className="income-breakdown">
        <div className="breakdown-row">
          <span className="breakdown-label">Base Salary (from budget):</span>
          <span className="breakdown-value">${monthlySalary.toFixed(2)}</span>
        </div>
        {additionalIncome > 0 && (
          <div className="breakdown-row">
            <span className="breakdown-label">Additional Income:</span>
            <span className="breakdown-value additional">+${additionalIncome.toFixed(2)}</span>
          </div>
        )}
        <div className="breakdown-row total">
          <span className="breakdown-label">Total This Month:</span>
          <span className="breakdown-value">${totalIncome.toFixed(2)}</span>
        </div>
      </div>
      <p className="income-note">
        💡 Your monthly salary is set in the budget. Add "Salary" category records for bonuses or additional income.
      </p>
    </div>
  );
};