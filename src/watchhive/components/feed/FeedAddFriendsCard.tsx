import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { Avatar } from '../common';
import { useNavigate } from 'react-router-dom';

interface FeedAddFriendsCardProps {
    suggestedUsers: User[];
    onFollow: (userId: string) => Promise<void>;
    onDismiss: () => void;
}

export const FeedAddFriendsCard: React.FC<FeedAddFriendsCardProps> = ({
    suggestedUsers,
    onFollow,
    onDismiss,
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
        }
    };

    const handleFollowClick = async (targetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (loadingMap[targetId] || followingMap[targetId]) return;

        setLoadingMap(prev => ({ ...prev, [targetId]: true }));
        try {
            await onFollow(targetId);
            setFollowingMap(prev => ({ ...prev, [targetId]: true }));
        } catch (err) {
            console.error('Failed to follow suggested user', err);
        } finally {
            setLoadingMap(prev => ({ ...prev, [targetId]: false }));
        }
    };

    const handleProfileClick = (targetId: string) => {
        if (!targetId) return;
        navigate(`/watch-hive/profile/${targetId}`);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF6F0] to-[#F5ECE0] border border-[#E8DCC8] p-5 shadow-sm transition-all">
            {/* Header with Icon, Title, and Dismiss Button */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-700 text-[22px]">group_add</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Diversify Your Hive Feed & Swarm
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Recommended
                            </span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Connect with fellow cinephiles to populate your feed with varied movie ratings, reviews, and community buzz.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss banner"
                    className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                    title="Dismiss"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            {/* Inline Suggested Friends Horizontal Scroll Container */}
            {suggestedUsers && suggestedUsers.length > 0 && (
                <div className="mt-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-amber-600">auto_awesome</span>
                            Suggested Friends to Follow
                        </span>
                        <div className="flex items-center gap-1">
                            {suggestedUsers.length > 2 && (
                                <div className="flex items-center gap-0.5 mr-1">
                                    <button
                                        type="button"
                                        onClick={scrollLeft}
                                        className="p-1 rounded-full hover:bg-amber-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                        title="Scroll left"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={scrollRight}
                                        className="p-1 rounded-full hover:bg-amber-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                        title="Scroll right"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">
                                {suggestedUsers.length} cinephiles
                            </span>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory -mx-1 px-1 scroll-smooth"
                    >
                        {suggestedUsers.map((u) => {
                            const isFollowing = followingMap[u.id] ?? (u as any).isFollowing ?? false;
                            const isLoading = loadingMap[u.id] ?? false;
                            const reason = (u as any).suggestionReason || u.bio || 'Active Cinephile';

                            return (
                                <div
                                    key={u.id}
                                    onClick={() => handleProfileClick(u.id)}
                                    title={`View @${u.username}'s profile`}
                                    className="snap-start shrink-0 w-[170px] sm:w-[185px] bg-white rounded-xl p-3 border border-amber-100/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between items-center text-center group"
                                >
                                    <div className="flex flex-col items-center w-full">
                                        <div className="relative mb-2">
                                            <Avatar
                                                src={u.profilePictureUrl || null}
                                                name={u.displayName || u.username}
                                                size="md"
                                                className="ring-2 ring-amber-100 group-hover:ring-amber-300 transition-all cursor-pointer"
                                            />
                                        </div>

                                        <p className="text-xs font-bold text-slate-800 truncate w-full line-clamp-1 group-hover:text-amber-700 transition-colors">
                                            {u.displayName || u.username}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate w-full">
                                            @{u.username}
                                        </p>

                                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 truncate max-w-full">
                                            {reason}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isLoading || isFollowing}
                                        onClick={(e) => handleFollowClick(u.id, e)}
                                        className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                            isFollowing
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                : isLoading
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-wait'
                                                : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-xs hover:shadow-sm active:scale-95'
                                        }`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                                Following
                                            </>
                                        ) : isLoading ? (
                                            'Adding...'
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[14px]">person_add</span>
                                                Follow
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8DCC8]/70">
                <button
                    type="button"
                    onClick={() => navigate('/watch-hive/search')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/60 hover:bg-amber-200/60 px-3 py-1.5 rounded-lg border border-amber-300/60 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[15px]">person_search</span>
                    Add Friends
                </button>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
