import React from 'react';
import { Link } from 'react-router-dom';

export interface InspectionItem {
    id: string;
    title: string;
    type: string;
    rating?: string;
    watchedAt?: string;
    tmdbId?: number;
    posterPath?: string;
}

interface DailyLogInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateStr: string | null;
    count: number;
    items: InspectionItem[];
}

export const DailyLogInspectorModal: React.FC<DailyLogInspectorModalProps> = ({
    isOpen,
    onClose,
    dateStr,
    count,
    items,
}) => {
    if (!isOpen || !dateStr) return null;

    const formattedDate = new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/50 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]"
            onClick={onClose}
        >
            <div
                className="bg-[#FFF9F0] w-full max-w-lg max-h-[85vh] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-[#ffb700]/20 animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#ffb700]/15 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] border border-[#ffb700]/20">
                            <span className="material-symbols-outlined text-xl">calendar_today</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#2D2926] tracking-tight line-clamp-1">
                                {formattedDate}
                            </h3>
                            <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest">
                                {count} {count === 1 ? 'Watch Logged' : 'Watches Logged'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#ffb700]/10 text-[#ffb700] hover:bg-[#ffb700]/20 hover:text-[#2D2926] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl font-bold">close</span>
                    </button>
                </div>

                {/* Items Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FFF9F0]/60 no-scrollbar">
                    {items.length === 0 ? (
                        <div className="py-12 text-center text-[#2D2926]/40 font-bold text-sm">
                            No detailed item metadata found for this day.
                        </div>
                    ) : (
                        items.map((item, idx) => {
                            const isMovie = item.type === 'MOVIE' || item.type === 'movie';
                            const watchTime = item.watchedAt
                                ? new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : null;

                            return (
                                <div
                                    key={item.id || idx}
                                    className="bg-white rounded-2xl p-4 border border-[#ffb700]/15 shadow-sm hover:shadow-md hover:border-[#ffb700]/40 transition-all flex items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        {/* Number Badge or Media Icon */}
                                        <div className="w-10 h-10 rounded-xl bg-[#FFF9F0] border border-[#ffb700]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-[#ffb700] text-xl">
                                                {isMovie ? 'movie' : 'tv'}
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex flex-col">
                                            <span className="text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                {item.title}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ffb700]/10 text-[#ffb700]">
                                                    {isMovie ? 'Movie' : 'TV Show'}
                                                </span>

                                                {watchTime && (
                                                    <span className="text-[10px] font-bold text-[#2D2926]/50 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px] text-[#ffb700]">
                                                            schedule
                                                        </span>
                                                        {watchTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side Rating & View Link */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {item.rating && (
                                            <div className="flex items-center gap-1 bg-[#FFF9F0] border border-[#ffb700]/20 px-2.5 py-1 rounded-xl">
                                                <span className="text-amber-500 text-xs">★</span>
                                                <span className="text-xs font-black text-[#2D2926]">{item.rating}</span>
                                            </div>
                                        )}

                                        {item.tmdbId ? (
                                            <Link
                                                to={`/watch-hive/movie/${item.tmdbId}`}
                                                onClick={onClose}
                                                className="px-3.5 py-1.5 rounded-xl bg-[#ffb700] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#2D2926] transition-colors shadow-xs"
                                            >
                                                View
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/watch-hive/entries"
                                                onClick={onClose}
                                                className="px-3 py-1.5 rounded-xl bg-[#FFF9F0] border border-[#ffb700]/30 text-[#ffb700] text-[11px] font-black hover:bg-[#ffb700] hover:text-white transition-colors"
                                            >
                                                Details
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#ffb700]/15 bg-white flex justify-between items-center text-[11px] font-black text-[#2D2926]/40 uppercase tracking-widest">
                    <span>WatchHive Inspection Log</span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#2D2926] text-white text-[10px] uppercase font-black tracking-widest hover:bg-[#ffb700] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default DailyLogInspectorModal;
