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
    const inWatchlist = tmdbId ? isInWatchlist(tmdbId) : false;

    const handleStartWatching = async () => {
        if (!tmdbId || isTransitioning) return;

        const confirmed = await confirm(
            `Would you like to start watching "${title}"? This will move it from your watchlist to your Currently Watching list.`,
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

    const getLanguageName = (code?: string) => {
        if (!code) return '';
        try {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
            return displayNames.of(code) || code.toUpperCase();
        } catch {
            return code.toUpperCase();
        }
    };

    return (
        <PageLayout maxWidth="5xl">
            <div className="space-y-6 pb-12 animate-fade-in">
                {/* Back Button Toolbar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ffb700]/20 rounded-2xl text-xs font-black uppercase tracking-widest text-[#2D2926] shadow-sm hover:bg-[#FFF9F0] transition-all group"
                    >
                        <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                            arrow_back
                        </span>
                        Back
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
                    <div className="bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm p-6 md:p-10 relative overflow-hidden">
                        {view === 'details' ? (
                            <>
                                {/* Hero Backdrop */}
                                <div className="relative -mx-6 -mt-6 md:-mx-10 md:-mt-10 h-56 md:h-96 overflow-hidden">
                                    {details.backdrop_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#2D2926]/5 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-6xl text-[#2D2926]/10">movie</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                                </div>

                                {/* Main Content Layout */}
                                <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative -mt-20 md:-mt-48 z-10">
                                    {/* Poster */}
                                    <div className="w-40 sm:w-52 md:w-64 shrink-0 mx-auto md:mx-0">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white"
                                        >
                                            {details.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                                                    alt={title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926]/20 font-black">
                                                    NO POSTER
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Metadata & Actions */}
                                    <div className="flex-1 flex flex-col pt-2 md:pt-16 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                            <span className="px-3 py-1 rounded-full bg-[#ffb700] text-white text-[10px] font-black uppercase tracking-widest shadow-xs">
                                                {mediaType === 'tv' ? 'TV SERIES' : 'MOVIE'}
                                            </span>
                                            {year && (
                                                <span className="text-xs md:text-sm font-bold text-[#2D2926]/40">{year}</span>
                                            )}
                                            <div className="flex items-center gap-1 text-[#ffb700]">
                                                <span className="material-symbols-outlined text-base filled">star</span>
                                                <span className="text-xs md:text-sm font-black">{details.vote_average.toFixed(1)}</span>
                                            </div>
                                        </div>

                                        <h1 className="text-2xl md:text-5xl font-black text-[#2D2926] leading-tight mb-2 tracking-tight">
                                            {title}
                                        </h1>

                                        {details.tagline && (
                                            <p className="text-sm md:text-lg font-bold text-[#ffb700] italic mb-4">
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

                                        {/* Action Bar */}
                                        <div className="flex flex-wrap items-center gap-4 py-5 border-y border-[#ffb700]/15 mb-6">
                                            <button
                                                onClick={handleWatchlistToggle}
                                                className="flex items-center gap-2 group transition-all"
                                                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                            >
                                                <span className={`material-symbols-outlined text-[22px] ${inWatchlist ? 'text-[#ffb700] filled' : 'text-[#2D2926]/40 group-hover:text-[#ffb700]'}`}>
                                                    {inWatchlist ? 'bookmark_added' : 'bookmark_add'}
                                                </span>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${inWatchlist ? 'text-[#ffb700]' : 'text-[#2D2926]/60 group-hover:text-[#2D2926]'}`}>
                                                    {inWatchlist ? 'Saved' : 'Watchlist'}
                                                </span>
                                            </button>

                                            {inWatchlist && (
                                                <button
                                                    onClick={handleStartWatching}
                                                    disabled={isTransitioning}
                                                    className="flex items-center gap-2 group transition-all disabled:opacity-50"
                                                >
                                                    {isTransitioning ? (
                                                        <span className="animate-spin text-[16px] text-[#ffb700]">⏳</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[22px] text-[#2D2926]/40 group-hover:text-[#ffb700]">
                                                            play_circle
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#2D2926]/60 group-hover:text-[#2D2926]">
                                                        Start Watching
                                                    </span>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setView('log')}
                                                className="flex items-center gap-2 group transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[22px] text-[#2D2926]/40 group-hover:text-[#2D2926]">
                                                    edit_note
                                                </span>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-[#2D2926]/60 group-hover:text-[#2D2926]">
                                                    Log Watch
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => setView('suggest')}
                                                className="flex items-center gap-2 group transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[22px] text-[#2D2926]/40 group-hover:text-[#ffb700]">
                                                    send
                                                </span>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-[#2D2926]/60 group-hover:text-[#2D2926]">
                                                    Suggest
                                                </span>
                                            </button>

                                            <button
                                                onClick={handleShare}
                                                className="ml-auto w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF9F0] border border-[#ffb700]/15 text-[#2D2926]/50 hover:text-[#ffb700] hover:bg-white transition-all shadow-xs"
                                                title="Share this movie"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">share</span>
                                            </button>
                                        </div>

                                        {/* Synopsis */}
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-2">
                                                The Narrative
                                            </h4>
                                            <p className="text-[#2D2926]/80 leading-relaxed font-medium text-base md:text-lg">
                                                {details.overview || 'No transmission available for this cinematic entry.'}
                                            </p>
                                        </div>

                                        {/* Where to Watch */}
                                        {(() => {
                                            const watchProvidersData = details['watch/providers']?.results;
                                            const localProviders = watchProvidersData
                                                ? watchProvidersData.US || Object.values(watchProvidersData)[0]
                                                : null;

                                            const streamingProviders = localProviders?.flatrate || localProviders?.free || [];
                                            const purchaseProviders = localProviders?.rent || localProviders?.buy || [];

                                            const uniqueRentBuy = purchaseProviders.reduce((acc: any[], current: any) => {
                                                const x = acc.find(item => item.provider_id === current.provider_id);
                                                if (!x) return acc.concat([current]);
                                                return acc;
                                            }, []);

                                            if (!streamingProviders.length && !uniqueRentBuy.length) return null;

                                            return (
                                                <div className="mb-8 p-6 bg-[#FFF9F0]/60 rounded-3xl border border-[#ffb700]/15">
                                                    <h4 className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm text-[#ffb700]">
                                                            live_tv
                                                        </span>
                                                        Where to Watch
                                                    </h4>

                                                    <div className="flex flex-col gap-4">
                                                        {streamingProviders.length > 0 && (
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                <span className="text-[10px] font-black text-[#2D2926]/50 uppercase tracking-widest sm:w-28 shrink-0">
                                                                    Stream
                                                                </span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {streamingProviders.map((provider: any) => (
                                                                        <div
                                                                            key={provider.provider_id}
                                                                            className="flex items-center gap-2 bg-white border border-[#ffb700]/15 pl-1.5 pr-3 py-1 rounded-xl shadow-xs text-xs font-bold text-[#2D2926]"
                                                                            title={provider.provider_name}
                                                                        >
                                                                            <img
                                                                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                                                                alt={provider.provider_name}
                                                                                className="w-5 h-5 rounded-md object-cover"
                                                                            />
                                                                            <span>{provider.provider_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {uniqueRentBuy.length > 0 && (
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                <span className="text-[10px] font-black text-[#2D2926]/50 uppercase tracking-widest sm:w-28 shrink-0">
                                                                    Rent / Buy
                                                                </span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {uniqueRentBuy.map((provider: any) => (
                                                                        <div
                                                                            key={provider.provider_id}
                                                                            className="flex items-center gap-2 bg-white border border-[#ffb700]/15 pl-1.5 pr-3 py-1 rounded-xl shadow-xs text-xs font-bold text-[#2D2926]"
                                                                            title={provider.provider_name}
                                                                        >
                                                                            <img
                                                                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                                                                alt={provider.provider_name}
                                                                                className="w-5 h-5 rounded-md object-cover"
                                                                            />
                                                                            <span>{provider.provider_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Cinematic Intel */}
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-4">
                                                Cinematic Intel
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-t border-b border-[#ffb700]/15">
                                                <div>
                                                    <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                        Released
                                                    </h5>
                                                    <p className="font-black text-[#2D2926]">
                                                        {formatDate(details.release_date || details.first_air_date)}
                                                    </p>
                                                </div>

                                                {details.runtime ? (
                                                    <div>
                                                        <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                            Duration
                                                        </h5>
                                                        <p className="font-black text-[#2D2926]">{details.runtime} mins</p>
                                                    </div>
                                                ) : details.episode_run_time?.[0] ? (
                                                    <div>
                                                        <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                            Episode Runtime
                                                        </h5>
                                                        <p className="font-black text-[#2D2926]">
                                                            {details.episode_run_time[0]} mins
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {mediaType === 'tv' && (
                                                    <div>
                                                        <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                            Format
                                                        </h5>
                                                        <p className="font-black text-[#2D2926]">
                                                            {details.number_of_seasons
                                                                ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`
                                                                : ''}
                                                            {details.number_of_episodes
                                                                ? ` (${details.number_of_episodes} Episode${details.number_of_episodes > 1 ? 's' : ''})`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                )}

                                                {details.status && (
                                                    <div>
                                                        <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                            Status
                                                        </h5>
                                                        <p className="font-black text-[#2D2926]">{details.status}</p>
                                                    </div>
                                                )}

                                                {details.original_language && (
                                                    <div>
                                                        <h5 className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-1">
                                                            Language
                                                        </h5>
                                                        <p className="font-black text-[#2D2926]">
                                                            {getLanguageName(details.original_language)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : view === 'log' ? (
                            <div className="animate-[fade-in_0.3s_ease-out]">
                                <div className="flex items-center gap-4 mb-8">
                                    <button
                                        onClick={() => setView('details')}
                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF9F0] border border-[#ffb700]/15 text-[#2D2926] hover:bg-white transition-colors"
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
                            <div className="animate-[fade-in_0.3s_ease-out]">
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
