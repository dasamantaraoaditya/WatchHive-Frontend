import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartSuggestItem } from '../../services/suggestions.service';
import { WatchlistButton } from '../common';

interface SmartSuggestCardProps {
    item: SmartSuggestItem;
    onLogWatch?: (item: SmartSuggestItem) => void;
}

export const SmartSuggestCard: React.FC<SmartSuggestCardProps> = ({ item, onLogWatch }) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(`/watch-hive/details/${item.mediaType}/${item.tmdbId}`, {
            state: { from: window.location.pathname + window.location.search }
        });
    };

    const year = item.releaseDate ? item.releaseDate.substring(0, 4) : null;

    const getBadgeIcon = (type: string) => {
        switch (type) {
            case 'friend_pick': return 'group';
            case 'network_buzz': return 'local_fire_department';
            case 'critical_acclaim': return 'verified';
            case 'palate_cleanser': return 'cached';
            case 'taste_match': return 'auto_awesome';
            default: return 'stars';
        }
    };

    return (
        <div className="group relative flex flex-col justify-between bg-white rounded-[24px] border border-black/5 p-4 shadow-sm hover:shadow-xl hover:border-[#ffb700]/30 transition-all duration-300">
            {/* Top Info & Poster */}
            <div>
                <div
                    onClick={handleNavigate}
                    className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer shadow-inner bg-slate-100 group-hover:scale-[1.01] transition-transform"
                >
                    <img
                        src={
                            item.posterPath
                                ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />

                    {/* Match Score Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-[#2D2926]/90 backdrop-blur-md text-[#ffb700] px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md border border-white/10">
                        <span className="material-symbols-outlined text-[13px]">bolt</span>
                        <span>{item.score}% Match</span>
                    </div>

                    {/* TMDb Rating */}
                    {item.voteAverage > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <span className="text-[#ffb700]">★</span>
                            <span>{item.voteAverage.toFixed(1)}</span>
                        </div>
                    )}

                    {/* Media Type Pill */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white/90 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {item.mediaType}
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-3.5 flex flex-col gap-1.5">
                    {/* Explainability Badges */}
                    {item.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {item.badges.slice(0, 2).map((badge, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF9F0] text-amber-900 border border-[#ffb700]/30"
                                    title={badge.meta || badge.label}
                                >
                                    <span className="material-symbols-outlined text-[12px] text-[#ffb700]">
                                        {getBadgeIcon(badge.type)}
                                    </span>
                                    <span className="truncate max-w-[150px]">{badge.label}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    <h4
                        onClick={handleNavigate}
                        className="text-base font-black text-[#2D2926] hover:text-[#ffb700] transition-colors cursor-pointer line-clamp-1"
                        title={item.title}
                    >
                        {item.title}
                    </h4>

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                        {year && <span>{year}</span>}
                        {year && item.genreNames.length > 0 && <span>•</span>}
                        {item.genreNames.length > 0 && (
                            <span className="truncate">{item.genreNames.slice(0, 2).join(', ')}</span>
                        )}
                    </div>

                    {/* Overview */}
                    {item.overview && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {item.overview}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                <div title="Save to Watchlist">
                    <WatchlistButton
                        tmdbId={item.tmdbId}
                        variant="icon"
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#ffb700]/20 text-[#2D2926] flex items-center justify-center transition-colors cursor-pointer text-[18px]"
                    />
                </div>

                <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {onLogWatch && (
                        <button
                            type="button"
                            onClick={() => onLogWatch(item)}
                            className="px-3 py-1.5 bg-[#FFF9F0] hover:bg-[#ffb700]/20 text-[#2D2926] rounded-xl font-black text-xs transition-colors flex items-center gap-1 cursor-pointer border border-[#ffb700]/30"
                            title="Log watch entry"
                        >
                            <span className="material-symbols-outlined text-[15px]">edit_note</span>
                            <span>Log</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleNavigate}
                        className="px-3 py-1.5 bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                        <span>View</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartSuggestCard;
