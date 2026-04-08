import React, { useState, useEffect } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { entriesApi, CreateEntryData } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import './Profile.css';

interface WatchlistCardProps {
    tmdbId: number;
    mediaType?: string;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ tmdbId, mediaType = 'movie' }) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const { removeFromList } = useWatchlist();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
                const data = await apiClient.get(`/tmdb/${endpoint}/${tmdbId}`);
                setDetails(data);
            } catch (err) {
                console.error('Failed to load watchlist item', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [tmdbId, mediaType]);

    const handleMarkAsWatched = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (marking || !details) return;

        const title = details.title || details.name;
        if (!window.confirm(`Mark "${title}" as watched and add to your hive?`)) return;

        setMarking(true);
        try {
            const entryData: CreateEntryData = {
                tmdbId: Number(tmdbId),
                title: title,
                type: mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                watchedAt: new Date().toISOString().split('T')[0],
                review: '',
                tags: []
            };

            await entriesApi.createEntry(entryData);
            await removeFromList(tmdbId);
        } catch (error) {
            console.error('Failed to mark as watched', error);
            alert('Failed to mark as watched. Please try again.');
        } finally {
            setMarking(false);
        }
    };

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const title = details?.title || details?.name;
        if (!window.confirm(`Remove "${title}" from your watchlist?`)) return;
        
        await removeFromList(tmdbId);
    };

    if (loading) {
        return <div className="watchlist-card skeleton"></div>;
    }

    if (!details) return null;

    const title = details.title || details.name;
    const date = details.release_date || details.first_air_date;
    const year = date ? date.split('-')[0] : '';
    const rating = details.vote_average ? details.vote_average.toFixed(1) : '';

    return (
        <div className="watchlist-card group relative cursor-pointer overflow-hidden transform-gpu">
            <div className="watchlist-card__poster-wrapper bg-stone-900 rounded-t-xl overflow-hidden relative">
                {details.poster_path ? (
                    <img
                        src={`${TMDB_IMG}${details.poster_path}`}
                        alt={title}
                        className="watchlist-card__poster object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="watchlist-card__no-poster h-full flex items-center justify-center bg-[#ffb700]/5">
                        <span className="material-symbols-outlined text-4xl mb-2 text-[#2D2926]/20">movie</span>
                    </div>
                )}

                {/* Overlay shadow for cinematic feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Standardized Actions Layout */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleMarkAsWatched}
                        disabled={marking}
                        className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-green-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                        title="Mark as Watched (Hive It)"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {marking ? 'sync' : 'check_circle'}
                        </span>
                    </button>
                    
                    <button
                        onClick={handleRemove}
                        className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-red-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                        title="Remove from Watchlist"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="bg-[#ffb700] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90 uppercase tracking-tighter">
                        {mediaType === 'tv' ? '📺 TV' : '🎬 Movie'}
                    </span>
                </div>
            </div>
            <div className="watchlist-card__info gap-1 p-3 flex flex-col h-full bg-white dark:bg-stone-900 border-t border-slate-50">
                <h4 className="watchlist-card__title text-[13px] leading-tight font-bold dark:text-stone-100 truncate" title={title}>{title}</h4>
                <div className="watchlist-card__meta text-[11px] font-bold mt-1 text-[#2D2926]/60 dark:text-stone-400 flex items-center justify-between w-full">
                    <span>{year || 'Coming Soon'}</span>
                    {rating && (
                        <span className="watchlist-card__rating text-[#ffb700] flex items-center gap-1 shrink-0 ml-2">⭐ {rating}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
