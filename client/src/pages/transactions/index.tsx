// client/src/pages/transactions/index.tsx
import React, { useState, useMemo } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { FinancialRecordList } from "../dashboard/financial-record-list";
import { FinancialRecordForm } from "../dashboard/financial-record-form";
import { TransactionTemplates } from "../../components/TransactionTemplates";
import { PageLoader } from "../../components/PageLoader";
import { ArrowLeft, Filter, Search, Calendar, Tag, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./transactions.css";

export const TransactionsPage = () => {
    const navigate = useNavigate();
    const { records, isLoading } = useFinancialRecords();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [dateRange, setDateRange] = useState<string>("all");

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(records.map(record => record.category));
        return Array.from(cats).sort();
    }, [records]);

    // Filter records based on search and filters
    const filteredRecords = useMemo(() => {
        let filtered = records;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(record =>
                record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(record => record.category === selectedCategory);
        }

        // Date range filter
        if (dateRange !== "all") {
            const now = new Date();
            const filterDate = new Date();

            switch (dateRange) {
                case "today":
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case "week":
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case "month":
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case "year":
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            if (dateRange !== "all") {
                filtered = filtered.filter(record => new Date(record.date) >= filterDate);
            }
        }

        return filtered;
    }, [records, searchTerm, selectedCategory, dateRange]);

    // Calculate stats for filtered records
    const stats = useMemo(() => {
        const income = filteredRecords
            .filter(r => r.category === "Salary")
            .reduce((sum, r) => sum + r.amount, 0);
        const expenses = filteredRecords
            .filter(r => r.category !== "Salary")
            .reduce((sum, r) => sum + r.amount, 0);

        return {
            total: filteredRecords.length,
            income,
            expenses,
            balance: income - expenses
        };
    }, [filteredRecords]);

    if (isLoading) {
        return <PageLoader message="Loading transactions..." variant="minimal" />;
    }

    return (
        <div className="transactions-page">
            {/* Header */}
            <div className="page-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>All Transactions</h1>
                    <p>View and manage all your financial records</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="transactions-stats">
                <div className="stat-item">
                    <div className="stat-icon">
                        <Tag size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Records</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                </div>
                <div className="stat-item income">
                    <div className="stat-icon">
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Income</span>
                        <span className="stat-value">₹{stats.income.toFixed(2)}</span>
                    </div>
                </div>
                <div className="stat-item expense">
                    <div className="stat-icon">
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">₹{stats.expenses.toFixed(2)}</span>
                    </div>
                </div>
                <div className="stat-item balance">
                    <div className="stat-icon">
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Net Balance</span>
                        <span className="stat-value">₹{stats.balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="transactions-content">
                {/* Sidebar with form and templates */}
                <div className="transactions-sidebar">
                    <FinancialRecordForm />
                    <TransactionTemplates />
                </div>

                {/* Main content */}
                <div className="transactions-main">
                    {/* Filters */}
                    <div className="transactions-filters">
                        <div className="filter-group">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-group">
                            <Tag size={18} />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <Calendar size={18} />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="year">Last Year</option>
                            </select>
                        </div>

                        {(searchTerm || selectedCategory !== "all" || dateRange !== "all") && (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory("all");
                                    setDateRange("all");
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Transaction List */}
                    <div className="transactions-list-container">
                        <FinancialRecordList />
                        {filteredRecords.length === 0 && (
                            <div className="no-results">
                                <p>No transactions found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};