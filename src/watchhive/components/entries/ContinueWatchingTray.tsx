import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { episodesApi, ContinueWatchingItem } from '../../services/episodes.service';
import { useCustomAlert } from '../../contexts';
import { ContinueWatchingSkeleton } from '../common';

interface ContinueWatchingTrayProps {
    onProgressUpdated?: () => void;
    className?: string;
}

export const ContinueWatchingTray: React.FC<ContinueWatchingTrayProps> = ({
    onProgressUpdated,
    className = '',
}) => {
    const navigate = useNavigate();
    const { alert } = useCustomAlert();
    const [items, setItems] = useState<ContinueWatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingTmdbId, setUpdatingTmdbId] = useState<number | null>(null);

    const loadItems = async () => {
        try {
            const data = await episodesApi.getContinueWatching(10);
            setItems(data);
        } catch (err) {
            console.error('Failed to load continue watching tray:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleQuickMarkNext = async (e: React.MouseEvent, item: ContinueWatchingItem) => {
        e.stopPropagation();
        if (!item.nextEpisodeUp || updatingTmdbId === item.tmdbId) return;

        const next = item.nextEpisodeUp;
        setUpdatingTmdbId(item.tmdbId);

        try {
            const res = await episodesApi.toggleEpisodeWatch(item.tmdbId, {
                seasonNumber: next.seasonNumber,
                episodeNumber: next.episodeNumber,
                isWatched: true,
            });

            // Optimistically update local item
            setItems(prev => prev.map(it => {
                if (it.tmdbId === item.tmdbId) {
                    return {
                        ...it,
                        currentSeason: next.seasonNumber,
                        currentEpisode: next.episodeNumber,
                        totalEpisodesWatched: it.totalEpisodesWatched + 1,
                        progressPercentage: res.progress.progressPercentage,
                        nextEpisodeUp: res.progress.nextEpisodeUp,
                    };
                }
                return it;
            }));

            if (onProgressUpdated) onProgressUpdated();

            // Check if completed season
            if (!res.progress.nextEpisodeUp || res.progress.nextEpisodeUp.seasonNumber > next.seasonNumber) {
                alert(`You completed Season ${next.seasonNumber} of ${item.title}!`, {
                    title: 'Season Completed! 🐝',
                    severity: 'success',
                });
            }
        } catch (err) {
            console.error('Error marking next episode:', err);
            alert('Failed to update episode watch status', {
                title: 'Error',
                severity: 'error',
            });
        } finally {
            setUpdatingTmdbId(null);
        }
    };

    if (loading) {
        return <ContinueWatchingSkeleton />;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <section className={`w-full flex flex-col gap-3 py-2 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb700] text-xl font-black">
                        play_circle
                    </span>
                    <h3 className="text-base font-black text-[#2D2926] tracking-tight">
                        Continue Watching
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ffb700]/15 text-[#2D2926] border border-[#ffb700]/30">
                        {items.length} in progress
                    </span>
                </div>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {items.map(item => {
                    const isUpdating = updatingTmdbId === item.tmdbId;
                    const nextEp = item.nextEpisodeUp;

                    return (
                        <div
                            key={item.tmdbId}
                            onClick={() => navigate(`/watch-hive/details/tv/${item.tmdbId}`)}
                            className="w-[280px] sm:w-[320px] shrink-0 bg-white hover:bg-slate-50/80 rounded-2xl p-3 border border-black/5 hover:border-[#ffb700]/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative"
                        >
                            <div className="flex items-start gap-3">
                                {/* Thumbnail Poster */}
                                <div className="relative w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-black/5">
                                    {item.posterPath ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined">tv</span>
                                        </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white font-black text-[8px] uppercase tracking-wider backdrop-blur-xs">
                                        TV
                                    </span>
                                </div>

                                {/* Text & Current Progress */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <h4 className="text-sm font-black text-[#2D2926] truncate group-hover:text-[#b38000] transition-colors" title={item.title}>
                                        {item.title}
                                    </h4>
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-black text-[#2D2926] bg-[#ffb700]/20 text-[#2D2926] px-1.5 py-0.5 rounded-md">
                                            S{item.currentSeason} • E{item.currentEpisode}
                                        </span>
                                        {item.totalEpisodesCount ? (
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {item.totalEpisodesWatched}/{item.totalEpisodesCount} eps
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Honey Progress Bar */}
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-black/5">
                                        <div
                                            className="bg-[#ffb700] h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(5, Math.min(100, item.progressPercentage))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Up Next / Quick Mark Action */}
                            {nextEp ? (
                                <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            Up Next
                                        </span>
                                        <span className="text-xs font-black text-[#2D2926] truncate">
                                            S{nextEp.seasonNumber} E{nextEp.episodeNumber}
                                            {nextEp.name ? ` • ${nextEp.name}` : ''}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={(e) => handleQuickMarkNext(e, item)}
                                        title={`Mark S${nextEp.seasonNumber} E${nextEp.episodeNumber} watched`}
                                        className="px-3 py-1.5 bg-[#ffb700] hover:bg-[#e6a500] text-[#2D2926] font-black text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[14px] font-black">
                                            {isUpdating ? 'refresh' : 'check'}
                                        </span>
                                        <span>{isUpdating ? 'Saving...' : 'Watched'}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs text-slate-400 font-bold">
                                    <span>🎉 All caught up!</span>
                                    <span className="text-[10px] text-[#ffb700] font-black">100%</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
