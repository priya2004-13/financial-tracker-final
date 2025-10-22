// client/src/components/Notifications.tsx
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    Notification as NotificationType,
    fetchNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../../services/api';
import { Bell, AlertCircle, CheckCircle, Info, AlertTriangle, X, Check } from 'lucide-react';
import './Notifications.css';

export const Notifications = () => {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            loadUnreadCount();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await fetchNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        if (!user) return;
        try {
            const { count } = await getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            await loadNotifications();
            await loadUnreadCount();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsRead(user.id);
            await loadNotifications();
            await loadUnreadCount();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            await deleteNotification(notificationId);
            await loadNotifications();
            await loadUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'anomaly':
                return <AlertTriangle size={20} />;
            case 'budget_warning':
                return <AlertCircle size={20} />;
            case 'goal_achieved':
                return <CheckCircle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getSeverityClass = (severity: string) => {
        return `notification-${severity}`;
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    return (
        <div className="notifications-wrapper">
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                className="btn-mark-all-read"
                                onClick={handleMarkAllAsRead}
                            >
                                <Check size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {isLoading ? (
                            <div className="notifications-loading">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notifications-empty">
                                <Bell size={48} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${getSeverityClass(notification.severity)} ${!notification.isRead ? 'unread' : ''}`}
                                >
                                    <div className="notification-icon">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <h4>{notification.title}</h4>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">
                                            {notification.createdAt && formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="btn-read"
                                                onClick={() => handleMarkAsRead(notification._id!)}
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            className="btn-delete-notif"
                                            onClick={() => handleDelete(notification._id!)}
                                            title="Delete"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};