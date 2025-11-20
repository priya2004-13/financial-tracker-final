// client/src/components/GlobalFeatures.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Download,
    Bell,
    Database,
    X,
    FileDown,
    FileText,
    Table,
    ChevronDown,
    Check,
    AlertCircle,
    Info,
    CheckCircle,
    XCircle,
    Upload,
    Trash2
} from 'lucide-react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { Link } from 'react-router-dom';
import './GlobalFeatures.css';

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

export const GlobalFeatures: React.FC = () => {
    const { records, budget } = useFinancialRecords();

    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Export state
    const [exportOpen, setExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
    const [exportType, setExportType] = useState<'transactions' | 'budget' | 'all'>('transactions');

    // Notifications state
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Backup state
    const [backupOpen, setBackupOpen] = useState(false);
    const [lastBackup, setLastBackup] = useState<Date | null>(null);

    // Generate smart notifications based on financial data
    useEffect(() => {
        const generateNotifications = () => {
            const newNotifications: Notification[] = [];

            // Check if budget is exceeded
            if (budget && budget.categoryBudgets) {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                Object.entries(budget.categoryBudgets).forEach(([category, limit]) => {
                    const spent = records
                        .filter(r => {
                            const date = new Date(r.date);
                            return r.category === category &&
                                date.getMonth() === currentMonth &&
                                date.getFullYear() === currentYear;
                        })
                        .reduce((sum, r) => sum + r.amount, 0);

                    if (spent > limit) {
                        newNotifications.push({
                            id: `budget-${category}-${Date.now()}`,
                            type: 'warning',
                            title: 'Budget Exceeded',
                            message: `You've exceeded your ${category} budget by ₹${(spent - limit).toFixed(2)}`,
                            timestamp: new Date(),
                            read: false
                        });
                    } else if (spent > limit * 0.9) {
                        newNotifications.push({
                            id: `budget-warning-${category}-${Date.now()}`,
                            type: 'info',
                            title: 'Budget Warning',
                            message: `You've used ${((spent / limit) * 100).toFixed(0)}% of your ${category} budget`,
                            timestamp: new Date(),
                            read: false
                        });
                    }
                });
            }

            // Check for recent large transactions
            const recentLarge = records
                .filter(r => {
                    const daysDiff = (Date.now() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 7 && r.amount > 5000;
                });

            if (recentLarge.length > 0) {
                newNotifications.push({
                    id: `large-transaction-${Date.now()}`,
                    type: 'info',
                    title: 'Large Transactions',
                    message: `${recentLarge.length} large transaction(s) in the past week`,
                    timestamp: new Date(),
                    read: false
                });
            }

            // Welcome message if no notifications
            if (newNotifications.length === 0) {
                newNotifications.push({
                    id: `welcome-${Date.now()}`,
                    type: 'success',
                    title: 'All Good!',
                    message: 'Your finances are on track. Keep up the great work!',
                    timestamp: new Date(),
                    read: false
                });
            }

            setNotifications(prev => {
                // Merge with existing, avoiding duplicates
                const existingIds = prev.map(n => n.id);
                const toAdd = newNotifications.filter(n => !existingIds.includes(n.id));
                return [...prev, ...toAdd].slice(0, 20); // Keep max 20 notifications
            });
        };

        generateNotifications();
    }, [records, budget]);

    // Global search across all data
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        const results: Array<{
            type: 'transaction' | 'budget' | 'category';
            title: string;
            description: string;
            link: string;
            amount?: number;
        }> = [];

        // Search transactions
        records.forEach(record => {
            if (
                record.description.toLowerCase().includes(query) ||
                record.category.toLowerCase().includes(query) ||
                record.paymentMethod?.toLowerCase().includes(query)
            ) {
                results.push({
                    type: 'transaction',
                    title: record.description,
                    description: `${record.category} • ${new Date(record.date).toLocaleDateString()}`,
                    link: '/transactions',
                    amount: record.amount
                });
            }
        });

        // Search budget categories
        if (budget && budget.categoryBudgets) {
            Object.entries(budget.categoryBudgets).forEach(([category, limit]) => {
                if (category.toLowerCase().includes(query)) {
                    results.push({
                        type: 'budget',
                        title: `${category} Budget`,
                        description: `Limit: ₹${limit}`,
                        link: '/budget',
                        amount: limit
                    });
                }
            });
        }

        return results.slice(0, 10); // Limit to 10 results
    }, [searchQuery, records, budget]);

    // Export functionality
    const handleExport = () => {
        let data: any[] = [];
        let filename = '';

        if (exportType === 'transactions' || exportType === 'all') {
            data = records.map(r => ({
                date: new Date(r.date).toLocaleDateString(),
                description: r.description,
                category: r.category,
                amount: r.amount,
                paymentMethod: r.paymentMethod || 'N/A'
            }));
            filename = 'transactions';
        }

        if (exportType === 'budget' || exportType === 'all') {
            if (budget) {
                const budgetData = {
                    monthlySalary: budget.monthlySalary,
                    categoryBudgets: budget.categoryBudgets
                };

                if (exportType === 'all') {
                    data.push({ type: 'budget', data: budgetData });
                    filename = 'financial-data';
                } else {
                    data = [budgetData];
                    filename = 'budget';
                }
            }
        }

        if (exportFormat === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadFile(blob, `${filename}.json`);
        } else if (exportFormat === 'csv' && exportType !== 'all') {
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            downloadFile(blob, `${filename}.csv`);
        } else {
            alert('PDF export coming soon!');
        }

        setExportOpen(false);
    };

    const convertToCSV = (data: any[]) => {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj =>
            Object.values(obj).map(val =>
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    };

    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Backup functionality
    const handleBackup = () => {
        const backupData = {
            records,
            budget,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        downloadFile(blob, `financial-backup-${new Date().toISOString().split('T')[0]}.json`);

        setLastBackup(new Date());
        alert('Backup created successfully!');
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);
                console.log('Backup data loaded:', backupData);
                alert('Backup file validated! Restore functionality would update your data here.');
                // In production, you would dispatch actions to update the context/state
            } catch (error) {
                alert('Invalid backup file!');
            }
        };
        reader.readAsText(file);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="global-features">
            {/* Global Search Button */}
            <button
                className="global-feature-btn"
                onClick={() => setSearchOpen(true)}
                title="Global Search (Ctrl+K)"
            >
                <Search size={20} />
            </button>

            {/* Export Button */}
            <button
                className="global-feature-btn"
                onClick={() => setExportOpen(true)}
                title="Export Data"
            >
                <Download size={20} />
            </button>

            {/* Notifications Button */}
            <button
                className="global-feature-btn notification-btn"
                onClick={() => setNotificationsOpen(true)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {/* Backup Button */}
            <button
                className="global-feature-btn"
                onClick={() => setBackupOpen(true)}
                title="Backup & Restore"
            >
                <Database size={20} />
            </button>

            {/* Search global-modal */}
            {searchOpen && (
                <div className="global-modal-overlay" onClick={() => setSearchOpen(false)}>
                    <div className="global-modal-content search-global-modal" onClick={e => e.stopPropagation()}>
                        <div className="global-modal-header">
                            <h3><Search size={20} /> Global Search</h3>
                            <button className="global-modal-close" onClick={() => setSearchOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="search-input-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search transactions, budgets, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="search-input"
                            />
                        </div>

                        <div className="search-results">
                            {searchQuery.trim() === '' ? (
                                <div className="search-empty">
                                    <Info size={40} />
                                    <p>Start typing to search across all your financial data</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="search-empty">
                                    <AlertCircle size={40} />
                                    <p>No results found for "{searchQuery}"</p>
                                </div>
                            ) : (
                                searchResults.map((result, index) => (
                                    <Link
                                        key={index}
                                        to={result.link}
                                        className="search-result-item"
                                        onClick={() => setSearchOpen(false)}
                                    >
                                        <div className="search-result-icon">
                                            {result.type === 'transaction' && <FileText size={18} />}
                                            {result.type === 'budget' && <Table size={18} />}
                                            {result.type === 'category' && <ChevronDown size={18} />}
                                        </div>
                                        <div className="search-result-content">
                                            <div className="search-result-title">{result.title}</div>
                                            <div className="search-result-desc">{result.description}</div>
                                        </div>
                                        {result.amount !== undefined && (
                                            <div className="search-result-amount">
                                                ₹{result.amount.toFixed(2)}
                                            </div>
                                        )}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Export global-modal */}
            {exportOpen && (
                <div className="global-modal-overlay" onClick={() => setExportOpen(false)}>
                    <div className="global-modal-content export-global-modal" onClick={e => e.stopPropagation()}>
                        <div className="global-modal-header">
                            <h3><Download size={20} /> Export Center</h3>
                            <button className="global-modal-close" onClick={() => setExportOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="export-options">
                            <div className="option-group">
                                <label>Export Type</label>
                                <div className="option-buttons">
                                    <button
                                        className={`option-btn ${exportType === 'transactions' ? 'active' : ''}`}
                                        onClick={() => setExportType('transactions')}
                                    >
                                        <FileText size={18} />
                                        Transactions
                                    </button>
                                    <button
                                        className={`option-btn ${exportType === 'budget' ? 'active' : ''}`}
                                        onClick={() => setExportType('budget')}
                                    >
                                        <Table size={18} />
                                        Budget
                                    </button>
                                    <button
                                        className={`option-btn ${exportType === 'all' ? 'active' : ''}`}
                                        onClick={() => setExportType('all')}
                                    >
                                        <Database size={18} />
                                        All Data
                                    </button>
                                </div>
                            </div>

                            <div className="option-group">
                                <label>Format</label>
                                <div className="option-buttons">
                                    <button
                                        className={`option-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                                        onClick={() => setExportFormat('csv')}
                                    >
                                        <FileDown size={18} />
                                        CSV
                                    </button>
                                    <button
                                        className={`option-btn ${exportFormat === 'json' ? 'active' : ''}`}
                                        onClick={() => setExportFormat('json')}
                                    >
                                        <FileText size={18} />
                                        JSON
                                    </button>
                                    <button
                                        className={`option-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                                        onClick={() => setExportFormat('pdf')}
                                    >
                                        <FileDown size={18} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="export-info">
                            <Info size={16} />
                            <span>Exporting {records.length} transactions</span>
                        </div>

                        <button className="global-export-btn primary-btn" onClick={handleExport}>
                            <Download size={18} />
                            Export {exportFormat.toUpperCase()}
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications global-modal */}
            {notificationsOpen && (
                <div className="global-modal-overlay" onClick={() => setNotificationsOpen(false)}>
                    <div className="global-modal-content notifications-global-modal" onClick={e => e.stopPropagation()}>
                        <div className="global-modal-header">
                            <h3>
                                <Bell size={20} />
                                Notifications
                                {unreadCount > 0 && <span className="unread-count">({unreadCount})</span>}
                            </h3>
                            <div className="header-actions">
                                <button className="text-btn" onClick={clearNotifications}>
                                    <Trash2 size={16} />
                                    Clear All
                                </button>
                                <button className="global-modal-close" onClick={() => setNotificationsOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="notifications-list">
                            {notifications.length === 0 ? (
                                <div className="notifications-empty">
                                    <Bell size={40} />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.type} ${notification.read ? 'read' : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="notification-icon">
                                            {notification.type === 'success' && <CheckCircle size={20} />}
                                            {notification.type === 'error' && <XCircle size={20} />}
                                            {notification.type === 'warning' && <AlertCircle size={20} />}
                                            {notification.type === 'info' && <Info size={20} />}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">{notification.title}</div>
                                            <div className="notification-message">{notification.message}</div>
                                            <div className="notification-time">
                                                {notification.timestamp.toLocaleTimeString()} • {notification.timestamp.toLocaleDateString()}
                                            </div>
                                        </div>
                                        {!notification.read && <div className="unread-dot" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Backup global-modal */}
            {backupOpen && (
                <div className="global-modal-overlay" onClick={() => setBackupOpen(false)}>
                    <div className="global-modal-content backup-global-modal" onClick={e => e.stopPropagation()}>
                        <div className="global-modal-header">
                            <h3><Database size={20} /> Backup & Restore</h3>
                            <button className="global-modal-close" onClick={() => setBackupOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="backup-section">
                            <div className="backup-card">
                                <div className="backup-icon">
                                    <Download size={32} />
                                </div>
                                <h4>Create Backup</h4>
                                <p>Download all your financial data as a secure backup file</p>
                                {lastBackup && (
                                    <div className="last-backup">
                                        Last backup: {lastBackup.toLocaleString()}
                                    </div>
                                )}
                                <button className="backup-btn primary-btn" onClick={handleBackup}>
                                    <Download size={18} />
                                    Create Backup
                                </button>
                            </div>

                            <div className="backup-card">
                                <div className="backup-icon">
                                    <Upload size={32} />
                                </div>
                                <h4>Restore Backup</h4>
                                <p>Upload a backup file to restore your financial data</p>
                                <label className="backup-btn secondary-btn">
                                    <Upload size={18} />
                                    Select Backup File
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleRestore}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="backup-info">
                            <AlertCircle size={16} />
                            <span>Backup files contain all transactions, budgets, and settings. Store them securely!</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
