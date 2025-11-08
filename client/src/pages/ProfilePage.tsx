// client/src/pages/ProfilePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../contexts/themeContext';
import { useFinancialRecords } from '../contexts/financial-record-context';
import {
    User,
    Mail,
    Calendar,
    LogOut,
    Moon,
    Sun,
    HelpCircle,
    ChevronRight,
    Bell,
    Shield,
    CreditCard,
    FileText,
    Settings,
    TrendingUp,
    DollarSign,
    Target,
    Activity,
    Award,
    Clock,
    MapPin,
    Phone,
    Edit2,
    Download,
    Upload,
    Trash2
} from 'lucide-react';
import { CategoryManager } from '../components/CategoryManager';
import './ProfilePage.css';

export const ProfilePage = () => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { records } = useFinancialRecords();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'categories'>('overview');

    // Calculate user statistics
    const totalTransactions = records?.length || 0;
    const totalIncome = records?.filter(r => r.category === 'Income')
        .reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalExpenses = records?.filter(r => r.category !== 'Income')
        .reduce((sum, r) => sum + r.amount, 0) || 0;
    const netBalance = totalIncome - totalExpenses;

    const accountAge = user?.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) {
            return;
        }

        setIsSigningOut(true);

        try {
            await signOut({ redirectUrl: '/auth' });
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Sign out error:', error);
            navigate('/auth', { replace: true });
        } finally {
            setTimeout(() => setIsSigningOut(false), 500);
        }
    };

    return (
        <div className="profile-page-wrapper">
            {/* Desktop Sidebar / Mobile Header */}
            <div className="profile-sidebar">
                <div className="profile-hero-card">
                    <div className="profile-hero-bg"></div>
                    <div className="profile-hero-content">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-large">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt={user.firstName || 'User'} />
                                ) : (
                                    <User size={48} />
                                )}
                            </div>
                            <button className="profile-avatar-edit">
                                <Edit2 size={14} />
                            </button>
                        </div>
                        <div className="profile-user-info">
                            <h2 className="profile-user-name">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p className="profile-user-email">
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                            <div className="profile-badges">
                                <span className="profile-badge primary">
                                    <Award size={12} />
                                    Premium Member
                                </span>
                                <span className="profile-badge">
                                    <Clock size={12} />
                                    {accountAge} days
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="profile-quick-stats">
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon income">
                            <TrendingUp size={20} />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Total Income</span>
                            <span className="quick-stat-value">${totalIncome.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon expense">
                            <DollarSign size={20} />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Total Expenses</span>
                            <span className="quick-stat-value">${totalExpenses.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon balance">
                            <Target size={20} />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Net Balance</span>
                            <span className="quick-stat-value">${netBalance.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon transactions">
                            <Activity size={20} />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Transactions</span>
                            <span className="quick-stat-value">{totalTransactions}</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="profile-tabs">
                    <button
                        className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <User size={18} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Shield size={18} />
                        <span>Security</span>
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <FileText size={18} />
                        <span>Categories</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="profile-main-content">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="profile-content-section">
                        <h2 className="section-main-title">Account Information</h2>

                        <div className="profile-grid">
                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <User size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Full Name</span>
                                    <span className="profile-info-value">{user?.firstName} {user?.lastName}</span>
                                </div>
                                <button className="profile-edit-btn">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <Mail size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Email Address</span>
                                    <span className="profile-info-value">{user?.primaryEmailAddress?.emailAddress}</span>
                                </div>
                                <button className="profile-edit-btn">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <Phone size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Phone Number</span>
                                    <span className="profile-info-value">
                                        {user?.primaryPhoneNumber?.phoneNumber || 'Not provided'}
                                    </span>
                                </div>
                                <button className="profile-edit-btn">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <Calendar size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Member Since</span>
                                    <span className="profile-info-value">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <MapPin size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Location</span>
                                    <span className="profile-info-value">Not set</span>
                                </div>
                                <button className="profile-edit-btn">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon">
                                    <Clock size={20} />
                                </div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Last Updated</span>
                                    <span className="profile-info-value">
                                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <h2 className="section-main-title" style={{ marginTop: '2rem' }}>Data Management</h2>
                        <div className="profile-actions-grid">
                            <button className="profile-action-card">
                                <Download size={24} />
                                <span>Export Data</span>
                                <p>Download all your financial data</p>
                            </button>
                            <button className="profile-action-card">
                                <Upload size={24} />
                                <span>Import Data</span>
                                <p>Upload transactions from file</p>
                            </button>
                            <button className="profile-action-card danger">
                                <Trash2 size={24} />
                                <span>Delete Account</span>
                                <p>Permanently remove your account</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="profile-content-section">
                        <h2 className="section-main-title">Preferences</h2>

                        <div className="settings-list">
                            <button className="profile-settings-item" onClick={toggleTheme}>
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Appearance</span>
                                        <span className="settings-item-desc">
                                            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <Bell size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Notifications</span>
                                        <span className="settings-item-desc">Email, push, and alerts</span>
                                    </div>
                                </div>
                                <div className="toggle-switch">
                                    <div className="toggle-slider"></div>
                                </div>
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <DollarSign size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Currency</span>
                                        <span className="settings-item-desc">USD ($)</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Date Format</span>
                                        <span className="settings-item-desc">MM/DD/YYYY</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="profile-content-section">
                        <h2 className="section-main-title">Security & Privacy</h2>

                        <div className="settings-list">
                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <Shield size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Two-Factor Authentication</span>
                                        <span className="settings-item-desc">Add extra security to your account</span>
                                    </div>
                                </div>
                                <div className="toggle-switch">
                                    <div className="toggle-slider"></div>
                                </div>
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Payment Methods</span>
                                        <span className="settings-item-desc">Manage saved payment cards</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <FileText size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Privacy Settings</span>
                                        <span className="settings-item-desc">Control your data sharing</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <Activity size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Login Activity</span>
                                        <span className="settings-item-desc">View recent login history</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>
                        </div>

                        <h2 className="section-main-title" style={{ marginTop: '2rem' }}>Support</h2>
                        <div className="settings-list">
                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <HelpCircle size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Help Center</span>
                                        <span className="settings-item-desc">FAQs and support articles</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon">
                                        <FileText size={20} />
                                    </div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Terms & Privacy Policy</span>
                                        <span className="settings-item-desc">Legal information</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="profile-content-section">
                        <h2 className="section-main-title">Category Management</h2>
                        <p className="section-description">
                            Customize your transaction categories to better organize your finances
                        </p>
                        <div className="profile-category-manager">
                            <CategoryManager />
                        </div>
                    </div>
                )}

                {/* Sign Out Button */}
                <button
                    className="profile-signout-button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <>
                            <div className="signout-spinner" />
                            Signing Out...
                        </>
                    ) : (
                        <>
                            <LogOut size={20} />
                            Sign Out
                        </>
                    )}
                </button>

                {/* Footer */}
                <div className="profile-footer">
                    <p>Financial Tracker v1.0.0</p>
                    <p>© 2025 All rights reserved</p>
                </div>
            </div>
        </div>
    );
};
