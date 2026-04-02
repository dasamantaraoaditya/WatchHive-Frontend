import React, { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { ListItem } from '../../services/lists.service';
import apiClient from '../../services/api.js';

interface TmdbDetails {
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
            className="flex items-center gap-4 p-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
        >
            {/* Rank Indicator */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#ffb700] text-[#2D2926] font-black rounded-full shadow-inner text-sm">
                #{rank}
            </div>

            {/* Poster */}
            <div className="w-16 h-24 bg-[#2D2926]/5 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                {posterUrl && !imgError ? (
                    <img
                        src={posterUrl}
                        alt={item.title || 'Movie'}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2D2926]/20">
                        <span className="material-symbols-outlined">movie</span>
                    </div>
                )}
            </div>

            {/* Title & Info */}
            <div className="flex-grow min-w-0">
                <h4 className="font-bold text-[#2D2926] truncate text-sm mb-0.5">
                    {item.title || 'Loading...'}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#2D2926]/40">
                    {year && <span>{year}</span>}
                    {year && details?.genres?.[0] && <span>•</span>}
                    {details?.genres?.[0] && <span className="truncate">{details.genres[0]}</span>}
                </div>
                {rating && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-[#ffb700]">⭐</span>
                        <span className="text-[10px] font-black text-[#ffb700]">{rating}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {onRemove && (
                    <button
                        onClick={() => onRemove(item.tmdbId)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#2D2926]/20 hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#2D2926]/20 cursor-grab active:cursor-grabbing hover:text-[#ffb700] transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </div>
            </div>
        </Reorder.Item>
    );
};
