import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../contexts/WatchlistContext';
import apiClient from '../../services/api.js';
import { MovieDetailsModal } from '../common';
import { entriesApi } from '../../services/entries.service';
import './Profile.css';
import { useCustomAlert } from '../../contexts';

interface WatchlistCardProps {
    tmdbId: number;
    mediaType?: string;
    readOnly?: boolean;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ tmdbId, mediaType = 'movie', readOnly = false }) => {
    const navigate = useNavigate();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalView, setModalView] = useState<'details' | 'log'>('details');
    const { removeFromList } = useWatchlist();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const { confirm, alert } = useCustomAlert();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const [showMobileActions, setShowMobileActions] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleAddToWatching = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isTransitioning) return;

        const title = details?.title || details?.name || 'this title';
        const confirmed = await confirm(`Would you like to start watching "${title}"? This will move it from your watchlist to your Currently Watching list.`, {
            title: 'Start Watching',
            confirmText: 'Start Watching',
            severity: 'primary'
        });
        if (!confirmed) return;

        setIsTransitioning(true);

        try {
            const apiType = mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE';
            
            // Create currently watching entry
            await entriesApi.createEntry({
                tmdbId,
                title: details.title || details.name,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString()
            });

            // Remove from watchlist
            await removeFromList(tmdbId);

            // Display beautiful success alert
            await alert(`"${title}" has been successfully moved to your Currently Watching list!`, {
                title: 'Watching Started',
                severity: 'success',
                confirmText: 'Awesome'
            });
        } catch (err) {
            console.error('Failed to move item to currently watching', err);
            await alert(`Failed to start watching "${title}". Please try again.`, {
                title: 'Error',
                severity: 'error'
            });
        } finally {
            setIsTransitioning(false);
        }
    };

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
        setModalView('log');
        setShowModal(true);
    };

    const handleCardClick = () => {
        navigate(`/watch-hive/details/${mediaType}/${tmdbId}`, { state: { from: window.location.pathname + window.location.search } });
    };

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const title = details?.title || details?.name;
        const confirmed = await confirm(`Remove "${title}" from your watchlist?`, {
            title: 'Remove from Watchlist',
            confirmText: 'Remove',
            severity: 'danger'
        });
        if (!confirmed) return;
        
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
        <>
            <div 
                className="watchlist-card group relative cursor-pointer overflow-hidden transform-gpu rounded-3xl bg-white border border-[#ffb700]/10 shadow-sm hover:shadow-md transition-all"
                onClick={(e) => {
                    if (isMobile) {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMobileActions(!showMobileActions);
                    } else {
                        handleCardClick();
                    }
                }}
            >
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

                {/* Mobile Central Eye Overlay */}
                {isMobile && showMobileActions && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[2.5px] transition-all duration-300 animate-[fade-in_0.2s_ease-out]">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick();
                            }}
                            className="w-12 h-12 rounded-full bg-[#ffb700] hover:bg-[#ffc83b] text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform scale-105 pointer-events-auto"
                            title="View details"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold">visibility</span>
                        </button>
                    </div>
                )}

                {/* Standardized Actions Layout */}
                {!readOnly && (
                    <div className={`absolute top-2 right-2 flex flex-col gap-2 z-20 transition-all duration-300
                        ${isMobile 
                            ? (showMobileActions ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-90 pointer-events-none') 
                            : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <button
                            onClick={handleAddToWatching}
                            disabled={isTransitioning}
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-[#ffb700] flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors disabled:opacity-50"
                            title="Start Watching (Move to Currently Watching)"
                        >
                            {isTransitioning ? (
                                <span className="animate-spin text-[12px] text-[#ffb700]">⏳</span>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">
                                    play_arrow
                                </span>
                            )}
                        </button>

                        <button
                            onClick={handleMarkAsWatched}
                            className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/60 hover:text-green-500 flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
                            title="Mark as Watched (Hive It)"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                check_circle
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
                )}

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="bg-[#ffb700] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90 uppercase tracking-tighter">
                        {mediaType === 'tv' ? '📺 TV' : '🎬 Movie'}
                    </span>
                </div>
            </div>
            <div className="watchlist-card__info gap-1 p-4 flex flex-col h-full bg-white border-t border-slate-50">
                <h4 className="watchlist-card__title text-[13px] leading-tight font-black text-[#2D2926] truncate" title={title}>{title}</h4>
                <div className="watchlist-card__meta text-[11px] font-bold mt-1 text-[#2D2926]/60 dark:text-stone-400 flex items-center justify-between w-full">
                    <span>{year || 'Coming Soon'}</span>
                    {rating && (
                        <span className="watchlist-card__rating text-[#ffb700] flex items-center gap-1 shrink-0 ml-2">⭐ {rating}</span>
                    )}
                </div>
            </div>
        </div>

        <MovieDetailsModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            tmdbId={tmdbId}
            mediaType={mediaType as 'movie' | 'tv'}
            initialView={modalView}
            onLogSuccess={async () => {
                if (!readOnly) {
                    await removeFromList(tmdbId);
                }
            }}
        />
        </>
    );
};
