import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { shareCompletedWatch } from '../../utils/shareHelper';
import { SuggestMovieModal } from '../suggestions/SuggestMovieModal';
import { Avatar } from '../common/Avatar';

export interface PostLogSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tmdbId?: number | null;
    mediaType?: string; // 'movie' or 'tv'
    posterPath?: string | null;
    backdropPath?: string | null;
    rating?: number | null;
    review?: string | null;
    isWatching?: boolean;
    releaseYear?: string | null;
    user?: {
        displayName?: string | null;
        username?: string | null;
        profilePictureUrl?: string | null;
    } | null;
}

export const PostLogSuccessModal: React.FC<PostLogSuccessModalProps> = ({
    isOpen,
    onClose,
    title,
    tmdbId,
    mediaType = 'movie',
    posterPath,
    backdropPath,
    rating,
    review,
    isWatching = false,
    releaseYear,
    user,
}) => {
    const [copied, setCopied] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

    if (!isOpen) return null;

    const displayTitle = (title && title !== 'undefined' && title.trim()) ? title.trim() : 'Movie';
    const cleanMediaType = mediaType?.toLowerCase() === 'tv' ? 'tv' : 'movie';
    const isTv = cleanMediaType === 'tv';
    const hasRating = !isWatching && rating != null && Number(rating) > 0;
    const hasReview = !isWatching && review != null && review.trim().length > 0;

    const posterUrl = posterPath
        ? `https://image.tmdb.org/t/p/w500${posterPath}`
        : null;
    const backdropUrl = backdropPath || posterPath
        ? `https://image.tmdb.org/t/p/w780${backdropPath || posterPath}`
        : null;

    const handleShare = async () => {
        const success = await shareCompletedWatch({
            title: displayTitle,
            rating: isWatching ? null : rating,
            review: isWatching ? null : review,
            tmdbId,
            mediaType: cleanMediaType,
            username: user?.username || undefined,
            isWatching,
        });
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div
                className="relative w-full max-w-md bg-[#FFF9F0] rounded-3xl shadow-2xl border-2 border-[#FFB700]/30 overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Badge & Close */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB700] text-[#262626] font-black text-xs tracking-wide uppercase shadow-sm">
                        {isWatching ? '🍿 NOW WATCHING' : '🏆 WATCH LOGGED'}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-[#737373] hover:text-[#262626] hover:bg-black/5 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Subtitle / confirmation heading */}
                <div className="px-5 pb-3">
                    <h3 className="text-base font-extrabold text-[#262626] leading-tight">
                        {isWatching
                            ? `"${displayTitle}" added to Currently Watching!`
                            : `"${displayTitle}" successfully logged to your Hive!`}
                    </h3>
                    <p className="text-xs text-[#737373] mt-0.5">
                        {isWatching
                            ? 'Share your current watch with friends or invite them to watch along.'
                            : 'Here is your cinematic story poster — share it or suggest it to friends!'}
                    </p>
                </div>

                {/* Scrollable Center: The Sharing Poster Preview */}
                <div className="px-5 overflow-y-auto flex-1 pb-4">
                    <div className="relative w-full aspect-[9/14] rounded-2xl overflow-hidden shadow-xl border border-[#FFB700]/40 bg-[#141210] flex flex-col justify-between p-4 text-white select-none">
                        {/* Background Backdrop Art with Scrim */}
                        {backdropUrl && (
                            <img
                                src={backdropUrl}
                                alt={displayTitle}
                                className="absolute inset-0 w-full h-full object-cover filter blur-[2px] scale-105 opacity-35"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/60 to-[#141210]/80" />

                        {/* Story Card Top Header */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-[#FFB700] flex items-center justify-center font-black text-[#262626] text-xs shadow-md">
                                    🐝
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#FFDA40]">
                                    WATCHERSHIVE
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/10 text-white/90 backdrop-blur-sm border border-white/10">
                                {isWatching ? 'Currently Watching' : (isTv ? 'TV Series' : 'Film')}
                            </span>
                        </div>

                        {/* Center Poster Artwork & Info */}
                        <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={displayTitle}
                                    className="w-24 h-36 object-cover rounded-xl shadow-2xl border border-white/20 mb-3"
                                />
                            ) : (
                                <div className="w-24 h-36 rounded-xl bg-white/10 flex items-center justify-center text-3xl shadow-2xl border border-white/20 mb-3">
                                    🎬
                                </div>
                            )}

                            <h4 className="text-lg font-black text-white leading-tight px-2 drop-shadow-md line-clamp-2">
                                {displayTitle}
                            </h4>

                            {releaseYear && (
                                <span className="text-[11px] font-semibold text-white/70 mt-0.5">
                                    {releaseYear}
                                </span>
                            )}

                            {/* Honey Star Rating */}
                            {hasRating && (
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB700] text-[#262626] font-black text-xs shadow-md">
                                    <span>⭐</span>
                                    <span>{Number(rating).toFixed(1)} / 10</span>
                                </div>
                            )}

                            {/* Review Quote */}
                            {hasReview && (
                                <p className="mt-2 text-xs italic text-white/85 line-clamp-3 px-3 leading-relaxed drop-shadow">
                                    &ldquo;{review.trim()}&rdquo;
                                </p>
                            )}
                        </div>

                        {/* Card Footer: User & Branding */}
                        <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar
                                    src={user?.profilePictureUrl || null}
                                    name={user?.displayName || user?.username || 'User'}
                                    className="w-6 h-6 rounded-full border border-[#FFB700]"
                                />
                                <span className="text-[11px] font-bold text-white/90 truncate max-w-[120px]">
                                    @{user?.username || 'user'}
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-white/60 tracking-wider">
                                watchershive.com
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="px-5 pb-5 pt-1 flex flex-col gap-2 bg-[#FFF9F0]">
                    {/* Share Button */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FFB700] hover:bg-[#E59700] text-[#262626] font-black text-sm shadow-md transition-all active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{copied ? 'Copied to Clipboard! 🎉' : 'Share to Instagram Story'}</span>
                    </button>

                    {/* Suggest to Friend */}
                    {tmdbId && (
                        <button
                            type="button"
                            onClick={() => setIsSuggestModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#FFF3E0] text-[#262626] font-bold text-xs border border-[#FFB700]/60 shadow-sm transition-all"
                        >
                            <svg className="w-4 h-4 text-[#E59700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Suggest to a Friend</span>
                        </button>
                    )}

                    {/* Done / Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-center text-xs font-bold text-[#737373] hover:text-[#262626] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Nested Suggest Modal if triggered */}
            {isSuggestModalOpen && tmdbId && (
                <SuggestMovieModal
                    isOpen={isSuggestModalOpen}
                    initialMovie={{
                        id: tmdbId,
                        title: displayTitle,
                        name: displayTitle,
                        media_type: cleanMediaType,
                        poster_path: posterPath || null,
                    }}
                    onClose={() => setIsSuggestModalOpen(false)}
                    onSuccess={() => {
                        setIsSuggestModalOpen(false);
                    }}
                />
            )}
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default PostLogSuccessModal;
