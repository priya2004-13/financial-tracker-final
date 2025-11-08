// client/src/pages/transactions/index.tsx
import React, { useState, useMemo } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { FinancialRecordList } from "../dashboard/financial-record-list";
import { FinancialRecordForm } from "../dashboard/financial-record-form";
import { TransactionTemplates } from "../../components/TransactionTemplates";
import { PageLoader } from "../../components/PageLoader";
import { useScreenSize } from "../../hooks/useScreenSize";
import { ArrowLeft, Filter, Search, Calendar as CalendarIcon, Tag, DollarSign, CreditCard, TrendingUp, TrendingDown, List, Grid, BarChart2, CheckSquare, Square, Trash2, Edit2, Download, AlertTriangle, PieChart, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./transactions.css";

export const TransactionsPage = () => {
    const navigate = useNavigate();
    const { records, isLoading, deleteRecord, updateRecord } = useFinancialRecords();
    const screenSize = useScreenSize();
    const isMobile = screenSize === "xs";
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<string>("all");
    const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("all");
    const [transactionType, setTransactionType] = useState<string>("all"); // all, income, expense
    const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">("list");
    const [showDuplicates, setShowDuplicates] = useState(false);

    // Bulk operations state
    const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
    const [bulkEditCategory, setBulkEditCategory] = useState<string>("");
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(records.map(record => record.category));
        return Array.from(cats).sort();
    }, [records]);

    // Get unique payment methods
    const paymentMethods = useMemo(() => {
        const methods = new Set(records.map(record => record.paymentMethod).filter(Boolean));
        return Array.from(methods).sort();
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

        // Transaction type filter
        if (transactionType === "income") {
            filtered = filtered.filter(record => record.category === "Salary");
        } else if (transactionType === "expense") {
            filtered = filtered.filter(record => record.category !== "Salary");
        }

        // Category filter (single or multi)
        if (selectedCategory !== "all") {
            filtered = filtered.filter(record => record.category === selectedCategory);
        }

        // Payment method filter
        if (paymentMethod !== "all") {
            filtered = filtered.filter(record => record.paymentMethod === paymentMethod);
        }

        // Amount range filter
        if (minAmount) {
            filtered = filtered.filter(record => record.amount >= parseFloat(minAmount));
        }
        if (maxAmount) {
            filtered = filtered.filter(record => record.amount <= parseFloat(maxAmount));
        }

        // Date range filter
        if (dateRange === "custom" && customDateFrom && customDateTo) {
            const fromDate = new Date(customDateFrom);
            const toDate = new Date(customDateTo);
            toDate.setHours(23, 59, 59, 999); // Include entire day
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= fromDate && recordDate <= toDate;
            });
        } else if (dateRange !== "all") {
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

            if (dateRange !== "all" && dateRange !== "custom") {
                filtered = filtered.filter(record => new Date(record.date) >= filterDate);
            }
        }

        return filtered;
    }, [records, searchTerm, selectedCategory, dateRange, customDateFrom, customDateTo, minAmount, maxAmount, paymentMethod, transactionType]);

    // Calculate stats for filtered records
    const stats = useMemo(() => {
        const income = filteredRecords
            .filter(r => r.category === "Salary")
            .reduce((sum, r) => sum + r.amount, 0);
        const expenses = filteredRecords
            .filter(r => r.category !== "Salary")
            .reduce((sum, r) => sum + r.amount, 0);

        const avgTransaction = filteredRecords.length > 0
            ? filteredRecords.reduce((sum, r) => sum + r.amount, 0) / filteredRecords.length
            : 0;

        // Find most frequent category
        const categoryCounts: Record<string, number> = {};
        filteredRecords.forEach(r => {
            categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
        });
        const mostFrequentCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        // Find highest and lowest
        const amounts = filteredRecords.map(r => r.amount);
        const highest = amounts.length > 0 ? Math.max(...amounts) : 0;
        const lowest = amounts.length > 0 ? Math.min(...amounts) : 0;

        // Calculate category spending for charts
        const categorySpending: Record<string, number> = {};
        filteredRecords
            .filter(r => r.category !== "Salary")
            .forEach(r => {
                categorySpending[r.category] = (categorySpending[r.category] || 0) + r.amount;
            });

        return {
            total: filteredRecords.length,
            income,
            expenses,
            balance: income - expenses,
            avgTransaction,
            mostFrequentCategory,
            highest,
            lowest,
            categorySpending
        };
    }, [filteredRecords]);

    // Duplicate detection logic
    const duplicateGroups = useMemo(() => {
        if (!showDuplicates) return [];

        const groups: Array<Array<typeof filteredRecords[0]>> = [];
        const processed = new Set<string>();

        filteredRecords.forEach((record, index) => {
            if (processed.has(record._id || '')) return;

            const potentialDuplicates = filteredRecords.filter((other, otherIndex) => {
                if (index === otherIndex || processed.has(other._id || '')) return false;

                // Check if amounts are within 5% of each other
                const amountDiff = Math.abs(record.amount - other.amount);
                const amountThreshold = record.amount * 0.05;
                const similarAmount = amountDiff <= amountThreshold;

                // Check if same category
                const sameCategory = record.category === other.category;

                // Check if dates are within 24 hours
                const date1 = new Date(record.date).getTime();
                const date2 = new Date(other.date).getTime();
                const timeDiff = Math.abs(date1 - date2);
                const within24Hours = timeDiff <= 24 * 60 * 60 * 1000;

                // Check if descriptions are similar (simple check)
                const desc1 = record.description.toLowerCase();
                const desc2 = other.description.toLowerCase();
                const similarDescription = desc1.includes(desc2) || desc2.includes(desc1) ||
                    (desc1.length > 3 && desc2.length > 3 &&
                        desc1.substring(0, 5) === desc2.substring(0, 5));

                return similarAmount && sameCategory && within24Hours && similarDescription;
            });

            if (potentialDuplicates.length > 0) {
                const group = [record, ...potentialDuplicates];
                group.forEach(r => processed.add(r._id || ''));
                groups.push(group);
            }
        });

        return groups;
    }, [filteredRecords, showDuplicates]);

    // Records to display based on duplicate filter
    const displayRecords = useMemo(() => {
        if (!showDuplicates) return filteredRecords;

        // Flatten duplicate groups
        const duplicateIds = new Set(
            duplicateGroups.flat().map(r => r._id).filter(Boolean)
        );

        return filteredRecords.filter(r => duplicateIds.has(r._id || ''));
    }, [filteredRecords, showDuplicates, duplicateGroups]);

    // Bulk operations functions
    const toggleSelectAll = () => {
        if (selectedTransactions.size === displayRecords.length) {
            setSelectedTransactions(new Set());
        } else {
            const allIds = new Set(displayRecords.map(r => r._id).filter(Boolean) as string[]);
            setSelectedTransactions(allIds);
        }
    };

    const toggleSelectTransaction = (id: string) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTransactions(newSelected);
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction(s)?`)) {
            selectedTransactions.forEach(id => {
                deleteRecord(id);
            });
            setSelectedTransactions(new Set());
            setShowBulkActions(false);
        }
    };

    const handleBulkCategoryChange = () => {
        if (!bulkEditCategory) {
            alert("Please select a category");
            return;
        }

        selectedTransactions.forEach(id => {
            const record = displayRecords.find(r => r._id === id);
            if (record) {
                updateRecord(id, { ...record, category: bulkEditCategory });
            }
        });

        setSelectedTransactions(new Set());
        setBulkEditCategory("");
        setShowBulkActions(false);
        alert(`Updated ${selectedTransactions.size} transaction(s)`);
    };

    const exportToCSV = (recordsToExport = displayRecords) => {
        // CSV headers
        const headers = ["Date", "Description", "Amount", "Category", "Payment Method"];

        // Convert records to CSV rows
        const rows = recordsToExport.map(record => [
            new Date(record.date).toLocaleDateString(),
            `"${record.description}"`, // Quote to handle commas in description
            record.amount.toString(),
            record.category,
            record.paymentMethod || "N/A"
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportSelectedToCSV = () => {
        const selectedRecords = filteredRecords.filter(r => r._id && selectedTransactions.has(r._id));
        exportToCSV(selectedRecords);
    };

    if (isLoading) {
        return <PageLoader message="Loading transactions..." variant="minimal" />;
    }

    return (
        <div className={`transactions-page ${isMobile ? 'mobile-transactions' : ''}`}>
            {/* Mobile Layout */}
            {isMobile ? (
                <div className="mobile-transactions-content">
                    <div className="mobile-page-header">
                        <h1>Transactions</h1>
                        <p>{filteredRecords.length} transactions</p>
                    </div>

                    {/* Mobile Search */}
                    <div className="mobile-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Mobile Filter Chips */}
                    <div className="mobile-filter-chips">
                        <button
                            className={`filter-chip ${transactionType === "all" ? "active" : ""}`}
                            onClick={() => setTransactionType("all")}
                        >
                            All
                        </button>
                        <button
                            className={`filter-chip ${transactionType === "income" ? "active" : ""}`}
                            onClick={() => setTransactionType("income")}
                        >
                            <TrendingUp size={14} /> Income
                        </button>
                        <button
                            className={`filter-chip ${transactionType === "expense" ? "active" : ""}`}
                            onClick={() => setTransactionType("expense")}
                        >
                            <TrendingDown size={14} /> Expense
                        </button>
                    </div>

                    {/* Mobile Stats */}
                    <div className="mobile-transaction-stats">
                        <div className="mobile-stat">
                            <span className="stat-label">Total</span>
                            <span className="stat-value">
                                ₹{filteredRecords.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="mobile-stat">
                            <span className="stat-label">Average</span>
                            <span className="stat-value">
                                ₹{filteredRecords.length ? (filteredRecords.reduce((sum, r) => sum + r.amount, 0) / filteredRecords.length).toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Transaction List */}
                    <div className="mobile-transactions-list">
                        <FinancialRecordList />
                    </div>
                </div>
            ) : (
                /* Desktop Layout */
                <>
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

                    {/* Bulk Actions Bar */}
                    {selectedTransactions.size > 0 && (
                        <div className="bulk-actions-bar">
                            <div className="bulk-info">
                                <CheckSquare size={20} />
                                <span>{selectedTransactions.size} transaction(s) selected</span>
                            </div>
                            <div className="bulk-buttons">
                                <button
                                    className="bulk-btn bulk-edit"
                                    onClick={() => setShowBulkActions(!showBulkActions)}
                                >
                                    <Edit2 size={18} />
                                    Change Category
                                </button>
                                <button
                                    className="bulk-btn bulk-export"
                                    onClick={exportSelectedToCSV}
                                >
                                    <Download size={18} />
                                    Export Selected
                                </button>
                                <button
                                    className="bulk-btn bulk-delete"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 size={18} />
                                    Delete Selected
                                </button>
                                <button
                                    className="bulk-btn bulk-clear"
                                    onClick={() => setSelectedTransactions(new Set())}
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bulk Edit Modal */}
                    {showBulkActions && (
                        <div className="bulk-edit-modal">
                            <h3>Change Category for {selectedTransactions.size} transaction(s)</h3>
                            <div className="bulk-edit-content">
                                <select
                                    value={bulkEditCategory}
                                    onChange={(e) => setBulkEditCategory(e.target.value)}
                                    className="bulk-category-select"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <div className="bulk-edit-buttons">
                                    <button onClick={handleBulkCategoryChange} className="apply-btn">
                                        Apply Changes
                                    </button>
                                    <button onClick={() => setShowBulkActions(false)} className="cancel-btn">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Summary - Enhanced */}
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
                                <TrendingUp size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Income</span>
                                <span className="stat-value">₹{stats.income.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="stat-item expense">
                            <div className="stat-icon">
                                <TrendingDown size={20} />
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
                        <div className="stat-item">
                            <div className="stat-icon">
                                <BarChart2 size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Avg Transaction</span>
                                <span className="stat-value">₹{stats.avgTransaction.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">
                                <Tag size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Top Category</span>
                                <span className="stat-value">{stats.mostFrequentCategory}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mini Insights Section */}
                    {stats.expenses > 0 && Object.keys(stats.categorySpending).length > 0 && (
                        <div className="mini-insights-section">
                            <div className="insights-header">
                                <PieChart size={20} />
                                <h3>Spending Breakdown</h3>
                            </div>
                            <div className="category-bars">
                                {Object.entries(stats.categorySpending)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([category, amount]) => {
                                        const percentage = (amount / stats.expenses) * 100;
                                        return (
                                            <div key={category} className="category-bar-item">
                                                <div className="category-bar-header">
                                                    <span className="category-name">{category}</span>
                                                    <span className="category-amount">₹{amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <div className="category-bar-container">
                                                    <div
                                                        className="category-bar-fill"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Transaction Type Toggle */}
                    <div className="transaction-type-toggle">
                        <button
                            className={`type-btn ${transactionType === "all" ? "active" : ""}`}
                            onClick={() => setTransactionType("all")}
                        >
                            All Transactions
                        </button>
                        <button
                            className={`type-btn income ${transactionType === "income" ? "active" : ""}`}
                            onClick={() => setTransactionType("income")}
                        >
                            <TrendingUp size={16} />
                            Income Only
                        </button>
                        <button
                            className={`type-btn expense ${transactionType === "expense" ? "active" : ""}`}
                            onClick={() => setTransactionType("expense")}
                        >
                            <TrendingDown size={16} />
                            Expenses Only
                        </button>
                    </div>

                    <div className="transactions-content">
                        {/* Sidebar with form and templates */}
                        <div className="transactions-sidebar">
                            <FinancialRecordForm />
                            <TransactionTemplates />
                        </div>

                        {/* Main content */}
                        <div className="transactions-main">
                            {/* Enhanced Filters */}
                            <div className="transactions-filters">
                                {/* Search */}
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

                                {/* Category Filter */}
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

                                {/* Payment Method Filter */}
                                {paymentMethods.length > 0 && (
                                    <div className="filter-group">
                                        <CreditCard size={18} />
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">All Payment Methods</option>
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Date Range Filter */}
                                <div className="filter-group">
                                    <CalendarIcon size={18} />
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
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>

                                {/* Custom Date Range */}
                                {dateRange === "custom" && (
                                    <>
                                        <div className="filter-group">
                                            <input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="date-input"
                                                placeholder="From"
                                            />
                                        </div>
                                        <div className="filter-group">
                                            <input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="date-input"
                                                placeholder="To"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Amount Range Filter */}
                                <div className="filter-group amount-range">
                                    <DollarSign size={18} />
                                    <input
                                        type="number"
                                        placeholder="Min ₹"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        className="amount-input"
                                        min="0"
                                    />
                                    <span className="range-separator">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max ₹"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                        className="amount-input"
                                        min="0"
                                    />
                                </div>

                                {/* View Mode Toggle */}
                                <div className="view-mode-toggle">
                                    <button
                                        className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                                        onClick={() => setViewMode("list")}
                                        title="List View"
                                    >
                                        <List size={18} />
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                                        onClick={() => setViewMode("grid")}
                                        title="Grid View"
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
                                        onClick={() => setViewMode("calendar")}
                                        title="Calendar View"
                                    >
                                        <CalendarDays size={18} />
                                    </button>
                                </div>

                                {/* Duplicate Detection Toggle */}
                                <button
                                    className={`duplicate-toggle-btn ${showDuplicates ? "active" : ""}`}
                                    onClick={() => setShowDuplicates(!showDuplicates)}
                                    title={showDuplicates ? "Show All Transactions" : "Show Only Duplicates"}
                                >
                                    <AlertTriangle size={18} />
                                    {showDuplicates ? `Duplicates (${duplicateGroups.length} groups)` : "Find Duplicates"}
                                </button>

                                {/* Select All Checkbox */}
                                <button
                                    className="select-all-btn"
                                    onClick={toggleSelectAll}
                                    title={selectedTransactions.size === displayRecords.length ? "Deselect All" : "Select All"}
                                >
                                    {selectedTransactions.size === displayRecords.length ? (
                                        <CheckSquare size={18} />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                    {selectedTransactions.size === displayRecords.length ? "Deselect All" : "Select All"}
                                </button>

                                {/* Export All Button */}
                                <button
                                    className="export-all-btn"
                                    onClick={() => exportToCSV()}
                                    title="Export all filtered transactions"
                                >
                                    <Download size={18} />
                                    Export All
                                </button>

                                {/* Clear Filters */}
                                {(searchTerm || selectedCategory !== "all" || dateRange !== "all" || minAmount || maxAmount || paymentMethod !== "all" || transactionType !== "all") && (
                                    <button
                                        className="clear-filters-btn"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedCategory("all");
                                            setDateRange("all");
                                            setCustomDateFrom("");
                                            setCustomDateTo("");
                                            setMinAmount("");
                                            setMaxAmount("");
                                            setPaymentMethod("all");
                                            setTransactionType("all");
                                        }}
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* Transaction List or Calendar View */}
                            <div className="transactions-list-container">
                                {viewMode === "calendar" ? (
                                    <div className="calendar-view">
                                        {(() => {
                                            // Group transactions by date
                                            const transactionsByDate: Record<string, typeof displayRecords> = {};
                                            displayRecords.forEach(record => {
                                                const dateKey = new Date(record.date).toDateString();
                                                if (!transactionsByDate[dateKey]) {
                                                    transactionsByDate[dateKey] = [];
                                                }
                                                transactionsByDate[dateKey].push(record);
                                            });

                                            // Sort dates in descending order
                                            const sortedDates = Object.keys(transactionsByDate).sort((a, b) =>
                                                new Date(b).getTime() - new Date(a).getTime()
                                            );

                                            return sortedDates.map(dateKey => {
                                                const dateRecords = transactionsByDate[dateKey];
                                                const totalAmount = dateRecords.reduce((sum, r) => sum + r.amount, 0);
                                                const income = dateRecords.filter(r => r.category === "Salary").reduce((sum, r) => sum + r.amount, 0);
                                                const expenses = dateRecords.filter(r => r.category !== "Salary").reduce((sum, r) => sum + r.amount, 0);

                                                return (
                                                    <div key={dateKey} className="calendar-day-group">
                                                        <div className="calendar-day-header">
                                                            <div className="date-info">
                                                                <CalendarIcon size={20} />
                                                                <h3>{new Date(dateKey).toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</h3>
                                                            </div>
                                                            <div className="day-summary">
                                                                <span className="day-count">{dateRecords.length} transactions</span>
                                                                {income > 0 && <span className="day-income">+₹{income.toFixed(2)}</span>}
                                                                {expenses > 0 && <span className="day-expense">-₹{expenses.toFixed(2)}</span>}
                                                                <span className={`day-total ${income - expenses >= 0 ? 'positive' : 'negative'}`}>
                                                                    Net: ₹{(income - expenses).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="calendar-day-transactions">
                                                            <FinancialRecordList
                                                                filteredRecords={dateRecords}
                                                                showFilters={false}
                                                                selectedTransactions={selectedTransactions}
                                                                onToggleSelect={toggleSelectTransaction}
                                                                enableSelection={true}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                ) : (
                                    <>
                                        <FinancialRecordList
                                            filteredRecords={displayRecords}
                                            showFilters={false}
                                            selectedTransactions={selectedTransactions}
                                            onToggleSelect={toggleSelectTransaction}
                                            enableSelection={true}
                                        />
                                        {displayRecords.length === 0 && (
                                            <div className="no-results">
                                                <p>No transactions found matching your filters.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};