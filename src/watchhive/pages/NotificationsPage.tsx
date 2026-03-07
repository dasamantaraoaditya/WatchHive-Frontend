import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
    const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, acceptFollowRequest, rejectFollowRequest } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

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
            default: return '🔔';
        }
    };

    const getLink = (n: any) => {
        if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPT') {
            return `/watch-hive/profile/${n.content.actorId}`;
        }
        return `/watch-hive/entry/${n.content.entryId}`;
    };

    return (
        <div className="notifications-page-container">
            <div className="notifications-header">
                <h1>Notifications</h1>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchNotifications}>Refresh</button>
                    {notifications.length > 0 && (
                        <button className="mark-all-btn" onClick={markAllAsRead}>Mark all as read</button>
                    )}
                </div>
            </div>

            <div className="notifications-card">
                {loading && notifications.length === 0 ? (
                    <div className="loading-state">Loading your activity...</div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <h3>No notifications yet</h3>
                        <p>When people interact with your content or follow you, you'll see it here.</p>
                    </div>
                ) : (
                    <div className="notifications-list-full">
                        {notifications.map((n) => (
                            <div key={n.id} className={`notification-row-wrapper ${n.isRead ? 'read' : 'unread'}`}>
                                <Link
                                    to={getLink(n)}
                                    className="notification-row"
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                    }}
                                >
                                    <div className="row-icon">{getNotificationIcon(n.type)}</div>
                                    <div className="row-content">
                                        <p>{getNotificationMessage(n)}</p>
                                        <span className="row-time">
                                            {new Date(n.createdAt).toLocaleString([], {
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {!n.isRead && <div className="row-unread-badge">New</div>}
                                </Link>

                                {n.type === 'FOLLOW_REQUEST' && !n.isRead && (
                                    <div className="row-actions">
                                        <button
                                            className="accept-btn-full"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                acceptFollowRequest(n.content.requestId!, n.id);
                                            }}
                                        >
                                            Accept Follow Request
                                        </button>
                                        <button
                                            className="reject-btn-full"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                rejectFollowRequest(n.content.requestId!, n.id);
                                            }}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
