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
            <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 font-display flex flex-col gap-5 sm:gap-6 pb-24">
                {/* Header Navigation Bar */}
                <div className="flex items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-[#ffb700]/20 shadow-xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/20 hover:bg-[#ffb700] hover:text-white flex items-center justify-center text-[#2D2926] transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                            title="Back to User Profile"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back_ios_new</span>
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-[#ffb700]/15 text-[#ffb700] text-[9px] font-black uppercase tracking-widest">
                                    Swarm Intelligence
                                </span>
                            </div>
                            <h1 className="text-lg sm:text-2xl font-black text-[#2D2926] tracking-tight truncate">
                                Watch History Comparison
                            </h1>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-black/5 shadow-xs">
                        <BeeLoader size="large" message="Cross-referencing viewing histories..." />
                    </div>
                ) : isPrivacyRestricted ? (
                    <div className="py-16 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs flex flex-col items-center">
                        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4">
                            🔒
                        </div>
                        <h4 className="text-xl font-black text-[#2D2926] mb-2">Privacy Restricted</h4>
                        <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            {error}
                        </p>
                        <button
                            onClick={handleBack}
                            className="px-6 py-3 bg-[#ffb700] hover:brightness-105 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md shadow-[#ffb700]/20 transition-all cursor-pointer"
                        >
                            Return to Profile
                        </button>
                    </div>
                ) : error ? (
                    <div className="py-16 text-center px-6 bg-white rounded-3xl border border-black/5 shadow-xs flex flex-col items-center">
                        <div className="w-16 h-16 rounded-3xl bg-[#ffb700]/10 border border-[#ffb700]/30 flex items-center justify-center text-3xl mb-4">
                            🐝
                        </div>
                        <h4 className="text-xl font-black text-[#2D2926] mb-2">Comparison Unavailable</h4>
                        <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-[#ffb700] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md shadow-[#ffb700]/20 hover:brightness-105 transition-all cursor-pointer"
                        >
                            Retry Comparison
                        </button>
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-5 sm:gap-6">
                        {/* Mobile & Desktop Profile Comparison Card */}
                        <div className="bg-gradient-to-br from-[#2D2926] via-[#3A3532] to-[#2D2926] text-white p-5 sm:p-8 rounded-3xl shadow-xl border border-amber-500/20 relative overflow-hidden">
                            {/* Decorative background ambient blur */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ffb700]/15 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                {/* Left Side: User A & User B Profile Badges */}
                                <div className="flex items-center gap-3 sm:gap-5 w-full md:w-auto justify-center md:justify-start">
                                    {/* User A (You) */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative">
                                            <img
                                                src={data.userA.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userA.username}`}
                                                alt={data.userA.username}
                                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#ffb700] shadow-md"
                                            />
                                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#ffb700] text-[#2D2926] text-[8px] font-black uppercase tracking-wider">
                                                YOU
                                            </span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-white mt-2 max-w-[100px] truncate">
                                            {data.userA.displayName || data.userA.username}
                                        </h4>
                                    </div>

                                    {/* Swarm Connector Badge */}
                                    <div className="flex flex-col items-center px-2">
                                        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-400 text-lg shadow-inner">
                                            ⚡
                                        </span>
                                    </div>

                                    {/* User B (Friend) */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative">
                                            <img
                                                src={data.userB.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userB.username}`}
                                                alt={data.userB.username}
                                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-slate-400 shadow-md"
                                            />
                                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-slate-600 text-white text-[8px] font-black uppercase tracking-wider">
                                                FRIEND
                                            </span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-white mt-2 max-w-[100px] truncate">
                                            {data.userB.displayName || data.userB.username}
                                        </h4>
                                    </div>
                                </div>

                                {/* Center/Right Side: Swarm Compatibility Score Badge */}
                                <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-full md:w-auto text-center shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-2xl sm:text-4xl font-black text-[#ffb700] tracking-tight drop-shadow-sm">
                                            🔥 {data.stats.matchPercentage}%
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 mt-1">
                                        Swarm Compatibility Score
                                    </span>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 pt-5 border-t border-white/10 text-center">
                                <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-base sm:text-xl font-black text-amber-400 leading-none block">
                                        {data.stats.totalCommon}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block">
                                        In Common
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-base sm:text-xl font-black text-white leading-none block">
                                        {data.stats.totalUserAOnly}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block">
                                        Only You
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-base sm:text-xl font-black text-white leading-none block">
                                        {data.stats.totalUserBOnly}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block truncate">
                                        Only {data.userB.displayName?.split(' ')[0] || data.userB.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Segmented Filter Tabs (Mobile Scrollable) */}
                        <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-black/5 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('common')}
                                className={`flex-1 min-w-[110px] py-3 px-3.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'common'
                                        ? 'bg-white text-[#2D2926] shadow-sm border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>🤝 In Common</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#ffb700]/15 text-[#ffb700] text-[10px] font-black">
                                    {data.stats.totalCommon}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userA')}
                                className={`flex-1 min-w-[110px] py-3 px-3.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'userA'
                                        ? 'bg-white text-[#2D2926] shadow-sm border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span>👤 Only You</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">
                                    {data.stats.totalUserAOnly}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('userB')}
                                className={`flex-1 min-w-[110px] py-3 px-3.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                                    activeTab === 'userB'
                                        ? 'bg-white text-[#2D2926] shadow-sm border border-black/5'
                                        : 'text-slate-500 hover:text-[#2D2926]'
                                }`}
                            >
                                <span className="truncate">👥 Only {data.userB.displayName?.split(' ')[0] || data.userB.username}</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">
                                    {data.stats.totalUserBOnly}
                                </span>
                            </button>
                        </div>

                        {/* List Items Grid */}
                        <div className="space-y-3">
                            {activeTab === 'common' && (
                                data.commonItems.length === 0 ? (
                                    <div className="py-16 px-4 text-center text-slate-400 font-bold text-xs sm:text-sm bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-3xl">🍿</span>
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
                                                className="p-3.5 sm:p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-12 h-18 sm:w-14 sm:h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-18 sm:w-14 sm:h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1.5 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm sm:text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        {/* Side-by-Side Scores */}
                                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-900 border border-amber-500/20 rounded-xl flex items-center gap-1">
                                                                <span className="text-[9px] font-black uppercase text-amber-700">You:</span>
                                                                <span>{ratingA !== null ? `⭐ ${ratingA}` : 'Watched'}</span>
                                                            </span>
                                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1">
                                                                <span className="text-[9px] font-black uppercase text-slate-400">
                                                                    {data.userB.displayName?.split(' ')[0] || data.userB.username}:
                                                                </span>
                                                                <span>{ratingB !== null ? `⭐ ${ratingB}` : 'Watched'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg sm:text-xl">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userA' && (
                                data.userAOnlyItems.length === 0 ? (
                                    <div className="py-16 px-4 text-center text-slate-400 font-bold text-xs sm:text-sm bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-3xl">🎬</span>
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
                                                className="p-3.5 sm:p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-12 h-18 sm:w-14 sm:h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-18 sm:w-14 sm:h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1.5 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm sm:text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        <div className="text-xs font-bold text-slate-500">
                                                            Your Score: {rating !== null ? `⭐ ${rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg sm:text-xl">arrow_forward</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'userB' && (
                                data.userBOnlyItems.length === 0 ? (
                                    <div className="py-16 px-4 text-center text-slate-400 font-bold text-xs sm:text-sm bg-white rounded-3xl border border-black/5 flex flex-col items-center gap-2">
                                        <span className="text-3xl">📺</span>
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
                                                className="p-3.5 sm:p-4 bg-white hover:bg-[#ffb700]/5 rounded-3xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    {posterUrl ? (
                                                        <img
                                                            src={posterUrl}
                                                            alt={item.title}
                                                            className="w-12 h-18 sm:w-14 sm:h-20 object-cover rounded-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-18 sm:w-14 sm:h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex flex-col gap-1.5 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase shrink-0">
                                                                {item.type === 'TV_SHOW' ? 'TV' : 'Movie'}
                                                            </span>
                                                            <h5 className="text-sm sm:text-base font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                {item.title}
                                                            </h5>
                                                        </div>

                                                        <div className="text-xs font-bold text-slate-500">
                                                            {data.userB.displayName?.split(' ')[0] || data.userB.username}'s Score: {rating !== null ? `⭐ ${rating}` : 'Watched'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-50 group-hover:bg-[#ffb700]/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-lg sm:text-xl">arrow_forward</span>
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
