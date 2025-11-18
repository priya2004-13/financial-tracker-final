// client/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ✅ Custom Auth
import { useTheme } from '../contexts/themeContext';
import { useFinancialRecords } from '../contexts/financial-record-context';
import {
    User, Mail, Calendar, LogOut, Moon, Sun, HelpCircle,
    ChevronRight, Bell, Shield, CreditCard, FileText,
    Settings, TrendingUp, DollarSign, Target, Activity,
    Award, Clock, MapPin, Phone, Edit2, Download, Upload,
    Trash2, Save, X
} from 'lucide-react';
import { CategoryManager } from '../components/CategoryManager';
import './ProfilePage.css';

export const ProfilePage = () => {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { records } = useFinancialRecords();

    // State management
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'categories'>('overview');

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    });

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    // Handle Input Changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Save Profile Changes
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel Editing
    const handleCancelEdit = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
        setIsEditing(false);
    };

    // Stats Calculation
    const totalTransactions = records?.length || 0;
    const totalIncome = records?.filter(r => r.category === 'Income').reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalExpenses = records?.filter(r => r.category !== 'Income').reduce((sum, r) => sum + r.amount, 0) || 0;
    const netBalance = totalIncome - totalExpenses;

    const accountAge = user?.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) return;
        setIsSigningOut(true);
        setTimeout(() => {
            logout();
            navigate('/auth');
        }, 800);
    };

    return (
        <div className="profile-page-wrapper">
            {/* Sidebar */}
            <div className="profile-sidebar">
                <div className="profile-hero-card">
                    <div className="profile-hero-bg"></div>
                    <div className="profile-hero-content">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-large">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" />
                                ) : (
                                    <User size={48} />
                                )}
                            </div>
                            {/* Avatar Edit could be implemented with file upload later */}
                            <button className="profile-avatar-edit" title="Change Avatar (Coming Soon)">
                                <Edit2 size={14} />
                            </button>
                        </div>
                        <div className="profile-user-info">
                            <h2 className="profile-user-name">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p className="profile-user-email">{user?.email}</p>
                            <div className="profile-badges">
                                <span className="profile-badge primary">
                                    <Award size={12} /> Premium
                                </span>
                                <span className="profile-badge">
                                    <Clock size={12} /> {accountAge} days
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="profile-quick-stats">
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon income"><TrendingUp size={20} /></div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Income</span>
                            <span className="quick-stat-value">${totalIncome.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className="quick-stat-item">
                        <div className="quick-stat-icon expense"><DollarSign size={20} /></div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-label">Expense</span>
                            <span className="quick-stat-value">${totalExpenses.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="profile-tabs">
                    {[
                        { id: 'overview', icon: User, label: 'Overview' },
                        { id: 'settings', icon: Settings, label: 'Settings' },
                        { id: 'security', icon: Shield, label: 'Security' },
                        { id: 'categories', icon: FileText, label: 'Categories' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id as any)}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="profile-main-content">

                {/* OVERVIEW TAB with Edit Functionality */}
                {activeTab === 'overview' && (
                    <div className="profile-content-section">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="section-main-title" style={{ margin: 0 }}>Account Information</h2>

                            {!isEditing ? (
                                <button className="btn-base btn-edit-profile" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                            ) : (
                                <div className="edit-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-base btn-cancel" onClick={handleCancelEdit} disabled={isSaving}>
                                        <X size={16} /> Cancel
                                    </button>
                                    <button className="btn-base btn-save" onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? <div className="spinner-small" /> : <Save size={16} />} Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="profile-grid">
                            {/* First Name */}
                            <div className={`profile-info-card ${isEditing ? 'editing' : ''}`}>
                                <div className="profile-info-icon"><User size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">First Name</span>
                                    {isEditing ? (
                                        <input
                                            name="firstName"
                                            className="profile-input"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <span className="profile-info-value">{user?.firstName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Last Name */}
                            <div className={`profile-info-card ${isEditing ? 'editing' : ''}`}>
                                <div className="profile-info-icon"><User size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Last Name</span>
                                    {isEditing ? (
                                        <input
                                            name="lastName"
                                            className="profile-input"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <span className="profile-info-value">{user?.lastName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className={`profile-info-card ${isEditing ? 'editing' : ''}`}>
                                <div className="profile-info-icon"><Mail size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Email Address</span>
                                    {isEditing ? (
                                        <input
                                            name="email"
                                            className="profile-input"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <span className="profile-info-value">{user?.email}</span>
                                    )}
                                </div>
                            </div>

                            {/* Phone */}
                            <div className={`profile-info-card ${isEditing ? 'editing' : ''}`}>
                                <div className="profile-info-icon"><Phone size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Phone Number</span>
                                    {isEditing ? (
                                        <input
                                            name="phoneNumber"
                                            className="profile-input"
                                            placeholder="Add phone number"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <span className="profile-info-value">{user?.phoneNumber || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Static Fields */}
                            <div className="profile-info-card">
                                <div className="profile-info-icon"><Calendar size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Member Since</span>
                                    <span className="profile-info-value">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-info-card">
                                <div className="profile-info-icon"><MapPin size={20} /></div>
                                <div className="profile-info-content">
                                    <span className="profile-info-label">Location</span>
                                    <span className="profile-info-value">Global</span>
                                </div>
                            </div>
                        </div>

                        <h2 className="section-main-title" style={{ marginTop: '2rem' }}>Data Management</h2>
                        <div className="profile-actions-grid">
                            <button className="profile-action-card">
                                <Download size={24} />
                                <span>Export Data</span>
                                <p>Download CSV/PDF</p>
                            </button>
                            <button className="profile-action-card danger">
                                <Trash2 size={24} />
                                <span>Delete Account</span>
                                <p>Permanent Action</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
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
                                <div className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}>
                                    <div className="toggle-slider"></div>
                                </div>
                            </button>

                            <button className="profile-settings-item">
                                <div className="settings-item-left">
                                    <div className="settings-item-icon"><Bell size={20} /></div>
                                    <div className="settings-item-content">
                                        <span className="settings-item-label">Notifications</span>
                                        <span className="settings-item-desc">Manage alerts</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="settings-item-arrow" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Other tabs remain mostly static or use other components */}
                {activeTab === 'categories' && (
                    <div className="profile-content-section">
                        <h2 className="section-main-title">Category Management</h2>
                        <CategoryManager />
                    </div>
                )}

                {/* Sign Out */}
                <button
                    className="profile-signout-button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <>
                            <div className="signout-spinner" /> Signing Out...
                        </>
                    ) : (
                        <>
                            <LogOut size={20} /> Sign Out
                        </>
                    )}
                </button>

                <div className="profile-footer">
                    <p>MoneyFlow v1.0.0</p>
                </div>
            </div>
        </div>
    );
};