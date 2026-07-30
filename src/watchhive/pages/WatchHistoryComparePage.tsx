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

    const getAvatarUrl = (url: string | null | undefined, seed: string) => {
        if (!url) {
            return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const baseUrl = backendUrl.replace(/\/api\/v1\/?$/, '');
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

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
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 font-display flex flex-col gap-4 sm:gap-5 pb-24">
                {/* Header Navigation Bar */}
                <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-[#ffb700]/20 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/20 hover:bg-[#ffb700] hover:text-white flex items-center justify-center text-[#2D2926] transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                            title="Back to User Profile"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-black text-[#2D2926] tracking-tight truncate">
                                Watch Comparison
                            </h1>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                                Swarm Viewing Intelligence
                            </p>
                        </div>
                    </div>

                    {data && (
                        <div className="px-3 py-1.5 bg-[#FFF9F0] border border-[#ffb700]/30 rounded-2xl flex items-center gap-1.5 shrink-0">
                            <span className="text-sm sm:text-base font-black text-[#ffb700]">
                                🔥 {data.stats.matchPercentage}%
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#2D2926]/70 hidden sm:inline">
                                Match
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-black/5 shadow-xs">
                        <BeeLoader size="large" message="Cross-referencing viewing histories..." />
                    </div>
                ) : isPrivacyRestricted ? (
                    <div className="py-16 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl mb-3">
                            🔒
                        </div>
                        <h4 className="text-lg font-black text-[#2D2926] mb-1">Privacy Restricted</h4>
                        <p className="text-xs font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
                            {error}
                        </p>
                        <button
                            onClick={handleBack}
                            className="px-5 py-2.5 bg-[#ffb700] hover:brightness-105 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-[#ffb700]/20 transition-all cursor-pointer"
                        >
                            Return to Profile
                        </button>
                    </div>
                ) : error ? (
                    <div className="py-16 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#ffb700]/10 border border-[#ffb700]/30 flex items-center justify-center text-2xl mb-3">
                            🐝
                        </div>
                        <h4 className="text-lg font-black text-[#2D2926] mb-1">Comparison Unavailable</h4>
                        <p className="text-xs font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-[#ffb700]/20 hover:brightness-105 transition-all cursor-pointer"
                        >
                            Retry Comparison
                        </button>
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-4 sm:gap-5">
                        {/* Light Theme Profile Comparison Card */}
                        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#ffb700]/25 shadow-xs flex flex-col gap-4">
                            {/* Profile Avatars Strip */}
                            <div className="flex items-center justify-between gap-2 sm:gap-4 bg-[#FFF9F0] p-3 sm:p-4 rounded-2xl border border-[#ffb700]/15">
                                {/* User A (You) */}
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                    <img
                                        src={getAvatarUrl(data.userA.profilePictureUrl, data.userA.username)}
                                        onError={(e) => {
                                            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.userA.username)}`;
                                        }}
                                        alt={data.userA.username}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#ffb700]/40 shadow-xs shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#ffb700] block leading-none mb-0.5">
                                            YOU
                                        </span>
                                        <h4 className="text-xs sm:text-sm font-black text-[#2D2926] truncate">
                                            {data.userA.displayName || data.userA.username}
                                        </h4>
                                    </div>
                                </div>

                                {/* Center Icon */}
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-[#ffb700]/30 flex items-center justify-center text-[#ffb700] text-sm font-black shadow-2xs shrink-0">
                                    ⚡
                                </div>

                                {/* User B (Friend) */}
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end text-right">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block leading-none mb-0.5">
                                            FRIEND
                                        </span>
                                        <h4 className="text-xs sm:text-sm font-black text-[#2D2926] truncate">
                                            {data.userB.displayName || data.userB.username}
                                        </h4>
                                    </div>
                                    <img
                                        src={getAvatarUrl(data.userB.profilePictureUrl, data.userB.username)}
                                        onError={(e) => {
                                            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.userB.username)}`;
                                        }}
                                        alt={data.userB.username}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                                    />
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                                    <span className="text-base sm:text-lg font-black text-[#ffb700] leading-none block">
                                        {data.stats.totalCommon}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1 block">
                                        In Common
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <span className="text-base sm:text-lg font-black text-[#2D2926] leading-none block">
                                        {data.stats.totalUserAOnly}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1 block">
                                        Only You
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <span className="text-base sm:text-lg font-black text-[#2D2926] leading-none block">
                                        {data.stats.totalUserBOnly}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1 block truncate">
                                        Only {data.userB.displayName?.split(' ')[0] || data.userB.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Segmented Filter Tabs (Mobile Responsive Scrollable) */}
                        <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-black/5 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('common')}
                                className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'common'
                                        ? 'bg-white text-[#2D2926] shadow-2xs border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>🤝 In Common</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-[#ffb700]/15 text-[#ffb700] text-[9px] font-black">
                                    {data.stats.totalCommon}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userA')}
                                className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'userA'
                                        ? 'bg-white text-[#2D2926] shadow-2xs border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👤 Only You</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-black">
                                    {data.stats.totalUserAOnly}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userB')}
                                className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'userB'
                                        ? 'bg-white text-[#2D2926] shadow-2xs border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span className="truncate">👥 Only {data.userB.displayName?.split(' ')[0] || data.userB.username}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-black">
                                    {data.stats.totalUserBOnly}
                                </span>
                            </button>
                        </div>

                        {/* List Items Grid */}
                        <div className="space-y-2.5">
                            {activeTab === 'common' && (
                                data.commonItems.length === 0 ? (
                                    <div className="py-12 px-4 text-center text-slate-400 font-bold text-xs bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-2xl">🍿</span>
                                        <span>No common watched titles yet. Log more entries together!</span>
                                    </div>
                                ) : (
                                    data.commonItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;
                                        const ratingA = item.entryA.rating ? parseFloat(item.entryA.rating) : null;
                                        const ratingB = item.entryB.rating ? parseFloat(item.entryB.rating) : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3 sm:p-3.5 bg-white hover:bg-[#FFF9F0] rounded-2xl sm:rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 sm:w-12 sm:h-18 object-cover rounded-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 sm:w-12 sm:h-18 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-xs sm:text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        {/* Side-by-Side Scores */}
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-950 rounded-lg flex items-center gap-1">
                                                                <span className="text-[8px] font-black uppercase text-amber-700">You:</span>
                                                                <span>{ratingA !== null ? `⭐ ${ratingA}` : 'Watched'}</span>
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1">
                                                                <span className="text-[8px] font-black uppercase text-slate-400">
                                                                    {data.userB.displayName?.split(' ')[0] || data.userB.username}:
                                                                </span>
                                                                <span>{ratingB !== null ? `⭐ ${ratingB}` : 'Watched'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userA' && (
                                data.userAOnlyItems.length === 0 ? (
                                    <div className="py-12 px-4 text-center text-slate-400 font-bold text-xs bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-2xl">🎬</span>
                                        <span>You haven't watched any unique titles compared to this friend.</span>
                                    </div>
                                ) : (
                                    data.userAOnlyItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;
                                        const rating = item.rating ? parseFloat(item.rating) : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3 sm:p-3.5 bg-white hover:bg-[#FFF9F0] rounded-2xl sm:rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 sm:w-12 sm:h-18 object-cover rounded-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 sm:w-12 sm:h-18 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-xs sm:text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            Your Score: {rating !== null ? `⭐ ${rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userB' && (
                                data.userBOnlyItems.length === 0 ? (
                                    <div className="py-12 px-4 text-center text-slate-400 font-bold text-xs bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-2xl">📺</span>
                                        <span>This friend hasn't watched any unique titles yet.</span>
                                    </div>
                                ) : (
                                    data.userBOnlyItems.map(item => {
                                        const poster = item.posterPath || posters[item.tmdbId];
                                        const posterUrl = poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;
                                        const rating = item.rating ? parseFloat(item.rating) : null;

                                        return (
                                            <div
                                                key={item.tmdbId}
                                                onClick={() => handleMovieClick(item.tmdbId, item.type)}
                                                className="p-3 sm:p-3.5 bg-white hover:bg-[#FFF9F0] rounded-2xl sm:rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-11 h-16 sm:w-12 sm:h-18 object-cover rounded-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-16 sm:w-12 sm:h-18 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-xs sm:text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            {data.userB.displayName?.split(' ')[0] || data.userB.username}'s Score: {rating !== null ? `⭐ ${rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
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
