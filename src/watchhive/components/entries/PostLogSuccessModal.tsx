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
    watchBuddies?: Array<{ username?: string; displayName?: string; profilePictureUrl?: string | null }> | string[] | null;
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
    watchBuddies,
    user,
}) => {
    const [copied, setCopied] = useState(false);
    const [copyNotice, setCopyNotice] = useState<string | null>(null);
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

    const shareUrl = tmdbId
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://watchershive.com'}/watch-hive/details/${cleanMediaType}/${tmdbId}?source=story${user?.username ? `&ref=${encodeURIComponent(user.username)}` : ''}`
        : (typeof window !== 'undefined' ? window.location.origin : 'https://watchershive.com');

    const buddiesNames = Array.isArray(watchBuddies)
        ? watchBuddies.map(b => (typeof b === 'string' ? b : (b?.displayName || b?.username || '')).trim()).filter(Boolean)
        : [];
    const hasBuddies = buddiesNames.length > 0;
    const watchersText = isWatching
        ? (user?.username ? `Watching now: ${user.displayName || user.username}${hasBuddies ? ` with ${buddiesNames.join(', ')}` : ''}` : 'Currently Watching')
        : (user?.username ? `Logged by ${user.displayName || user.username}${hasBuddies ? ` with ${buddiesNames.join(', ')}` : ''}` : 'Logged to Hive');

    const handleShare = async () => {
        const success = await shareCompletedWatch({
            title: displayTitle,
            rating: isWatching ? null : rating,
            review: isWatching ? null : review,
            tmdbId,
            mediaType: cleanMediaType,
            username: user?.username || undefined,
            isWatching,
            watchBuddies,
        });
        if (success) {
            setCopied(true);
            setCopyNotice('Link copied! In Instagram, tap Sticker 🔗 -> LINK to paste.');
            setTimeout(() => {
                setCopied(false);
                setCopyNotice(null);
            }, 3500);
        }
    };

    const handleCopyDirectLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyNotice('Link copied to clipboard! 📋');
            setTimeout(() => setCopyNotice(null), 2500);
        } catch {
            // fallback
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[4000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm sm:max-w-md bg-[#FFF9F0] rounded-3xl shadow-2xl border-2 border-[#FFB700]/30 overflow-hidden flex flex-col max-h-[94vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Badge & Close */}
                <div className="flex items-center justify-between px-5 pt-4 pb-1">
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
                <div className="px-5 pb-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#262626] leading-tight">
                        {isWatching
                            ? `"${displayTitle}" added to Currently Watching!`
                            : `"${displayTitle}" successfully logged to your Hive!`}
                    </h3>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                        Here is your cinematic story poster — share it on Instagram Stories or suggest to friends!
                    </p>
                </div>

                {/* Toast Notification Alert when Link is copied */}
                {copyNotice && (
                    <div className="mx-5 mb-2 px-3 py-1.5 rounded-xl bg-[#FFB700] text-[#262626] text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
                        <span>🔗</span>
                        <span className="flex-1">{copyNotice}</span>
                    </div>
                )}

                {/* Scrollable Center: The 9:16 Instagram Story Preview */}
                <div className="px-4 sm:px-5 overflow-y-auto flex-1 pb-3">
                    <div
                        id="story-card-preview"
                        className="relative w-full aspect-[9/15] sm:aspect-[9/15.5] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#FFB700]/50 bg-[#FFF9F0] flex flex-col justify-between p-3.5 sm:p-4 text-[#262626] select-none"
                    >
                        {/* Ambient Warm Honey Background Orbs */}
                        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#FFB700]/20 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#FFDA40]/20 blur-2xl pointer-events-none" />

                        {/* 1. Top Section: Elevated Brand Capsule + Watchers Activity */}
                        <div className="relative z-10 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-white/95 border border-[#FFB700]/45 shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-md bg-[#FFB700] flex items-center justify-center font-black text-[#262626] text-xs shadow-xs">
                                        🐝
                                    </div>
                                    <span className="text-xs font-black tracking-tight text-[#262626]">
                                        Watchers<span className="text-[#E59700]">Hive</span>
                                    </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-[#FFF3D6] text-[#995700] border border-[#E59700]/50">
                                    {isWatching ? '📺 WATCHING' : '🍿 JUST WATCHED'}
                                </span>
                            </div>

                            {/* Watchers & User Activity Attribution */}
                            <div className="flex items-center justify-center gap-1.5 text-center px-1">
                                <Avatar
                                    src={user?.profilePictureUrl || null}
                                    name={user?.displayName || user?.username || 'User'}
                                    className="w-4 h-4 rounded-full border border-[#FFB700] object-cover"
                                />
                                <span className="text-[10px] sm:text-[11px] font-bold text-[#525252] truncate">
                                    {watchersText}
                                </span>
                            </div>
                        </div>

                        {/* 2. Hero Movie Showcase: Bigger Banner of Movie + Overlapping Good-Length Poster + Title */}
                        <div className="relative z-10 flex flex-col items-center my-auto py-1">
                            {/* Cinematic Showcase Container */}
                            <div className="relative w-full">
                                {/* Bigger Banner of the Movie */}
                                <div className="w-full h-28 sm:h-32 rounded-2xl overflow-hidden border border-[#FFB700]/50 shadow-md relative bg-[#23201D]">
                                    {backdropUrl ? (
                                        <img
                                            src={backdropUrl}
                                            alt={displayTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2D2926] to-[#1B1917] text-3xl">
                                            🎬
                                        </div>
                                    )}
                                    {/* Gradient Scrim */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                                    {/* Media Type & Year Badge */}
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 border border-white/25 text-[9px] font-extrabold text-white tracking-wider">
                                        {isTv ? 'SERIES' : 'MOVIE'} {releaseYear ? `• ${releaseYear}` : ''}
                                    </div>
                                </div>

                                {/* Good-Length Poster (Overlapping the banner at bottom-left) */}
                                <div className="absolute -bottom-7 left-3 w-16 h-24 sm:w-18 sm:h-27 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-white">
                                    {posterUrl ? (
                                        <img
                                            src={posterUrl}
                                            alt={displayTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-amber-50 text-xl">
                                            🎬
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Spacing for poster overlap */}
                            <div className="h-8" />

                            {/* Movie Title */}
                            <h4 className="text-base sm:text-lg font-black text-[#262626] leading-snug px-2 text-center line-clamp-2 mt-0.5">
                                {displayTitle}
                            </h4>

                            {/* 3. Review & Ratings in the Bottom */}
                            {hasRating && (
                                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3D6] border border-[#FFB700] text-[#262626] font-black text-[11px] shadow-xs">
                                    <span className="text-[#FFB700]">★</span>
                                    <span>{Number(rating).toFixed(1)} / 10</span>
                                </div>
                            )}

                            {hasReview && (
                                <div className="mt-2 mx-1 p-2 rounded-xl bg-white/95 border border-[#FFB700]/30 shadow-xs flex items-start gap-1.5 text-left">
                                    <span className="text-sm font-serif text-[#FFB700] leading-none">“</span>
                                    <p className="text-[10px] sm:text-[10.5px] italic text-[#262626] line-clamp-2 leading-tight">
                                        {review.trim()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 4. Bottom Link & QR Card */}
                        <div className="relative z-10 p-2 sm:p-2.5 rounded-2xl bg-white border border-[#FFB700]/50 shadow-sm flex items-center gap-2.5">
                            {/* QR Code */}
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-[#FFB700]/40 overflow-hidden bg-white p-0.5 shrink-0 flex items-center justify-center">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(shareUrl)}`}
                                    alt="QR"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Text & Action */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black text-[#262626] truncate">
                                        {isWatching ? 'Join on WatchersHive' : 'View on WatchersHive'}
                                    </span>
                                </div>
                                <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFB700] text-[#262626] text-[9.5px] font-black self-start">
                                    <span>watchershive.com</span>
                                    <span>→</span>
                                </div>
                                <span className="text-[8px] font-semibold text-[#737373] truncate mt-0.5">
                                    Tap Link sticker or scan QR to view on WatchersHive
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="px-5 pb-4 pt-1 flex flex-col gap-2 bg-[#FFF9F0]">
                    {/* Share to Instagram Story */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FFB700] hover:bg-[#E59700] text-[#262626] font-black text-sm shadow-md transition-all active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{copied ? 'Link Copied! Opening Story Share... 🎉' : 'Share to Instagram Story'}</span>
                    </button>

                    {/* Copy Direct Link */}
                    <button
                        type="button"
                        onClick={handleCopyDirectLink}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#FFF3E0] text-[#262626] font-bold text-xs border border-[#FFB700]/60 shadow-xs transition-all"
                    >
                        <span>🔗</span>
                        <span>Copy Story Link</span>
                    </button>

                    {/* Suggest to Friend */}
                    {tmdbId && (
                        <button
                            type="button"
                            onClick={() => setIsSuggestModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-[#FFF3E0] text-[#262626] font-bold text-xs border border-[#FFB700]/60 shadow-xs transition-all"
                        >
                            <svg className="w-3.5 h-3.5 text-[#E59700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Suggest to a Friend</span>
                        </button>
                    )}

                    {/* Done / Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-1 text-center text-xs font-bold text-[#737373] hover:text-[#262626] transition-colors"
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
