// client/src/pages/MobileLayout.tsx - 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    LayoutGrid,
    List,
    PieChart,
    Target,
    TrendingDown,
    User,
    Wallet,
    Settings,
    LogOut,
    Moon,
    Sun,
    HelpCircle,
} from 'lucide-react';
import './MobileLayout.css';
import '../components/ProfilePage.css';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { useTheme } from '../contexts/themeContext';
import { useUser, useClerk } from '@clerk/clerk-react';
import { StatCard } from '../components/StatCard';
import { FinancialRecordForm } from './dashboard/financial-record-form';
import { FinancialRecordList } from './dashboard/financial-record-list';
import { FinancialRecordChart as SpendingBarChart } from './dashboard/financial-record-chart';
import { SpendingInsights } from '../components/SpendingInsights';
import { BudgetManager } from '../components/BudgetManager';
import { BudgetTracking } from '../components/BudgetTracking';
import { BudgetTemplates } from '../components/BudgetTemplates';
import { CategoryManager } from '../components/CategoryManager';
import { FinancialHealth } from '../components/FinancialHealth';
import { Subscriptions } from '../components/Subscriptions';
import SavingsGoals from '../components/SavingsGoals';
import { useMemo } from 'react';
import { SpendingCategory } from '../components/Spending-by-Category';

// --- HOME PAGE ---
const HomePage = () => {
    const { records, budget } = useFinancialRecords();

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
        <div className="mobile-page-content">
            <h2 className="page-title">Dashboard Overview</h2>

            <div className="stats-grid">
                <StatCard title="Total Balance" value={balance} icon={Wallet} color="#6366f1" trend="All time" />
                <StatCard title="This Month Income" value={currentMonthIncome} icon={DollarSign} color="#10b981" trend="Current month" />
                <StatCard title="This Month Expenses" value={currentMonthExpenses} icon={TrendingDown} color="#ef4444" trend="Current month" />
                {budget && <StatCard title="Budget Remaining" value={budgetAdherence} icon={Target} color="#8b5cf6" trend={`${budgetAdherence.toFixed(0)}%`} prefix="" />}
            </div>

            <FinancialHealth />
            {budget && <BudgetTracking />}
        </div>
    );
};

// --- TRANSACTIONS PAGE ---
const TransactionsPage = () => (
    <div className="mobile-page-content">
        <h2 className="page-title">Transactions</h2>
        <FinancialRecordForm />
        <FinancialRecordList />
    </div>
);

// --- ANALYSIS PAGE ---
const AnalysisPage = () => (
    <div className="mobile-page-content">
        <h2 className="page-title">Financial Analysis</h2>
        <SpendingInsights />
        <SpendingCategory />
        <SpendingBarChart />
    </div>
);

// --- BUDGETS PAGE ---
const BudgetsPage = () => (
    <div className="mobile-page-content">
        <h2 className="page-title">Budget & Goals</h2>
        <BudgetManager />
        <BudgetTemplates />
        <SavingsGoals />
        <Subscriptions />
    </div>
);

const ProfilePage = () => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) {
            return;
        }

        setIsSigningOut(true);

        try {
            // Sign out from Clerk
            await signOut();

            // Wait a moment for Clerk to process
            await new Promise(resolve => setTimeout(resolve, 100));

            // Force navigation to auth page
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Sign out error:', error);
            // Even on error, try to redirect
            navigate('/auth', { replace: true });
        } finally {
            // Reset state after a delay
            setTimeout(() => setIsSigningOut(false), 500);
        }
    };

    return (
        <div className="mobile-page-content">
            <h2 className="page-title">Profile & Settings</h2>

            <div className="profile-card">
                <div className="profile-avatar">
                    <User size={48} />
                </div>
                <div className="profile-info">
                    <h3>{user?.firstName} {user?.lastName}</h3>
                    <p>{user?.primaryEmailAddress?.emailAddress}</p>
                    <span className="member-badge">
                        Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="settings-section">
                <h3 className="section-title">Settings</h3>

                <button className="settings-item" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    <span>Theme</span>
                    <span className="settings-value">{theme === 'light' ? 'Light' : 'Dark'}</span>
                </button>

                <button className="settings-item" disabled>
                    <Settings size={20} />
                    <span>Preferences</span>
                </button>

                <button className="settings-item" disabled>
                    <HelpCircle size={20} />
                    <span>Help & Support</span>
                </button>
            </div>

            <div className="settings-section">
                <h3 className="section-title">Manage</h3>
                <CategoryManager />
            </div>

            <button
                className="btn-signout"
                onClick={handleSignOut}
                disabled={isSigningOut}
                style={{
                    opacity: isSigningOut ? 0.6 : 1,
                    cursor: isSigningOut ? 'not-allowed' : 'pointer'
                }}
            >
                {isSigningOut ? (
                    <>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        Signing Out...
                    </>
                ) : (
                    <>
                        <LogOut size={20} />
                        Sign Out
                    </>
                )}
            </button>
        </div>
    );
};
// --- MAIN MOBILE LAYOUT COMPONENT ---
const TABS = [
    { id: 'home', icon: LayoutGrid, label: 'Home' },
    { id: 'transactions', icon: List, label: 'Transactions' },
    { id: 'analysis', icon: PieChart, label: 'Analysis' },
    { id: 'budgets', icon: Target, label: 'Budgets' },
    { id: 'profile', icon: User, label: 'Profile' },
];

const MobileLayout = () => {
    const [activeTab, setActiveTab] = useState('home');
    const { isLoading } = useFinancialRecords();

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <HomePage />;
            case 'transactions': return <TransactionsPage />;
            case 'analysis': return <AnalysisPage />;
            case 'budgets': return <BudgetsPage />;
            case 'profile': return <ProfilePage />;
            default: return <HomePage />;
        }
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
            <main className="mobile-content-area safe-area-inset-top safe-area-inset-bottom">
                {renderContent()}
            </main>

            <nav className="mobile-bottom-nav safe-area-inset-bottom">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`mobile-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            aria-label={tab.label}
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