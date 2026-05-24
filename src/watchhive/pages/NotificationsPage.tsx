import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Link, useNavigate } from 'react-router-dom';
import { BeeLoader, Button } from '../components/common';
import { useUI } from '../contexts';
import { PageLayout } from '../components/layout';

const NotificationsPage: React.FC = () => {
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

    const navigate = useNavigate();
    const { setPageTitle, setPageIcon } = useUI();

    const notificationsRef = useRef(notifications);
    const markAllAsReadRef = useRef(markAllAsRead);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    useEffect(() => {
        markAllAsReadRef.current = markAllAsRead;
    }, [markAllAsRead]);

    useEffect(() => {
        setPageTitle('Notifications');
        setPageIcon('notifications');
    }, [setPageTitle, setPageIcon]);

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: fetchMore,
        hasMore,
        isLoading: loading,
    });

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    // 1. Auto-mark all as read after 2 seconds of viewing the page
    useEffect(() => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (hasUnread && !loading) {
            const timer = setTimeout(() => {
                markAllAsRead();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [notifications, loading, markAllAsRead]);

    // 2. Track tab/window focus to sync notifications automatically when focusing
    useEffect(() => {
        const handleFocus = () => {
            if (document.visibilityState === 'visible' || document.hasFocus()) {
                fetchNotifications(1);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [fetchNotifications]);

    // 3. Fallback: Mark all as read when leaving the page/unmounting
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
        const actor = <span className="font-black text-[#2D2926]">{content.actorName}</span>;

        switch (type) {
            case 'LIKE':
                return <>{actor} liked your watch entry <span className="text-[#ffb700] font-black">{content.entryTitle}</span></>;
            case 'COMMENT':
                return <>{actor} commented on <span className="text-[#ffb700] font-black">{content.entryTitle}</span>: "{content.contentSnippet}..."</>;
            case 'REPLY':
                return <>{actor} replied to your comment on <span className="text-[#ffb700] font-black">{content.entryTitle}</span></>;
            case 'FOLLOW':
                return <>{actor} started following you</>;
            case 'FOLLOW_REQUEST':
                return <>{actor} wants to follow you</>;
            case 'FOLLOW_ACCEPT':
                return <>{actor} accepted your follow request</>;
            case 'FOLLOW_REJECT':
                return <>{actor} rejected your follow request</>;
            case 'SUGGESTION':
                return <>{actor} suggested you watch <span className="text-[#ffb700] font-black">{content.title}</span></>;
            default:
                return 'New activity in your network';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <span className="material-symbols-outlined text-rose-500 fill-1 text-xl">favorite</span>;
            case 'COMMENT': return <span className="material-symbols-outlined text-blue-500 text-xl">chat_bubble</span>;
            case 'REPLY': return <span className="material-symbols-outlined text-indigo-500 text-xl">reply</span>;
            case 'FOLLOW': return <span className="material-symbols-outlined text-emerald-500 text-xl">person_add</span>;
            case 'FOLLOW_REQUEST': return <span className="material-symbols-outlined text-[#ffb700] text-xl">lock_person</span>;
            case 'FOLLOW_ACCEPT': return <span className="material-symbols-outlined text-emerald-600 text-xl">how_to_reg</span>;
            case 'FOLLOW_REJECT': return <span className="material-symbols-outlined text-rose-500 text-xl">person_remove</span>;
            case 'SUGGESTION': return <span className="material-symbols-outlined text-amber-500 text-xl">auto_awesome</span>;
            default: return <span className="material-symbols-outlined text-[#ffb700] text-xl">notifications</span>;
        }
    };

    const getLinkData = (n: any) => {
        if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPT' || n.type === 'FOLLOW_REJECT') {
            return { to: `/watch-hive/profile/${n.content.actorId}` };
        }
        if (n.type === 'SUGGESTION') {
            return { to: '/watch-hive/entries', state: { activeTab: 'suggestions' } };
        }
        return { to: `/watch-hive/entry/${n.content.entryId}` };
    };

    return (
        <PageLayout maxWidth="3xl">
            <div className="flex flex-col gap-6 pb-20 animate-slide-up">
                {/* Premium Header Section */}
                <div className="flex flex-row items-center justify-between pb-4 border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black tracking-tighter text-[#2D2926]">
                            Activity<span className="text-[#ffb700]">Hub</span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => fetchNotifications(1)} 
                            className="!h-9 !px-2.5 sm:!px-3.5 flex items-center gap-1.5 active:scale-95 transition-all"
                            title="Refresh"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Refresh</span>
                        </Button>
                        {notifications.length > 0 && (
                             <Button 
                                variant="secondary"
                                size="sm"
                                onClick={markAllAsRead} 
                                className="!h-9 !px-2.5 sm:!px-3.5 flex items-center gap-1.5 active:scale-95 transition-all"
                                title="Clear All"
                             >
                                 <span className="material-symbols-outlined text-[18px]">done_all</span>
                                 <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Clear All</span>
                             </Button>
                        )}
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/watch-hive/feed');
                                }
                            }}
                            className="!h-9 !px-2.5 sm:!px-3.5 flex items-center gap-1.5 active:scale-95 transition-all"
                            title="Close"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Close</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <BeeLoader size="small" message="Loading your activity..." />
                        </div>
                    ) : notifications.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-24 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/2 relative">
                                <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                                <span className="material-symbols-outlined text-4xl text-slate-200 relative z-10">notifications_off</span>
                            </div>
                            <h3 className="text-2xl font-black text-[#2D2926] mb-2">No activity yet</h3>
                            <p className="text-slate-400 font-bold max-w-xs mx-auto leading-relaxed mb-6">
                                When people interact with your cinematic journey or follow you, you'll see the buzz here.
                            </p>
                            <button
                                onClick={() => navigate('/watch-hive/feed')}
                                className="bg-[#ffb700] hover:brightness-105 text-white font-black py-3.5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#ffb700]/20 active:scale-95"
                            >
                                Back to Feed
                            </button>
                         </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {notifications.map((n) => (
                                <div key={n.id} className="relative group">
                                    <Link
                                        {...getLinkData(n)}
                                        className={`flex items-start gap-4 p-5 rounded-[28px] transition-all duration-300 border hover:-translate-y-0.5 ${
                                            n.isRead 
                                            ? 'bg-white border-black/5 hover:border-[#ffb700]/30 hover:shadow-xl hover:shadow-black/5' 
                                            : 'bg-gradient-to-br from-[#ffb700]/5 to-transparent border-[#ffb700]/15 hover:bg-white hover:border-[#ffb700]/30 hover:shadow-xl hover:shadow-black/5 shadow-sm shadow-[#ffb700]/2'
                                        }`}
                                        onClick={() => {
                                            if (!n.isRead) markAsRead(n.id);
                                        }}
                                    >
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-300 ${n.isRead ? 'bg-slate-50 text-slate-400' : 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/20'}`}>
                                            {getNotificationIcon(n.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 py-1">
                                            <p className="text-[14px] leading-relaxed text-[#2D2926] font-bold">
                                                {getNotificationMessage(n)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                    {new Date(n.createdAt).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {!n.isRead && (
                                                    <span className="w-1.5 h-1.5 bg-[#ffb700] rounded-full animate-pulse" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                                        </div>
                                    </Link>

                                     {n.type === 'FOLLOW_REQUEST' && (
                                         <div className="mt-3 ml-16 flex gap-3">
                                             <button
                                                 className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-[0.15em] rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                                 onClick={(e) => {
                                                     e.preventDefault();
                                                     e.stopPropagation();
                                                     acceptFollowRequest(n.content.requestId!, n.id);
                                                 }}
                                             >
                                                 <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                                 Accept
                                             </button>
                                             <button
                                                 className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 font-black text-[9px] uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                                 onClick={(e) => {
                                                     e.preventDefault();
                                                     e.stopPropagation();
                                                     rejectFollowRequest(n.content.requestId!, n.id);
                                                 }}
                                             >
                                                 <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                                 Decline
                                             </button>
                                         </div>
                                     )}
                                </div>
                            ))}
                            
                            {/* Observer for infinite load */}
                            <div ref={observerTarget} className="h-4 w-full mt-4" />
                            
                            {loading && notifications.length > 0 && (
                                <div className="flex justify-center items-center py-6">
                                    <BeeLoader size="small" message="Fetching more activity..." />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default NotificationsPage;
