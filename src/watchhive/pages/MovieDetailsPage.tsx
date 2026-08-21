import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BeeLoader, ErrorState } from '../components/common';
import apiClient from '../services/api';
import { useWatchlist } from '../contexts/WatchlistContext';
import { EntryForm } from '../components/entries/EntryForm';
import { SuggestUserSelector } from '../components/suggestions/SuggestUserSelector';
import { useUI, useCustomAlert } from '../contexts';
import { entriesApi } from '../services/entries.service';

interface CastMember {
    id: number;
    name: string;
    character?: string;
    profile_path: string | null;
    order?: number;
}

interface SeasonSummary {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
    air_date?: string;
    overview?: string;
}

interface EpisodeItem {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date?: string;
    vote_average?: number;
    runtime?: number;
}

interface MovieDetails {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genres: { id: number; name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    seasons?: SeasonSummary[];
    tagline?: string;
    status?: string;
    original_language?: string;
    origin_country?: string[];
    credits?: {
        cast: CastMember[];
    };
    aggregate_credits?: {
        cast: CastMember[];
    };
    awards?: string | null;
    critic_ratings?: { Source: string; Value: string }[];
    box_office?: string | null;
    'watch/providers'?: {
        results: Record<string, {
            link?: string;
            flatrate?: { logo_path: string; provider_id: number; provider_name: string; display_priority: number }[];
            rent?: { logo_path: string; provider_id: number; provider_name: string; display_priority: number }[];
            buy?: { logo_path: string; provider_id: number; provider_name: string; display_priority: number }[];
            free?: { logo_path: string; provider_id: number; provider_name: string; display_priority: number }[];
        }>;
    };
}

const getFormatCategory = (details: MovieDetails, mediaType: 'movie' | 'tv') => {
    const genreNames = (details.genres || []).map(g => g.name.toLowerCase());
    const isAnimation = genreNames.includes('animation') || details.genres?.some(g => g.id === 16);
    const isDoc = genreNames.includes('documentary') || details.genres?.some(g => g.id === 99);
    const lang = (details.original_language || '').toLowerCase();
    const countries = details.origin_country || [];

    if (isDoc) {
        return { label: 'Documentary', icon: '📽️', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
    }

    if (isAnimation && (lang === 'ja' || countries.includes('JP'))) {
        return { label: 'Anime', icon: '🎌', color: 'bg-rose-500/10 text-rose-700 border-rose-500/30' };
    }

    if (mediaType === 'tv' && (lang === 'ko' || countries.includes('KR'))) {
        return { label: 'K-Drama', icon: '🇰🇷', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30' };
    }

    if (mediaType === 'tv' && (lang === 'ja' || countries.includes('JP')) && !isAnimation) {
        return { label: 'J-Drama', icon: '🇯🇵', color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' };
    }

    if (mediaType === 'tv') {
        if (details.number_of_seasons === 1) {
            return { label: 'Miniseries / Limited Series', icon: '⚡', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' };
        }
        return { label: 'TV Series', icon: '📺', color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' };
    }

    return { label: 'Feature Film', icon: '🎬', color: 'bg-amber-400/10 text-amber-700 border-amber-400/30' };
};

const getDirectLink = (providerName: string, fallbackLink: string, title: string) => {
    const name = providerName.toLowerCase();
    const query = encodeURIComponent(title);
    if (name.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
    if (name.includes('amazon') || name.includes('prime')) return `https://www.primevideo.com/search/ref=atv_sr_sug_1?phrase=${query}`;
    if (name.includes('hotstar')) return `https://www.hotstar.com/in/explore?searchQuery=${query}`;
    if (name.includes('zee5')) return `https://www.zee5.com/search?q=${query}`;
    if (name.includes('sonyliv')) return `https://www.sonyliv.com/search?query=${query}`;
    if (name.includes('jiocinema')) return `https://www.jiocinema.com/search?q=${query}`;
    if (name.includes('apple')) return `https://tv.apple.com/in/search?q=${query}`;
    if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}+movie`;
    return fallbackLink;
};

export const MovieDetailsPage: React.FC = () => {
    const { mediaType: paramMediaType, tmdbId: paramTmdbId } = useParams<{ mediaType: string; tmdbId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setPageTitle, setPageIcon } = useUI();
    const { alert, confirm } = useCustomAlert();
    const { addToList, removeFromList, isInWatchlist } = useWatchlist();

    const mediaType = (paramMediaType === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
    const tmdbId = paramTmdbId ? parseInt(paramTmdbId, 10) : null;

    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<{ episodes: EpisodeItem[]; overview?: string; name?: string } | null>(null);
    const [isSeasonLoading, setIsSeasonLoading] = useState(false);

    useEffect(() => {
        if (details?.seasons && details.seasons.length > 0 && selectedSeasonNumber === null) {
            const firstValid = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
            setSelectedSeasonNumber(firstValid.season_number);
        }
    }, [details, selectedSeasonNumber]);

    useEffect(() => {
        if (mediaType === 'tv' && tmdbId && selectedSeasonNumber !== null) {
            const fetchSeason = async () => {
                setIsSeasonLoading(true);
                try {
                    const data: any = await apiClient.get(`/tmdb/tv/${tmdbId}/season/${selectedSeasonNumber}`);
                    setSeasonDetails(data);
                } catch (e) {
                    console.error('Failed to fetch season details:', e);
                } finally {
                    setIsSeasonLoading(false);
                }
            };
            fetchSeason();
        }
    }, [mediaType, tmdbId, selectedSeasonNumber]);

    const initialAction = searchParams.get('action') || 'details';
    const [view, setView] = useState<'details' | 'log' | 'suggest'>(
        initialAction === 'log' ? 'log' : initialAction === 'suggest' ? 'suggest' : 'details'
    );
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        setPageTitle(mediaType === 'tv' ? 'TV Details' : 'Movie Details');
        setPageIcon('movie');
    }, [mediaType, setPageTitle, setPageIcon]);

    // Lock body scroll while expanded view is active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (!tmdbId) return;
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const endpoint = mediaType === 'movie' ? `/tmdb/movie/${tmdbId}` : `/tmdb/tv/${tmdbId}`;
                const data: any = await apiClient.get(endpoint);
                setDetails(data);
            } catch (err) {
                console.error('Failed to fetch details:', err);
                setError('Failed to load cinematic details. The hive is a bit busy.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [tmdbId, mediaType]);

    // Handle scroll for sticky navbar hiding/showing
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentY = e.currentTarget.scrollTop;
        if (currentY > lastScrollY.current && currentY > 60) {
            if (isNavVisible) setIsNavVisible(false);
        } else if (currentY < lastScrollY.current) {
            if (!isNavVisible) setIsNavVisible(true);
        }
        lastScrollY.current = currentY;
    };

    const title = details?.title || details?.name || 'Loading...';
    const year = (details?.release_date || details?.first_air_date || '').substring(0, 4);
    const runtime = details?.runtime ? `${details.runtime}m` : details?.episode_run_time?.[0] ? `${details.episode_run_time[0]}m` : null;
    const primaryGenre = details?.genres?.[0]?.name;
    const inWatchlist = tmdbId ? isInWatchlist(tmdbId) : false;

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/original${details.poster_path}`
        : null;

    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : posterUrl;

    const handleStartWatching = async () => {
        if (!tmdbId || isTransitioning) return;

        const confirmed = await confirm(
            `Would you like to move "${title}" to your Currently Watching log?`,
            { title: 'Log as Currently Watching', confirmText: 'Move to Currently Watching', severity: 'primary' }
        );
        if (!confirmed) return;

        setIsTransitioning(true);
        try {
            const apiType = mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE';
            const suggestedByUserId = location.state?.suggestedByUserId || location.state?.suggestedByUser?.id;
            await entriesApi.createEntry({
                tmdbId,
                title,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString(),
                suggestedByUserId: suggestedByUserId || null,
            });
            await removeFromList(tmdbId);
            await alert(`"${title}" has been added to your Currently Watching log!`, {
                title: 'Marked as Watching',
                severity: 'success',
                confirmText: 'Awesome',
            });
        } catch (err) {
            console.error('Failed to add to currently watching log:', err);
            await alert(`Failed to add "${title}" to currently watching log. Please try again.`, {
                title: 'Error',
                severity: 'error',
            });
        } finally {
            setIsTransitioning(false);
        }
    };

    const handleWatchlistToggle = async () => {
        if (!tmdbId) return;
        try {
            const suggestedByUserId = location.state?.suggestedByUserId || location.state?.suggestedByUser?.id;
            if (inWatchlist) {
                await removeFromList(tmdbId);
            } else {
                await addToList(tmdbId, mediaType, suggestedByUserId);
            }
        } catch (err) {
            console.error('Watchlist action failed', err);
        }
    };

    const handleShare = async () => {
        if (!details) return;
        const shareData = {
            title,
            text: `Check out ${title} on WatchHive!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                await alert('Link copied to clipboard!', { title: 'Link Copied', severity: 'success' });
            }
        } catch (err) {
            console.error('Share failed', err);
        }
    };

    const handleBack = () => {
        const fromPath = (location.state as any)?.from;
        if (fromPath) {
            navigate(fromPath);
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/watch-hive/feed');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
            exit={{ opacity: 0, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
            onScroll={handleScroll}
            className="fixed inset-y-0 right-0 left-0 md:left-[256px] z-[100] flex flex-col bg-[#FFF9F0] overflow-y-auto no-scrollbar font-display pb-32 md:pb-24"
        >
            {/* Sticky Navigation Bar — with round arrow_back_ios button */}
            <div
                className={`sticky top-3 md:top-6 z-50 flex justify-between items-start px-4 md:px-6 pointer-events-none w-full max-w-full transition-all duration-300 ease-in-out ${
                    isNavVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
            >
                {/* Back button — exact round arrow_back_ios design from ExpandedCard */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={handleBack}
                    className="w-11 h-11 rounded-full bg-white/40 border border-white/30 flex items-center justify-center text-[#ffb700] hover:bg-white/60 active:scale-95 transition-all pointer-events-auto shadow-md backdrop-blur-md"
                    title="Back"
                >
                    <span className="material-symbols-outlined text-[26px] ml-1">arrow_back_ios</span>
                </motion.button>

                {/* Right Action Icons */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        onClick={handleShare}
                        className="w-11 h-11 rounded-full bg-white/40 border border-white/30 flex items-center justify-center text-[#2D2926] hover:bg-white/60 active:scale-95 transition-all pointer-events-auto shadow-md backdrop-blur-md"
                        title="Share"
                    >
                        <span className="material-symbols-outlined text-[20px]">share</span>
                    </motion.button>
                </div>
            </div>

            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                    <BeeLoader size="large" message="Sourcing cinematic intelligence..." />
                </div>
            ) : error ? (
                <div className="py-20 px-6 max-w-md mx-auto">
                    <ErrorState message={error} onRetry={() => window.location.reload()} />
                </div>
            ) : details ? (
                <>
                    {view === 'details' ? (
                        <>
                            {/* Hero Header (Exact ExpandedCard Style) */}
                            <div className="relative w-full h-[60vh] md:h-[70vh] shrink-0 bg-[#FFF9F0] -mt-[56px] md:-mt-[64px]">
                                <picture>
                                    {backdropUrl && <source media="(min-width: 768px)" srcSet={backdropUrl} />}
                                    {posterUrl && (
                                        <img
                                            src={posterUrl}
                                            alt={title}
                                            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
                                        />
                                    )}
                                </picture>

                                {/* Cinematic Gradient Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                                {/* Metadata at bottom of Hero */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-3">
                                    {(() => {
                                        const category = getFormatCategory(details, mediaType);
                                        return (
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3.5 py-1 rounded-full text-xs font-black tracking-wide border flex items-center gap-1.5 shadow-md backdrop-blur-md ${category.color}`}>
                                                    <span>{category.icon}</span>
                                                    <span>{category.label}</span>
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    <h1 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight drop-shadow-sm leading-tight">
                                        {title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-[#2D2926]/70 font-bold text-xs md:text-sm uppercase tracking-[0.2em]">
                                        {primaryGenre && <span>{primaryGenre}</span>}
                                        {primaryGenre && year && <span className="opacity-40">•</span>}
                                        {year && <span>{year}</span>}
                                        {year && runtime && <span className="opacity-40">•</span>}
                                        {runtime && <span>{runtime}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="px-6 md:px-10 pb-24 pt-4 flex flex-col gap-10 w-full relative z-10">
                                {/* Interactive Action Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-[#ffb700]/20 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                        <button
                                            onClick={handleWatchlistToggle}
                                            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xs ${
                                                inWatchlist
                                                    ? 'bg-[#ffb700] text-white'
                                                    : 'bg-[#FFF9F0] text-[#2D2926] hover:bg-[#ffb700]/10 border border-[#ffb700]/15'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {inWatchlist ? 'bookmark_added' : 'bookmark_add'}
                                            </span>
                                            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                                        </button>

                                        {inWatchlist && (
                                            <button
                                                onClick={handleStartWatching}
                                                disabled={isTransitioning}
                                                className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-[#FFF9F0] text-[#2D2926] border border-[#ffb700]/15 hover:bg-[#ffb700]/10 flex items-center gap-2 transition-all shadow-xs"
                                            >
                                                <span className="material-symbols-outlined text-[18px] text-[#ffb700]">
                                                     visibility
                                                 </span>
                                                 Log Currently Watching
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setView('log')}
                                            className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-[#ffb700] text-white hover:brightness-105 flex items-center gap-2 transition-all shadow-md shadow-[#ffb700]/20"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                            Log Watch
                                        </button>

                                        <button
                                            onClick={() => setView('suggest')}
                                            className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-[#FFF9F0] text-[#2D2926] border border-[#ffb700]/15 hover:bg-[#ffb700]/10 flex items-center gap-2 transition-all shadow-xs"
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-[#ffb700]">send</span>
                                            Suggest
                                        </button>
                                    </div>
                                </div>

                                {/* Accolades & Critic Reception Section */}
                                {(details.awards || (details.critic_ratings && details.critic_ratings.length > 0)) && (
                                    <div className="flex flex-col gap-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white p-6 md:p-8 rounded-3xl border border-amber-400/30 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center gap-3.5">
                                            <span className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                                                🏆
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-[#2D2926] text-lg font-black tracking-tight">Accolades & Recognition</h3>
                                                {details.awards && (
                                                    <p className="text-sm font-extrabold text-amber-950 mt-0.5 leading-snug">{details.awards}</p>
                                                )}
                                            </div>
                                        </div>

                                        {details.critic_ratings && details.critic_ratings.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-amber-400/20">
                                                {details.critic_ratings.map((r, idx) => (
                                                    <div key={idx} className="px-4 py-2 bg-white/90 rounded-2xl border border-black/5 shadow-2xs flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-400">{r.Source}:</span>
                                                        <span className="text-xs font-black text-[#2D2926]">{r.Value}</span>
                                                    </div>
                                                ))}
                                                {details.box_office && (
                                                    <div className="px-4 py-2 bg-white/90 rounded-2xl border border-black/5 shadow-2xs flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-400">Box Office:</span>
                                                        <span className="text-xs font-black text-emerald-600">{details.box_office}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Synopsis */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                                        Synopsis
                                    </h3>
                                    <p className="text-[#2D2926]/80 text-lg md:text-xl leading-relaxed font-serif tracking-wide">
                                        {details.overview || 'No synopsis available for this title.'}
                                    </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                            TMDB Score
                                        </span>
                                        <span className="text-[#2D2926] text-2xl font-black">
                                            {details.vote_average ? `⭐ ${details.vote_average.toFixed(1)}` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                            Release Date
                                        </span>
                                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">
                                            {formatDate(details.release_date || details.first_air_date)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                            Runtime
                                        </span>
                                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">
                                            {runtime || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                            Format Category
                                        </span>
                                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide uppercase flex items-center gap-1">
                                            <span>{getFormatCategory(details, mediaType).icon}</span>
                                            <span>{getFormatCategory(details, mediaType).label}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Star Cast Carousel */}
                                {(() => {
                                    const castList = details.credits?.cast || details.aggregate_credits?.cast || [];
                                    if (!castList || castList.length === 0) return null;

                                    return (
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                                                <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                                                Cast & Performers ({castList.length})
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                                                {castList.slice(0, 15).map(member => (
                                                    <div 
                                                        key={member.id}
                                                        className="w-32 shrink-0 bg-white border border-black/5 rounded-2xl p-3 shadow-2xs flex flex-col items-center text-center group hover:border-[#ffb700]/30 transition-all"
                                                    >
                                                        {member.profile_path ? (
                                                            <img 
                                                                src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} 
                                                                alt={member.name}
                                                                className="w-20 h-20 object-cover rounded-full shadow-xs mb-2 group-hover:scale-105 transition-transform" 
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                                                <span className="material-symbols-outlined text-2xl">person</span>
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-black text-[#2D2926] line-clamp-1 group-hover:text-[#ffb700] transition-colors">
                                                            {member.name}
                                                        </span>
                                                        {member.character && (
                                                            <span className="text-[10px] font-bold text-slate-400 line-clamp-2 mt-0.5">
                                                                {member.character}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Season & Episode Drill Down Accordion */}
                                {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
                                    <div className="flex flex-col gap-6 bg-white p-6 md:p-8 rounded-3xl border border-[#ffb700]/20 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Seasons & Episode Guide</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                                    {details.number_of_seasons || details.seasons.length} Season(s) • {details.number_of_episodes || '—'} Total Episodes
                                                </p>
                                            </div>
                                        </div>

                                        {/* Season Selector Tabs */}
                                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                            {details.seasons.map(s => (
                                                <button
                                                    key={s.id || s.season_number}
                                                    onClick={() => setSelectedSeasonNumber(s.season_number)}
                                                    className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all cursor-pointer ${
                                                        selectedSeasonNumber === s.season_number
                                                            ? 'bg-[#ffb700] text-white shadow-md shadow-[#ffb700]/20'
                                                            : 'bg-slate-50 text-[#2D2926]/70 hover:bg-slate-100 border border-black/5'
                                                    }`}
                                                >
                                                    {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selected Season Episodes */}
                                        {isSeasonLoading ? (
                                            <div className="py-12 flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffb700]"></div>
                                            </div>
                                        ) : seasonDetails?.episodes && seasonDetails.episodes.length > 0 ? (
                                            <div className="flex flex-col gap-3 mt-2">
                                                {seasonDetails.episodes.map(ep => (
                                                    <div 
                                                        key={ep.id || ep.episode_number}
                                                        className="p-4 bg-slate-50/70 hover:bg-[#ffb700]/5 rounded-2xl border border-black/5 hover:border-[#ffb700]/30 transition-all flex flex-col md:flex-row gap-4"
                                                    >
                                                        {ep.still_path ? (
                                                            <img 
                                                                src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} 
                                                                alt={ep.name}
                                                                className="w-full md:w-40 h-24 object-cover rounded-xl shadow-xs shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-full md:w-40 h-24 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                                <span className="material-symbols-outlined text-3xl">tv</span>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col min-w-0 flex-grow gap-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="px-2 py-0.5 bg-[#ffb700]/10 text-[#ffb700] rounded-md text-[10px] font-black uppercase">
                                                                        EP {ep.episode_number}
                                                                    </span>
                                                                    <h4 className="text-sm font-black text-[#2D2926] truncate">
                                                                        {ep.name}
                                                                    </h4>
                                                                </div>
                                                                {ep.vote_average && ep.vote_average > 0 && (
                                                                    <span className="text-xs font-black text-amber-500 flex items-center gap-0.5 shrink-0">
                                                                        ⭐ {ep.vote_average.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                                                                {ep.air_date && <span>Aired: {formatDate(ep.air_date)}</span>}
                                                                {ep.runtime && <span>• {ep.runtime}m</span>}
                                                            </div>
                                                            <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1">
                                                                {ep.overview || 'No episode synopsis available.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-bold">
                                                Select a season above to inspect episodes.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Where to Watch */}
                                {(() => {
                                    const watchProvidersData = details['watch/providers']?.results;
                                    const localProviders = watchProvidersData
                                        ? watchProvidersData.IN || watchProvidersData.US || Object.values(watchProvidersData)[0]
                                        : null;

                                    if (!localProviders) return null;

                                    const streamingProviders = localProviders.flatrate || localProviders.free || [];
                                    const rentProviders = localProviders.rent || [];
                                    const buyProviders = localProviders.buy || [];

                                    if (!streamingProviders.length && !rentProviders.length && !buyProviders.length) return null;

                                    return (
                                        <div className="flex flex-col gap-4 bg-white p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb700]/40 via-[#ffb700] to-[#ffb700]/40 opacity-80"></div>
                                            <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em]">
                                                Where to Watch (India)
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {streamingProviders.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-xs font-bold text-[#2D2926]/60 w-16">Stream:</span>
                                                        {streamingProviders.map((p: any) => (
                                                            <a
                                                                href={getDirectLink(p.provider_name, localProviders.link || '', title)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                key={p.provider_id}
                                                                className="shrink-0 hover:scale-105 transition-transform duration-200"
                                                                title={p.provider_name}
                                                            >
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                                                    alt={p.provider_name}
                                                                    className="w-10 h-10 rounded-xl shadow-xs border border-[#2D2926]/5"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                {rentProviders.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-xs font-bold text-[#2D2926]/60 w-16">Rent:</span>
                                                        {rentProviders.map((p: any) => (
                                                            <a
                                                                href={getDirectLink(p.provider_name, localProviders.link || '', title)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                key={p.provider_id}
                                                                className="shrink-0 hover:scale-105 transition-transform duration-200"
                                                                title={p.provider_name}
                                                            >
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                                                    alt={p.provider_name}
                                                                    className="w-10 h-10 rounded-xl shadow-xs border border-[#2D2926]/5"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                {buyProviders.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-xs font-bold text-[#2D2926]/60 w-16">Buy:</span>
                                                        {buyProviders.map((p: any) => (
                                                            <a
                                                                href={getDirectLink(p.provider_name, localProviders.link || '', title)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                key={p.provider_id}
                                                                className="shrink-0 hover:scale-105 transition-transform duration-200"
                                                                title={p.provider_name}
                                                            >
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                                                    alt={p.provider_name}
                                                                    className="w-10 h-10 rounded-xl shadow-xs border border-[#2D2926]/5"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    ) : view === 'log' ? (
                        <div className="p-6 md:p-10 animate-[fade-in_0.3s_ease-out] relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={() => setView('details')}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 border border-white/20 text-[#ffb700] hover:bg-white/30 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[26px] ml-1">arrow_back_ios</span>
                                </button>
                                <div>
                                    <h3 className="text-2xl font-black text-[#2D2926]">Log Your Watch</h3>
                                    <p className="text-xs font-bold text-[#2D2926]/40 uppercase tracking-widest">
                                        Adding entry for {title}
                                    </p>
                                </div>
                            </div>

                            <EntryForm
                                prefillData={{
                                    tmdbId: tmdbId!,
                                    title,
                                    type: mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                                    posterPath: details.poster_path,
                                    overview: details.overview,
                                    suggestedByUserId: location.state?.suggestedByUserId || location.state?.suggestedByUser?.id || null,
                                    suggestedByUser: location.state?.suggestedByUser || null,
                                }}
                                isModal={false}
                                onSuccess={() => setView('details')}
                                onCancel={() => setView('details')}
                            />
                        </div>
                    ) : (
                        <div className="p-6 md:p-10 animate-[fade-in_0.3s_ease-out] relative z-10">
                            <SuggestUserSelector
                                tmdbId={tmdbId!}
                                mediaType={mediaType}
                                title={title}
                                onBack={() => setView('details')}
                                onSuccess={async () => {
                                    await alert(`Suggestion for ${title} sent!`, {
                                        title: 'Suggestion Sent',
                                        severity: 'success',
                                    });
                                    setView('details');
                                }}
                            />
                        </div>
                    )}
                </>
            ) : null}
        </motion.div>
    );
};

export default MovieDetailsPage;
