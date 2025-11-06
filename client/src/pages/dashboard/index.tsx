// client/src/pages/dashboard/index.tsx - Updated with Scroll Detection
import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useMemo } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { DollarSign, TrendingDown, Wallet, Target, ArrowUp } from "lucide-react";

// Import the scroll detection hook
import { useScrollDetection } from "../../hooks/useScrollDetection";

// Import components
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

import { FinancialRecordChart as SpendingBarChart } from "./financial-record-chart";
import { SpendingInsights } from "../../components/SpendingInsights";
import { SharedExpenses } from "../../components/SharedExpenses";
import { StatCard } from "../../components/StatCard";

import "./dashboard.css";
import TrendAnalysisChart from "../../components/TrendAnalysisChart";
import SpendingHeatmap from "../../components/SpendingHeatmap";
import { CategoryChart } from "../../components/CategoryChart";
import { RingLoader } from "react-spinners";
import { PageLoader } from "../../components/PageLoader";
export const Dashboard = () => {
  const { user } = useUser();
  const { records, budget, isLoading } = useFinancialRecords();
  const [showHeader, setShowHeader] = React.useState(true);
  useEffect(() => {
    setTimeout(() => setShowHeader(false), 1000);

  }, []);
  // Scroll detection for sidebar and main content
  const sidebar = useScrollDetection();
  const mainContent = useScrollDetection();

  // Calculate stats (existing code)
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
    if (totalBudgeted === 0) return currentMonthExpenses === 0 ? 100 : 0;
    const remainingPercentage = Math.max(0, ((totalBudgeted - currentMonthExpenses) / totalBudgeted) * 100);
    return Math.min(100, remainingPercentage);
  }, [budget, currentMonthExpenses]);

  if (isLoading) {
    return (
      <PageLoader message="Loading your financial data..." variant='minimal' />

    );
  }

  return (
    <div className="dashboard-container desktop-view">
      {/* Header - Fixed */}
      {showHeader && <div className="dashboard-header">
        <h1 className="dashboard-welcome">Welcome back, {user?.firstName}! 👋</h1>
        <p className="dashboard-subtitle">Here's your financial overview</p>
      </div>}

      {/* Stats Grid - Fixed */}
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

      {/* Main Dashboard Grid - Scrollable sections */}
      <div className="dashboard-grid">
        {/* Sidebar - Independently Scrollable */}
        <div
          ref={sidebar.scrollRef}
          className={`dashboard-sidebar ${sidebar.isScrollable ? 'has-scroll' : ''} ${sidebar.isAtBottom ? 'scroll-bottom' : ''}`}
        >
          <FinancialRecordForm />
          <TransactionTemplates />
          <BudgetManager />
          <BudgetTemplates />
          <CategoryManager />
          <SavingsGoals />
          <Subscriptions />

          {/* Scroll to top button for sidebar */}
          {sidebar.isScrollable && !sidebar.isAtTop && (
            <button
              className="scroll-to-top visible"
              onClick={sidebar.scrollToTop}
              title="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>

        {/* Main Content - Independently Scrollable */}
        <div
          ref={mainContent.scrollRef}
          className={`dashboard-main ${mainContent.isScrollable ? 'has-scroll' : ''} ${mainContent.isAtBottom ? 'scroll-bottom' : ''}`}
        >
          <FinancialSummary />
          <FinancialHealth />
          <SharedExpenses />
          <SpendingInsights />
          {budget && <BudgetTracking />}
          <CategoryChart />
          <SpendingBarChart />
          <FinancialRecordList />
          <SpendingHeatmap />
          <TrendAnalysisChart />

          {/* Scroll to top button for main content */}
          {mainContent.isScrollable && !mainContent.isAtTop && (
            <button
              className="scroll-to-top visible"
              onClick={mainContent.scrollToTop}
              title="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};