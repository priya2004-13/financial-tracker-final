// client/src/pages/analytics/index.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { PageLoader } from "../../components/PageLoader";
import { FinancialRecordChart as SpendingBarChart } from "../dashboard/financial-record-chart";
import { CategoryChart } from "../../components/CategoryChart";
import { SpendingInsights } from "../../components/SpendingInsights";
import TrendAnalysisChart from "../../components/TrendAnalysisChart";
import SpendingHeatmap from "../../components/SpendingHeatmap";
import { FinancialHealth } from "../../components/FinancialHealth";
import { FinancialSummary } from "../../components/FinancialSummary";
import { ArrowLeft, BarChart3, TrendingUp, PieChart } from "lucide-react";
import "./analytics.css";

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const { isLoading } = useFinancialRecords();

    if (isLoading) {
        return <PageLoader message="Loading analytics..." variant="minimal" />;
    }

    return (
        <div className="analytics-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <BarChart3 size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Financial Analytics</h1>
                        <p>Comprehensive insights into your spending patterns and financial health</p>
                    </div>
                </div>
            </div>

            <div className="analytics-content">
                {/* Overview Section */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <TrendingUp size={24} />
                        <h2>Financial Overview</h2>
                    </div>
                    <div className="overview-grid">
                        <FinancialSummary />
                        <FinancialHealth />
                    </div>
                </section>

                {/* Spending Analysis */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <PieChart size={24} />
                        <h2>Spending Analysis</h2>
                    </div>
                    <div className="charts-grid">
                        <div className="chart-container">
                            <CategoryChart />
                        </div>
                        <div className="chart-container">
                            <SpendingBarChart />
                        </div>
                    </div>
                </section>

                {/* Insights Section */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <BarChart3 size={24} />
                        <h2>AI-Powered Insights</h2>
                    </div>
                    <SpendingInsights />
                </section>

                {/* Trends & Patterns */}
                <section className="analytics-section full-width">
                    <div className="section-title">
                        <TrendingUp size={24} />
                        <h2>Trends & Patterns</h2>
                    </div>
                    <div className="trends-grid">
                        <div className="trend-item">
                            <h3>Monthly Trends</h3>
                            <TrendAnalysisChart />
                        </div>
                        <div className="trend-item">
                            <h3>Spending Heatmap</h3>
                            <SpendingHeatmap />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
