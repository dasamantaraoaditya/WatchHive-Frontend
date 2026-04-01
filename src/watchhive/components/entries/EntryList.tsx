import React, { useState, useEffect, useCallback } from 'react';
import { entriesApi, Entry, GetEntriesParams } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { ErrorState, EmptyState, WatchlistButton, BeeLoader } from '../common';
import '../profile/Profile.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface EntryListProps {
    onEdit?: (entry: Entry) => void;
    filters?: GetEntriesParams;
    readOnly?: boolean;
}

interface TmdbDetails {
    poster_path: string | null;
    overview: string;
    vote_average: number;
    genres: string[];
    runtime?: number | null;
    release_date?: string;
    first_air_date?: string;
    number_of_seasons?: number;
    tagline?: string;
}

const tmdbCache = new Map<string, TmdbDetails>();



export const EntryCard: React.FC<{
    entry: Entry;
    onEdit?: (entry: Entry) => void;
    onDelete?: (id: string) => void;
}> = ({ entry, onEdit, onDelete }) => {
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
                    overview: data.overview || '',
                    vote_average: data.vote_average || 0,
                    genres: (data.genres || []).map((g: any) => g.name),
                    runtime: data.runtime || null,
                    release_date: data.release_date,
                    first_air_date: data.first_air_date,
                    number_of_seasons: data.number_of_seasons,
                    tagline: data.tagline || '',
                };
                tmdbCache.set(cacheKey, parsed);
                setDetails(parsed);
            } catch {
                // Silently fail
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        
        // Only show time if it's not exactly midnight (common default for legacy data)
        // Or actually, just show it always now that we track it.
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
        
        return `${formattedDate} at ${formattedTime}`;
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
        <div className="watchlist-card group relative">
            <div className="watchlist-card__poster-wrapper">
                {posterUrl && !imgError ? (
                    <img
                        src={posterUrl}
                        alt={entry.title}
                        className="watchlist-card__poster"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="watchlist-card__no-poster">
                        <span className="material-symbols-outlined text-4xl mb-2 text-[#2D2926]/20">movie</span>
                    </div>
                )}
                
                {/* Top Actions Overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {entry.isWatching && (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await entriesApi.updateEntry(entry.id, { 
                                        isWatching: false,
                                        completedAt: new Date().toISOString()
                                    });
                                    window.location.reload();
                                } catch (err) { }
                            }}
                            className="w-8 h-8 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center shadow-lg"
                            title="Mark as Watched"
                        >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                        </button>
                    )}
                    <WatchlistButton 
                        tmdbId={entry.tmdbId} 
                        variant="icon" 
                        className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/40 hover:text-[#ffb700] flex items-center justify-center shadow-sm" 
                    />

                    {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/40 hover:text-[#ffb700] flex items-center justify-center shadow-sm" title="Edit">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/40 hover:text-red-500 flex items-center justify-center shadow-sm" title="Delete">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    )}
                </div>

                {/* Hover Action for Watching Sessions */}
                {entry.isWatching && (
                    <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-10">
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await entriesApi.updateEntry(entry.id, { 
                                        isWatching: false,
                                        completedAt: new Date().toISOString()
                                    });
                                    window.location.reload();
                                } catch (err) { }
                            }}
                            className="w-full py-2 bg-green-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Complete Session
                        </button>
                    </div>
                )}

                {/* Left Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className={`${ti.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90`}>
                        {ti.emoji}
                    </span>
                    {entry.isRewatch && <span className="bg-[#2D2926]/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">🔄</span>}
                </div>
            </div>

            <div className="watchlist-card__info gap-1 p-3 flex flex-col h-full">
                <h4 className="watchlist-card__title text-[13px] leading-tight" title={entry.title}>
                    {entry.title}
                </h4>
                <div className="text-[10px] text-[#2D2926]/40 font-bold mb-1.5 flex items-center justify-between">
                    <span>{formatDate(entry.watchedAt).split(' at')[0]}</span>
                    <div className="flex items-center gap-2 text-[#2D2926]/50">
                        {entry._count?.likes !== undefined && (
                            <span className="flex items-center gap-0.5" title={`${entry._count.likes} likes`}>
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                {entry._count.likes}
                            </span>
                        )}
                        {entry._count?.comments !== undefined && (
                            <span className="flex items-center gap-0.5" title={`${entry._count.comments} comments`}>
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                                {entry._count.comments}
                            </span>
                        )}
                    </div>
                </div>
                {details?.overview && (
                    <p className="text-[11px] text-[#2D2926]/60 line-clamp-2 leading-relaxed mb-2 mt-0.5" title={details.overview}>
                        {details.overview}
                    </p>
                )}
                <div className="watchlist-card__meta text-[11px] font-bold mt-auto text-[#2D2926]/60 flex items-center justify-between w-full">
                    <span className="truncate flex-1" title={metadataString}>{metadataString || '-'}</span>
                    {entry.rating && <span className="watchlist-card__rating text-[#ffb700] flex items-center gap-1 shrink-0 ml-2">⭐ {entry.rating}</span>}
                </div>
            </div>
        </div>
    );
};

export const EntryList: React.FC<EntryListProps> = ({ onEdit, filters, readOnly }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            const response = await entriesApi.getEntries({ ...filters, ...params });
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
    }, [filters]);

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
    }, [loadEntries]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await entriesApi.deleteEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete entry');
        }
    };

    if (isLoading && entries.length === 0) {
        return (
            <div className="w-full flex justify-center py-20">
                <BeeLoader size="large" message="Loading your hive..." />
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

    if (entries.length === 0) {
        return (
            <div className="py-20 w-full flex justify-center">
                <EmptyState
                    title="No entries found"
                    message={typeof filters?.search === 'string' ? `No results for "${filters.search}"` : "Start logging your watch history!"}
                    icon={<span className="text-5xl drop-shadow-sm">🎬</span>}
                />
            </div>
        );
    }

    return (
        <div className="w-full flex gap-4 flex-col">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-[#2D2926]">Watch History</h2>
                <span className="text-sm font-bold bg-[#ffb700]/10 text-[#ffb700] px-3 py-1 rounded-full">{pagination.total} {pagination.total === 1 ? 'title' : 'titles'}</span>
            </div>

            <div className="watchlist-grid">
                {entries.map((entry) => (
                    <EntryCard
                        key={entry.id}
                        entry={entry}
                        onEdit={onEdit}
                        onDelete={readOnly ? undefined : handleDelete}
                    />
                ))}
            </div>

            <div ref={observerTarget} className="h-4 w-full mt-4" />
            
            {isLoading && entries.length > 0 && (
                <div className="flex justify-center items-center py-6 gap-3">
                    <BeeLoader size="small" message="Fetching older entries..." />
                </div>
            )}
        </div>
    );
};

export default EntryList;
