import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Link } from 'react-router-dom';
import { BeeLoader } from '../components/common';
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

    const { setPageTitle, setPageIcon } = useUI();

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
            case 'SUGGESTION': return <span className="material-symbols-outlined text-amber-500 text-xl">auto_awesome</span>;
            default: return <span className="material-symbols-outlined text-[#ffb700] text-xl">notifications</span>;
        }
    };

    const getLinkData = (n: any) => {
        if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPT') {
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
                {/* Custom Header Section */}
                <div className="flex items-center justify-between pb-4 border-b border-black/5">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tighter text-[#2D2926]">Activity</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buzz from your hive</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchNotifications(1)} 
                            className="w-10 h-10 rounded-2xl hover:bg-slate-100 text-[#2D2926] transition-all flex items-center justify-center bg-white border border-black/5 shadow-sm"
                            title="Refresh"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                        </button>
                        {notifications.length > 0 && (
                             <button 
                                onClick={markAllAsRead} 
                                className="bg-[#2D2926] hover:bg-black text-white font-black py-3 px-6 rounded-2xl text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-black/5"
                            >
                                 Clear All
                             </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <BeeLoader size="small" message="Loading your activity..." />
                        </div>
                    ) : notifications.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-24 text-center px-8 bg-white rounded-[40px] border border-black/5 shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-slate-200">notifications_off</span>
                            </div>
                            <h3 className="text-2xl font-black text-[#2D2926] mb-2">No notifications yet</h3>
                            <p className="text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                                When people interact with your cinematic journey or follow you, you'll see the buzz here.
                            </p>
                         </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {notifications.map((n) => (
                                <div key={n.id} className="relative group">
                                    <Link
                                        {...getLinkData(n)}
                                        className={`flex items-start gap-4 p-5 rounded-[28px] transition-all border ${
                                            n.isRead 
                                            ? 'bg-white border-black/5 hover:border-[#ffb700]/30 hover:shadow-xl hover:shadow-black/5' 
                                            : 'bg-[#ffb700]/5 border-[#ffb700]/20 hover:bg-white hover:border-[#ffb700]/50'
                                        }`}
                                        onClick={() => {
                                            if (!n.isRead) markAsRead(n.id);
                                        }}
                                    >
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors ${n.isRead ? 'bg-slate-50 text-slate-400' : 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/20'}`}>
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
                                                    <span className="w-1.5 h-1.5 bg-[#ffb700] rounded-full" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                                        </div>
                                    </Link>

                                    {n.type === 'FOLLOW_REQUEST' && !n.isRead && (
                                        <div className="mt-3 ml-16 flex gap-3">
                                            <button
                                                className="px-6 py-2.5 bg-[#ffb700] hover:brightness-105 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-[#ffb700]/10 transition-all"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    acceptFollowRequest(n.content.requestId!, n.id);
                                                }}
                                            >
                                                Accept Request
                                            </button>
                                            <button
                                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
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
