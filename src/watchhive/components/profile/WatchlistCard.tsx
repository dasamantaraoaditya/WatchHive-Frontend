import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../contexts/WatchlistContext';
import apiClient from '../../services/api.js';
import { MovieDetailsModal, Modal, CardDropdownMenu } from '../common';
import { entriesApi } from '../../services/entries.service';
import { EntryForm } from '../entries/EntryForm';
import './Profile.css';
import { useCustomAlert } from '../../contexts';

interface WatchlistCardProps {
    tmdbId: number;
    mediaType?: string;
    readOnly?: boolean;
    suggestedByUserId?: string | null;
    suggestedByUser?: {
        id: string;
        username: string;
        displayName?: string | null;
        profilePictureUrl?: string | null;
    } | null;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ tmdbId, mediaType = 'movie', readOnly = false, suggestedByUserId = null, suggestedByUser = null }) => {
    const navigate = useNavigate();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalView] = useState<'details' | 'log'>('details');
    const [showEntryForm, setShowEntryForm] = useState(false);
    const { removeFromList } = useWatchlist();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const { confirm, alert } = useCustomAlert();

    const handleAddToWatching = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isTransitioning) return;

        let resolvedTitle = details?.name || details?.title || details?.original_name || details?.original_title;
        if (!resolvedTitle) {
            try {
                const fetched = await apiClient.get<any>(`/tmdb/${mediaType === 'tv' ? 'tv' : 'movie'}/${tmdbId}`);
                resolvedTitle = fetched?.name || fetched?.title || fetched?.original_name || fetched?.original_title || 'Untitled';
                setDetails(fetched);
            } catch {
                resolvedTitle = 'Untitled';
            }
        }

        const confirmed = await confirm(`Would you like to move "${resolvedTitle}" to your Currently Watching log?`, {
            title: 'Log as Currently Watching',
            confirmText: 'Move to Currently Watching',
            severity: 'primary'
        });
        if (!confirmed) return;

        setIsTransitioning(true);

        try {
            const apiType = mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE';
            
            // Create currently watching entry with preserved suggestedByUserId
            await entriesApi.createEntry({
                tmdbId,
                title: resolvedTitle,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString(),
                suggestedByUserId: suggestedByUser?.id || null
            });

            // Remove from watchlist
            await removeFromList(tmdbId);

            // Display beautiful success alert
            await alert(`"${title}" has been added to your Currently Watching log!`, {
                title: 'Marked as Watching',
                severity: 'success',
                confirmText: 'Awesome'
            });
        } catch (err) {
            console.error('Failed to move item to currently watching', err);
            await alert(`Failed to add "${title}" to currently watching log. Please try again.`, {
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
        setShowEntryForm(true);
    };

    const handleCardClick = () => {
        navigate(`/watch-hive/details/${mediaType}/${tmdbId}`, { 
            state: { 
                suggestedByUserId: suggestedByUser?.id || suggestedByUserId,
                suggestedByUser,
                from: window.location.pathname + window.location.search 
            } 
        });
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
                onClick={handleCardClick}
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

                {/* Three-dots Context Menu */}
                {!readOnly && (
                    <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                        <CardDropdownMenu
                            items={[
                                {
                                    label: 'Log as Watching',
                                    icon: 'play_arrow',
                                    iconColor: 'text-sky-500',
                                    disabled: isTransitioning,
                                    onClick: handleAddToWatching,
                                },
                                {
                                    label: 'Mark as Watched',
                                    icon: 'check_circle',
                                    iconColor: 'text-emerald-500',
                                    onClick: handleMarkAsWatched,
                                },
                                {
                                    label: 'Remove from Watchlist',
                                    icon: 'delete',
                                    danger: true,
                                    onClick: handleRemove,
                                },
                            ]}
                        />
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
                {suggestedByUser && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200/70 rounded-md text-[#2D2926] text-[9px] font-bold w-fit mt-0.5">
                        <span>💡 Suggested by</span>
                        <span className="font-black text-amber-800">@{suggestedByUser.username}</span>
                    </div>
                )}
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
                        tmdbId,
                        title: details.title || details.name,
                        type: mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                        posterPath: details.poster_path,
                        overview: details.overview,
                        suggestedByUserId: suggestedByUser?.id || suggestedByUserId || null,
                        suggestedByUser: suggestedByUser ? {
                            id: suggestedByUser.id,
                            username: suggestedByUser.username,
                            displayName: suggestedByUser.displayName || null,
                            profilePictureUrl: suggestedByUser.profilePictureUrl || null,
                        } : null,
                    }}
                    onSuccess={async () => {
                        setShowEntryForm(false);
                        if (!readOnly) {
                            await removeFromList(tmdbId);
                        }
                    }}
                    onCancel={() => setShowEntryForm(false)}
                />
            </Modal>
        )}
        </>
    );
};
