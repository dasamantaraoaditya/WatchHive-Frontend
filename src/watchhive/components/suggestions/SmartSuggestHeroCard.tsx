import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestionsApi, SmartSuggestItem, SmartSuggestResponse } from '../../services/suggestions.service';
import { SmartSuggestDeckModal } from './SmartSuggestDeckModal';
import { WatchlistButton } from '../common';

export const SmartSuggestHeroCard: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'social' | 'critic' | 'explore'>('social');
    const [items, setItems] = useState<SmartSuggestItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isDeckOpen, setIsDeckOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchPicks = async () => {
            setLoading(true);
            try {
                const res: SmartSuggestResponse = await suggestionsApi.getSmartSuggestions(mode, 8);
                if (isMounted) {
                    setItems(res.items || []);
                    setCurrentIndex(0);
                }
            } catch (err) {
                console.error('[SmartSuggestHeroCard] Failed to fetch picks:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPicks();
        return () => { isMounted = false; };
    }, [mode]);

    if (isDismissed) return null;

    const currentItem = items[currentIndex];

    const handleShuffle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (items.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    const handleNavigate = () => {
        if (!currentItem) return;
        navigate(`/watch-hive/details/${currentItem.mediaType}/${currentItem.tmdbId}`, {
            state: { from: window.location.pathname + window.location.search }
        });
    };

    return (
        <>
            <div className="relative w-full bg-gradient-to-br from-[#FFF9F0] to-[#fff4dd] rounded-[28px] border-1.5 border-[#ffb700]/30 shadow-md p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:shadow-lg">
                {/* Background Golden Glow */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#ffb700]/15 rounded-full blur-2xl pointer-events-none" />

                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#ffb700]/20 flex items-center justify-center text-[#ffb700] border border-[#ffb700]/40">
                            <span className="material-symbols-outlined text-[17px]">psychology</span>
                        </div>
                        <div>
                            <span className="text-xs sm:text-sm font-black text-[#2D2926] tracking-tight">
                                SmartSuggest <span className="text-[#ffb700]">Tonight</span>
                            </span>
                        </div>
                    </div>

                    {/* Mode Selector Mini Pills */}
                    <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-xl border border-[#ffb700]/20 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setMode('social')}
                            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                                mode === 'social' ? 'bg-[#ffb700] text-[#2D2926]' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
                            }`}
                            title="Hive Mind: Social & Friend recommendations"
                        >
                            Social
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('critic')}
                            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                                mode === 'critic' ? 'bg-[#ffb700] text-[#2D2926]' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
                            }`}
                            title="Certified Gold: Critical & Audience acclaim"
                        >
                            Critic
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('explore')}
                            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                                mode === 'explore' ? 'bg-[#ffb700] text-[#2D2926]' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
                            }`}
                            title="Palate Cleanser: Contrasting fresh genres"
                        >
                            Explore
                        </button>
                    </div>

                    {/* Dismiss Button */}
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="w-6 h-6 rounded-full text-[#2D2926]/30 hover:text-[#2D2926] flex items-center justify-center transition-colors cursor-pointer"
                        title="Dismiss for now"
                        aria-label="Dismiss"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                {/* Content Body */}
                {loading ? (
                    <div className="py-6 flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#ffb700] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-[#2D2926]/60">Analyzing your hive taste...</span>
                    </div>
                ) : currentItem ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Movie Info Thumbnail & Badges */}
                        <div
                            className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer group"
                            onClick={handleNavigate}
                        >
                            <div className="relative w-16 h-22 sm:w-18 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md border border-white">
                                <img
                                    src={
                                        currentItem.posterPath
                                            ? `https://image.tmdb.org/t/p/w342${currentItem.posterPath}`
                                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300'
                                    }
                                    alt={currentItem.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute top-1 left-1 bg-[#2D2926]/85 backdrop-blur-xs text-[#ffb700] text-[9px] font-black px-1 rounded-sm">
                                    ★ {currentItem.voteAverage.toFixed(1)}
                                </div>
                            </div>

                            <div className="min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black bg-[#ffb700] text-[#2D2926] px-2 py-0.5 rounded-full">
                                        {currentItem.score}% Match
                                    </span>
                                    {currentItem.genreNames.length > 0 && (
                                        <span className="text-[11px] font-bold text-[#2D2926]/50">
                                            {currentItem.genreNames[0]}
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-sm sm:text-base font-black text-[#2D2926] truncate group-hover:text-[#ffb700] transition-colors">
                                    {currentItem.title}
                                </h4>

                                {/* Top Reason Badge */}
                                {currentItem.badges.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D2926]/80 line-clamp-1">
                                        <span className="material-symbols-outlined text-[15px] text-[#ffb700] shrink-0">
                                            {currentItem.badges[0].type === 'friend_pick' ? 'group' : currentItem.badges[0].type === 'palate_cleanser' ? 'cached' : 'verified'}
                                        </span>
                                        <span className="truncate">{currentItem.badges[0].label}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ffb700]/15">
                            {/* Shuffle Pick */}
                            <button
                                type="button"
                                onClick={handleShuffle}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-[#2D2926] flex items-center justify-center shadow-xs border border-[#ffb700]/20 transition-all cursor-pointer"
                                title="Shuffle to another smart pick"
                            >
                                <span className="material-symbols-outlined text-[18px]">cached</span>
                            </button>

                            {/* Quick Watchlist */}
                            <div title="Save to Watchlist">
                                <WatchlistButton
                                    tmdbId={currentItem.tmdbId}
                                    variant="icon"
                                    className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-[#2D2926] flex items-center justify-center shadow-xs border border-[#ffb700]/20 transition-all cursor-pointer text-[18px]"
                                />
                            </div>

                            {/* Open Deck Modal */}
                            <button
                                type="button"
                                onClick={() => setIsDeckOpen(true)}
                                className="px-3.5 py-2 bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                                <span>Explore Deck</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center text-xs font-bold text-[#2D2926]/40">
                        Log more watches to supercharge SmartSuggest recommendations!
                    </div>
                )}
            </div>

            {/* SmartSuggest Full Deck Modal */}
            <SmartSuggestDeckModal
                isOpen={isDeckOpen}
                onClose={() => setIsDeckOpen(false)}
                initialMode={mode}
            />
        </>
    );
};

export default SmartSuggestHeroCard;
