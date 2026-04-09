import React, { useState, useEffect, useCallback } from 'react';
import { entriesApi, Entry, GetEntriesParams } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { 
    SkeletonCard, 
    SkeletonGrid,
    ErrorState, 
    EmptyState,
    FilterBar
} from '../common';
import '../profile/Profile.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryListProps {
    onEdit?: (entry: Entry) => void;
    filters?: GetEntriesParams;
    readOnly?: boolean;
}

interface TmdbDetails {
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    genres: string[];
    runtime?: number | null;
    release_date?: string;
    first_air_date?: string;
    number_of_seasons?: number;
    tagline?: string;
    watch_providers?: any;
}

const tmdbCache = new Map<string, TmdbDetails>();

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return formattedDate;
};

export const EntryCard: React.FC<{
    entry: Entry;
    onEdit?: (entry: Entry) => void;
    onDelete?: (id: string) => void;
    onComplete?: (entry: Entry) => void;
    onClick?: (entry: Entry, details: TmdbDetails | null) => void;
}> = ({ entry, onEdit, onDelete: _onDelete, onComplete: _onComplete, onClick }) => {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [imgError, setImgError] = useState(false);

    const cacheKey = `${entry.type}-${entry.tmdbId}`;

    useEffect(() => {
        if (tmdbCache.has(cacheKey)) {
            setDetails(tmdbCache.get(cacheKey)!);
            return;
        }

        const fetchDetails = async () => {
            try {
                const endpoint = entry.type === 'TV_SHOW' ? 'tv' : 'movie';
                const data: any = await apiClient.get(`/tmdb/${endpoint}/${entry.tmdbId}`);

                const parsed: TmdbDetails = {
                    poster_path: data.poster_path,
                    backdrop_path: data.backdrop_path,
                    overview: data.overview || '',
                    vote_average: data.vote_average || 0,
                    genres: (data.genres || []).map((g: any) => g.name),
                    runtime: data.runtime || null,
                    release_date: data.release_date,
                    first_air_date: data.first_air_date,
                    number_of_seasons: data.number_of_seasons,
                    tagline: data.tagline || '',
                    watch_providers: data['watch/providers']?.results || {},
                };
                tmdbCache.set(cacheKey, parsed);
                setDetails(parsed);
            } catch (err) {
                console.error("Failed fetching entry details:", err);
            }
        };
        fetchDetails();
    }, [cacheKey, entry.tmdbId, entry.type]);

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/w342${details.poster_path}`
        : null;

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'MOVIE': return { emoji: '🎬', label: 'Movie', color: 'bg-indigo-500' };
            case 'TV_SHOW': return { emoji: '📺', label: 'TV Series', color: 'bg-blue-500' };
            case 'EPISODE': return { emoji: '📼', label: 'Episode', color: 'bg-emerald-500' };
            default: return { emoji: '🎞️', label: type, color: 'bg-gray-500' };
        }
    };

    const ti = getTypeInfo(entry.type);
    const year = details?.release_date?.slice(0, 4) || details?.first_air_date?.slice(0, 4);
    const runtime = details?.runtime ? `${details.runtime}m` : null;
    const primaryGenre = details?.genres?.[0];

    const metaItems = [];
    if (year) metaItems.push(year);
    if (primaryGenre) metaItems.push(primaryGenre);
    if (runtime) metaItems.push(runtime);
    const metadataString = metaItems.join(' • ');

    return (
        <motion.div
            layoutId={`card-wrapper-${entry.id}`}
            className="watchlist-card group relative cursor-pointer overflow-hidden transform-gpu rounded-3xl"
            onClick={() => onClick && onClick(entry, details)}
            whileHover={onClick ? { scale: 0.98, transition: { duration: 0.2 } } : {}}
            whileTap={onClick ? { scale: 0.95 } : {}}
        >
            <div className="watchlist-card__poster-wrapper bg-stone-900 rounded-t-xl overflow-hidden relative">
                {posterUrl && !imgError ? (
                    <motion.img
                        layoutId={`poster-${entry.id}`}
                        src={posterUrl}
                        alt={entry.title}
                        className="watchlist-card__poster object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="watchlist-card__no-poster h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-[#2D2926]/20">movie</span>
                    </div>
                )}

                {/* Overlay shadow for cinematic feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-[#ffb700] flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                    )}
                    {_onDelete && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                _onDelete(entry.id); 
                            }} 
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-red-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors" 
                            title="Delete"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                    {_onComplete && entry.isWatching && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                _onComplete(entry); 
                            }} 
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-green-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors" 
                            title="Complete Watching"
                        >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                    )}
                </div>

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className={`${ti.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90`}>
                        {ti.emoji}
                    </span>
                </div>
            </div>

            <motion.div layoutId={`card-content-${entry.id}`} className="watchlist-card__info gap-1 p-4 flex flex-col h-full bg-white">
                <motion.h4 layoutId={`title-${entry.id}`} className="watchlist-card__title text-[13px] leading-tight font-black text-[#2D2926] truncate" title={entry.title}>
                    {entry.title}
                </motion.h4>
                <div className="text-[10px] text-[#2D2926]/40 dark:text-stone-400 font-bold mb-1.5 flex items-center justify-between">
                    <span>{formatDate(entry.watchedAt)}</span>
                </div>
                {details?.overview && (
                    <p className="text-[11px] text-[#2D2926]/60 dark:text-stone-500 line-clamp-2 leading-relaxed mb-2 mt-0.5">
                        {details.overview}
                    </p>
                )}
                <div className="watchlist-card__meta text-[11px] font-bold mt-auto text-[#2D2926]/60 dark:text-stone-400 flex items-center justify-between w-full">
                    <span className="truncate flex-1">{metadataString || '-'}</span>
                    {entry.rating && <span className="watchlist-card__rating text-[#ffb700] flex items-center gap-1 shrink-0 ml-2">⭐ {entry.rating}</span>}
                </div>
            </motion.div>
        </motion.div>
    );
};

export const ExpandedCard: React.FC<{
    entry: Entry;
    details: TmdbDetails | null;
    onClose: () => void;
    onEdit?: (entry: Entry) => void;
    onDelete?: (id: string) => void;
    onComplete?: (entry: Entry) => void;
}> = ({ entry, details, onClose, onEdit, onDelete, onComplete }) => {
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = React.useRef(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentY = e.currentTarget.scrollTop;
        if (currentY > lastScrollY.current && currentY > 60) {
            if (isNavVisible) setIsNavVisible(false);
        } else if (currentY < lastScrollY.current) {
            if (!isNavVisible) setIsNavVisible(true);
        }
        lastScrollY.current = currentY;
    };

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/original${details.poster_path}`
        : null;

    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : posterUrl;

    const year = details?.release_date?.slice(0, 4) || details?.first_air_date?.slice(0, 4);
    const runtime = details?.runtime ? `${details.runtime}m` : null;
    const primaryGenre = details?.genres?.[0];

    const getDirectLink = (providerName: string, fallbackLink: string) => {
        const title = entry.title || '';
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

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
            exit={{ opacity: 0, y: 0, transition: { duration: 0.35, ease: [0.66, 0.06] } }}
            onScroll={handleScroll}
            className="fixed inset-y-0 right-0 left-0 md:left-[256px] z-[100] flex flex-col bg-[#FFF9F0] overflow-y-auto no-scrollbar font-display"
        >
            {/* Sticky Navigation Bar */}
            <div
                className={`sticky top-4 md:top-6 z-50 flex justify-between items-start px-4 md:px-6 pointer-events-none w-full max-w-full transition-all duration-300 ease-in-out ${isNavVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-xl flex items-center justify-center text-[#2D2926]/90 hover:bg-white hover:text-[#ffb700] transition-all border border-white/40 shadow-sm pointer-events-auto shadow-md"
                    title="Back"
                >
                    <span className="material-symbols-outlined text-[20px] ml-1">arrow_back_ios</span>
                </motion.button>

                {onEdit && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => {
                            onClose();
                            onEdit(entry);
                        }}
                        className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl flex items-center gap-2 text-[#2D2926] font-bold text-sm hover:bg-white hover:text-[#ffb700] transition-all border border-white/40 shadow-sm shadow-md pointer-events-auto"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        Edit Entry
                    </motion.button>
                )}

                {onDelete && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => {
                            onDelete(entry.id);
                        }}
                        className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl flex items-center gap-2 text-[#2D2926] font-bold text-sm hover:bg-red-50 hover:text-red-500 transition-all border border-white/40 shadow-sm shadow-md pointer-events-auto"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete Entry
                    </motion.button>
                )}

                {onComplete && entry.isWatching && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => {
                            onComplete(entry);
                        }}
                        className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl flex items-center gap-2 text-[#2D2926] font-bold text-sm hover:bg-green-50 hover:text-green-600 transition-all border border-white/40 shadow-sm shadow-md pointer-events-auto"
                    >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Complete Watching
                    </motion.button>
                )}
            </div>

            {/* Hero Header */}
            <motion.div layoutId={`card-wrapper-${entry.id}`} className="relative w-full h-[60vh] md:h-[70vh] shrink-0 bg-[#FFF9F0] -mt-[56px] md:-mt-[64px]">
                <picture>
                    {backdropUrl && <source media="(min-width: 768px)" srcSet={backdropUrl} />}
                    {posterUrl && (
                        <motion.img
                            layoutId={`poster-${entry.id}`}
                            src={posterUrl}
                            alt={entry.title}
                            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
                        />
                    )}
                </picture>

                {/* Cinematic Gradient Overlays matched to Light Theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                {/* Metadata at bottom of Hero */}
                <motion.div layoutId={`card-content-${entry.id}`} className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-3">
                    <motion.h1 layoutId={`title-${entry.id}`} className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight drop-shadow-sm leading-tight">
                        {entry.title}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 text-[#2D2926]/70 font-bold text-xs md:text-sm uppercase tracking-[0.2em]"
                    >
                        {primaryGenre && <span>{primaryGenre}</span>}
                        {primaryGenre && year && <span className="opacity-40">•</span>}
                        {year && <span>{year}</span>}
                        {year && runtime && <span className="opacity-40">•</span>}
                        {runtime && <span>{runtime}</span>}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Content Body */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="px-6 md:px-10 pb-24 pt-4 flex flex-col gap-10 w-full relative z-10"
            >
                {/* Overview */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                        Synopsis
                    </h3>
                    <p className="text-[#2D2926]/80 text-lg md:text-xl leading-relaxed font-serif tracking-wide">
                        {details?.overview || 'No synopsis available.'}
                    </p>
                </div>


                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Your Rating</span>
                        <span className="text-[#2D2926] text-2xl font-black">{entry.rating ? `⭐ ${entry.rating}` : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Watched On</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{formatDate(entry.watchedAt)}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">TMDB Score</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{details?.vote_average ? `${details.vote_average.toFixed(1)} / 10` : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Status</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{entry.isWatching ? 'Watching' : 'Completed'}</span>
                    </div>
                </div>

                {/* Where to Watch Section */}
                {details?.watch_providers && Object.keys(details.watch_providers).length > 0 && (
                    <div className="flex flex-col gap-4 bg-white p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb700]/40 via-[#ffb700] to-[#ffb700]/40 opacity-80"></div>
                        <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em]">
                            Where to Watch (India)
                        </h3>
                        <div className="flex flex-col gap-3">
                            {details.watch_providers['IN']?.flatrate && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Stream:</span>
                                    {details.watch_providers['IN'].flatrate.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.rent && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Rent:</span>
                                    {details.watch_providers['IN'].rent.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.buy && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Buy:</span>
                                    {details.watch_providers['IN'].buy.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.link && (
                                <a href={details.watch_providers['IN'].link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#ffb700] hover:underline mt-1 inline-block tracking-wide uppercase">
                                    View more providers on TMDB ↗
                                </a>
                            )}
                            {(!details.watch_providers['IN']?.flatrate && !details.watch_providers['IN']?.rent && !details.watch_providers['IN']?.buy) && (
                                <span className="text-sm text-[#2D2926]/60 italic mt-1">No India availability data found.</span>
                            )}
                        </div>
                    </div>
                )}

                {/* User's Review Section (if they wrote one) */}
                {entry.review && (
                    <div className="flex flex-col gap-4 bg-[#ffb700]/5 p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden">
                        <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                            Your Review
                        </h3>
                        <p className="text-[#2D2926] text-[16px] md:text-lg leading-relaxed font-serif tracking-wide italic whitespace-pre-wrap">
                            "{entry.review}"
                        </p>
                    </div>
                )}

                {/* Long-form Editorial/Review Text placeholder */}
                <div className="flex flex-col gap-4 bg-white p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb700]/40 via-[#ffb700] to-[#ffb700]/40 opacity-80"></div>
                    <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-between">
                        Director's Cut Notes
                        <span className="material-symbols-outlined text-[16px] text-[#ffb700] transition-colors cursor-pointer opacity-70 hover:opacity-100">edit</span>
                    </h3>
                    <p className="text-[#2D2926] text-[15px] leading-[2.2] italic font-serif opacity-80">
                        "A masterclass in tension and release. The pacing in the second act deliberately subverts expectations, grounding the narrative in a stark, uncomfortable reality. The aesthetic is perfectly complemented by the fluid camerawork, creating a spatial motion that feels almost hypnotic. Truly a definitive work of its era."
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const EntryList: React.FC<EntryListProps> = ({ onEdit, filters, readOnly }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<{ entry: Entry, details: TmdbDetails | null } | null>(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [sortBy, setSortBy] = useState<'watchedAt' | 'rating' | 'title'>('watchedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
    });

    const loadEntries = useCallback(async (params?: GetEntriesParams) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await entriesApi.getEntries({ 
                ...filters, 
                search,
                sortBy, 
                order: sortOrder,
                ...params 
            });
            if (params?.offset && params.offset > 0) {
                setEntries(prev => [...prev, ...response.entries]);
            } else {
                setEntries(response.entries);
            }
            setPagination(response.pagination);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load entries');
        } finally {
            setIsLoading(false);
        }
    }, [filters, sortBy, sortOrder]);

    const handleLoadMore = useCallback(() => {
        if (pagination.hasMore && !isLoading) {
            loadEntries({ offset: pagination.offset + pagination.limit });
        }
    }, [pagination, isLoading, loadEntries]);

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore: pagination.hasMore,
        isLoading,
        enabled: !error,
    });

    useEffect(() => {
        loadEntries();
    }, [loadEntries, search, sortBy, sortOrder]);

    // Push a synthetic history entry when the card opens so the phone's
    // hardware back button closes the card instead of navigating to a previous page.
    useEffect(() => {
        if (!selectedEntry) return;

        history.pushState({ expandedCard: true }, '');

        const handlePopState = () => {
            setSelectedEntry(null);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [selectedEntry]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await entriesApi.deleteEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
            if (selectedEntry?.entry.id === id) {
                setSelectedEntry(null);
                history.back(); // Close expanded card if it was open
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete entry');
        }
    };

    if (isLoading && entries.length === 0) {
        return <SkeletonGrid count={8} />;
    }

    if (error) {
        return (
            <div className="py-12 flex justify-center w-full">
                <ErrorState message={error} onRetry={() => loadEntries()} />
            </div>
        );
    }

    return (
        <div className="w-full flex gap-1 flex-col">
            <FilterBar 
                search={search}
                onSearchChange={setSearch}
                sortBy={`${sortBy}-${sortOrder}`}
                onSortChange={(val) => {
                    const [newSort, newOrder] = val.split('-') as [any, any];
                    setSortBy(newSort);
                    setSortOrder(newOrder);
                }}
                sortOptions={[
                    { value: 'watchedAt-desc', label: 'Recently Watched' },
                    { value: 'watchedAt-asc', label: 'Oldest Watched' },
                    { value: 'rating-desc', label: 'Highest Rated' },
                    { value: 'rating-asc', label: 'Lowest Rated' },
                    { value: 'title-asc', label: 'Movie: A-Z' },
                    { value: 'title-desc', label: 'Movie: Z-A' }
                ]}
                count={pagination.total}
                countLabel="Logged Titles"
                placeholder="Search your history..."
            />

            {entries.length === 0 ? (
                <div className="py-20 w-full flex justify-center bg-white border border-[#ffb700]/10 rounded-3xl shadow-sm">
                    <EmptyState
                        title={search ? "No matching entries" : "No entries found"}
                        message={search ? `No results for "${search}"` : "Start logging your watch history!"}
                        icon={<span className="text-5xl drop-shadow-sm">🎬</span>}
                        actionLabel={search ? "Clear Search" : undefined}
                        onAction={search ? () => setSearch('') : undefined}
                    />
                </div>
            ) : (
                <>
                    <div className="watchlist-grid outline-none">
                        {entries.map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onEdit={onEdit}
                                onDelete={readOnly ? undefined : handleDelete}
                                onClick={(entry, details) => setSelectedEntry({ entry, details })}
                            />
                        ))}
                    </div>

                    <div ref={observerTarget} className="h-4 w-full mt-4" />

                    {isLoading && entries.length > 0 && (
                        <div className="watchlist-grid mt-4">
                            {[...Array(4)].map((_, i) => (
                                <SkeletonCard key={`more-${i}`} />
                            ))}
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {selectedEntry && (
                    <ExpandedCard
                        key="expanded-card"
                        entry={selectedEntry.entry}
                        details={selectedEntry.details}
                        onClose={() => history.back()}
                        onEdit={onEdit}
                        onDelete={readOnly ? undefined : handleDelete}
                        onComplete={readOnly ? undefined : (_entry) => {
                            // This will be handled by the parent if needed
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EntryList;
