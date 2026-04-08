import React, { useState, useEffect } from 'react';
import { GroupedSuggestion, suggestionsApi } from '../../services/suggestions.service';
import apiClient from '../../services/api.js';
import { WatchlistButton, BeeLoader } from '../common';
import '../profile/Profile.css';

interface SuggestionCardProps {
    group: GroupedSuggestion;
    onStatusChange?: () => void;
}

interface TmdbDetails {
    title: string;
    name?: string;
    poster_path: string | null;
    overview: string;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    genres: string[];
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ group, onStatusChange }) => {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissing, setIsDismissing] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const endpoint = group.mediaType === 'tv' ? 'tv' : 'movie';
                const data: any = await apiClient.get(`/tmdb/${endpoint}/${group.tmdbId}`);
                setDetails({
                    title: data.title || data.name,
                    name: data.name,
                    poster_path: data.poster_path,
                    overview: data.overview,
                    vote_average: data.vote_average,
                    release_date: data.release_date,
                    first_air_date: data.first_air_date,
                    genres: (data.genres || []).map((g: any) => g.name)
                });
            } catch (err) {
                console.error('Failed to fetch TMDb details', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [group.tmdbId, group.mediaType]);

    const handleDismiss = async () => {
        if (isDismissing) return;
        
        const title = details?.title || 'this title';
        if (!window.confirm(`Dismiss suggestions for "${title}"?`)) return;

        setIsDismissing(true);
        try {
            // Delete all suggestions in this group
            await Promise.all(group.suggestions.map(s => suggestionsApi.deleteSuggestion(s.id)));
            onStatusChange?.();
        } catch (err) {
            console.error('Failed to dismiss suggestions', err);
        } finally {
            setIsDismissing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="watchlist-card animate-pulse bg-slate-100 flex items-center justify-center min-h-[250px] rounded-3xl">
                <BeeLoader size="small" message="" />
            </div>
        );
    }

    const posterUrl = details?.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : null;
    const title = details?.title || details?.name || 'Untitled';
    
    // De-duplicate suggestors
    const uniqueSuggestors = group.suggestors.reduce((acc: any[], current) => {
        if (!acc.find(s => s.id === current.id)) acc.push(current);
        return acc;
    }, []);

    return (
        <div className="watchlist-card group relative flex flex-col h-full bg-white rounded-3xl border border-[#ffb700]/10 overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Poster Wrapper */}
            <div className="watchlist-card__poster-wrapper aspect-[2/3] relative overflow-hidden bg-stone-900">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} className="watchlist-card__poster w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-[#FFF9F0] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#2D2926]/20 text-5xl">movie</span>
                    </div>
                )}
                
                {/* Standardized Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="watchlist-action-standard">
                        <WatchlistButton 
                            tmdbId={group.tmdbId} 
                            mediaType={group.mediaType as any} 
                            variant="icon"
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-[#ffb700] flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                        />
                    </div>
                    
                    <button 
                        onClick={handleDismiss}
                        className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-red-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                        disabled={isDismissing}
                        title="Dismiss Suggestion"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isDismissing ? 'sync' : 'visibility_off'}
                        </span>
                    </button>
                </div>

                {/* Badge Overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
                    <span className="bg-[#ffb700] text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider opacity-90">
                        {group.suggestions.length > 1 ? `${group.suggestions.length} Suggestions` : 'Suggested'}
                    </span>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 flex flex-col flex-1 gap-1">
                <h4 className="text-[13px] leading-tight font-black text-[#2D2926] truncate" title={title}>
                    {title}
                </h4>
                <p className="text-[11px] text-[#2D2926]/60 line-clamp-2 leading-snug mt-1 italic">
                    {details?.overview || 'No description available'}
                </p>
                
                <div className="mt-auto pt-3 border-t border-[#ffb700]/10">
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#2D2926]/40">From your Hive</span>
                        <div className="flex -space-x-2 overflow-hidden">
                            {uniqueSuggestors.slice(0, 4).map(s => (
                                <img 
                                    key={s.id} 
                                    src={s.profilePictureUrl || `https://ui-avatars.com/api/?name=${s.displayName || s.username}&background=ffb700&color=fff`} 
                                    title={s.displayName || s.username}
                                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-white" 
                                    alt=""
                                />
                            ))}
                            {uniqueSuggestors.length > 4 && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-[#2D2926] ring-2 ring-white">
                                    +{uniqueSuggestors.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
