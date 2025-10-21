import { useUser } from "@clerk/clerk-react";
import { FinancialRecordForm } from "./financial-record-form";
import { FinancialRecordList } from "./financial-record-list";
import { FinancialRecordChart } from "./financial-record-chart";
import { BudgetManager } from "../../components/BudgetManager";
import { BudgetTracking } from "../../components/BudgetTracking";
import "./dashboard.css";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { useMemo } from "react";
import { StatCard } from "../../components/StatCard";
import { DollarSign, TrendingDown, Wallet, Target } from "lucide-react";
import SavingsGoals from "../../components/SavingsGoals";

export const Dashboard = () => {
  const { user } = useUser();
  const { records, budget, isLoading } = useFinancialRecords();

  // Calculate current month's income (from budget salary + any additional income)
  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get additional income from records (bonuses, etc.)
    const additionalIncome = records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.category === "Salary"
        );
      })
      .reduce((total, record) => total + record.amount, 0);

    // Return monthly salary from budget + any additional income
    return (budget?.monthlySalary || 0) + additionalIncome;
  }, [records, budget]);

  // Calculate current month's expenses
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.category !== "Salary"
        );
      })
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  // Calculate total income (all time)
  const totalIncome = useMemo(() => {
    return records
      .filter((record) => record.category === "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  // Calculate total expenses (all time)
  const totalExpenses = useMemo(() => {
    return records
      .filter((record) => record.category !== "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const currentMonthBalance = useMemo(() => {
    return currentMonthIncome - currentMonthExpenses;
  }, [currentMonthIncome, currentMonthExpenses]);

  // Calculate budget adherence percentage
  const budgetAdherence = useMemo(() => {
    if (!budget) return 0;
    const totalBudget = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + val, 0);
    if (totalBudget === 0) return 0;
    return Math.min(100, ((totalBudget - currentMonthExpenses) / totalBudget) * 100);
  }, [budget, currentMonthExpenses]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-welcome">Welcome back, {user?.firstName}! 👋</h1>
        <p className="dashboard-subtitle">Here's your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Balance"
          value={balance}
          icon={Wallet}
          color="#6366f1"
          trend="All time"
        />
        <StatCard
          title="This Month Income"
          value={currentMonthIncome}
          icon={DollarSign}
          color="#10b981"
          trend="Current month"
        />
        <StatCard
          title="This Month Expenses"
          value={currentMonthExpenses}
          icon={TrendingDown}
          color="#ef4444"
          trend="Current month"
        />
        {budget && (
          <StatCard
            title="Budget Adherence"
            value={budgetAdherence}
            icon={Target}
            color="#8b5cf6"
            trend={`₹${budgetAdherence.toFixed(0)}% remaining`}
            prefix=""
          />
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <FinancialRecordForm />
          <BudgetManager />
          <SavingsGoals />
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {budget && <BudgetTracking />}
          <FinancialRecordChart />
          <FinancialRecordList />
        </div>
      </div>
    </div>
  );
};