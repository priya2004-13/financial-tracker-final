// client/src/pages/ProfilePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../contexts/themeContext';
import {
    User,
    Mail,
    Calendar,
    Settings,
    LogOut,
    Moon,
    Sun,
    HelpCircle,
    ChevronRight,
    Bell,
    Shield,
    CreditCard,
    FileText
} from 'lucide-react';
import { CategoryManager } from '../components/CategoryManager';
import './ProfilePage.css';

export const ProfilePage = () => {
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
        <div className="profile-page-container">
            <div className="profile-header-card">
                <div className="profile-avatar-large">
                    {user?.imageUrl ? (
                        <img src={user.imageUrl} alt={user.firstName || 'User'} />
                    ) : (
                        <User size={48} />
                    )}
                </div>
                <div className="profile-user-info">
                    <h2 className="profile-user-name">
                        {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="profile-user-email">
                        {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <span className="profile-member-badge">
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                </div>
            </div>

            <div className="profile-section">
                <h3 className="profile-section-title">Account Details</h3>

                <div className="profile-info-card">
                    <div className="profile-info-icon">
                        <User size={20} />
                    </div>
                    <div className="profile-info-content">
                        <span className="profile-info-label">Full Name</span>
                        <span className="profile-info-value">{user?.firstName} {user?.lastName}</span>
                    </div>
                </div>

                <div className="profile-info-card">
                    <div className="profile-info-icon">
                        <Mail size={20} />
                    </div>
                    <div className="profile-info-content">
                        <span className="profile-info-label">Email Address</span>
                        <span className="profile-info-value">{user?.primaryEmailAddress?.emailAddress}</span>
                    </div>
                </div>

                <div className="profile-info-card">
                    <div className="profile-info-icon">
                        <Calendar size={20} />
                    </div>
                    <div className="profile-info-content">
                        <span className="profile-info-label">Account Created</span>
                        <span className="profile-info-value">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="profile-section">
                <h3 className="profile-section-title">Settings & Preferences</h3>

                <button className="profile-settings-item" onClick={toggleTheme}>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Theme</span>
                            <span className="settings-item-desc">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>

                <button className="profile-settings-item" disabled>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            <Bell size={20} />
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Notifications</span>
                            <span className="settings-item-desc">Manage alerts</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>

                <button className="profile-settings-item" disabled>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            <Shield size={20} />
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Privacy & Security</span>
                            <span className="settings-item-desc">Control your data</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>

                <button className="profile-settings-item" disabled>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            <CreditCard size={20} />
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Payment Methods</span>
                            <span className="settings-item-desc">Manage cards</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>
            </div>

            <div className="profile-section">
                <h3 className="profile-section-title">Category Management</h3>
                <div className="profile-category-manager">
                    <CategoryManager />
                </div>
            </div>

            <div className="profile-section">
                <h3 className="profile-section-title">Support & Resources</h3>

                <button className="profile-settings-item" disabled>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            <HelpCircle size={20} />
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Help Center</span>
                            <span className="settings-item-desc">Get support</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>

                <button className="profile-settings-item" disabled>
                    <div className="settings-item-left">
                        <div className="settings-item-icon">
                            <FileText size={20} />
                        </div>
                        <div className="settings-item-content">
                            <span className="settings-item-label">Terms & Privacy</span>
                            <span className="settings-item-desc">Legal information</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="settings-item-arrow" />
                </button>
            </div>

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

            <div className="profile-footer">
                <p>Financial Tracker v1.0.0</p>
                <p>© 2024 All rights reserved</p>
            </div>
        </div>
    );
};
