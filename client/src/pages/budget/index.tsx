// client/src/pages/budget/index.tsx
 
import { useNavigate } from "react-router-dom";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { BudgetManager } from "../../components/BudgetManager";
import { BudgetTracking } from "../../components/BudgetTracking";
import { BudgetTemplates } from "../../components/BudgetTemplates";
import { PageLoader } from "../../components/PageLoader";
import { ArrowLeft, PiggyBank, TrendingUp, AlertCircle } from "lucide-react";
import "./budget.css";

export const BudgetPage = () => {
    const navigate = useNavigate();
    const { budget, isLoading } = useFinancialRecords();

    if (isLoading) {
        return <PageLoader message="Loading budget data..." variant="minimal" />;
    }

    return (
        <div className="budget-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <PiggyBank size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Budget Management</h1>
                        <p>Set and track your budget across different categories</p>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            {!budget && (
                <div className="info-banner">
                    <AlertCircle size={20} />
                    <div>
                        <h3>Get Started with Budgeting</h3>
                        <p>Create your first budget to start tracking your spending and managing your finances better.</p>
                    </div>
                </div>
            )}

            <div className="budget-content">
                {/* Left Section - Budget Setup */}
                <div className="budget-setup-section">
                    <div className="section-header">
                        <h2>Budget Setup</h2>
                        <p>Configure your monthly budget and category limits</p>
                    </div>

                    <BudgetManager />

                    <div className="templates-section">
                        <h3>Quick Start Templates</h3>
                        <BudgetTemplates />
                    </div>
                </div>

                {/* Right Section - Budget Tracking */}
                <div className="budget-tracking-section">
                    <div className="section-header">
                        <h2>Budget Overview</h2>
                        <p>Track your spending against budget limits</p>
                    </div>

                    {budget ? (
                        <BudgetTracking />
                    ) : (
                        <div className="empty-state">
                            <TrendingUp size={64} />
                            <h3>No Budget Set Yet</h3>
                            <p>Create a budget in the setup section to see your spending overview here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
