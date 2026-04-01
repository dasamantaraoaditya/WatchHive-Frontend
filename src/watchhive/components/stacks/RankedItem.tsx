import React, { useState, useEffect } from 'react';
import { Reorder, useDragControls, motion } from 'framer-motion';
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
    onRemove?: (tmdbId: number) => void;
}

const tmdbCache = new Map<number, TmdbDetails>();

export const RankedItem: React.FC<RankedItemProps> = ({ item, rank, onRemove }) => {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [imgError, setImgError] = useState(false);
    const dragControls = useDragControls();

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
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileDrag={{ 
                scale: 1.02, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                zIndex: 50,
                rotate: 1
            }}
            className="ranked-item-card group flex w-full"
        >
            {/* Rank Indicator */}
            <div className="ranked-item__rank">
                {rank}
            </div>

            {/* Poster Wrap */}
            <div className="ranked-item__poster-wrap">
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
                <h4 className="ranked-item__title truncate w-full">
                    {details?.title || details?.name || item.title || 'Unknown Title'}
                </h4>
                <div className="ranked-item__meta">
                    {details?.genres?.[0] && <span>{details.genres[0]}</span>}
                    {details?.genres?.[0] && details?.genres?.[1] && <span>•</span>}
                    {details?.genres?.[1] && <span>{details.genres[1]}</span>}
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
                
                <div className="flex items-center gap-0.5 sm:gap-1">
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
                    
                    <motion.div
                        onPointerDown={(e) => dragControls.start(e)}
                        whileHover={{ color: '#ffb700' }}
                        className="drag-handle w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#2D2926]/10"
                    >
                        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">drag_indicator</span>
                    </motion.div>
                </div>
            </div>
        </Reorder.Item>
    );
};
