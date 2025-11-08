// client/src/pages/goals/index.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { PageLoader } from "../../components/PageLoader";
import SavingsGoals from "../../components/SavingsGoals";
import { Subscriptions } from "../../components/Subscriptions";
import { SharedExpenses } from "../../components/SharedExpenses";
import { ArrowLeft, Target, Repeat, Users } from "lucide-react";
import "./goals.css";

export const GoalsPage = () => {
    const navigate = useNavigate();
    const { isLoading } = useFinancialRecords();

    if (isLoading) {
        return <PageLoader message="Loading goals and subscriptions..." variant="minimal" />;
    }

    return (
        <div className="goals-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <Target size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Goals & Recurring Payments</h1>
                        <p>Manage your savings goals, subscriptions, and shared expenses</p>
                    </div>
                </div>
            </div>

            <div className="goals-content">
                <div>

                    {/* Savings Goals Section */}
                    <section className="goals-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <Target size={24} />
                            </div>
                            <div className="section-text">
                                <h2>Savings Goals</h2>
                                <p>Track progress towards your financial objectives</p>
                            </div>
                        </div>
                        <div className="section-content">
                            <SavingsGoals />
                        </div>
                    </section>

                    {/* Shared Expenses Section */}
                    <section className="goals-section">
                        <div className="section-header">
                            <div className="section-icon shared">
                                <Users size={24} />
                            </div>
                            <div className="section-text">
                                <h2>Shared Expenses</h2>
                                <p>Split bills and track shared costs with others</p>
                            </div>
                        </div>
                        <div className="section-content">
                            <SharedExpenses />
                        </div>
                    </section>
                </div>

                {/* Subscriptions Section */}
                <section className="goals-section">
                    <div className="section-header">
                        <div className="section-icon recurring">
                            <Repeat size={24} />
                        </div>
                        <div className="section-text">
                            <h2>Recurring Payments & Subscriptions</h2>
                            <p>Monitor your regular expenses and subscription services</p>
                        </div>
                    </div>
                    <div className="section-content">
                        <Subscriptions />
                    </div>
                </section>

            </div>
        </div>
    );
};
