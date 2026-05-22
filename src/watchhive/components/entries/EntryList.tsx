import React, { useState, useEffect, useCallback } from 'react';
import { entriesApi, Entry, GetEntriesParams } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import {
    SkeletonCard,
    SkeletonGrid,
    ErrorState,
    FilterBar,
    MovieDetailsModal
} from '../common';
import '../profile/Profile.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { motion, AnimatePresence } from 'framer-motion';
import { TmdbDetails, formatDate } from './types';
import { ExpandedCard } from './ExpandedCard';
import { useCustomAlert } from '../../contexts';

interface EntryListProps {
    onEdit?: (entry: Entry) => void;
    onAddNew?: () => void;
    filters?: GetEntriesParams;
    readOnly?: boolean;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
}

const tmdbCache = new Map<string, TmdbDetails>();

export const EntryCard: React.FC<{
    entry: Entry;
    onEdit?: (entry: Entry) => void;
    onDelete?: (id: string) => void;
    onComplete?: (entry: Entry) => void;
    onClick?: (entry: Entry, details: TmdbDetails | null) => void;
}> = ({ entry, onEdit, onDelete: _onDelete, onComplete: _onComplete, onClick }) => {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [imgError, setImgError] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

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
        <>
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

                    {/* Actions — desktop hover only */}
                    <div className="hidden sm:flex absolute top-2 right-2 flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                                    setIsCompleting(true);
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
                    {/* Have Watched button — always visible when entry is in currently watching mode */}
                    {_onComplete && entry.isWatching && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCompleting(true);
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Have Watched
                        </button>
                    )}
                </motion.div>
            </motion.div>

            <MovieDetailsModal
                isOpen={isCompleting}
                onClose={() => setIsCompleting(false)}
                tmdbId={entry.tmdbId}
                mediaType={entry.type === 'TV_SHOW' ? 'tv' : 'movie'}
                initialView="log"
                existingEntry={{
                    ...entry,
                    isWatching: false,
                    watchedAt: new Date().toISOString()
                }}
                onLogSuccess={() => {
                    if (_onComplete) _onComplete(entry);
                    setIsCompleting(false);
                }}
            />
        </>
    );
};

// ExpandedCard is now a standalone component in ./ExpandedCard.tsx
// It accepts an `actions` render prop for consumer-specific buttons.



export const EntryList: React.FC<EntryListProps> = ({ 
    onEdit,
    onAddNew,
    filters, 
    readOnly, 
    searchQuery, 
    onSearchChange 
}) => {
    const { alert, confirm } = useCustomAlert();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<{ entry: Entry, details: TmdbDetails | null } | null>(null);
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
    }, [loadEntries, sortBy, sortOrder]);

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
        const confirmed = await confirm('Are you sure you want to delete this entry?', {
            title: 'Delete Entry',
            confirmText: 'Delete',
            severity: 'danger'
        });
        if (!confirmed) return;
        try {
            await entriesApi.deleteEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
            if (selectedEntry?.entry.id === id) {
                setSelectedEntry(null);
                history.back(); // Close expanded card if it was open
            }
        } catch (err: any) {
            await alert(err.response?.data?.error || 'Failed to delete entry', {
                title: 'Error',
                severity: 'error'
            });
        }
    };

    if (isLoading && entries.length === 0) {
        return (
            <div className="w-full flex animate-[fade-in_0.3s_ease-out] flex-col gap-6">
                <FilterBar
                    search={searchQuery}
                    onSearchChange={onSearchChange}
                    placeholder="Search logged movies, TV shows, or ratings..."
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
                    count={0}
                    countLabel="Logged Titles"
                />
                <SkeletonGrid count={8} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 flex justify-center w-full">
                <ErrorState message={error} onRetry={() => loadEntries()} />
            </div>
        );
    }



    // Extracted to satisfy Rules of Hooks — hooks cannot be called inside render props
    const EntryActionsMenu: React.FC<{
        entry: Entry;
        onClose: () => void;
    }> = ({ entry, onClose: closeCard }) => {
        const [menuOpen, setMenuOpen] = useState(false);
        const hasActions = onEdit || !readOnly;
        if (!hasActions) return null;

        return (
            <div className="relative flex items-center gap-2">
                {/* Desktop: full buttons */}
                <div className="hidden md:flex items-center gap-2">
                    {onEdit && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => { closeCard(); onEdit(entry); }}
                            className="px-4 py-2 rounded-full bg-white/20 flex items-center gap-2 text-[#ffb700] font-bold text-sm hover:bg-white/30 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                            Edit Entry
                        </motion.button>
                    )}
                    {!readOnly && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => handleDelete(entry.id)}
                            className="px-4 py-2 rounded-full bg-white/20 flex items-center gap-2 text-red-400 font-bold text-sm hover:bg-white/30 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Delete
                        </motion.button>
                    )}
                </div>

                {/* Mobile: three-dot toggle menu */}
                <div className="flex md:hidden relative">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-[#ffb700] hover:bg-white/30 transition-all"
                        title="More options"
                    >
                        <span className="material-symbols-outlined text-[24px]">more_vert</span>
                    </motion.button>

                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-12 right-0 z-[200] flex flex-col gap-1 bg-white/20 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-xl overflow-hidden min-w-[160px] p-1"
                        >
                            {onEdit && (
                                <button
                                    onClick={() => { setMenuOpen(false); closeCard(); onEdit(entry); }}
                                    className="flex items-center gap-3 px-4 py-3 text-[#2D2926]/90 font-bold text-sm hover:bg-white/30 active:bg-white/40 transition-all rounded-xl"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-[#ffb700]">edit_note</span>
                                    Edit Entry
                                </button>
                            )}
                            {!readOnly && (
                                <button
                                    onClick={() => { setMenuOpen(false); handleDelete(entry.id); }}
                                    className="flex items-center gap-3 px-4 py-3 text-red-400 font-bold text-sm hover:bg-red-50/20 active:bg-red-50/30 transition-all rounded-xl"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Delete
                                </button>
                            )}
                        </motion.div>
                    )}

                    {menuOpen && (
                        <div className="fixed inset-0 z-[199]" onClick={() => setMenuOpen(false)} />
                    )}
                </div>
            </div>
        );
    };

    const hasSearch = typeof filters?.search === 'string' && !!filters.search;

    return (
        <div className="w-full flex animate-[fade-in_0.3s_ease-out] flex-col gap-6">
            <FilterBar
                search={searchQuery}
                onSearchChange={onSearchChange}
                placeholder="Search logged movies, TV shows, or ratings..."
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
            />

            {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm animate-[fade-in_0.3s_ease-out]">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/5 relative">
                        <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                        <span className="material-symbols-outlined text-4xl text-slate-300 relative z-10">
                            {hasSearch ? "travel_explore" : "movie"}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                        {hasSearch ? "No matching entries" : "No entries yet"}
                    </h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed mb-6">
                        {hasSearch
                            ? `No results found for "${filters!.search}"`
                            : "Start building your cinematic journey — log a movie or show you've watched!"}
                    </p>
                    {!hasSearch && onAddNew && (
                        <button
                            onClick={onAddNew}
                            className="bg-[#ffb700] hover:brightness-105 text-white font-black py-3.5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#ffb700]/20 active:scale-95 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base font-bold">add</span>
                            Log a Watch
                        </button>
                    )}
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
                        actions={({ entry, onClose }) => (
                            <EntryActionsMenu entry={entry} onClose={onClose} />
                        )}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EntryList;
