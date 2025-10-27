// src/pages/MobileLayout.tsx
import   {   useMemo, useState } from 'react';
import { DollarSign, LayoutGrid, List, PieChart, Target, TrendingDown, User, Wallet } from 'lucide-react';
import './MobileLayout.css'; 
import { useFinancialRecords } from '../contexts/financial-record-context';
import { useUser } from '@clerk/clerk-react';
import { StatCard } from '../components/StatCard';

// --- Placeholder Pages for each Tab ---
// You will replace these with actual components later
const HomePagePlaceholder = () => {
    // const { user } = useUser();
    const { records, budget,  } = useFinancialRecords();

    // Scroll detection for sidebar and main content


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


    return (


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


    );
}
const TransactionsPagePlaceholder = () => (
    <div className="page-placeholder">
        <h2>Transactions Tab</h2>
        <p>Content for the Transactions screen goes here (e.g., FinancialRecordList, FAB).</p>
    </div>
);
const AnalysisPagePlaceholder = () => (
    <div className="page-placeholder">
        <h2>Analysis Tab</h2>
        <p>Content for the Analysis screen goes here (e.g., charts, insights).</p>
    </div>
);
const BudgetsPagePlaceholder = () => (
    <div className="page-placeholder">
        <h2>Budgets Tab</h2>
        <p>Content for the Budgets screen goes here (e.g., BudgetManager, SavingsGoals).</p>
    </div>
);
const ProfilePagePlaceholder = () => (
    <div className="page-placeholder">
        <h2>Profile Tab</h2>
        <p>Content for the Profile screen goes here (e.g., settings, categories, logout).</p>
    </div>
);
// --- End Placeholder Pages ---


// Define the tabs and their corresponding components
const TABS = [
    { id: 'home', icon: LayoutGrid, label: 'Home', component: <HomePagePlaceholder /> },
    { id: 'transactions', icon: List, label: 'Transactions', component: <TransactionsPagePlaceholder /> },
    { id: 'analysis', icon: PieChart, label: 'Analysis', component: <AnalysisPagePlaceholder /> },
    { id: 'budgets', icon: Target, label: 'Budgets', component: <BudgetsPagePlaceholder /> },
    { id: 'profile', icon: User, label: 'Profile', component: <ProfilePagePlaceholder /> },
];

const MobileLayout = () => {

    const [activeTab, setActiveTab] = useState('home'); // Default to 'home'
    const { isLoading } = useFinancialRecords();

    // Function to render the content of the currently active tab
    const renderContent = () => {
        const activeTabContent = TABS.find(tab => tab.id === activeTab);
        return activeTabContent ? activeTabContent.component : null;
    };
    if (isLoading) {
        return (

            <div className="loading-dashboard">
                <div className="loading-spinner"></div>
                <p>Loading your financial data...</p>
            </div>

        );
    }
    return (
        <div className="mobile-layout-container">
            {/* Main content area that changes based on the active tab */}
            <main className="mobile-content-area safe-area-inset-top safe-area-inset-bottom">
                {renderContent()}
            </main>

            {/* Fixed bottom navigation bar */}
            <nav className="mobile-bottom-nav safe-area-inset-bottom">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon; // Get the icon component
                    return (
                        <button
                            key={tab.id}
                            className={`mobile-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            aria-label={tab.label} // For accessibility
                        >
                            <IconComponent size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span className="nav-button-label">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileLayout;

