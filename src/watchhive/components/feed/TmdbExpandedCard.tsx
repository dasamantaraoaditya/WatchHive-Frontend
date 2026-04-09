import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WatchlistButton } from '../common/WatchlistButton';

export interface TmdbExpandedCardProps {
    tmdbId: number;
    mediaType: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    details: any;        // full TMDB data incl. watch_providers (may be null while loading)
    fallbackData?: any; // basic data for instant render (from feed suggestion raw data)
    title: string;
    onClose: () => void;
    isWatched?: boolean;
}

const getDirectLink = (providerName: string, fallbackLink: string, title: string) => {
    if (!providerName) return fallbackLink;
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

export const TmdbExpandedCard: React.FC<TmdbExpandedCardProps> = ({ tmdbId, mediaType, details, fallbackData, title, onClose, isWatched }) => {
    // Merge: prefer full `details` but fall back to `fallbackData` for basic fields
    const d = details || fallbackData;
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

    const posterUrl = d?.poster_path
        ? `https://image.tmdb.org/t/p/original${d.poster_path}`
        : null;

    const backdropUrl = d?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${d.backdrop_path}`
        : posterUrl;

    const year = d?.release_date?.slice(0, 4) || d?.first_air_date?.slice(0, 4);
    const runtime = d?.runtime ? `${d.runtime}m` : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : null);
    
    // Support either an array of strings (from our frontend types sometimes) or objects (from TMDB)
    const primaryGenre = d?.genres?.[0]?.name || d?.genres?.[0];

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        // Handle hardware back button equivalent
        history.pushState({ expandedCard: true }, '');
        const handlePopState = () => {
            onClose();
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
            exit={{ opacity: 0, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
            onScroll={handleScroll}
            className="fixed inset-y-0 right-0 left-0 md:left-[256px] z-[100] flex flex-col bg-[#FFF9F0] overflow-y-auto no-scrollbar font-display"
        >
            <div
                className={`sticky top-4 md:top-6 z-[110] flex justify-between items-start px-4 md:px-6 pointer-events-none w-full max-w-full transition-all duration-300 ease-in-out ${isNavVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => history.back()}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-[#ffb700] hover:bg-white/30 transition-all pointer-events-auto"
                    title="Back"
                >
                    <span className="material-symbols-outlined text-[26px] ml-1">arrow_back_ios</span>
                </motion.button>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {isWatched ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffb700] text-white font-bold text-sm shadow-md whitespace-nowrap">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Watched
                        </div>
                    ) : (
                        <WatchlistButton 
                            tmdbId={tmdbId} 
                            mediaType={mediaType === 'TV_SHOW' ? 'tv' : 'movie'} 
                            className="shadow-md"
                        />
                    )}
                </div>
            </div>

            <motion.div layoutId={`feed-poster-${tmdbId}`} className="relative w-full h-[60vh] md:h-[70vh] shrink-0 bg-[#FFF9F0] -mt-[56px] md:-mt-[64px]">
                <picture>
                    {backdropUrl && <source media="(min-width: 768px)" srcSet={backdropUrl} />}
                    {posterUrl && (
                        <img
                            src={posterUrl}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
                        />
                    )}
                </picture>

                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                <motion.div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-3">
                    <h1 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight drop-shadow-sm leading-tight">
                        {title}
                    </h1>
                    <div className="flex items-center gap-4 text-[#2D2926]/70 font-bold text-xs md:text-sm uppercase tracking-[0.2em]">
                        {primaryGenre && <span>{primaryGenre}</span>}
                        {primaryGenre && year && <span className="opacity-40">•</span>}
                        {year && <span>{year}</span>}
                        {year && runtime && <span className="opacity-40">•</span>}
                        {runtime && <span>{runtime}</span>}
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="px-6 md:px-10 pb-24 pt-4 flex flex-col gap-10 w-full relative z-10"
            >
                <div className="flex flex-col gap-4">
                    <h3 className="text-[#ffb700] text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#ffb700]"></span>
                        Synopsis
                    </h3>
                    <p className="text-[#2D2926]/80 text-lg md:text-xl leading-relaxed font-serif tracking-wide">
                        {d?.overview || 'No synopsis available.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">Released</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{year || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-5 rounded-3xl bg-white border border-[#ffb700]/20 shadow-sm">
                        <span className="text-[#2D2926]/50 text-[10px] font-bold uppercase tracking-widest">TMDB Score</span>
                        <span className="text-[#2D2926] text-sm font-bold mt-1 tracking-wide">{d?.vote_average ? `${d.vote_average.toFixed(1)} / 10` : '-'}</span>
                    </div>
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
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.rent && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Rent:</span>
                                    {details.watch_providers['IN'].rent.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-xl shadow-sm border border-[#2D2926]/5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            {details.watch_providers['IN']?.buy && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-[#2D2926]/60 w-16">Buy:</span>
                                    {details.watch_providers['IN'].buy.map((p: any) => (
                                        <a href={getDirectLink(p.provider_name, details.watch_providers['IN'].link, title)} target="_blank" rel="noopener noreferrer" key={p.provider_id} className="shrink-0 hover:scale-105 transition-transform duration-200" title={p.provider_name}>
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
            </motion.div>
        </motion.div>
    );
};
