import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BeeLoader, ErrorState } from '../components/common';
import apiClient from '../services/api';
import { useWatchlist } from '../contexts/WatchlistContext';
import { EntryForm } from '../components/entries/EntryForm';
import { SuggestUserSelector } from '../components/suggestions/SuggestUserSelector';
import { useUI, useCustomAlert } from '../contexts';
import { entriesApi } from '../services/entries.service';
import { PageLayout } from '../components/layout';

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
    tagline?: string;
    status?: string;
    original_language?: string;
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
    const { setPageTitle, setPageIcon } = useUI();
    const { alert, confirm } = useCustomAlert();
    const { addToList, removeFromList, isInWatchlist } = useWatchlist();

    const mediaType = (paramMediaType === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
    const tmdbId = paramTmdbId ? parseInt(paramTmdbId, 10) : null;

    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialAction = searchParams.get('action') || 'details';
    const [view, setView] = useState<'details' | 'log' | 'suggest'>(
        initialAction === 'log' ? 'log' : initialAction === 'suggest' ? 'suggest' : 'details'
    );
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        setPageTitle(mediaType === 'tv' ? 'TV Details' : 'Movie Details');
        setPageIcon('movie');
    }, [mediaType, setPageTitle, setPageIcon]);

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

    const title = details?.title || details?.name || 'Loading...';
    const year = (details?.release_date || details?.first_air_date || '').substring(0, 4);
    const runtime = details?.runtime ? `${details.runtime}m` : details?.episode_run_time?.[0] ? `${details.episode_run_time[0]}m` : null;
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
            `Would you like to start watching "${title}"? This will move it to your Currently Watching list.`,
            { title: 'Start Watching', confirmText: 'Start Watching', severity: 'primary' }
        );
        if (!confirmed) return;

        setIsTransitioning(true);
        try {
            const apiType = mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE';
            await entriesApi.createEntry({
                tmdbId,
                title,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString(),
            });
            await removeFromList(tmdbId);
            await alert(`"${title}" has been moved to your Currently Watching list!`, {
                title: 'Watching Started',
                severity: 'success',
                confirmText: 'Awesome',
            });
        } catch (err) {
            console.error('Failed to start watching:', err);
            await alert(`Failed to start watching "${title}". Please try again.`, {
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
            if (inWatchlist) {
                await removeFromList(tmdbId);
            } else {
                await addToList(tmdbId, mediaType);
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <PageLayout maxWidth="5xl">
            <div className="space-y-6 pb-12 animate-fade-in">
                {/* Back Button Toolbar — clearly visible inside main layout */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#ffb700]/20 rounded-2xl text-xs font-black uppercase tracking-widest text-[#2D2926] shadow-sm hover:bg-[#FFF9F0] transition-all group"
                    >
                        <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                            arrow_back
                        </span>
                        Back
                    </button>
                    
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#ffb700]/20 text-[#2D2926]/60 hover:text-[#ffb700] transition-all shadow-xs"
                        title="Share"
                    >
                        <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                </div>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm">
                        <BeeLoader size="large" message="Sourcing cinematic intelligence..." />
                    </div>
                ) : error ? (
                    <div className="py-12 bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm">
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    </div>
                ) : details ? (
                    <div className="bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm overflow-hidden relative">
                        {view === 'details' ? (
                            <>
                                {/* Hero Backdrop Header */}
                                <div className="relative w-full h-[40vh] md:h-[50vh] bg-[#FFF9F0] overflow-hidden">
                                    {backdropUrl ? (
                                        <motion.img
                                            initial={{ scale: 1.05, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                            src={backdropUrl}
                                            alt={title}
                                            className="w-full h-full object-cover object-top md:object-center"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926]/20">
                                            <span className="material-symbols-outlined text-6xl">movie</span>
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                                </div>

                                {/* Content Body */}
                                <div className="p-6 md:p-10 relative -mt-24 md:-mt-32 z-10 space-y-8">
                                    {/* Title & Core Meta */}
                                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                                        {/* Poster */}
                                        {posterUrl && (
                                            <div className="w-36 md:w-48 shrink-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white mx-auto md:mx-0">
                                                <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 pt-2 md:pt-16">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="px-3 py-1 rounded-full bg-[#ffb700] text-white text-[10px] font-black uppercase tracking-widest shadow-xs">
                                                    {mediaType === 'tv' ? 'TV SERIES' : 'MOVIE'}
                                                </span>
                                                {details.vote_average > 0 && (
                                                    <span className="px-3 py-1 rounded-full bg-[#FFF9F0] border border-[#ffb700]/20 text-[#ffb700] text-[10px] font-black flex items-center gap-1">
                                                        ⭐ {details.vote_average.toFixed(1)}
                                                    </span>
                                                )}
                                                {year && <span className="text-xs font-bold text-[#2D2926]/40">{year}</span>}
                                            </div>

                                            <h1 className="text-3xl md:text-5xl font-black text-[#2D2926] tracking-tight leading-tight mb-2">
                                                {title}
                                            </h1>

                                            {details.tagline && (
                                                <p className="text-sm md:text-base font-bold text-[#ffb700] italic mb-4">
                                                    "{details.tagline}"
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {details.genres.map(genre => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-3 py-1 rounded-xl bg-[#FFF9F0] text-[#2D2926]/70 text-[10px] font-black uppercase tracking-widest border border-[#ffb700]/15"
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#FFF9F0]/60 rounded-3xl border border-[#ffb700]/15">
                                        <button
                                            onClick={handleWatchlistToggle}
                                            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xs ${
                                                inWatchlist
                                                    ? 'bg-[#ffb700] text-white'
                                                    : 'bg-white text-[#2D2926] hover:bg-[#ffb700]/10 border border-[#ffb700]/15'
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
                                                className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white text-[#2D2926] border border-[#ffb700]/15 hover:bg-[#ffb700]/10 flex items-center gap-2 transition-all shadow-xs"
                                            >
                                                <span className="material-symbols-outlined text-[18px] text-[#ffb700]">
                                                    play_circle
                                                </span>
                                                Start Watching
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
                                            className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white text-[#2D2926] border border-[#ffb700]/15 hover:bg-[#ffb700]/10 flex items-center gap-2 transition-all shadow-xs"
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-[#ffb700]">send</span>
                                            Suggest
                                        </button>
                                    </div>

                                    {/* Synopsis */}
                                    <div className="space-y-2">
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
                                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[#FFF9F0]/60 border border-[#ffb700]/15 shadow-xs">
                                            <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                                TMDb Rating
                                            </span>
                                            <span className="text-[#2D2926] text-2xl font-black">
                                                {details.vote_average ? `⭐ ${details.vote_average.toFixed(1)}` : '-'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[#FFF9F0]/60 border border-[#ffb700]/15 shadow-xs">
                                            <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                                Release Date
                                            </span>
                                            <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">
                                                {formatDate(details.release_date || details.first_air_date)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[#FFF9F0]/60 border border-[#ffb700]/15 shadow-xs">
                                            <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                                Runtime
                                            </span>
                                            <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">
                                                {runtime || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[#FFF9F0]/60 border border-[#ffb700]/15 shadow-xs">
                                            <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">
                                                Format
                                            </span>
                                            <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide uppercase">
                                                {mediaType === 'tv'
                                                    ? `${details.number_of_seasons || 1} Season(s)`
                                                    : 'Feature Film'}
                                            </span>
                                        </div>
                                    </div>

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
                                            <div className="flex flex-col gap-4 bg-[#FFF9F0]/60 p-6 md:p-8 rounded-3xl border border-[#ffb700]/15">
                                                <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em]">
                                                    Where to Watch
                                                </h3>
                                                <div className="flex flex-col gap-4">
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
                            <div className="p-6 md:p-10 animate-[fade-in_0.3s_ease-out]">
                                <div className="flex items-center gap-4 mb-8">
                                    <button
                                        onClick={() => setView('details')}
                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF9F0] border border-[#ffb700]/20 text-[#2D2926] hover:bg-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
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
                                    }}
                                    isModal={false}
                                    onSuccess={() => setView('details')}
                                    onCancel={() => setView('details')}
                                />
                            </div>
                        ) : (
                            <div className="p-6 md:p-10 animate-[fade-in_0.3s_ease-out]">
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
                    </div>
                ) : null}
            </div>
        </PageLayout>
    );
};

export default MovieDetailsPage;
