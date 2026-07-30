import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { Modal, BeeLoader } from '../common';

interface UserSummary {
    id: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
}

interface CommonItem {
    tmdbId: number;
    title: string;
    type: 'MOVIE' | 'TV_SHOW' | string;
    posterPath?: string | null;
    entryA: {
        id: string;
        rating: string | null;
        review: string | null;
        watchedAt: string | null;
    };
    entryB: {
        id: string;
        rating: string | null;
        review: string | null;
        watchedAt: string | null;
    };
}

interface SingleItem {
    tmdbId: number;
    title: string;
    type: 'MOVIE' | 'TV_SHOW' | string;
    rating: string | null;
    watchedAt: string | null;
    posterPath?: string | null;
}

interface CompareResponse {
    userA: UserSummary;
    userB: UserSummary;
    stats: {
        matchPercentage: number;
        totalCommon: number;
        totalUserAOnly: number;
        totalUserBOnly: number;
        totalUnique: number;
    };
    commonItems: CommonItem[];
    userAOnlyItems: SingleItem[];
    userBOnlyItems: SingleItem[];
}

interface WatchHistoryCompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
}

export const WatchHistoryCompareModal: React.FC<WatchHistoryCompareModalProps> = ({
    isOpen,
    onClose,
    targetUserId,
}) => {
    const navigate = useNavigate();
    const [data, setData] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'common' | 'userA' | 'userB'>('common');
    const [posters, setPosters] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!isOpen || !targetUserId) return;

        const fetchCompareData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res: any = await apiClient.get(`/entries/compare/${targetUserId}`);
                setData(res);

                // Fetch posters for top items asynchronously
                const allItems = [
                    ...(res.commonItems || []),
                    ...(res.userAOnlyItems || []),
                    ...(res.userBOnlyItems || []),
                ];
                
                const posterMap: Record<number, string> = {};
                await Promise.all(
                    allItems.slice(0, 30).map(async (item) => {
                        try {
                            const endpoint = item.type === 'TV_SHOW' ? 'tv' : 'movie';
                            const tmdbData: any = await apiClient.get(`/tmdb/${endpoint}/${item.tmdbId}`);
                            if (tmdbData?.poster_path) {
                                posterMap[item.tmdbId] = tmdbData.poster_path;
                            }
                        } catch {
                            // Silently ignore individual poster fetch error
                        }
                    })
                );
                setPosters(posterMap);
            } catch (err: any) {
                console.error('Compare API failed, attempting direct entry comparison fallback:', err);
                try {
                    // Fallback: Fetch target user entries & current user entries directly
                    const [targetEntriesRes, userEntriesRes]: [any, any] = await Promise.all([
                        apiClient.get(`/entries/user/${targetUserId}?limit=100`),
                        apiClient.get(`/entries?limit=100`)
                    ]);

                    const userBEntries = targetEntriesRes.entries || [];
                    const userAEntries = userEntriesRes.entries || [];

                    const userAMap = new Map<number, any>();
                    userAEntries.forEach((e: any) => userAMap.set(e.tmdbId, e));

                    const userBMap = new Map<number, any>();
                    userBEntries.forEach((e: any) => userBMap.set(e.tmdbId, e));

                    const allTmdbIds = Array.from(new Set([...userAMap.keys(), ...userBMap.keys()]));

                    const commonItems: any[] = [];
                    const userAOnlyItems: any[] = [];
                    const userBOnlyItems: any[] = [];

                    for (const tmdbId of allTmdbIds) {
                        const entryA = userAMap.get(tmdbId);
                        const entryB = userBMap.get(tmdbId);

                        if (entryA && entryB) {
                            commonItems.push({
                                tmdbId,
                                title: entryA.title || entryB.title,
                                type: entryA.type || entryB.type,
                                entryA: { id: entryA.id, rating: entryA.rating, review: entryA.review, watchedAt: entryA.watchedAt },
                                entryB: { id: entryB.id, rating: entryB.rating, review: entryB.review, watchedAt: entryB.watchedAt },
                            });
                        } else if (entryA) {
                            userAOnlyItems.push({ tmdbId, title: entryA.title, type: entryA.type, rating: entryA.rating, watchedAt: entryA.watchedAt });
                        } else if (entryB) {
                            userBOnlyItems.push({ tmdbId, title: entryB.title, type: entryB.type, rating: entryB.rating, watchedAt: entryB.watchedAt });
                        }
                    }

                    const matchPercentage = allTmdbIds.length > 0 ? Math.round((commonItems.length / allTmdbIds.length) * 100) : 0;

                    setData({
                        userA: { id: 'me', username: 'you', displayName: 'You', profilePictureUrl: null },
                        userB: { id: targetUserId, username: 'friend', displayName: 'Friend', profilePictureUrl: null },
                        stats: {
                            matchPercentage,
                            totalCommon: commonItems.length,
                            totalUserAOnly: userAOnlyItems.length,
                            totalUserBOnly: userBOnlyItems.length,
                            totalUnique: allTmdbIds.length,
                        },
                        commonItems,
                        userAOnlyItems,
                        userBOnlyItems,
                    });
                } catch (fallbackErr: any) {
                    console.error('Fallback compare failed:', fallbackErr);
                    setError(err.response?.data?.error || 'Unable to load watch comparison at this moment.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCompareData();
    }, [isOpen, targetUserId]);

    const handleMovieClick = (tmdbId: number, type: string) => {
        onClose();
        const mType = type === 'TV_SHOW' ? 'tv' : 'movie';
        navigate(`/watch-hive/details/${mType}/${tmdbId}`, {
            state: { from: window.location.pathname + window.location.search }
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Swarm Compare & Match">
            <div className="flex flex-col gap-6 py-2 min-h-[420px] max-h-[75vh] overflow-y-auto no-scrollbar font-display">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <BeeLoader size="large" message="Cross-referencing viewing histories..." />
                    </div>
                ) : error ? (
                    <div className="py-16 text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-[#ffb700]/10 border border-[#ffb700]/30 flex items-center justify-center text-3xl mx-auto mb-4">
                            🐝
                        </div>
                        <h4 className="text-lg font-black text-[#2D2926] mb-2">Comparison Unavailable</h4>
                        <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                window.location.reload();
                            }}
                            className="px-5 py-2.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-[#ffb700]/20 hover:brightness-105 transition-all cursor-pointer"
                        >
                            Retry Comparison
                        </button>
                    </div>
                ) : data ? (
                    <>
                        {/* Users Header & Match Compatibility Score */}
                        <div className="bg-gradient-to-r from-amber-500/10 via-[#ffb700]/10 to-amber-500/10 p-6 rounded-3xl border border-[#ffb700]/20 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                            {/* User A (You) */}
                            <div className="flex items-center gap-3.5 min-w-0">
                                <img
                                    src={data.userA.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userA.username}`}
                                    alt={data.userA.username}
                                    className="w-12 h-12 rounded-2xl object-cover border border-black/5 shadow-xs"
                                />
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb700]">You</span>
                                    <h4 className="text-sm font-black text-[#2D2926] truncate">
                                        {data.userA.displayName || data.userA.username}
                                    </h4>
                                </div>
                            </div>

                            {/* Match Score Badge */}
                            <div className="flex flex-col items-center justify-center text-center px-4 py-2 bg-white rounded-2xl border border-black/5 shadow-xs shrink-0">
                                <span className="text-2xl font-black text-[#ffb700] tracking-tight">
                                    🔥 {data.stats.matchPercentage}%
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Swarm Match
                                </span>
                            </div>

                            {/* User B (Friend) */}
                            <div className="flex items-center gap-3.5 min-w-0 sm:flex-row-reverse sm:text-right">
                                <img
                                    src={data.userB.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userB.username}`}
                                    alt={data.userB.username}
                                    className="w-12 h-12 rounded-2xl object-cover border border-black/5 shadow-xs"
                                />
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Friend</span>
                                    <h4 className="text-sm font-black text-[#2D2926] truncate">
                                        {data.userB.displayName || data.userB.username}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* Segmented Filter Tabs */}
                        <div className="flex gap-2 p-1.5 bg-slate-100/70 rounded-2xl border border-black/5">
                            <button
                                onClick={() => setActiveTab('common')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'common'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>🤝 In Common</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#ffb700]/10 text-[#ffb700] text-[10px]">
                                    {data.stats.totalCommon}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userA')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'userA'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👤 Only You</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px]">
                                    {data.stats.totalUserAOnly}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userB')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'userB'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👥 Only {data.userB.displayName?.split(' ')[0] || data.userB.username}</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px]">
                                    {data.stats.totalUserBOnly}
                                </span>
                            </button>
                        </div>

                        {/* List Content */}
                        <div className="space-y-3">
                            {activeTab === 'common' && (
                                data.commonItems.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-bold text-xs">
                                        No common watched titles yet. Log more entries together!
                                    </div>
                                ) : (
                                    data.commonItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3.5 bg-white hover:bg-[#ffb700]/5 rounded-2xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 object-cover rounded-xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                            <span>You: {item.entryA.rating ? `⭐ ${item.entryA.rating}` : 'Logged'}</span>
                                                            <span>•</span>
                                                            <span>{data.userB.displayName?.split(' ')[0] || data.userB.username}: {item.entryB.rating ? `⭐ ${item.entryB.rating}` : 'Logged'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userA' && (
                                data.userAOnlyItems.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-bold text-xs">
                                        You haven't watched any unique titles compared to this friend.
                                    </div>
                                ) : (
                                    data.userAOnlyItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3.5 bg-white hover:bg-[#ffb700]/5 rounded-2xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 object-cover rounded-xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500">
                                                            Your Score: {item.rating ? `⭐ ${item.rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userB' && (
                                data.userBOnlyItems.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-bold text-xs">
                                        This friend hasn't watched any unique titles yet.
                                    </div>
                                ) : (
                                    data.userBOnlyItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3.5 bg-white hover:bg-[#ffb700]/5 rounded-2xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 object-cover rounded-xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500">
                                                            {data.userB.displayName?.split(' ')[0] || data.userB.username}'s Score: {item.rating ? `⭐ ${item.rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </Modal>
    );
};
