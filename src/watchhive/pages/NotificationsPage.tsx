import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Link, useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        loading,
        hasMore,
        fetchNotifications,
        fetchMore,
        markAsRead,
        markAllAsRead,
        acceptFollowRequest,
        rejectFollowRequest
    } = useNotifications();

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: fetchMore,
        hasMore,
        isLoading: loading,
    });

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    const getNotificationMessage = (n: any) => {
        const { type, content } = n;
        const actor = <span className="font-extrabold text-[#2D2926]">{content.actorName}</span>;

        switch (type) {
            case 'LIKE':
                return <>{actor} liked your watch entry <strong className="font-bold text-[#2D2926]">{content.entryTitle}</strong></>;
            case 'COMMENT':
                return <>{actor} commented on <strong className="font-bold text-[#2D2926]">{content.entryTitle}</strong>: "{content.contentSnippet}..."</>;
            case 'REPLY':
                return <>{actor} replied to your comment on <strong className="font-bold text-[#2D2926]">{content.entryTitle}</strong></>;
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
            case 'LIKE': return <span className="material-symbols-outlined text-rose-500 fill-1">favorite</span>;
            case 'COMMENT': return <span className="material-symbols-outlined text-blue-500">chat_bubble</span>;
            case 'REPLY': return <span className="material-symbols-outlined text-indigo-500">reply</span>;
            case 'FOLLOW': return <span className="material-symbols-outlined text-emerald-500">person_add</span>;
            case 'FOLLOW_REQUEST': return <span className="material-symbols-outlined text-[#ffb700]">lock_person</span>;
            case 'FOLLOW_ACCEPT': return <span className="material-symbols-outlined text-emerald-600">how_to_reg</span>;
            default: return <span className="material-symbols-outlined text-[#ffb700]">notifications</span>;
        }
    };

    const getLink = (n: any) => {
        if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPT') {
            return `/watch-hive/profile/${n.content.actorId}`;
        }
        return `/watch-hive/entry/${n.content.entryId}`;
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-sans text-[#2D2926]">
            
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-2 rounded-full hover:bg-[#ffb700]/10 text-[#2D2926] transition-colors flex items-center justify-center"
                        title="Go back"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-[#2D2926]">Notifications</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fetchNotifications(1)} 
                        className="p-2 rounded-full hover:bg-[#ffb700]/10 text-[#2D2926] transition-colors flex items-center justify-center"
                        title="Refresh"
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                    {notifications.length > 0 && (
                         <button 
                            onClick={markAllAsRead} 
                            className="bg-[#2D2926] hover:bg-[#2D2926]/90 text-white font-bold py-2 px-4 rounded-full text-xs shadow-sm transition-all"
                        >
                             Mark all read
                         </button>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-4">
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffb700]"></div>
                        <p className="font-bold text-[#2D2926]/50">Loading your activity...</p>
                    </div>
                ) : notifications.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-white rounded-3xl border border-[#ffb700]/10 shadow-sm mt-4">
                        <span className="material-symbols-outlined text-6xl text-[#ffb700] mb-4 opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                        <h3 className="text-2xl font-black text-[#2D2926] mb-2">No notifications yet</h3>
                        <p className="text-[#2D2926]/50 font-medium max-w-sm">When people interact with your cinematic journey or follow you, you'll see the buzz here.</p>
                     </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((n) => (
                            <div key={n.id} className="relative group">
                                <Link
                                    to={getLink(n)}
                                    className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl transition-all shadow-sm border ${
                                        n.isRead 
                                        ? 'bg-white border-[#ffb700]/10 hover:border-[#ffb700]/30 hover:shadow-md' 
                                        : 'bg-[#FFF9F0] border-[#ffb700]/30 hover:bg-white hover:border-[#ffb700]/50'
                                    }`}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                    }}
                                >
                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${n.isRead ? 'bg-[#2D2926]/5' : 'bg-[#ffb700]/10'}`}>
                                        {getNotificationIcon(n.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-[15px] leading-snug text-[#2D2926]/80 mb-1">
                                            {getNotificationMessage(n)}
                                        </p>
                                        <span className="text-xs font-semibold text-[#2D2926]/40 uppercase tracking-wide">
                                            {new Date(n.createdAt).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            }).replace(',', ' at')}
                                        </span>
                                    </div>

                                    {!n.isRead && (
                                        <div className="absolute top-1/2 -translate-y-1/2 right-4 w-3 h-3 bg-[#ffb700] rounded-full shadow-sm"></div>
                                    )}
                                </Link>

                                {n.type === 'FOLLOW_REQUEST' && !n.isRead && (
                                    <div className="mt-2 ml-16 flex gap-3">
                                        <button
                                            className="px-4 py-2 bg-[#ffb700] hover:brightness-105 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                acceptFollowRequest(n.content.requestId!, n.id);
                                            }}
                                        >
                                            Accept Follow Request
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm rounded-xl transition-all"
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
                        
                        {/* Observer for infinite load */}
                        <div ref={observerTarget} className="h-4 w-full mt-4" />
                        
                        {loading && notifications.length > 0 && (
                            <div className="flex justify-center items-center py-6 gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#ffb700]"></div>
                                <span className="text-sm font-bold text-[#2D2926]/40">Fetching more activity...</span>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;
