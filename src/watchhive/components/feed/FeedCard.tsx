import React, { useState } from 'react';
import { FeedItem } from '../../services/feed.service';
import { useTmdbDetails } from '../../hooks/useTmdbDetails';
import { Link } from 'react-router-dom';
import { Avatar, WatchlistButton, MovieDetailsModal } from '../common';
import { interactionService } from '../../services/interaction.service';
import { CommentsModal } from '../comments/CommentsModal';
import whLogo from '../../assets/images/watchhive-logo.png';
import './Feed.css';

interface FeedCardProps {
    item: FeedItem;
}

const TMDB_POSTER_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_IMG = 'https://image.tmdb.org/t/p/w780';

export const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
    const isSuggestion = item.type === 'SUGGESTION';
    const entryData = isSuggestion ? null : item.data;
    const targetTmdbId = isSuggestion ? item.data.id : entryData?.tmdbId;

    // State for interactions
    const [isLiked, setIsLiked] = useState<boolean>(entryData?.isLiked || false);
    const [likeCount, setLikeCount] = useState<number>(entryData?._count?.likes || 0);
    const [commentCount, setCommentCount] = useState<number>(entryData?._count?.comments || 0);
    const [showComments, setShowComments] = useState<boolean>(false);
    const [showMovieDetailsModal, setShowMovieDetailsModal] = useState<boolean>(false);
    const [showShareFeedback, setShowShareFeedback] = useState<boolean>(false);
    const [isCommented, setIsCommented] = useState<boolean>(entryData?.isCommented || false);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

    // Only fetch details if it's an ENTRY (suggestions come with poster_path usually), OR if the user expands the card
    const shouldFetchDetails = !isSuggestion || showMovieDetailsModal;
    const fetchTmdbId = shouldFetchDetails ? targetTmdbId : null;
    const mediaTypeFallback = (item.data as any)?.media_type?.toUpperCase() === 'TV' ? 'TV_SHOW' : 'MOVIE';
    const normMediaType = (() => {
        const rawType = entryData?.type || mediaTypeFallback;
        if (!rawType) return 'movie';
        const clean = rawType.toLowerCase();
        if (clean.includes('tv')) return 'tv';
        return 'movie';
    })() as 'movie' | 'tv';
    const { details } = useTmdbDetails(fetchTmdbId as number, entryData?.type || mediaTypeFallback);

    const title = isSuggestion ? (item.data.title || item.data.name) : entryData.title;

    // Choose cinematic landscape backdrop if available; otherwise fallback to poster
    const backdropPathRaw = isSuggestion ? item.data.backdrop_path : details?.backdrop_path;
    const posterPathRaw = isSuggestion ? item.data.poster_path : details?.poster_path;

    const posterUrl = backdropPathRaw
        ? `${TMDB_BACKDROP_IMG}${backdropPathRaw}`
        : (posterPathRaw ? `${TMDB_POSTER_IMG}${posterPathRaw}` : null);

    const username = isSuggestion ? 'WatchHive Suggestion' : (entryData?.user?.username || 'User');
    const displayName = isSuggestion ? (item.reason || 'Trending Now') : (entryData?.user?.displayName || username);
    const userId = !isSuggestion ? entryData?.user?.id : null;

    // Support both profilePictureUrl and avatarUrl (defensive)
    const userAvatar = entryData?.user?.profilePictureUrl || entryData?.user?.avatarUrl;

    const avatarUrl = isSuggestion
        ? null // Suggestions don't have user avatars
        : (userAvatar || undefined);

    const rating = isSuggestion ? item.data.vote_average : entryData?.rating;
    const review = !isSuggestion ? entryData?.review : (item.data.overview ? item.data.overview.slice(0, 150) + '...' : '');

    // Format timestamp cleanly: "Mar 20, 2026 at 2:30 PM"
    const displayTimestamp = item.timestamp || entryData?.updatedAt || entryData?.createdAt;
    const timestamp = !isSuggestion && displayTimestamp
        ? new Date(displayTimestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }).replace(',', ' at')
        : 'Just Now';

    const handleLike = async () => {
        if (isSuggestion || !entryData) return;

        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = likeCount;

        setIsLiked(!previousLiked);
        setLikeCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);

        try {
            if (previousLiked) {
                await interactionService.unlikeEntry(entryData.id);
            } else {
                await interactionService.likeEntry(entryData.id);
            }
        } catch (error) {
            console.error('Failed to toggle like', error);
            // Revert
            setIsLiked(previousLiked);
            setLikeCount(previousCount);
        }
    };

    const handleShare = async () => {
        const shareTitle = 'WatchHive';
        const shareText = isSuggestion
            ? `Check out this recommendation for "${title}" on WatchHive! ✨`
            : `Check out ${displayName}'s ${actionText} for "${title}" on WatchHive! ✨`;

        // Use user's profile as the target link if it's an entry
        const shareUrl = userId
            ? `${window.location.origin}/watch-hive/profile/${userId}`
            : window.location.origin;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setShowShareFeedback(true);
                setTimeout(() => setShowShareFeedback(false), 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    const actionText = (() => {
        if (isSuggestion) return 'recommends';
        if (!entryData) return 'just watched';
        
        if (entryData.isWatching) {
            return 'started watching';
        }
        
        if (entryData.startedAt) {
            return 'completed watching';
        }
        
        return entryData.review ? 'reviewed' : 'just watched';
    })();

    const releaseYear = (details?.release_date || details?.first_air_date || '').substring(0, 4);
    const runtime = details?.runtime || (details?.episode_run_time && details.episode_run_time[0]);
    const genreText = details?.genres?.map((g: any) => g.name).slice(0, 2).join(', ');

    const metaItems = [];
    if (releaseYear) metaItems.push(releaseYear);
    if (genreText) metaItems.push(genreText);
    if (runtime) metaItems.push(`${runtime}m`);
    const metadataString = metaItems.join(' • ');

    return (
        <>
            <div className={`feed-card glass group ${isSuggestion ? 'feed-card--suggestion' : ''}`}>
                {/* Suggestion Badge (Optional: if we want to keep it explicitly visual outside the text) */}
                {isSuggestion && (
                    <div className="absolute -top-3 left-6 bg-primary text-background-dark text-xs font-bold px-3 py-1 rounded-full border border-primary/20 shadow-sm z-10">
                        ✨ Recommended for You
                    </div>
                )}

                {/* Header: Avatar, Name & Action */}
                <div className="feed-card-header">
                    <div className="feed-card-avatar-wrapper ring-2 ring-primary ring-offset-4 ring-offset-background-dark">
                        <Link to={userId ? `/watch-hive/profile/${userId}` : '#'}>
                            <Avatar
                                src={isSuggestion ? whLogo : avatarUrl}
                                name={isSuggestion ? 'WatchHive' : username}
                                size="md"
                                showBorder={false}
                            />
                        </Link>
                    </div>

                    <div className="feed-card-header-info flex-1 min-w-0 pr-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between w-full gap-2">
                            <div className="flex flex-col min-w-[0] pr-2">
                                <p className="feed-card-header-text">
                                    {isSuggestion ? (
                                        <span className="font-bold text-[#2D2926]">{displayName}</span>
                                    ) : (
                                        <Link to={`/watch-hive/profile/${userId}`} className="font-bold text-[#2D2926] hover:text-[#ffb700] transition-colors">
                                            {displayName}
                                        </Link>
                                    )}
                                    {' '}
                                    <span className="text-[#2D2926]/70 font-medium">{actionText}</span>
                                    {' '}
                                    <button 
                                        type="button"
                                        onClick={() => setShowMovieDetailsModal(true)}
                                        className="font-extrabold text-[#2D2926] hover:text-[#ffb700] hover:underline transition-colors bg-transparent border-none p-0 inline align-baseline text-left cursor-pointer font-display"
                                    >
                                        {title}
                                    </button>
                                </p>
                                {metadataString && (
                                    <p className="text-xs text-[#2D2926]/50 mt-0.5 font-semibold">
                                        {metadataString}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content: Poster Image */}
                {posterUrl && (
                    <div className="feed-card-poster-container cursor-pointer" onClick={() => setShowMovieDetailsModal(true)}>
                        <div className="feed-card-poster-gradient"></div>
                        <img
                            src={posterUrl}
                            alt={title}
                            className={`feed-card-poster-img transition-opacity duration-700 ease-in-out ${isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                            loading="lazy"
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => setIsImageLoading(false)}
                        />
                        {isImageLoading && (
                            <div className="absolute inset-0 skeleton" style={{ zIndex: 0, borderBottomLeftRadius: '0', borderBottomRightRadius: '0' }} />
                        )}
                        <div className="feed-card-poster-badges">
                            <div className="flex flex-col gap-2">
                                {rating && (
                                    <div className="feed-card-rating">
                                        <span className="material-symbols-outlined text-primary text-xl">grade</span>
                                        <span className="font-bold text-white text-lg">{Number(rating).toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Tags (if any exist) */}
                            {!isSuggestion && entryData?.tags && entryData.tags.length > 0 && (
                                <div className="feed-card-tags">
                                    {entryData.tags.slice(0, 2).map((tag: string, i: number) => (
                                        <span key={i} className="feed-card-tag">#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Refined Timestamp Placement: Right-aligned below the image */}
                {!isSuggestion && (
                    <div className="feed-card-timestamp-footer">
                        <span className="material-symbols-outlined text-[12px] opacity-40">
                            {entryData?.isWatching ? 'play_arrow' : (entryData?.startedAt ? 'check_circle' : 'schedule')}
                        </span>
                        <span className="timestamp-label">
                            {entryData?.isWatching ? 'Started' : (entryData?.startedAt ? 'Completed' : 'Seen')}
                        </span>
                        <span className="timestamp-value">{timestamp}</span>
                    </div>
                )}

                {/* Review / MindLens Insight Section */}
                {review && (
                    <div className="feed-card-insight-box">
                        <span className="material-symbols-outlined text-primary text-xl mt-0.5">psychology</span>
                        <div>
                            <p className="insight-title">
                                {isSuggestion ? 'Why you might like this' : (entryData?.review ? 'Review' : 'MindLens Insight')}
                            </p>
                            <p className="insight-text">"{review}"</p>
                        </div>
                    </div>
                )}



                {/* Actions Bar */}
                <div className="feed-card-actions-bar">
                    <div className="flex gap-6">
                        {!isSuggestion && (
                            <>
                                <button
                                    className={`action-btn ${isLiked ? 'action-btn--liked' : ''}`}
                                    onClick={handleLike}
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'filled' : ''}`}>favorite</span>
                                    <span className="text-sm font-medium">{likeCount}</span>
                                </button>
                                <button
                                    className={`action-btn ${isCommented ? 'action-btn--commented' : ''}`}
                                    onClick={() => setShowComments(true)}
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${isCommented ? 'filled' : ''}`}>chat_bubble</span>
                                    <span className="text-sm font-medium">{commentCount}</span>
                                </button>
                            </>
                        )}
                        {isSuggestion && (
                            <button className="action-btn">
                                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                                <span className="text-sm font-medium">Show more like this</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            className={`icon-only-btn transition-all ${showShareFeedback ? 'text-green-500' : ''}`}
                            title={showShareFeedback ? "Link Copied!" : "Share activity"}
                            onClick={handleShare}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showShareFeedback ? 'check_circle' : 'share'}
                            </span>
                        </button>
                        {!item.data?.isWatched && targetTmdbId && (
                            <div className="flex items-center gap-2">
                                <WatchlistButton tmdbId={targetTmdbId} variant="icon" className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/40 hover:text-[#ffb700] flex items-center justify-center shadow-sm text-[20px]" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Modal */}
            {!isSuggestion && entryData && (
                <CommentsModal
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    entryId={entryData.id}
                    onCommentAdded={() => {
                        setCommentCount(prev => prev + 1);
                        setIsCommented(true);
                    }}
                />
            )}

            {showMovieDetailsModal && targetTmdbId && (
                <MovieDetailsModal
                    isOpen={showMovieDetailsModal}
                    onClose={() => setShowMovieDetailsModal(false)}
                    tmdbId={targetTmdbId}
                    mediaType={normMediaType}
                />
            )}
        </>
    );
};
