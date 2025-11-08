// client/src/pages/dashboard/index.tsx - Updated with Scroll Detection
import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useMemo, useState } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  Target,
  ArrowUp,
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
          {/* Header - Fixed */}
          <div className={`dashboard-header ${showHeader ? 'dashboard-header-visible' : 'dashboard-header-hidden'}`}>
            <h1 className="dashboard-welcome">Welcome back, {user?.firstName}! 👋</h1>
            <p className="dashboard-subtitle">Here's your financial overview</p>
          </div>

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

          {/* Quick Actions Panel */}
          {visibleWidgets.quickActions && (
            <div className="quick-actions-panel">
              <div className="quick-actions-header">
                <h3><Plus size={18} /> Quick Actions</h3>
                <button
                  className="widget-toggle-btn"
                  onClick={() => toggleWidget('quickActions')}
                  title="Hide Quick Actions"
                >
                  <EyeOff size={16} />
                </button>
              </div>
              <div className="quick-actions-grid">
                <Link to="/transactions" className="quick-action-card">
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Plus size={20} />
                  </div>
                  <span>Add Transaction</span>
                </Link>

                <Link to="/budget" className="quick-action-card">
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <PiggyBank size={20} />
                  </div>
                  <span>Set Budget</span>
                </Link>

                <Link to="/goals" className="quick-action-card">
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <Target size={20} />
                  </div>
                  <span>Create Goal</span>
                </Link>

                <Link to="/analytics" className="quick-action-card">
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <TrendingUp size={20} />
                  </div>
                  <span>View Analytics</span>
                </Link>

                <Link to="/transactions" className="quick-action-card">
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                    <Calendar size={20} />
                  </div>
                  <span>Calendar View</span>
                </Link>

                <button className="quick-action-card" onClick={() => window.print()}>
                  <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                    <Download size={20} />
                  </div>
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Financial News Panel */}
          {visibleWidgets.financialNews && newsArticles.length > 0 && (
            <div className="financial-news-panel">
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
                  <button
                    className="widget-toggle-btn"
                    onClick={() => toggleWidget('financialNews')}
                    title="Hide News"
                  >
                    <EyeOff size={16} />
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

          {/* Widget Customization Bar */}
          <div className="widget-customization-bar">
            <div className="customization-label">
              <Settings size={16} />
              <span>Customize Dashboard</span>
            </div>
            <div className="widget-toggles">
              <button
                className={`widget-toggle ${!visibleWidgets.quickActions ? 'hidden' : ''}`}
                onClick={() => toggleWidget('quickActions')}
                title={visibleWidgets.quickActions ? 'Hide Quick Actions' : 'Show Quick Actions'}
              >
                {visibleWidgets.quickActions ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Quick Actions</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.financialNews ? 'hidden' : ''}`}
                onClick={() => toggleWidget('financialNews')}
                title={visibleWidgets.financialNews ? 'Hide News' : 'Show News'}
              >
                {visibleWidgets.financialNews ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>News</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.financialOverview ? 'hidden' : ''}`}
                onClick={() => toggleWidget('financialOverview')}
                title={visibleWidgets.financialOverview ? 'Hide Overview' : 'Show Overview'}
              >
                {visibleWidgets.financialOverview ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Overview</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.financialHealth ? 'hidden' : ''}`}
                onClick={() => toggleWidget('financialHealth')}
                title={visibleWidgets.financialHealth ? 'Hide Health' : 'Show Health'}
              >
                {visibleWidgets.financialHealth ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Health</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.recentTransactions ? 'hidden' : ''}`}
                onClick={() => toggleWidget('recentTransactions')}
                title={visibleWidgets.recentTransactions ? 'Hide Transactions' : 'Show Transactions'}
              >
                {visibleWidgets.recentTransactions ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Transactions</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.budgetTracking ? 'hidden' : ''}`}
                onClick={() => toggleWidget('budgetTracking')}
                title={visibleWidgets.budgetTracking ? 'Hide Budget' : 'Show Budget'}
              >
                {visibleWidgets.budgetTracking ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Budget</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.spendingInsights ? 'hidden' : ''}`}
                onClick={() => toggleWidget('spendingInsights')}
                title={visibleWidgets.spendingInsights ? 'Hide Insights' : 'Show Insights'}
              >
                {visibleWidgets.spendingInsights ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Insights</span>
              </button>
              <button
                className={`widget-toggle ${!visibleWidgets.categoryAnalysis ? 'hidden' : ''}`}
                onClick={() => toggleWidget('categoryAnalysis')}
                title={visibleWidgets.categoryAnalysis ? 'Hide Categories' : 'Show Categories'}
              >
                {visibleWidgets.categoryAnalysis ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Categories</span>
              </button>
            </div>
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
              {visibleWidgets.financialOverview && (
                <DashboardCard
                  title="Financial Overview"
                  subtitle="AI-powered insights"
                  viewMorePath="/analytics"
                  viewMoreText="View Full Analytics"
                  icon={<BarChart3 size={20} />}
                >
                  <FinancialSummary />
                </DashboardCard>
              )}

              {visibleWidgets.financialHealth && (
                <DashboardCard
                  title="Financial Health"
                  subtitle="Your overall financial status"
                  viewMorePath="/analytics"
                  icon={<Target size={20} />}
                >
                  <FinancialHealth />
                </DashboardCard>
              )}

              {visibleWidgets.recentTransactions && (
                <DashboardCard
                  title="Recent Transactions"
                  subtitle="Latest financial records"
                  viewMorePath="/transactions"
                  viewMoreText="View All Transactions"
                  icon={<Receipt size={20} />}
                >
                  <FinancialRecordList />
                </DashboardCard>
              )}

              {visibleWidgets.budgetTracking && budget && (
                <DashboardCard
                  title="Budget Tracking"
                  subtitle="Monitor your spending limits"
                  viewMorePath="/budget"
                  viewMoreText="Manage Budget"
                  icon={<PiggyBank size={20} />}
                >
                  <BudgetTracking />
                </DashboardCard>
              )}

              {visibleWidgets.spendingInsights && (
                <DashboardCard
                  title="Spending Insights"
                  subtitle="AI analysis of your spending"
                  viewMorePath="/analytics"
                  icon={<BarChart3 size={20} />}
                >
                  <SpendingInsights />
                </DashboardCard>
              )}

              {visibleWidgets.categoryAnalysis && (
                <DashboardCard
                  title="Category Analysis"
                  subtitle="Spending by category"
                  viewMorePath="/analytics"
                  icon={<BarChart3 size={20} />}
                >
                  <CategoryChart />
                </DashboardCard>
              )}

              {visibleWidgets.aiInsights && (
                <DashboardCard
                  title="AI Insights"
                  subtitle="AI-powered financial analysis"
                  icon={<TrendingUp size={20} />}
                >
                  <AIInsights />
                </DashboardCard>
              )}

              {visibleWidgets.aiAdvisor && (
                <DashboardCard
                  title="AI Financial Advisor"
                  subtitle="Get personalized financial advice"
                  icon={<TrendingUp size={20} />}
                >
                  <AIAdvisor />
                </DashboardCard>
              )}

              {visibleWidgets.reportDownloads && (
                <DashboardCard
                  title="Reports"
                  subtitle="Download financial reports"
                  icon={<Download size={20} />}
                >
                  <ReportDownloads />
                </DashboardCard>
              )}

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
        </>
      )}
    </div>
  );
};