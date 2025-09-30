import { useUser } from "@clerk/clerk-react";
import { FinancialRecordForm } from "./financial-record-form";
import { FinancialRecordList } from "./financial-record-list";
import { FinancialRecordChart } from "./financial-record-chart";
import "./financial-record.css";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { useMemo } from "react";
import { CategoryChart } from "./CategoryChart";

export const Dashboard = () => {
  const { user } = useUser();
  const { records,addRecord } = useFinancialRecords();

  const totalIncome = useMemo(() => {
    return records
      .filter((record) => record.category === "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const totalExpenses = useMemo(() => {
    return records
      .filter((record) => record.category !== "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  return (
    <div className="dashboard-container">
      <h1> Welcome {user?.firstName}! Here Are Your Finances:</h1>
      <div className="dashboard-content">
        <div className="dashboard-left">
          <FinancialRecordForm   />
          <div className="summary">
            <div className="summary-card">
              <h2>Total Income</h2>
              <p>${totalIncome}</p>
            </div>
            <div className="summary-card">
              <h2>Total Expenses</h2>
              <p>${totalExpenses}</p>
            </div>
            <div className="summary-card">
              <h2>Balance</h2>
              <p>${balance}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-right">
          <FinancialRecordChart />
          <FinancialRecordList />
          <CategoryChart />
        </div>
      </div>
    </div>
  );
};