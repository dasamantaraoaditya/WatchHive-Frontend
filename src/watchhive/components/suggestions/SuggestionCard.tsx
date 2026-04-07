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
            <div className="watchlist-card animate-pulse bg-slate-100 flex items-center justify-center min-h-[200px]">
                <BeeLoader size="small" message="" />
            </div>
        );
    }

    const posterUrl = details?.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : null;
    
    // De-duplicate suggestors
    const uniqueSuggestors = group.suggestors.reduce((acc: any[], current) => {
        if (!acc.find(s => s.id === current.id)) acc.push(current);
        return acc;
    }, []);

    return (
        <div className="watchlist-card group relative flex flex-col h-full bg-white rounded-3xl border border-[#ffb700]/10 overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Poster Wrapper */}
            <div className="watchlist-card__poster-wrapper aspect-[2/3] relative overflow-hidden">
                {posterUrl ? (
                    <img src={posterUrl} alt="" className="watchlist-card__poster w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-[#FFF9F0] flex items-center justify-center"><span className="material-symbols-outlined text-[#ffb700]/30 text-5xl">movie</span></div>
                )}
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                    <WatchlistButton 
                        tmdbId={group.tmdbId} 
                        mediaType={group.mediaType} 
                        className="w-full py-2.5 bg-[#ffb700] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:brightness-105" 
                    />
                    <button 
                        onClick={handleDismiss}
                        className="w-full py-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                        disabled={isDismissing}
                    >
                        <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                        Dismiss
                    </button>
                </div>

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="bg-[#ffb700] text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                        {group.suggestions.length > 1 ? `${group.suggestions.length} Suggestions` : 'Suggested'}
                    </span>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                <h4 className="text-sm font-black text-[#2D2926] leading-tight line-clamp-2" title={details?.overview}>
                    {details?.overview ? details.overview.split('.')[0] : 'Suggested title'}
                </h4>
                
                <div className="mt-auto pt-4 border-t border-[#ffb700]/10">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/40">Suggested by</span>
                        <div className="flex -space-x-2 overflow-hidden">
                            {uniqueSuggestors.slice(0, 4).map(s => (
                                <img 
                                    key={s.id} 
                                    src={s.profilePictureUrl || `https://ui-avatars.com/api/?name=${s.displayName || s.username}&background=ffb700&color=fff`} 
                                    title={s.displayName || s.username}
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-white" 
                                    alt=""
                                />
                            ))}
                            {uniqueSuggestors.length > 4 && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-[#2D2926] ring-2 ring-white">
                                    +{uniqueSuggestors.length - 4}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-[#2D2926]/60 truncate">
                            {uniqueSuggestors.map(s => s.displayName || s.username).join(', ')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
