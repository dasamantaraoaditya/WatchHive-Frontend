import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { PageLayout } from '../components/layout';
import { BeeLoader } from '../components/common';

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

export const WatchHistoryComparePage: React.FC = () => {
    const { targetUserId } = useParams<{ targetUserId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [data, setData] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrivacyRestricted, setIsPrivacyRestricted] = useState(false);
    const [activeTab, setActiveTab] = useState<'common' | 'userA' | 'userB'>('common');
    const [posters, setPosters] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!targetUserId) return;

        const fetchCompareData = async () => {
            setLoading(true);
            setError(null);
            setIsPrivacyRestricted(false);
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
                    allItems.slice(0, 40).map(async (item) => {
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
                console.error('Compare API failed:', err);
                if (err.response?.status === 403) {
                    setIsPrivacyRestricted(true);
                    setError(err.response?.data?.error || 'This user has restricted access to their watch history.');
                    return;
                }

                // Fallback for network/server glitches
                try {
                    const [targetEntriesRes, userEntriesRes]: [any, any] = await Promise.all([
                        apiClient.get(`/entries?userId=${targetUserId}&limit=100`),
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
    }, [targetUserId]);

    const handleBack = () => {
        if (location.state && (location.state as any).from) {
            navigate((location.state as any).from);
        } else if (targetUserId) {
            navigate(`/watch-hive/profile/${targetUserId}`);
        } else {
            navigate(-1);
        }
    };

    const handleMovieClick = (tmdbId: number, type: string) => {
        const mType = type === 'TV_SHOW' ? 'tv' : 'movie';
        navigate(`/watch-hive/details/${mType}/${tmdbId}`, {
            state: { from: location.pathname + location.search }
        });
    };

    return (
        <PageLayout>
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 font-display flex flex-col gap-6">
                {/* Header Navigation Bar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-black/5 shadow-xs">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-[#ffb700]/10 hover:text-[#ffb700] flex items-center justify-center text-[#2D2926] transition-all cursor-pointer shadow-2xs"
                        title="Back to User Profile"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#2D2926] tracking-tight">
                            Watch History Comparison
                        </h1>
                        <p className="text-xs font-bold text-slate-400">
                            Side-by-side viewing analysis & Swarm compatibility
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-black/5 shadow-xs">
                        <BeeLoader size="large" message="Cross-referencing viewing histories..." />
                    </div>
                ) : isPrivacyRestricted ? (
                    <div className="py-20 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
                            🔒
                        </div>
                        <h4 className="text-xl font-black text-[#2D2926] mb-2">Privacy Restricted</h4>
                        <p className="text-sm font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            {error}
                        </p>
                        <button
                            onClick={handleBack}
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#2D2926] font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                            Return to Profile
                        </button>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-[#ffb700]/10 border border-[#ffb700]/30 flex items-center justify-center text-3xl mx-auto mb-4">
                            🐝
                        </div>
                        <h4 className="text-xl font-black text-[#2D2926] mb-2">Comparison Unavailable</h4>
                        <p className="text-sm font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-[#ffb700]/20 hover:brightness-105 transition-all cursor-pointer"
                        >
                            Retry Comparison
                        </button>
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-6">
                        {/* Users Summary Banner & Swarm Score */}
                        <div className="bg-gradient-to-r from-amber-500/10 via-[#ffb700]/10 to-amber-500/10 p-6 md:p-8 rounded-3xl border border-[#ffb700]/20 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                            {/* User A (You) */}
                            <div className="flex items-center gap-4 min-w-0">
                                <img
                                    src={data.userA.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userA.username}`}
                                    alt={data.userA.username}
                                    className="w-14 h-14 rounded-2xl object-cover border border-black/5 shadow-xs"
                                />
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb700]">You</span>
                                    <h4 className="text-base font-black text-[#2D2926] truncate">
                                        {data.userA.displayName || data.userA.username}
                                    </h4>
                                </div>
                            </div>

                            {/* Match Compatibility Badge */}
                            <div className="flex flex-col items-center justify-center text-center px-6 py-3 bg-white rounded-2xl border border-black/5 shadow-xs shrink-0">
                                <span className="text-3xl font-black text-[#ffb700] tracking-tight">
                                    🔥 {data.stats.matchPercentage}%
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Swarm Match
                                </span>
                            </div>

                            {/* User B (Friend) */}
                            <div className="flex items-center gap-4 min-w-0 sm:flex-row-reverse sm:text-right">
                                <img
                                    src={data.userB.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userB.username}`}
                                    alt={data.userB.username}
                                    className="w-14 h-14 rounded-2xl object-cover border border-black/5 shadow-xs"
                                />
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Friend</span>
                                    <h4 className="text-base font-black text-[#2D2926] truncate">
                                        {data.userB.displayName || data.userB.username}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* Segmented Filter Tabs */}
                        <div className="flex gap-2 p-1.5 bg-slate-100/70 rounded-2xl border border-black/5">
                            <button
                                onClick={() => setActiveTab('common')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    activeTab === 'common'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>🤝 In Common</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-[#ffb700]/10 text-[#ffb700] text-xs">
                                    {data.stats.totalCommon}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userA')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    activeTab === 'userA'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👤 Only You</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">
                                    {data.stats.totalUserAOnly}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userB')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    activeTab === 'userB'
                                        ? 'bg-white text-[#2D2926] shadow-sm'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👥 Only {data.userB.displayName?.split(' ')[0] || data.userB.username}</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">
                                    {data.stats.totalUserBOnly}
                                </span>
                            </button>
                        </div>

                        {/* List Items */}
                        <div className="space-y-3">
                            {activeTab === 'common' && (
                                data.commonItems.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-black/5">
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
                                                className="p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-14 h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
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

                                                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userA' && (
                                data.userAOnlyItems.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-black/5">
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
                                                className="p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-14 h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500">
                                                            Your Score: {item.rating ? `⭐ ${item.rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userB' && (
                                data.userBOnlyItems.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-black/5">
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
                                                className="p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-14 h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500">
                                                            {data.userB.displayName?.split(' ')[0] || data.userB.username}'s Score: {item.rating ? `⭐ ${item.rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </PageLayout>
    );
};

export default WatchHistoryComparePage;
