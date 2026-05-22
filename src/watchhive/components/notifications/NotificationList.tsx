import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import './NotificationList.css';

interface NotificationListProps {
    onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
    const { notifications, loading, markAsRead, markAllAsRead, acceptFollowRequest, rejectFollowRequest } = useNotifications();

    const notificationsRef = useRef(notifications);
    const markAllAsReadRef = useRef(markAllAsRead);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    useEffect(() => {
        markAllAsReadRef.current = markAllAsRead;
    }, [markAllAsRead]);

    // 1. Auto-mark all as read after 2 seconds of the list being open
    useEffect(() => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (hasUnread && !loading) {
            const timer = setTimeout(() => {
                markAllAsRead();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [notifications, loading, markAllAsRead]);

    // 2. Fallback: Mark all as read when the list is closed/unmounted
    useEffect(() => {
        return () => {
            const hasUnread = notificationsRef.current.some(n => !n.isRead);
            if (hasUnread) {
                markAllAsReadRef.current();
            }
        };
    }, []);

    const getNotificationMessage = (n: any) => {
        const { type, content } = n;
        const actor = <span className="actor-name">{content.actorName}</span>;

        switch (type) {
            case 'LIKE':
                return <>{actor} liked your watch entry <strong>{content.entryTitle}</strong></>;
            case 'COMMENT':
                return <>{actor} commented on <strong>{content.entryTitle}</strong>: "{content.contentSnippet}..."</>;
            case 'REPLY':
                return <>{actor} replied to your comment on <strong>{content.entryTitle}</strong></>;
            case 'FOLLOW':
                return <>{actor} started following you</>;
            case 'FOLLOW_REQUEST':
                return <>{actor} wants to follow you</>;
            case 'FOLLOW_ACCEPT':
                return <>{actor} accepted your follow request</>;
            case 'FOLLOW_REJECT':
                return <>{actor} rejected your follow request</>;
            default:
                return 'New activity in your network';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return '❤️';
            case 'COMMENT': return '💬';
            case 'REPLY': return '↪️';
            case 'FOLLOW': return '👤';
            case 'FOLLOW_REQUEST': return '🔒';
            case 'FOLLOW_ACCEPT': return '✅';
            case 'FOLLOW_REJECT': return '❌';
            default: return '🔔';
        }
    };

    const getLink = (n: any) => {
        if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPT' || n.type === 'FOLLOW_REJECT') {
            return `/watch-hive/profile/${n.content.actorId}`;
        }
        return `/watch-hive/entry/${n.content.entryId}`;
    };

    return (
        <div className="notification-list">
            <div className="notification-list-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                    <button className="mark-all-btn" onClick={markAllAsRead}>Mark all read</button>
                )}
            </div>

            <div className="notification-items">
                {loading && notifications.length === 0 && (
                    <div className="notification-empty">Loading...</div>
                )}

                {!loading && notifications.length === 0 && (
                    <div className="notification-empty">No new notifications</div>
                )}

                {notifications.map((n) => (
                    <div key={n.id} className={`notification-item-container ${n.isRead ? 'read' : 'unread'}`}>
                        <Link
                            to={getLink(n)}
                            className="notification-item"
                            onClick={() => {
                                if (!n.isRead) markAsRead(n.id);
                                onClose();
                            }}
                        >
                            <div className="notification-icon">{getNotificationIcon(n.type)}</div>
                            <div className="notification-content">
                                <p>{getNotificationMessage(n)}</p>
                                <span className="notification-time">
                                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {!n.isRead && <div className="unread-indicator" />}
                        </Link>

                        {n.type === 'FOLLOW_REQUEST' && (
                            <div className="notification-actions">
                                <button
                                    className="accept-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        acceptFollowRequest(n.content.requestId!, n.id);
                                    }}
                                >
                                    Accept
                                </button>
                                <button
                                    className="reject-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        rejectFollowRequest(n.content.requestId!, n.id);
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="notification-list-footer">
                <Link to="/watch-hive/notifications" onClick={onClose}>View all activity</Link>
            </div>
        </div>
    );
};

export default NotificationList;
