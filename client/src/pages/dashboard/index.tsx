// client/src/pages/dashboard/index.tsx - Updated to include new components
import { useUser } from "@clerk/clerk-react";
import { FinancialRecordForm } from "./financial-record-form";
import { FinancialRecordList } from "./financial-record-list";
// Removed FinancialRecordChart import, replaced by CategoryChart (Pie) and updated Bar Chart
import { BudgetManager } from "../../components/BudgetManager";
import { BudgetTracking } from "../../components/BudgetTracking";
import { FinancialSummary } from "../../components/FinancialSummary";
import { Subscriptions } from "../../components/Subscriptions";
import SavingsGoals from "../../components/SavingsGoals";
import { CategoryManager } from "../../components/CategoryManager"; // Import CategoryManager
import { FinancialHealth } from "../../components/FinancialHealth"; // Import FinancialHealth
import { TransactionTemplates } from "../../components/TransactionTemplates"; // Import TransactionTemplates
import { BudgetTemplates } from "../../components/BudgetTemplates"; // Import BudgetTemplates
import { CategoryChart } from "./CategoryChart"; // Import new Pie Chart
import { FinancialRecordChart as SpendingBarChart } from "./financial-record-chart"; // Rename Bar Chart import


import "./dashboard.css";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { useMemo } from "react";
import { StatCard } from "../../components/StatCard";
import { DollarSign, TrendingDown, Wallet, Target } from "lucide-react";
import { BillReminders } from "../../components/BillReminders";
import { SpendingInsights } from "../../components/SpendingInsights";

export const Dashboard = () => {
  const { user } = useUser();
  const { records, budget, isLoading } = useFinancialRecords();

  // Calculations remain the same...
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

    const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

    const budgetAdherence = useMemo(() => {
        if (!budget || !budget.categoryBudgets) return 0;
        const totalBudgeted = Object.values(budget.categoryBudgets).reduce((sum, val) => sum + (val || 0), 0);
        if (totalBudgeted === 0) return currentMonthExpenses === 0 ? 100 : 0; // If no budget and no expenses, 100%. If expenses, 0%.
        // Calculate remaining percentage
        const remainingPercentage = Math.max(0, ( (totalBudgeted - currentMonthExpenses) / totalBudgeted ) * 100);
        return Math.min(100, remainingPercentage); // Cap at 100%
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
        {budget && ( // Only show budget adherence if budget exists
            <StatCard
                title="Budget Remaining"
                value={budgetAdherence} // Show remaining percentage
                icon={Target}
                color="#8b5cf6"
                trend={`${budgetAdherence.toFixed(0)}%`} // Display percentage
                prefix="" // No currency prefix for percentage
            />
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <FinancialRecordForm />
          <TransactionTemplates /> Add Templates
          <BudgetManager />
          <BudgetTemplates /> Add Budget Templates

          <CategoryManager /> 
          <BillReminders />
          <SavingsGoals />
          <Subscriptions /> 
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          <FinancialSummary />
          <FinancialHealth /> 
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
