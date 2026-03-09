import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationsService, { Notification } from '../services/notifications.service';
import followsService from '../services/follows.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    hasMore: boolean;
    fetchNotifications: (page?: number) => Promise<void>;
    fetchMore: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    acceptFollowRequest: (requestId: string, notificationId: string) => Promise<void>;
    rejectFollowRequest: (requestId: string, notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const { user } = useAuth();

    const fetchNotifications = useCallback(async (pageNum = 1) => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await notificationsService.getNotifications(pageNum);
            if (pageNum === 1) {
                setNotifications(data.notifications);
            } else {
                setNotifications(prev => [...prev, ...data.notifications]);
            }
            setUnreadCount(data.unreadCount);
            setHasMore(data.pagination.page * data.pagination.limit < data.unreadCount + data.notifications.length); // Simple heuristic or use total if available
            // Better: notificationsService response has pagination, but let's check hasMore
            // If we got fewer than limit, hasMore = false.
            setHasMore(data.notifications.length === data.pagination.limit);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchMore = useCallback(async () => {
        if (hasMore && !loading) {
            await fetchNotifications(page + 1);
        }
    }, [hasMore, loading, page, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await notificationsService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const acceptFollowRequest = async (requestId: string, notificationId: string) => {
        try {
            await followsService.acceptRequest(requestId);
            await markAsRead(notificationId);
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, type: 'FOLLOW_ACCEPT' as any, isRead: true } : n
            ));
        } catch (error) {
            console.error('Failed to accept follow request:', error);
        }
    };

    const rejectFollowRequest = async (requestId: string, notificationId: string) => {
        try {
            await followsService.rejectRequest(requestId);
            await markAsRead(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to reject follow request:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            hasMore,
            fetchNotifications,
            fetchMore,
            markAsRead,
            markAllAsRead,
            acceptFollowRequest,
            rejectFollowRequest
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
