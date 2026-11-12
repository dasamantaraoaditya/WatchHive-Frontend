import React, { useState } from 'react';
import { FeedItem } from '../../services/feed.service';
import { useTmdbDetails } from '../../hooks/useTmdbDetails';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, WatchlistButton } from '../common';
import { Modal } from '../common/Modal';
import { EntryForm } from '../entries/EntryForm';
import { SuggestMovieModal } from '../suggestions/SuggestMovieModal';
import { useAuth } from '../../contexts/AuthContext';
import { interactionService } from '../../services/interaction.service';
import { CommentsModal } from '../comments/CommentsModal';
import { LikesModal } from './LikesModal';
import { shareCompletedWatch } from '../../utils/shareHelper';
import whLogo from '../../assets/images/watchhive-logo.png';
import './Feed.css';

interface FeedCardProps {
    item: FeedItem;
}

const TMDB_POSTER_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_IMG = 'https://image.tmdb.org/t/p/w780';

export const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isSuggestion = item.type === 'SUGGESTION';
    const entryData = isSuggestion ? null : item.data;
    const targetTmdbId = isSuggestion ? item.data.id : entryData?.tmdbId;

    // State for interactions
    const [isLiked, setIsLiked] = useState<boolean>(entryData?.isLiked || false);
    const [likeCount, setLikeCount] = useState<number>(entryData?._count?.likes || 0);
    const [commentCount, setCommentCount] = useState<number>(entryData?._count?.comments || 0);
    const [showLikes, setShowLikes] = useState<boolean>(false);
    const [showComments, setShowComments] = useState<boolean>(false);
    const [showShareFeedback, setShowShareFeedback] = useState<boolean>(false);
    const [isCommented, setIsCommented] = useState<boolean>(entryData?.isCommented || false);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
    const [showLogModal, setShowLogModal] = useState<boolean>(false);
    const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);

    const shouldFetchDetails = !isSuggestion;
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
    const rawTitle = isSuggestion ? (item.data.title || item.data.name) : entryData.title;
    const isGenericTitle = !rawTitle ||
        rawTitle.toLowerCase() === 'this title' ||
        rawTitle.toLowerCase() === 'untitled' ||
        rawTitle.toLowerCase().startsWith('movie #') ||
        rawTitle.toLowerCase().startsWith('media #');
    const title = (!isGenericTitle && rawTitle)
        ? rawTitle
        : (details?.name || details?.title || details?.original_name || details?.original_title || rawTitle || 'Untitled');

    // Choose cinematic landscape backdrop if available; otherwise fallback to poster
    const backdropPathRaw = isSuggestion ? item.data.backdrop_path : details?.backdrop_path;
    const posterPathRaw = isSuggestion ? item.data.poster_path : details?.poster_path;

    const posterUrl = backdropPathRaw
        ? `${TMDB_BACKDROP_IMG}${backdropPathRaw}`
        : (posterPathRaw ? `${TMDB_POSTER_IMG}${posterPathRaw}` : null);

    const username = isSuggestion ? 'WatchersHive' : (entryData?.user?.username || 'User');
    const displayName = isSuggestion ? 'WatchersHive' : (entryData?.user?.displayName || username);
    const userId = !isSuggestion ? (entryData?.user?.id || entryData?.userId) : null;

    // Support both profilePictureUrl and avatarUrl (defensive)
    const userAvatar = entryData?.user?.profilePictureUrl || entryData?.user?.avatarUrl;

    const avatarUrl = isSuggestion
        ? null // Suggestions don't have user avatars
        : (userAvatar || undefined);

    // Determine prefilled suggestor for quick log
    const isOwnPost = Boolean(currentUser?.id && userId === currentUser.id);
    const prefilledSuggestor = entryData?.suggestedByUser
        ? entryData.suggestedByUser
        : (!isOwnPost && userId && username ? {
            id: userId,
            username,
            displayName,
            profilePictureUrl: avatarUrl || null,
        } : null);
    const prefilledSuggestorId = prefilledSuggestor?.id || null;

    const rating = isSuggestion ? item.data.vote_average : entryData?.rating;
    const review = !isSuggestion ? entryData?.review : (item.data.overview ? item.data.overview.slice(0, 150) + '...' : '');

    // Format timestamp cleanly: "Mar 20, 2026 at 2:30 PM" or "Jan 1, 2025" for date-only, guarding against future skew
    const isCompletedWatching = !entryData?.isWatching && entryData?.completedAt && (entryData?.startedAt || (entryData?.createdAt && new Date(entryData.completedAt).getTime() - new Date(entryData.createdAt).getTime() > 2000));
    const displayTimestamp = entryData?.watchedAt || item.timestamp || (isCompletedWatching ? entryData?.completedAt : entryData?.createdAt);
    const timestamp = !isSuggestion && displayTimestamp
        ? (() => {
            const now = new Date();
            const rawDate = new Date(displayTimestamp);
            if (isNaN(rawDate.getTime())) return 'Just Now';
            const effectiveDate = rawDate.getTime() > now.getTime() ? now : rawDate;
            const isMidnight = effectiveDate.getHours() === 0 && effectiveDate.getMinutes() === 0;
            return isMidnight
                ? effectiveDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : effectiveDate.toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                }).replace(',', ' at');
        })()
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
        if (!isSuggestion && entryData && !entryData.isWatching) {
            const success = await shareCompletedWatch({
                title,
                rating: rating ? Number(rating) : null,
                review: review || null,
                tmdbId: targetTmdbId,
                mediaType: (item.data as any)?.type === 'TV_SHOW' ? 'tv' : 'movie',
                username: displayName || username,
            });
            if (success) {
                setShowShareFeedback(true);
                setTimeout(() => setShowShareFeedback(false), 2000);
            }
            return;
        }

        const shareTitle = 'WatchersHive';
        const shareText = isSuggestion
            ? `Check out this recommendation for "${title}" on WatchersHive! ✨`
            : `Check out ${displayName}'s ${actionText} for "${title}" on WatchersHive! ✨`;

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
        if (!entryData) return 'watched';

        if (entryData.isWatching) {
            return 'started watching';
        }

        if (entryData.startedAt) {
            return 'completed watching';
        }

        return entryData.review ? 'reviewed' : 'watched';
    })();

    const releaseYear = (details?.release_date || details?.first_air_date || (item.data as any)?.release_date || (item.data as any)?.first_air_date || '').substring(0, 4);
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
                {/* Suggestion Reason Badge */}
                {isSuggestion && (
                    <div className="absolute -top-3 left-6 bg-primary text-background-dark text-xs font-bold px-3 py-1 rounded-full border border-primary/20 shadow-sm z-10 flex items-center gap-1.5 max-w-[90%] truncate">
                        <span>✨</span>
                        <span className="truncate">{item.reason || 'Recommended for You'}</span>
                    </div>
                )}

                {/* Header: Avatar, Name & Action */}
                <div className="feed-card-header">
                    <div className="feed-card-avatar-wrapper ring-2 ring-primary ring-offset-4 ring-offset-background-dark">
                        <Link to={userId ? `/watch-hive/profile/${userId}` : '/watch-hive'}>
                            <Avatar
                                src={isSuggestion ? whLogo : avatarUrl}
                                name={isSuggestion ? 'WatchersHive' : username}
                                size="fluid"
                                showBorder={false}
                            />
                        </Link>
                    </div>

                    <div className="feed-card-header-info flex-1 min-w-0 pr-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between w-full gap-2">
                            <div className="flex flex-col min-w-[0] pr-2">
                                <p className="feed-card-header-text leading-snug">
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
                                        onClick={() => targetTmdbId && navigate(`/watch-hive/details/${normMediaType}/${targetTmdbId}`, { state: { from: window.location.pathname + window.location.search } })}
                                        className="font-extrabold text-[#2D2926] hover:text-[#ffb700] hover:underline transition-colors bg-transparent border-none p-0 inline align-baseline text-left cursor-pointer font-display"
                                    >
                                        {title}
                                    </button>
                                </p>

                                {entryData?.suggestedByUser && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#2D2926]/70 font-medium">
                                        <span className="text-[11px] font-medium text-[#2D2926]/60 shrink-0">Suggested by</span>
                                        <Link 
                                            to={`/watch-hive/profile/${entryData.suggestedByUser.id}`} 
                                            className="inline-flex items-center gap-1.5 font-bold text-[#2D2926] hover:text-[#ffb700] transition-colors truncate max-w-[200px]"
                                            onClick={(e) => e.stopPropagation()}
                                            title={`@${entryData.suggestedByUser.username}`}
                                        >
                                            <Avatar
                                                src={entryData.suggestedByUser.profilePictureUrl}
                                                name={entryData.suggestedByUser.displayName || entryData.suggestedByUser.username}
                                                size="xxs"
                                                showBorder={false}
                                            />
                                            <span className="truncate">
                                                @{entryData.suggestedByUser.username.length > 10 ? `${entryData.suggestedByUser.username.slice(0, 10)}...` : entryData.suggestedByUser.username}
                                            </span>
                                        </Link>
                                    </div>
                                )}

                                {metadataString && (
                                    <p className="text-xs text-[#2D2926]/50 mt-1 font-semibold">
                                        {metadataString}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content: Poster Image */}
                {posterUrl && (
                    <div className="feed-card-poster-container cursor-pointer" onClick={() => targetTmdbId && navigate(`/watch-hive/details/${normMediaType}/${targetTmdbId}`, { state: { from: window.location.pathname + window.location.search } })}>
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
                <div className="feed-card-actions-bar flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
                    <div className="flex gap-4 sm:gap-6 items-center">
                        {!isSuggestion && (
                            <>
                                <div className="flex items-center gap-1">
                                    <button
                                        className={`action-btn ${isLiked ? 'action-btn--liked text-[#ffb700]' : 'text-[#737373] hover:text-[#e59700]'}`}
                                        onClick={handleLike}
                                        title={isLiked ? 'Unlike' : 'Like'}
                                        aria-label={isLiked ? 'Unlike post' : 'Like post'}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isLiked ? 'filled text-[#ffb700] scale-110' : ''}`}>favorite</span>
                                    </button>
                                    {likeCount > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowLikes(true)}
                                            className={`text-sm font-bold underline decoration-[#ffb700]/60 underline-offset-2 transition-colors cursor-pointer bg-transparent border-none px-1 py-0.5 ${
                                                isLiked ? 'text-[#e59700] hover:text-[#bf7100]' : 'text-[#2D2926]/80 hover:text-[#e59700]'
                                            }`}
                                            title="See who liked this post"
                                        >
                                            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleLike}
                                            className="text-sm font-medium text-[#2D2926]/50 hover:text-[#E59700] transition-colors cursor-pointer bg-transparent border-none px-0.5 py-0.5"
                                        >
                                            0
                                        </button>
                                    )}
                                </div>
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

                    {/* Quick Actions (Watchlist, Log Watch, Suggest, Share) */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* 1. Quick Add to Watchlist */}
                        {targetTmdbId && (
                            <div className="relative group/btn" title="Save to Watchlist">
                                <WatchlistButton 
                                    tmdbId={targetTmdbId} 
                                    variant="icon" 
                                    className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/50 hover:text-[#ffb700] hover:bg-white flex items-center justify-center shadow-xs hover:shadow-sm text-[18px] transition-all cursor-pointer" 
                                />
                            </div>
                        )}

                        {/* 2. Quick Log Watch (Prefilled with Movie & Suggestor) */}
                        {targetTmdbId && (
                            <button
                                type="button"
                                className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/50 hover:text-[#ffb700] hover:bg-white flex items-center justify-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
                                title={`Log watch${prefilledSuggestor ? ` (Suggested by @${prefilledSuggestor.username})` : ''}`}
                                onClick={() => setShowLogModal(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">add_task</span>
                            </button>
                        )}

                        {/* 3. Quick Suggest to a Friend */}
                        {targetTmdbId && (
                            <button
                                type="button"
                                className="w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/50 hover:text-[#ffb700] hover:bg-white flex items-center justify-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
                                title="Suggest to a friend"
                                onClick={() => setShowSuggestModal(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">forward</span>
                            </button>
                        )}

                        {/* 4. Share activity */}
                        <button
                            type="button"
                            className={`w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/50 hover:text-[#ffb700] hover:bg-white flex items-center justify-center shadow-xs hover:shadow-sm transition-all cursor-pointer ${showShareFeedback ? 'text-green-500!' : ''}`}
                            title={showShareFeedback ? "Link Copied!" : "Share activity"}
                            onClick={handleShare}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {showShareFeedback ? 'check_circle' : 'share'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Likes Modal */}
            {!isSuggestion && entryData && (
                <LikesModal
                    isOpen={showLikes}
                    onClose={() => setShowLikes(false)}
                    entryId={entryData.id}
                    entryTitle={title}
                    initialLikeCount={likeCount}
                />
            )}

            {/* Comments Modal */}
            {!isSuggestion && entryData && (
                <CommentsModal
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    entryId={entryData.id}
                    entryTitle={title}
                    entryAuthorId={userId || undefined}
                    onCommentAdded={(newCount) => {
                        setCommentCount(prev => newCount ?? prev + 1);
                        setIsCommented(true);
                    }}
                    onCommentDeleted={(newCount) => {
                        setCommentCount(prev => Math.max(0, newCount ?? prev - 1));
                    }}
                />
            )}

            {/* Quick Log Watch Modal (Prefilled with Movie & Suggestor) */}
            {showLogModal && targetTmdbId && (
                <Modal
                    isOpen={showLogModal}
                    onClose={() => setShowLogModal(false)}
                    title="Log your watch"
                    maxWidth="max-w-4xl"
                >
                    <EntryForm
                        isModal={true}
                        prefillData={{
                            tmdbId: targetTmdbId,
                            title: title,
                            type: normMediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                            posterPath: posterPathRaw || null,
                            overview: details?.overview || null,
                            suggestedByUserId: prefilledSuggestorId,
                            suggestedByUser: prefilledSuggestor,
                        }}
                        onSuccess={() => setShowLogModal(false)}
                        onCancel={() => setShowLogModal(false)}
                    />
                </Modal>
            )}

            {/* Quick Suggest to Friend Modal (Prefilled with Movie) */}
            {showSuggestModal && targetTmdbId && (
                <SuggestMovieModal
                    isOpen={showSuggestModal}
                    initialMovie={{
                        id: targetTmdbId,
                        title: title,
                        name: title,
                        media_type: normMediaType,
                        poster_path: posterPathRaw || null,
                        overview: details?.overview,
                    }}
                    onClose={() => setShowSuggestModal(false)}
                    onSuccess={() => setShowSuggestModal(false)}
                />
            )}
        </>
    );
};
