// client/src/pages/dashboard/index.tsx - 
import { useUser } from "@clerk/clerk-react";
import { FinancialRecordForm } from "./financial-record-form";
import { FinancialRecordList } from "./financial-record-list";
import { BudgetManager } from "../../components/BudgetManager";
import { BudgetTracking } from "../../components/BudgetTracking";
import { FinancialSummary } from "../../components/FinancialSummary";
import { Subscriptions } from "../../components/Subscriptions";
import SavingsGoals from "../../components/SavingsGoals";
import { CategoryManager } from "../../components/CategoryManager";
import { FinancialHealth } from "../../components/FinancialHealth";
import { TransactionTemplates } from "../../components/TransactionTemplates";
import { BudgetTemplates } from "../../components/BudgetTemplates";
import { CategoryChart } from "./CategoryChart";
import { FinancialRecordChart as SpendingBarChart } from "./financial-record-chart";
import { SpendingInsights } from "../../components/SpendingInsights";
import { SharedExpenses } from "../../components/SharedExpenses"; 

import "./dashboard.css";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { useMemo } from "react";
import { StatCard } from "../../components/StatCard";
import { DollarSign, TrendingDown, Wallet, Target } from "lucide-react";

export const Dashboard = () => {
  const { user } = useUser();
  const { records, budget, isLoading } = useFinancialRecords();

  // Calculate current month income
  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
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
    return (budget?.monthlySalary || 0) + additionalIncome;
  }, [records, budget]);

  // Calculate current month expenses
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

  // Calculate total income
  const totalIncome = useMemo(() => {
    return records
      .filter((record) => record.category === "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return records
      .filter((record) => record.category !== "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  // Calculate balance
  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  // Calculate budget adherence
  const budgetAdherence = useMemo(() => {
    if (!budget || !budget.categoryBudgets) return 0;
    const totalBudgeted = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + (val || 0), 0);
    if (totalBudgeted === 0) return currentMonthExpenses === 0 ? 100 : 0;
    const remainingPercentage = Math.max(0, ((totalBudgeted - currentMonthExpenses) / totalBudgeted) * 100);
    return Math.min(100, remainingPercentage);
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
            title="Budget Remaining"
            value={budgetAdherence}
            icon={Target}
            color="#8b5cf6"
            trend={`${budgetAdherence.toFixed(0)}%`}
            prefix=""
          />
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <FinancialRecordForm />
          <TransactionTemplates />
          <BudgetManager />
          <BudgetTemplates />
          <CategoryManager />
          <SavingsGoals />
          <Subscriptions />
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          <FinancialSummary />
          <FinancialHealth />

        
          <SharedExpenses />

          <SpendingInsights />
          {budget && <BudgetTracking />}
          <CategoryChart />
          <SpendingBarChart />
          <FinancialRecordList />
        </div>
      </div>
    </div>
  );
};