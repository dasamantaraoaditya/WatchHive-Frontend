import api from './api';

export interface Notification {
    id: string;
    userId: string;
    type: 'FOLLOW' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPT' | 'FOLLOW_REJECT' | 'LIKE' | 'COMMENT' | 'REPLY' | 'MENTION' | 'SUGGESTION' | 'FRIEND_STARTED_WATCHING' | 'FRIEND_LOGGED_WATCH';
    content: {
        actorId: string;
        actorName: string;
        actorAvatar?: string | null;
        entryId?: string;
        entryTitle?: string;
        commentId?: string;
        contentSnippet?: string;
        requestId?: string;
        rating?: number | null;
        review?: string | null;
        isWatching?: boolean;
        tmdbId?: number | null;
    };
    isRead: boolean;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
    };
}

export const notificationsService = {
    getNotifications: async (page = 1, limit = 10) => {
        return await api.get<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}`);
    },

    getUnreadCount: async () => {
        const data = await api.get<{ count: number }>('/notifications/unread-count');
        return data.count;
    },

    markAsRead: async (notificationId: string) => {
        return await api.patch(`/notifications/${notificationId}/read`);
    },

    markAllAsRead: async () => {
        return await api.patch('/notifications/read-all');
    }
};

export default notificationsService;
