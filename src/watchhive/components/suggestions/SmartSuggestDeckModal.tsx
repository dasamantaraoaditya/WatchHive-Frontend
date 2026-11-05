import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { suggestionsApi, SmartSuggestItem, SmartSuggestResponse } from '../../services/suggestions.service';
import { WatchlistButton } from '../common';
import { EntryForm } from '../entries/EntryForm';
import { Modal } from '../common/Modal';

interface SmartSuggestDeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'social' | 'critic' | 'explore';
}

export const SmartSuggestDeckModal: React.FC<SmartSuggestDeckModalProps> = ({
    isOpen,
    onClose,
    initialMode = 'social'
}) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'social' | 'critic' | 'explore'>(initialMode);
    const [items, setItems] = useState<SmartSuggestItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logModalItem, setLogModalItem] = useState<SmartSuggestItem | null>(null);

    // Body scroll locking & modal state attribute
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
        } else {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        };
    }, [isOpen]);

    // Fetch recommendations whenever mode changes or modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchPicks = async () => {
            setLoading(true);
            setError(null);
            try {
                const res: SmartSuggestResponse = await suggestionsApi.getSmartSuggestions(mode, 12);
                if (isMounted) {
                    setItems(res.items || []);
                    setCurrentIndex(0);
                }
            } catch (err) {
                console.error('[SmartSuggest] Failed to load suggestions:', err);
                if (isMounted) {
                    setError('Failed to generate recommendations right now. Please try again.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPicks();
        return () => { isMounted = false; };
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const currentItem = items[currentIndex];

    const handleNext = () => {
        if (items.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    const handlePrev = () => {
        if (items.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        }
    };

    const handleNavigateDetails = (item: SmartSuggestItem) => {
        onClose();
        navigate(`/watch-hive/details/${item.mediaType}/${item.tmdbId}`, {
            state: { from: window.location.pathname + window.location.search }
        });
    };

    const getModeDescription = () => {
        switch (mode) {
            case 'social':
                return 'Prioritizing picks from your trusted circle & friend suggestions.';
            case 'critic':
                return 'Prioritizing top critical acclaim, audience consensus & IMDb scores.';
            case 'explore':
                return 'Nudging you outside your comfort zone with contrasting genres.';
        }
    };

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            data-modal-open="true"
            className="fixed inset-0 z-[3500] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onClick={onClose}
        >
            <div
                className="bg-[#FFF9F0] w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] rounded-[32px] shadow-2xl border border-[#ffb700]/30 flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Mode Switcher */}
                <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-white border-b border-[#ffb700]/15 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#ffb700]/15 flex items-center justify-center text-[#ffb700] border border-[#ffb700]/30">
                                <span className="material-symbols-outlined text-[20px]">psychology</span>
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-[#2D2926] tracking-tight">
                                    SmartSuggest <span className="text-[#ffb700]">Deck</span>
                                </h3>
                                <p className="text-[10px] font-bold text-[#2D2926]/50 uppercase tracking-wider">
                                    AI Taste Engine
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Mode Toggle Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#FFF9F0] rounded-2xl border border-[#ffb700]/20">
                        <button
                            type="button"
                            onClick={() => setMode('social')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                mode === 'social'
                                    ? 'bg-[#ffb700] text-[#2D2926] shadow-xs'
                                    : 'text-[#2D2926]/60 hover:text-[#2D2926]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">group</span>
                            <span>Hive Mind</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('critic')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                mode === 'critic'
                                    ? 'bg-[#ffb700] text-[#2D2926] shadow-xs'
                                    : 'text-[#2D2926]/60 hover:text-[#2D2926]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">stars</span>
                            <span>Certified Gold</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('explore')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                mode === 'explore'
                                    ? 'bg-[#ffb700] text-[#2D2926] shadow-xs'
                                    : 'text-[#2D2926]/60 hover:text-[#2D2926]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">explore</span>
                            <span>Palate Cleanser</span>
                        </button>
                    </div>
                </div>

                {/* Subtitle / Mode Guidance */}
                <div className="bg-[#fffbea] px-6 py-2 border-b border-[#ffb700]/10 flex items-center justify-between text-[11px] font-bold text-[#b07d00]">
                    <span className="truncate">{getModeDescription()}</span>
                    {items.length > 0 && !loading && (
                        <span className="shrink-0 font-extrabold text-[#2D2926]/60 ml-2">
                            Pick {currentIndex + 1} of {items.length}
                        </span>
                    )}
                </div>

                {/* Card Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center no-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-white border border-[#ffb700]/30 shadow-lg flex items-center justify-center animate-bounce">
                                <span className="material-symbols-outlined text-3xl text-[#ffb700]">psychology</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#2D2926]">Calculating your best match...</p>
                                <p className="text-xs text-[#2D2926]/50">Evaluating network buzz, ratings & mood balance</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center text-slate-500">
                            <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
                            <p className="text-sm font-bold text-[#2D2926]">{error}</p>
                            <button
                                onClick={() => setMode(mode)}
                                className="mt-4 px-4 py-2 bg-[#ffb700] text-[#2D2926] rounded-xl text-xs font-black uppercase tracking-wider"
                            >
                                Retry
                            </button>
                        </div>
                    ) : currentItem ? (
                        <div className="w-full flex flex-col items-center animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]">
                            {/* Poster Card */}
                            <div
                                className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[2/3] max-h-[360px] sm:max-h-[400px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/80 cursor-pointer group"
                                onClick={() => handleNavigateDetails(currentItem)}
                            >
                                <img
                                    src={
                                        currentItem.posterPath
                                            ? `https://image.tmdb.org/t/p/w780${currentItem.posterPath}`
                                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'
                                    }
                                    alt={currentItem.title}
                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                />

                                {/* Top Badges Overlay */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                    {/* Match Score */}
                                    <div className="bg-[#2D2926]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
                                        <span className="text-[#ffb700] text-xs font-black">★</span>
                                        <span className="text-white text-xs font-black">
                                            {currentItem.score}% Match
                                        </span>
                                    </div>

                                    {/* Vote Average */}
                                    {currentItem.voteAverage > 0 && (
                                        <div className="bg-[#ffb700] text-[#2D2926] px-2.5 py-1 rounded-full font-black text-xs shadow-md flex items-center gap-1">
                                            <span>{currentItem.voteAverage.toFixed(1)}</span>
                                            <span className="text-[10px] uppercase font-bold opacity-75">TMDb</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Poster Gradient */}
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                                <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                                    <h4 className="text-xl font-black leading-tight drop-shadow-md line-clamp-2">
                                        {currentItem.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-white/80 font-bold">
                                        {currentItem.releaseDate && (
                                            <span>{new Date(currentItem.releaseDate).getFullYear()}</span>
                                        )}
                                        {currentItem.genreNames.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate">{currentItem.genreNames.slice(0, 2).join(', ')}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Explainability Badges Section */}
                            <div className="w-full mt-4 flex flex-col gap-2">
                                <p className="text-[11px] font-black uppercase tracking-wider text-[#2D2926]/40">
                                    Why WatchersHive picked this:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {currentItem.badges.map((badge, idx) => (
                                        <div
                                            key={idx}
                                            className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xs ${
                                                badge.type === 'friend_pick'
                                                    ? 'bg-amber-50 border-[#ffb700]/40 text-[#2D2926]'
                                                    : badge.type === 'palate_cleanser'
                                                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                                                    : badge.type === 'critical_acclaim'
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                    : badge.type === 'watchlist'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                                                    : 'bg-white border-slate-200 text-slate-800'
                                            }`}
                                        >
                                            {badge.type === 'friend_pick' && (
                                                <span className="material-symbols-outlined text-[16px] text-[#ffb700]">group</span>
                                            )}
                                            {badge.type === 'palate_cleanser' && (
                                                <span className="material-symbols-outlined text-[16px] text-purple-600">cached</span>
                                            )}
                                            {badge.type === 'critical_acclaim' && (
                                                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                                            )}
                                            {badge.type === 'watchlist' && (
                                                <span className="material-symbols-outlined text-[16px] text-blue-600">bookmark</span>
                                            )}
                                            {badge.type === 'network_buzz' && (
                                                <span className="material-symbols-outlined text-[16px] text-amber-600">trending_up</span>
                                            )}
                                            <span>{badge.label}</span>
                                            {badge.meta && (
                                                <span className="text-[10px] opacity-60 font-semibold">
                                                    ({badge.meta})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Overview snippet */}
                                {currentItem.overview && (
                                    <p className="text-xs text-[#2D2926]/70 leading-relaxed mt-1 line-clamp-3 font-medium">
                                        "{currentItem.overview}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center text-[#2D2926]/40 font-bold text-sm">
                            No recommendations found in this category right now.
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {currentItem && !loading && (
                    <div className="px-5 py-3.5 bg-white border-t border-[#ffb700]/15 flex items-center justify-between gap-3 shrink-0">
                        {/* Skip / Previous */}
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#2D2926] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Previous pick"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>

                        <div className="flex items-center gap-2 flex-1 justify-center max-w-sm">
                            {/* Watchlist Quick Button */}
                            <div className="shrink-0" title="Add to Watchlist">
                                <WatchlistButton
                                    tmdbId={currentItem.tmdbId}
                                    variant="icon"
                                    className="w-11 h-11 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/30 hover:bg-[#ffb700]/20 text-[#2D2926] flex items-center justify-center text-xl transition-all shadow-xs cursor-pointer"
                                />
                            </div>

                            {/* Log Watch Button */}
                            <button
                                type="button"
                                onClick={() => setLogModalItem(currentItem)}
                                className="flex-1 py-2.5 px-3 bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#ffb700]/20 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-lg">add_task</span>
                                <span>Log Watch</span>
                            </button>
                        </div>

                        {/* Next / Pass Button */}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-4 py-2.5 rounded-2xl bg-[#2D2926] hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                            title="Next recommendation"
                        >
                            <span>Next</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Log Modal if triggered from SmartSuggest */}
            {logModalItem && (
                <Modal
                    isOpen={Boolean(logModalItem)}
                    onClose={() => setLogModalItem(null)}
                    title={`Log ${logModalItem.title}`}
                    maxWidth="max-w-4xl"
                >
                    <EntryForm
                        isModal={true}
                        prefillData={{
                            tmdbId: logModalItem.tmdbId,
                            title: logModalItem.title,
                            type: logModalItem.mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                            posterPath: logModalItem.posterPath || null,
                            overview: logModalItem.overview || null,
                            suggestedByUserId: logModalItem.suggestedBy?.id || null,
                        }}
                        onSuccess={() => {
                            setLogModalItem(null);
                            handleNext();
                        }}
                    />
                </Modal>
            )}

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default SmartSuggestDeckModal;
