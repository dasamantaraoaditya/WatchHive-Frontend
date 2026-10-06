import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Entry } from '../../services/entries.service';
import { TmdbDetails, formatDate } from './types';

export interface ExpandedCardProps {
    entry: Entry;
    details: TmdbDetails | null;
    onClose: () => void;
    /**
     * Render prop for the action buttons shown in the top-right of the sticky nav bar.
     * Each consumer (Feed, EntryList, CurrentlyWatching…) passes its own set of actions.
     * They receive `{ entry, onClose }` so they can easily wire up their own handlers.
     */
    actions?: (ctx: { entry: Entry; onClose: () => void }) => React.ReactNode;
}

const getDirectLink = (providerName: string, fallbackLink: string, title: string) => {
    const name = providerName.toLowerCase();
    const query = encodeURIComponent(title);
    if (name.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
    if (name.includes('amazon') || name.includes('prime')) return `https://www.primevideo.com/search/ref=atv_sr_sug_1?phrase=${query}`;
    if (name.includes('hotstar')) return `https://www.hotstar.com/in/explore?searchQuery=${query}`;
    if (name.includes('zee5')) return `https://www.zee5.com/search?q=${query}`;
    if (name.includes('sonyliv')) return `https://www.sonyliv.com/search?query=${query}`;
    if (name.includes('jiocinema')) return `https://www.jiocinema.com/search?q=${query}`;
    if (name.includes('apple')) return `https://tv.apple.com/in/search?q=${query}`;
    if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}+movie`;
    return fallbackLink;
};

export const ExpandedCard: React.FC<ExpandedCardProps> = ({ entry, details, onClose, actions }) => {
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = React.useRef(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentY = e.currentTarget.scrollTop;
        if (currentY > lastScrollY.current && currentY > 60) {
            if (isNavVisible) setIsNavVisible(false);
        } else if (currentY < lastScrollY.current) {
            if (!isNavVisible) setIsNavVisible(true);
        }
        lastScrollY.current = currentY;
    };

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/original${details.poster_path}`
        : null;

    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : posterUrl;

    const year = details?.release_date?.slice(0, 4) || details?.first_air_date?.slice(0, 4);
    const runtime = details?.runtime ? `${details.runtime}m` : null;
    const primaryGenre = details?.genres?.[0]?.name;

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
            exit={{ opacity: 0, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
            onScroll={handleScroll}
            className="fixed inset-y-0 right-0 left-0 md:left-[256px] z-[100] flex flex-col bg-[#FFF9F0] overflow-y-auto no-scrollbar font-display"
        >
            {/* Sticky Navigation Bar */}
            <div
                className={`sticky top-4 md:top-6 z-50 flex justify-between items-start px-4 md:px-6 pointer-events-none w-full max-w-full transition-all duration-300 ease-in-out ${isNavVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                {/* Back button — always present */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-[#ffb700] hover:bg-white/30 transition-all pointer-events-auto"
                    title="Back"
                >
                    <span className="material-symbols-outlined text-[26px] ml-1">arrow_back_ios</span>
                </motion.button>

                {/* Consumer-supplied action buttons */}
                {actions && (
                    <div className="flex items-center gap-2 pointer-events-auto">
                        {actions({ entry, onClose })}
                    </div>
                )}
            </div>

            {/* Hero Header */}
            <motion.div layoutId={`card-wrapper-${entry.id}`} className="relative w-full h-[60vh] md:h-[70vh] shrink-0 bg-[#FFF9F0] -mt-[56px] md:-mt-[64px]">
                <picture>
                    {backdropUrl && <source media="(min-width: 768px)" srcSet={backdropUrl} />}
                    {posterUrl && (
                        <motion.img
                            layoutId={`poster-${entry.id}`}
                            src={posterUrl}
                            alt={entry.title}
                            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
                        />
                    )}
                </picture>

                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                {/* Metadata at bottom of Hero */}
                <motion.div layoutId={`card-content-${entry.id}`} className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-3">
                    <motion.h1 layoutId={`title-${entry.id}`} className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight drop-shadow-sm leading-tight">
                        {entry.title}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 text-[#2D2926]/70 font-bold text-xs md:text-sm uppercase tracking-[0.2em]"
                    >
                        {primaryGenre && <span>{primaryGenre}</span>}
                        {primaryGenre && year && <span className="opacity-40">•</span>}
                        {year && <span>{year}</span>}
                        {year && runtime && <span className="opacity-40">•</span>}
                        {runtime && <span>{runtime}</span>}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Content Body */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="px-6 md:px-10 pb-24 pt-4 flex flex-col gap-10 w-full relative z-10"
            >
                {/* Synopsis */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                        Synopsis
                    </h3>
                    <p className="text-[#2D2926]/80 text-lg md:text-xl leading-relaxed font-serif tracking-wide">
                        {details?.overview || 'No synopsis available.'}
                    </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Your Rating</span>
                        <span className="text-[#2D2926] text-2xl font-black">{entry.rating ? `⭐ ${entry.rating}` : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Watched On</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{formatDate(entry.watchedAt)}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">TMDB Score</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{details?.vote_average ? `${details.vote_average.toFixed(1)} / 10` : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Status</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{entry.isWatching ? 'Watching' : 'Completed'}</span>
                    </div>
                    {entry.suggestedByUser && (
                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-amber-50/80 border border-amber-200/90 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-amber-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <span>💡</span> Suggested By
                            </span>
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                                {entry.suggestedByUser.profilePictureUrl ? (
                                    <img src={entry.suggestedByUser.profilePictureUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#ffb700] text-white font-black text-[9px] flex items-center justify-center shrink-0">
                                        {entry.suggestedByUser.displayName?.[0] || entry.suggestedByUser.username[0]}
                                    </div>
                                )}
                                <span className="text-[#2D2926] text-xs font-black truncate">@{entry.suggestedByUser.username}</span>
                            </div>
                        </div>
                    )}
                    {entry.watchLocation && (
                        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Watch Location</span>
                            <span className="text-[#ffb700] text-sm font-black mt-1 tracking-wide flex items-center gap-1.5 min-w-0">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                <span className="text-[#2D2926] truncate">{entry.watchLocation}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Where to Watch */}
                {details?.watch_providers && Object.keys(details.watch_providers).length > 0 && (
                    <div className="flex flex-col gap-4 bg-white p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb700]/40 via-[#ffb700] to-[#ffb700]/40 opacity-80"></div>
                        <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em]">Where to Watch (India)</h3>
                        <div className="flex flex-col gap-3">
                            {details.watch_providers['IN']?.flatrate && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Stream:</span>
                                    {details.watch_providers['IN'].flatrate.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, entry.title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.rent && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Rent:</span>
                                    {details.watch_providers['IN'].rent.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, entry.title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.buy && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Buy:</span>
                                    {details.watch_providers['IN'].buy.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, entry.title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.link && (
                                <a href={details.watch_providers['IN'].link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#ffb700] hover:underline mt-1 inline-block tracking-wide uppercase">
                                    View more providers on TMDB ↗
                                </a>
                            )}
                            {(!details.watch_providers['IN']?.flatrate && !details.watch_providers['IN']?.rent && !details.watch_providers['IN']?.buy) && (
                                <span className="text-sm text-[#2D2926]/60 italic mt-1">No India availability data found.</span>
                            )}
                        </div>
                    </div>
                )}

                {/* User's Review */}
                {entry.review && (
                    <div className="flex flex-col gap-4 bg-[#ffb700]/5 p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden">
                        <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                            Your Review
                        </h3>
                        <p className="text-[#2D2926] text-[16px] md:text-lg leading-relaxed font-serif tracking-wide italic whitespace-pre-wrap">
                            "{entry.review}"
                        </p>
                    </div>
                )}

                {/* Director's Cut Notes placeholder */}
                <div className="flex flex-col gap-4 bg-white p-8 md:p-10 rounded-3xl border border-[#ffb700]/20 shadow-sm mt-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb700]/40 via-[#ffb700] to-[#ffb700]/40 opacity-80"></div>
                    <h3 className="text-[#2D2926]/50 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-between">
                        Director's Cut Notes
                        <span className="material-symbols-outlined text-[16px] text-[#ffb700] transition-colors cursor-pointer opacity-70 hover:opacity-100">edit</span>
                    </h3>
                    <p className="text-[#2D2926] text-[15px] leading-[2.2] italic font-serif opacity-80">
                        "A masterclass in tension and release. The pacing in the second act deliberately subverts expectations, grounding the narrative in a stark, uncomfortable reality. The aesthetic is perfectly complemented by the fluid camerawork, creating a spatial motion that feels almost hypnotic. Truly a definitive work of its era."
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExpandedCard;
