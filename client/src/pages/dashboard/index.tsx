// client/src/pages/dashboard/index.tsx - Updated with Scroll Detection
import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useMemo, useState } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import {
  IndianRupee,
  TrendingDown,
  Wallet,
  Target,
  ArrowUp,
  ArrowRight,
  Receipt,
  PiggyBank,
  BarChart3,
  Plus,
  TrendingUp,
  Calendar,
  Download,
  Settings,
  Eye,
  EyeOff,
  Newspaper,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// Import the scroll detection hook
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { useScreenSize } from "../../hooks/useScreenSize";
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
import { DashboardCard } from "../../components/DashboardCard";
import { SpendingInsights } from "../../components/SpendingInsights";
import { StatCard } from "../../components/StatCard";
import "./dashboard.css";
import "./modern-dashboard.css";
import { CategoryChart } from "../../components/CategoryChart";
import { PageLoader } from "../../components/PageLoader";
import AIInsights from "../../components/AIInsights";
import AIAdvisor from "../../components/AIAdvisor";
import ReportDownloads from "../../components/ReportDownloads";
import { Link } from "react-router-dom";
export const Dashboard = () => {
  const { user } = useUser();
  const { records, budget, isLoading } = useFinancialRecords();
  const [showHeader, setShowHeader] = React.useState(true);
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  // Widget customization state
  const [visibleWidgets, setVisibleWidgets] = useState({
    financialOverview: true,
    financialHealth: true,
    recentTransactions: true,
    budgetTracking: true,
    spendingInsights: true,
    categoryAnalysis: true,
    quickActions: true,
    financialNews: true,
    aiInsights: true,
    aiAdvisor: true,
    reportDownloads: true
  });

  // Active feature tab state
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Financial news state
  const [newsArticles, setNewsArticles] = useState<Array<{
    id: string;
    title: string;
    description: string;
    source: string;
    url: string;
    publishedAt: string;
  }>>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  useEffect(() => {
    setTimeout(() => setShowHeader(false), 2000);
  }, []);

  // Load financial news from Marketaux API
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (forceRefresh: boolean = false) => {
    setNewsLoading(true);
    try {
      // Dynamic import to avoid bundling issues
      const { fetchTrendingFinanceNews } = await import('../../../services/marketaux-service');
      const articles = await fetchTrendingFinanceNews(5, !forceRefresh); // useCache = !forceRefresh

      // Transform Marketaux articles to our format
      const transformedArticles = articles.map(article => ({
        id: article.uuid,
        title: article.title,
        description: article.description || article.snippet,
        source: article.source,
        url: article.url,
        publishedAt: article.published_at
      }));

      setNewsArticles(transformedArticles);
    } catch (error) {
      console.error('Error loading financial news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const refreshNews = () => {
    console.log('🔄 Manually refreshing news (bypassing cache)...');
    loadNews(true); // Force refresh, bypass cache
  };

  const toggleWidget = (widget: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }));
  };

  const nextNews = () => {
    setCurrentNewsIndex((prev) => (prev + 1) % newsArticles.length);
  };

  const prevNews = () => {
    setCurrentNewsIndex((prev) => (prev - 1 + newsArticles.length) % newsArticles.length);
  };

  // Scroll detection for sidebar and main content
  const sidebar = useScrollDetection();
  const mainContent = useScrollDetection();
  // Calculate stats (existing code)
  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const additionalIncome = (records || [])
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
    return (records || [])
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
    return (records || [])
      .filter((record) => record.category === "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const totalExpenses = useMemo(() => {
    return (records || [])
      .filter((record) => record.category !== "Salary")
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  // Calculate last month expenses for comparison
  const lastMonthExpenses = useMemo(() => {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return (records || [])
      .filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === lastMonth &&
          recordDate.getFullYear() === lastYear &&
          record.category !== "Salary"
        );
      })
      .reduce((total, record) => total + record.amount, 0);
  }, [records]);

  // Calculate month-over-month change
  const expenseChange = useMemo(() => {
    if (lastMonthExpenses === 0) return 0;
    return ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
  }, [currentMonthExpenses, lastMonthExpenses]);

  // Calculate average daily expenses
  const averageDailyExpense = useMemo(() => {
    const dayOfMonth = new Date().getDate();
    return dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0;
  }, [currentMonthExpenses]);

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
    <div className={`dashboard-container ${isMobile ? 'mobile-dashboard' : ''}`}>
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="mobile-dashboard-content">
          {/* Mobile Header */}
          <div className="mobile-dashboard-header">
            <h1 className="mobile-welcome">Hi, {user?.firstName}! 👋</h1>
            <p className="mobile-subtitle">Your Financial Overview</p>
          </div>

          {/* Mobile Stats - Scrollable Horizontal */}
          <div className="mobile-stats-scroll">
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon" style={{ backgroundColor: '#6366f1' }}>
                <Wallet size={20} />
              </div>
              <div className="mobile-stat-info">
                <span className="mobile-stat-label">Balance</span>
                <span className="mobile-stat-value">₹{balance.toFixed(2)}</span>
              </div>
            </div>
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon" style={{ backgroundColor: '#10b981' }}>
                <TrendingUp size={20} />
              </div>
              <div className="mobile-stat-info">
                <span className="mobile-stat-label">Income</span>
                <span className="mobile-stat-value">₹{currentMonthIncome.toFixed(2)}</span>
              </div>
            </div>
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon" style={{ backgroundColor: '#ef4444' }}>
                <TrendingDown size={20} />
              </div>
              <div className="mobile-stat-info">
                <span className="mobile-stat-label">Expenses</span>
                <span className="mobile-stat-value">₹{currentMonthExpenses.toFixed(2)}</span>
              </div>
            </div>
            {budget && (
              <div className="mobile-stat-card">
                <div className="mobile-stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
                  <Target size={20} />
                </div>
                <div className="mobile-stat-info">
                  <span className="mobile-stat-label">Budget Left</span>
                  <span className="mobile-stat-value">{budgetAdherence.toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Quick Actions */}
          <div className="mobile-quick-actions">
            <Link to="/transactions" className="mobile-action-btn">
              <Plus size={18} />
              <span>Add Transaction</span>
            </Link>
            <Link to="/budget" className="mobile-action-btn">
              <PiggyBank size={18} />
              <span>Set Budget</span>
            </Link>
          </div>

          {/* Mobile Content Cards */}
          <div className="mobile-dashboard-cards">
            <div className="mobile-dashboard-card">
              <div className="mobile-card-header">
                <h3>Recent Transactions</h3>
                <Link to="/transactions" className="mobile-view-all">View All</Link>
              </div>
              <FinancialRecordList />
            </div>

            {budget && (
              <div className="mobile-dashboard-card">
                <div className="mobile-card-header">
                  <h3>Budget Tracking</h3>
                  <Link to="/budget" className="mobile-view-all">Manage</Link>
                </div>
                <BudgetTracking />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Modern Header with User Info */}
          <div className="modern-dashboard-header">
            <div className="header-user-section">
              <div className="user-greeting">
                <span className="greeting-text">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</span>
                <h1 className="user-name">{user?.firstName || 'User'}</h1>
              </div>
              <div className="header-actions">
                <button className="icon-btn" title="Settings">
                  <Settings size={20} />
                </button>
                <button className="icon-btn" title="Notifications">
                  <Calendar size={20} />
                </button>
              </div>
            </div>
            <div className="header-meta">
              <span className="last-update">Last update {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <button className="btn-share">
                <Download size={16} />
                Share
              </button>
            </div>
          </div>

          {/* Modern Two-Column Layout */}
          <div className="modern-dashboard-grid">
            {/* Left Column - Income & Budget */}
            <div className="modern-left-column">
              {/* Income Management Card */}
              <div className="modern-card income-card">
                <div className="card-header-modern">
                  <div className="card-header-left">
                    <h2 className="card-title-modern">Income Management</h2>
                    <p className="card-subtitle-modern">Monthly income recap</p>
                  </div>
                  <div className="card-header-actions">
                    <button className="icon-btn-small">
                      <Plus size={16} />
                      Add
                    </button>
                    <button className="icon-btn-small">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                <div className="income-value-section">
                  <div className="primary-amount">
                    <span className="currency-symbol">₹</span>
                    <span className="amount-large">{currentMonthIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="amount-change positive">
                    <ArrowUp size={14} />
                    <span>+₹{(currentMonthIncome - (budget?.monthlySalary || 0)).toFixed(2)}</span>
                    <span className="change-label">Last 24 hours</span>
                  </div>
                </div>

                <div className="income-breakdown">
                  <h4 className="breakdown-title">Income breakdown</h4>
                  <div className="breakdown-items">
                    <div className="breakdown-item">
                      <div className="breakdown-label">
                        <span className="label-text">Part-Time</span>
                      </div>
                      <span className="breakdown-value">₹{(budget?.monthlySalary || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-label">
                        <span className="label-text">Payslip</span>
                      </div>
                      <span className="breakdown-value">₹{(currentMonthIncome - (budget?.monthlySalary || 0)).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-label">
                        <span className="label-text">Gig</span>
                      </div>
                      <span className="breakdown-value positive-text">+₹{Math.abs(currentMonthIncome * 0.05).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="income-progress-bars">
                    <div className="progress-bar-stacked">
                      <div className="progress-segment" style={{ width: '48%', backgroundColor: '#4F46E5' }}></div>
                      <div className="progress-segment" style={{ width: '37%', backgroundColor: '#93C5FD' }}></div>
                      <div className="progress-segment" style={{ width: '15%', backgroundColor: '#EC4899' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="modern-card transactions-card">
                <div className="card-header-modern">
                  <h3 className="card-title-modern">Recent Transactions</h3>
                  <button className="link-btn" onClick={() => window.location.href = '/transactions'}>
                    <Plus size={16} />
                    Add new
                  </button>
                </div>
                <FinancialRecordList />
              </div>

              {/* Modern Feature Tabs Section - Moved below Recent Transactions */}
              <div className="modern-features-section">
                <div className="features-header">
                  <h2 className="features-title">Additional Features & Tools</h2>
                  <p className="features-subtitle">Click on any feature to explore</p>
                </div>

                <div className="features-tabs-grid">
                  {/* AI Insights Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'aiInsights' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'aiInsights' ? null : 'aiInsights')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <BarChart3 size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">AI Insights</h3>
                      <p className="feature-tab-description">AI-powered financial analysis</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'aiInsights' ? 'rotate' : ''}`} size={20} />
                  </button>

                  {/* AI Financial Advisor Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'aiAdvisor' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'aiAdvisor' ? null : 'aiAdvisor')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <Target size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">AI Financial Advisor</h3>
                      <p className="feature-tab-description">Get AI financial advice</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'aiAdvisor' ? 'rotate' : ''}`} size={20} />
                  </button>

                  {/* Budget Manager Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'budgetManager' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'budgetManager' ? null : 'budgetManager')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                      <PiggyBank size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">Budget Manager</h3>
                      <p className="feature-tab-description">Monthly budget tracking</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'budgetManager' ? 'rotate' : ''}`} size={20} />
                  </button>

                  {/* Savings Goals Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'savingsGoals' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'savingsGoals' ? null : 'savingsGoals')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                      <Target size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">Savings Goals</h3>
                      <p className="feature-tab-description">Set and track your goals</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'savingsGoals' ? 'rotate' : ''}`} size={20} />
                  </button>

                  {/* Subscriptions Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'subscriptions' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'subscriptions' ? null : 'subscriptions')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                      <RefreshCw size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">Subscriptions</h3>
                      <p className="feature-tab-description">Bills & recurring payments</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'subscriptions' ? 'rotate' : ''}`} size={20} />
                  </button>

                  {/* Reports Tab */}
                  <button
                    className={`feature-tab ${activeFeature === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveFeature(activeFeature === 'reports' ? null : 'reports')}
                  >
                    <div className="feature-tab-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                      <Download size={24} />
                    </div>
                    <div className="feature-tab-content">
                      <h3 className="feature-tab-title">Download Reports</h3>
                      <p className="feature-tab-description">Generate PDF reports</p>
                    </div>
                    <ChevronRight className={`feature-tab-arrow ${activeFeature === 'reports' ? 'rotate' : ''}`} size={20} />
                  </button>
                </div>

                {/* Feature Content Display */}
                {activeFeature && (
                  <div className="feature-content-display">
                    {activeFeature === 'aiInsights' && (
                      <div className="feature-content-wrapper">
                        <AIInsights />
                      </div>
                    )}
                    {activeFeature === 'aiAdvisor' && (
                      <div className="feature-content-wrapper">
                        <AIAdvisor />
                      </div>
                    )}
                    {activeFeature === 'budgetManager' && (
                      <div className="feature-content-wrapper">
                        <BudgetManager />
                      </div>
                    )}
                    {activeFeature === 'savingsGoals' && (
                      <div className="feature-content-wrapper">
                        <SavingsGoals />
                      </div>
                    )}
                    {activeFeature === 'subscriptions' && (
                      <div className="feature-content-wrapper">
                        <Subscriptions />
                      </div>
                    )}
                    {activeFeature === 'reports' && (
                      <div className="feature-content-wrapper">
                        <ReportDownloads />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Budget & Expenses */}
            <div className="modern-right-column">
              {/* Budget Control Card */}
              <div className="modern-card budget-card">
                <div className="card-header-modern">
                  <h2 className="card-title-modern">Budget Control</h2>
                  <button className="icon-btn-small">
                    <Settings size={16} />
                  </button>
                </div>

                <div className="budget-limit-section">
                  <p className="budget-label">Monthly Transaction Limit</p>
                  <div className="budget-amount">
                    <span className="currency-symbol-small">₹</span>
                    <span className="budget-value">{currentMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    <span className="budget-total">of ₹{(budget?.categoryBudgets ? Object.values(budget.categoryBudgets).reduce((sum, val) => sum + (val || 0), 0) : 2300).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="budget-progress-visual">
                  <div className="progress-bar-colorful">
                    <div className="progress-fill" style={{
                      width: `${Math.min((currentMonthExpenses / (budget?.categoryBudgets ? Object.values(budget.categoryBudgets).reduce((sum, val) => sum + (val || 0), 0) : 2300)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 25%, #D946EF 50%, #EC4899 75%, #EF4444 100%)'
                    }}></div>
                  </div>
                  {currentMonthExpenses > (budget?.categoryBudgets ? Object.values(budget.categoryBudgets).reduce((sum, val) => sum + (val || 0), 0) * 0.9 : 2070) && (
                    <div className="budget-alert">
                      <span className="alert-icon">⚠️</span>
                      <span className="alert-text">Your spending is almost at its peak</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Recap with Chart */}
              <div className="modern-card expense-recap-card">
                <div className="card-header-modern">
                  <h3 className="card-title-modern">Expense Recap</h3>
                  <select className="period-selector">
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                {/* Chart and Stats Side by Side */}
                <div className="expense-recap-content">
                  <div className="chart-wrapper">
                    <CategoryChart />
                  </div>

                  <div className="expense-stats-panel">
                    <div className="stat-highlight">
                      <div className={`stat-change-badge ${expenseChange >= 0 ? 'positive' : 'negative'}`}>
                        {expenseChange >= 0 ? <ArrowUp size={16} /> : <TrendingDown size={16} />}
                        <span className="change-value">{Math.abs(expenseChange).toFixed(1)}%</span>
                      </div>
                      <p className="stat-description">
                        {expenseChange >= 0 ? 'Higher' : 'Lower'} than last month
                      </p>
                    </div>

                    <div className="expense-metrics">
                      <div className="metric-item">
                        <span className="metric-label">This Month</span>
                        <span className="metric-value">₹{currentMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Last Month</span>
                        <span className="metric-value secondary">₹{lastMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Average Daily</span>
                        <span className="metric-value secondary">₹{averageDailyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    <button className="btn-view-details" onClick={() => window.location.href = '/analytics'}>
                      View Detailed Analytics
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Breakdown Section */}
              <div className="modern-card breakdown-card">
                <h3 className="card-title-modern">Breakdown</h3>
                <div className="breakdown-list">
                  <div className="breakdown-list-item">
                    <div className="breakdown-icon subscriptions">
                      <span>🎬</span>
                    </div>
                    <div className="breakdown-info">
                      <h4>Subscriptions</h4>
                      <p className="breakdown-detail">Netflix and 5 more</p>
                    </div>
                    <span className="breakdown-amount">₹430.20</span>
                  </div>
                  <div className="breakdown-list-item">
                    <div className="breakdown-icon fixed-expenses">
                      <span>🏪</span>
                    </div>
                    <div className="breakdown-info">
                      <h4>Fixed Expenses</h4>
                      <p className="breakdown-detail">Shell and 4 more</p>
                    </div>
                    <span className="breakdown-amount">₹712.41</span>
                  </div>
                  <div className="breakdown-list-item">
                    <div className="breakdown-icon transfers">
                      <span>🏦</span>
                    </div>
                    <div className="breakdown-info">
                      <h4>Transfers</h4>
                      <p className="breakdown-detail">Citibank Cris and 5 more</p>
                    </div>
                    <span className="breakdown-amount">₹720.34</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial News Panel */}
          {visibleWidgets.financialNews && newsArticles.length > 0 && (
            <div className="modern-card financial-news-panel">
              <div className="news-header">
                <div className="news-title">
                  <Newspaper size={18} />
                  <h3>Financial News & Tips</h3>
                </div>
                <div className="news-controls">
                  <button
                    className="news-nav-btn"
                    onClick={prevNews}
                    disabled={newsArticles.length <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="news-indicator">
                    {currentNewsIndex + 1} / {newsArticles.length}
                  </span>
                  <button
                    className="news-nav-btn"
                    onClick={nextNews}
                    disabled={newsArticles.length <= 1}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="news-nav-btn"
                    onClick={refreshNews}
                    disabled={newsLoading}
                    title="Refresh news (bypass cache)"
                  >
                    <RefreshCw size={16} className={newsLoading ? 'spin' : ''} />
                  </button>
                </div>
              </div>

              {newsLoading ? (
                <div className="news-loading">
                  <RefreshCw size={20} className="spin" />
                  <span>Loading news...</span>
                </div>
              ) : (
                <div className="news-content">
                  <div className="news-article">
                    <h4>{newsArticles[currentNewsIndex].title}</h4>
                    <p>{newsArticles[currentNewsIndex].description}</p>
                    <div className="news-meta">
                      <span className="news-source">{newsArticles[currentNewsIndex].source}</span>
                      <span className="news-date">
                        {new Date(newsArticles[currentNewsIndex].publishedAt).toLocaleDateString()}
                      </span>
                      <a
                        href={newsArticles[currentNewsIndex].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link"
                      >
                        Read More <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};