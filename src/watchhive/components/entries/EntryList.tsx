import React, { useState, useEffect, useCallback } from 'react';
import { entriesApi, Entry, GetEntriesParams } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { ErrorState, EmptyState, WatchlistButton } from '../common';
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

const MiniStars: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center gap-[2px]" title={`${rating}/10`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const starValue = star * 2;
                const filled = rating >= starValue;
                const half = !filled && rating >= starValue - 1;
                
                return (
                    <span key={star} className="relative w-3.5 h-3.5 sm:w-4 sm:h-4">
                        <span className="material-symbols-outlined absolute inset-0 text-[#2D2926]/10 text-[14px] sm:text-[16px] overflow-hidden" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                        {(filled || half) && (
                            <span 
                                className="material-symbols-outlined absolute inset-0 text-[#ffb700] text-[14px] sm:text-[16px] overflow-hidden drop-shadow-sm" 
                                style={{ 
                                    fontVariationSettings: "'FILL' 1",
                                    width: half ? '50%' : '100%'
                                }}
                            >
                                grade
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
};

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

    return (
        <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-[#ffb700]/10 hover:shadow-xl hover:border-[#ffb700]/30 transition-all duration-300">
            {/* Poster Section */}
            <div className="relative aspect-[2/3] w-full bg-[#FFF9F0] overflow-hidden">
                {posterUrl && !imgError ? (
                    <img
                        src={posterUrl}
                        alt={entry.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#2D2926]/10">
                        <span className="material-symbols-outlined text-6xl">movie</span>
                    </div>
                )}
                
                {/* Gradient Overlay for Actions & Badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D2926]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <span className={`${ti.color} text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm backdrop-blur-md bg-opacity-90`}>
                        {ti.emoji} {ti.label}
                    </span>
                    {entry.isRewatch && (
                        <span className="bg-[#2D2926]/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                            🔄 Rewatch
                        </span>
                    )}
                    {entry.isWatching && (
                        <span className="bg-green-500 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse shadow-lg shadow-green-500/20">
                            👀 Watching
                        </span>
                    )}
                </div>

                {/* Hover Actions (Edit/Delete/Watchlist) */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    {entry.isWatching && (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await entriesApi.updateEntry(entry.id, { isWatching: false });
                                    window.location.reload(); // Quickest way to refresh for now
                                } catch (err) {
                                    alert('Failed to mark as watched');
                                }
                            }}
                            className="w-9 h-9 rounded-xl bg-green-500 text-white hover:bg-green-600 hover:scale-110 transition-all flex items-center justify-center border border-green-400 shadow-lg shadow-green-500/20"
                            title="Mark as Watched"
                        >
                            <span className="material-symbols-outlined text-[20px] font-black">check_circle</span>
                        </button>
                    )}
                    <WatchlistButton 
                        tmdbId={entry.tmdbId} 
                        variant="icon" 
                        className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-[#2D2926]/40 hover:text-[#ffb700] hover:bg-white hover:scale-105 transition-all flex items-center justify-center border border-[#ffb700]/10 shadow-sm" 
                    />
                    
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-[#2D2926]/40 hover:text-[#ffb700] hover:bg-white hover:scale-105 transition-all flex items-center justify-center border border-[#ffb700]/10 shadow-sm"
                            title="Edit entry"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-[#2D2926]/40 hover:text-rose-500 hover:bg-rose-50 hover:scale-105 transition-all flex items-center justify-center border border-[#ffb700]/10 shadow-sm"
                            title="Delete entry"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        </button>
                    )}
                </div>

                {/* Bottom Overlay Text */}
                {details?.overview && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <p className="text-white/90 text-[13px] leading-snug line-clamp-3 italic shadow-sm">
                            "{details.overview}"
                        </p>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 relative">
                
                {/* Title & Year */}
                <div className="min-h-[48px]">
                    <h3 className="text-lg font-black text-[#2D2926] leading-tight line-clamp-2" title={entry.title}>
                        {entry.title}
                        {year && <span className="ml-2 font-semibold text-[#2D2926]/40 text-sm">({year})</span>}
                    </h3>
                </div>

                {/* Rating */}
                {entry.rating && (
                    <div className="flex items-center gap-2">
                        <MiniStars rating={entry.rating} />
                        <span className="text-sm font-bold text-[#2D2926]/70">{entry.rating}/10</span>
                    </div>
                )}

                {/* Meta Row: Date & Location */}
                <div className="flex items-center gap-4 text-[13px] font-bold text-[#2D2926]/30">
                    <span className="flex items-center gap-1.5 whitespace-nowrap group/meta hover:text-[#ffb700] transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-[#ffb700]/60">calendar_today</span>
                        {formatDate(entry.watchedAt)}
                    </span>
                    {entry.watchLocation && (
                        <span className="flex items-center gap-1.5 truncate group/meta hover:text-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-[#ffb700]/60">distance</span>
                            <span className="truncate">{entry.watchLocation}</span>
                        </span>
                    )}
                </div>

                {/* Embedded Tags */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                        {entry.tags.map((tag: string) => (
                            <span key={tag} className="text-[11px] font-bold text-[#ffb700] bg-[#ffb700]/10 px-2 py-0.5 rounded-md hover:bg-[#ffb700]/20 transition-colors cursor-default truncate max-w-[120px]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Engagement Footer */}
            <div className="px-5 py-3 border-t border-[#ffb700]/10 flex items-center justify-between text-[13px] font-bold text-[#2D2926]/40 bg-[#FFF9F0]/50">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 hover:text-[#ffb700] transition-colors cursor-pointer" title="Likes">
                        <span className="material-symbols-outlined text-[16px]">favorite</span>
                        {entry._count.likes}
                    </span>
                    <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer" title="Comments">
                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                        {entry._count.comments}
                    </span>
                </div>
                {details?.runtime && (
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                    </span>
                )}
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
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#ffb700]/20 border-t-[#ffb700]"></div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#ffb700]"></div>
                    <span className="text-sm font-bold text-[#2D2926]/40">Fetching older entries...</span>
                </div>
            )}
        </div>
    );
};

export default EntryList;
