import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupedSuggestion, suggestionsApi } from '../../services/suggestions.service';
import { entriesApi } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { WatchlistButton, SkeletonCard, Modal } from '../common';
import { EntryForm } from '../entries/EntryForm';
import '../profile/Profile.css';
import { useCustomAlert } from '../../contexts';

interface SuggestionCardProps {
    group: GroupedSuggestion;
    onStatusChange?: () => void;
    onLogEntry?: (prefill: { tmdbId: number; title: string; type: 'MOVIE' | 'TV_SHOW'; posterPath?: string | null; suggestedByUserId?: string | null; suggestionIds?: string[] }) => void;
    preloadedDetails?: {
        title: string;
        overview: string;
        poster_path: string | null;
    };
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

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ group, onStatusChange, preloadedDetails }) => {
    const navigate = useNavigate();
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissing, setIsDismissing] = useState(false);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const { confirm, alert } = useCustomAlert();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const [showMobileActions, setShowMobileActions] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (preloadedDetails) {
            setDetails({
                title: preloadedDetails.title,
                poster_path: preloadedDetails.poster_path,
                overview: preloadedDetails.overview,
                vote_average: 0,
                genres: []
            });
            setIsLoading(false);
            return;
        }

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
    }, [group.tmdbId, group.mediaType, preloadedDetails]);

    // De-duplicate suggestors
    const uniqueSuggestors = group.suggestors.reduce((acc: any[], current) => {
        if (!acc.find(s => s.id === current.id)) acc.push(current);
        return acc;
    }, []);

    const handleAddToWatching = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDismissing) return;

        const title = details?.title || details?.name || 'this title';
        const confirmed = await confirm(`Would you like to move "${title}" to your Currently Watching log?`, {
            title: 'Log as Currently Watching',
            confirmText: 'Move to Currently Watching',
            severity: 'primary'
        });
        if (!confirmed) return;

        setIsDismissing(true);
        try {
            const apiType = group.mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE';
            const suggestorId = uniqueSuggestors[0]?.id;
            await entriesApi.createEntry({
                tmdbId: group.tmdbId,
                title: details?.title || details?.name || title,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString(),
                suggestedByUserId: suggestorId
            });
            await Promise.all(group.suggestions.map(s => suggestionsApi.deleteSuggestion(s.id)));
            await alert(`"${title}" has been added to your Currently Watching log!`, {
                title: 'Marked as Watching',
                severity: 'success',
                confirmText: 'Awesome'
            });
            onStatusChange?.();
        } catch (err) {
            console.error('Failed to move item to currently watching', err);
            await alert(`Failed to add "${title}" to currently watching log. Please try again.`, {
                title: 'Error',
                severity: 'error'
            });
        } finally {
            setIsDismissing(false);
        }
    };

    const handleMarkAsWatched = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowEntryForm(true);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDismissing) return;
        
        const title = details?.title || details?.name || 'this title';
        const confirmed = await confirm(`Delete suggestions for "${title}"?`, {
            title: 'Delete Suggestion',
            confirmText: 'Delete',
            severity: 'warning'
        });
        if (!confirmed) return;

        setIsDismissing(true);
        try {
            // Delete all suggestions in this group
            await Promise.all(group.suggestions.map(s => suggestionsApi.deleteSuggestion(s.id)));
            onStatusChange?.();
        } catch (err) {
            console.error('Failed to delete suggestions', err);
        } finally {
            setIsDismissing(false);
        }
    };

    if (isLoading) {
        return <SkeletonCard />;
    }

    const posterUrl = details?.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : null;
    const title = details?.title || details?.name || 'Untitled';

    return (
        <>
            <div 
                className="watchlist-card group relative flex flex-col h-full bg-white rounded-3xl border border-[#ffb700]/10 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={(e) => {
                    if (isMobile) {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMobileActions(!showMobileActions);
                    } else {
                        navigate(`/watch-hive/details/${group.mediaType}/${group.tmdbId}`, { 
                            state: { 
                                suggestedByUserId: uniqueSuggestors[0]?.id,
                                suggestedByUser: uniqueSuggestors[0],
                                from: window.location.pathname + window.location.search 
                            } 
                        });
                    }
                }}
            >
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

                    {/* Mobile Central Eye Overlay */}
                    {isMobile && showMobileActions && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[2.5px] transition-all duration-300 animate-[fade-in_0.2s_ease-out]">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/watch-hive/details/${group.mediaType}/${group.tmdbId}`, { 
                                        state: { 
                                            suggestedByUserId: uniqueSuggestors[0]?.id,
                                            suggestedByUser: uniqueSuggestors[0],
                                            from: window.location.pathname + window.location.search 
                                        } 
                                    });
                                }}
                                className="w-12 h-12 rounded-full bg-[#ffb700] hover:bg-[#ffc83b] text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform scale-105 pointer-events-auto"
                                title="View details"
                            >
                                <span className="material-symbols-outlined text-[24px] font-bold">visibility</span>
                            </button>
                        </div>
                    )}

                    {/* Actions overlay */}
                    <div className={`absolute top-2 right-2 flex flex-col gap-2 z-20 transition-all duration-300
                        ${isMobile 
                            ? (showMobileActions ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-90 pointer-events-none') 
                            : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <div className="watchlist-action-standard">
                            <WatchlistButton 
                                tmdbId={group.tmdbId} 
                                mediaType={group.mediaType as any} 
                                suggestedByUserId={uniqueSuggestors[0]?.id}
                                variant="icon"
                                className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-[#ffb700] flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                            />
                        </div>

                        <button 
                            onClick={handleAddToWatching}
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-[#ffb700] flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                            disabled={isDismissing}
                            title="Log as Currently Watching"
                        >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        <button 
                            onClick={handleMarkAsWatched}
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-green-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                            disabled={isDismissing}
                            title="Mark as Watched"
                        >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        
                        <button 
                            onClick={handleDelete}
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-red-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                            disabled={isDismissing}
                            title="Delete Suggestion"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isDismissing ? 'sync' : 'delete'}
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

            {showEntryForm && (
                <Modal
                    isOpen={showEntryForm}
                    onClose={() => setShowEntryForm(false)}
                    title="Log your watch"
                    maxWidth="max-w-4xl"
                >
                    <EntryForm
                        isModal={true}
                        prefillData={{
                            tmdbId: group.tmdbId,
                            title: details?.title || details?.name || preloadedDetails?.title || 'Untitled',
                            type: group.mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                            posterPath: details?.poster_path || preloadedDetails?.poster_path || null,
                            overview: details?.overview || preloadedDetails?.overview || null,
                            suggestedByUserId: uniqueSuggestors[0]?.id || null,
                            suggestedByUser: uniqueSuggestors[0] || null,
                        }}
                        onSuccess={async () => {
                            setShowEntryForm(false);
                            try {
                                await Promise.all(group.suggestions.map(s => suggestionsApi.deleteSuggestion(s.id)));
                            } catch (err) {
                                console.error('Failed to delete suggestions on log:', err);
                            }
                            onStatusChange?.();
                        }}
                        onCancel={() => setShowEntryForm(false)}
                    />
                </Modal>
            )}
        </>
    );
};

export default SuggestionCard;
