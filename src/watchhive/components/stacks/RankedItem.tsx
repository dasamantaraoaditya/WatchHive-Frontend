import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListItem } from '../../services/lists.service';
import apiClient from '../../services/api';
import './Stacks.css';

interface TmdbDetails {
    title?: string;
    name?: string;
    poster_path: string | null;
    overview: string;
    vote_average: number;
    genres: string[];
    release_date?: string;
    first_air_date?: string;
}

interface RankedItemProps {
    item: ListItem;
    rank: number;
    totalItems: number;
    onRemove?: (tmdbId: number) => void;
    onMove?: (direction: 'up' | 'down') => void;
}

const tmdbCache = new Map<number, TmdbDetails>();

export const RankedItem: React.FC<RankedItemProps> = ({ item, rank, totalItems, onRemove, onMove }) => {
    const navigate = useNavigate();
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [imgError, setImgError] = useState(false);

    const handleItemClick = () => {
        const type = item.mediaType === 'tv' ? 'tv' : 'movie';
        navigate(`/watch-hive/details/${type}/${item.tmdbId}`, {
            state: { from: window.location.pathname + window.location.search }
        });
    };

    useEffect(() => {
        if (tmdbCache.has(item.tmdbId)) {
            setDetails(tmdbCache.get(item.tmdbId)!);
            return;
        }

        const fetchDetails = async () => {
            try {
                const endpoint = item.mediaType === 'tv' ? 'tv' : 'movie';
                const data: any = await apiClient.get(`/tmdb/${endpoint}/${item.tmdbId}`);
                const parsed: TmdbDetails = {
                    title: data.title,
                    name: data.name,
                    poster_path: data.poster_path,
                    overview: data.overview || '',
                    vote_average: data.vote_average || 0,
                    genres: (data.genres || []).map((g: any) => g.name),
                    release_date: data.release_date,
                    first_air_date: data.first_air_date,
                };
                tmdbCache.set(item.tmdbId, parsed);
                setDetails(parsed);
            } catch {
                // Silently fail
            }
        };
        fetchDetails();
    }, [item.tmdbId, item.mediaType]);

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/w185${details.poster_path}`
        : null;

    const year = details?.release_date?.slice(0, 4) || details?.first_air_date?.slice(0, 4);
    const rating = item.localRating || (details?.vote_average ? details.vote_average.toFixed(1) : null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="ranked-item-card group flex w-full"
        >
            {/* Rank Indicator */}
            <div className="ranked-item__rank">
                {rank}
            </div>

            {/* Poster & Title Content - Clickable */}
            <div
                onClick={handleItemClick}
                className="flex items-center gap-3.5 flex-grow min-w-0 cursor-pointer group/item"
                title="Click to view details"
            >
                <div className="ranked-item__poster-wrap group-hover/item:scale-105 transition-transform">
                    {posterUrl && !imgError ? (
                        <img
                            src={posterUrl}
                            alt={item.title || 'Movie'}
                            className="ranked-item__poster"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#2D2926]/20 bg-[#f8f8f8]">
                            <span className="material-symbols-outlined text-3xl">movie_edit</span>
                        </div>
                    )}
                </div>

                <div className="ranked-item__content min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="ranked-item__badge flex-shrink-0">
                            {item.mediaType === 'tv' ? 'TV' : 'Film'}
                        </span>
                        {year && <span className="text-[10px] font-bold text-[#2D2926]/30 flex-shrink-0">{year}</span>}
                    </div>
                    <h4 className="ranked-item__title truncate w-full group-hover/item:text-[#ffb700] transition-colors">
                        {details?.title || details?.name || item.title || 'Unknown Title'}
                    </h4>
                    <div className="ranked-item__meta">
                        {details?.genres?.[0] && <span>{details.genres[0]}</span>}
                        {details?.genres?.[0] && details?.genres?.[1] && <span>•</span>}
                        {details?.genres?.[1] && <span>{details.genres[1]}</span>}
                    </div>
                </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto flex-shrink-0">
                {rating && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#ffb700]/5 rounded-xl border border-[#ffb700]/10">
                        <span className="text-xs">⭐</span>
                        <span className="text-xs font-black text-[#ffb700] leading-none">{rating}</span>
                    </div>
                )}
                
                <div className="flex items-center gap-1 sm:gap-2">
                    {onMove && (
                        <div className="flex flex-col bg-white border border-[#2D2926]/10 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove('up');
                                }}
                                disabled={rank === 1}
                                className={`w-8 h-6 flex items-center justify-center transition-all ${
                                    rank === 1 
                                        ? 'text-[#2D2926]/10 cursor-not-allowed bg-slate-50/50' 
                                        : 'text-[#2D2926]/60 hover:text-[#ffb700] hover:bg-[#ffb700]/5 active:scale-95'
                                }`}
                                title="Move up"
                            >
                                <span className="material-symbols-outlined text-[18px] font-bold">keyboard_arrow_up</span>
                            </button>
                            <div className="h-[1px] bg-[#2D2926]/10 w-full" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove('down');
                                }}
                                disabled={rank === totalItems}
                                className={`w-8 h-6 flex items-center justify-center transition-all ${
                                    rank === totalItems 
                                        ? 'text-[#2D2926]/10 cursor-not-allowed bg-slate-50/50' 
                                        : 'text-[#2D2926]/60 hover:text-[#ffb700] hover:bg-[#ffb700]/5 active:scale-95'
                                }`}
                                title="Move down"
                            >
                                <span className="material-symbols-outlined text-[18px] font-bold">keyboard_arrow_down</span>
                            </button>
                        </div>
                    )}

                    {onRemove && (
                        <motion.button
                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemove(item.tmdbId)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#2D2926]/20 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Remove from stack"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete_sweep</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
