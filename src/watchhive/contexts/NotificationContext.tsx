import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationsService, { Notification } from '../services/notifications.service';
import followsService from '../services/follows.service';
import { useAuth } from './AuthContext';
import { NotificationToast } from '../components/notifications/NotificationToast';
import { PushPromptModal } from '../components/notifications/PushPromptModal';
import pushNotificationService from '../services/pushNotification.service';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    fetchNotifications: (page?: number) => Promise<void>;
    fetchMore: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    acceptFollowRequest: (requestId: string, notificationId: string) => Promise<void>;
    rejectFollowRequest: (requestId: string, notificationId: string) => Promise<void>;
    isPushSupported: boolean;
    pushPermission: NotificationPermission;
    subscribePush: () => Promise<boolean>;
    unsubscribePush: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState<{ id: string; notification: Notification } | null>(null);

    const [pushPermission, setPushPermission] = useState<NotificationPermission>(
        pushNotificationService.getPermissionState()
    );
    const isPushSupported = pushNotificationService.isSupported();

    const { user } = useAuth();

    const fetchNotifications = useCallback(async (pageNum = 1) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const data = await notificationsService.getNotifications(pageNum);
            if (pageNum === 1) {
                setNotifications(data.notifications);
            } else {
                setNotifications(prev => [...prev, ...data.notifications]);
            }
            setUnreadCount(data.unreadCount);
            setHasMore(data.notifications.length === data.pagination.limit);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Failed to fetch notifications:', err);
            setError('Unable to connect to WatchHive servers right now. Please check your connection or try again later.');
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

    const subscribePush = async () => {
        const success = await pushNotificationService.subscribe();
        setPushPermission(pushNotificationService.getPermissionState());
        return success;
    };

    const unsubscribePush = async () => {
        const success = await pushNotificationService.unsubscribe();
        setPushPermission(pushNotificationService.getPermissionState());
        return success;
    };

    // Initial fetch & SSE Real-time connection setup
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications(1);

        // Connect via SSE for instant in-app delivery
        const token = localStorage.getItem('token');
        if (!token) return;

        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const sseUrl = `${backendUrl.replace(/\/api\/v1\/?$/, '')}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;

        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource(sseUrl);

            eventSource.addEventListener('connected', (e: any) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.unreadCount !== undefined) {
                        setUnreadCount(data.unreadCount);
                    }
                } catch {}
            });

            eventSource.addEventListener('notification', (e: any) => {
                try {
                    const newNotification: Notification = JSON.parse(e.data);
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    setToast({ id: `${newNotification.id}-${Date.now()}`, notification: newNotification });
                } catch (err) {
                    console.error('[SSE] Error processing notification event:', err);
                }
            });

            eventSource.addEventListener('unread-count', (e: any) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.count !== undefined) {
                        setUnreadCount(data.count);
                    }
                } catch {}
            });

            eventSource.onerror = (err) => {
                console.warn('[SSE] EventSource connection issue. Auto-reconnecting...', err);
            };
        } catch (err) {
            console.error('[SSE] Failed to establish EventSource:', err);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [user, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            error,
            hasMore,
            fetchNotifications,
            fetchMore,
            markAsRead,
            markAllAsRead,
            acceptFollowRequest,
            rejectFollowRequest,
            isPushSupported,
            pushPermission,
            subscribePush,
            unsubscribePush
        }}>
            {children}
            <NotificationToast toast={toast} onClose={() => setToast(null)} />
            <PushPromptModal />
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
