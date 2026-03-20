import React, { useState } from 'react';
import { FeedItem } from '../../services/feed.service';
import { useTmdbDetails } from '../../hooks/useTmdbDetails';
import { Link } from 'react-router-dom';
import { Avatar, WatchlistButton } from '../common';
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

    // Only fetch details if it's an ENTRY (suggestions come with poster_path usually)
    const { details } = useTmdbDetails(entryData?.tmdbId, entryData?.type);

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
    const timestamp = !isSuggestion 
        ? new Date(entryData.createdAt).toLocaleString(undefined, { 
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

    const actionText = isSuggestion ? 'recommends' : (entryData?.review ? 'reviewed' : 'just watched');

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
                    
                    <div className="feed-card-header-info">
                        <div className="flex items-center justify-between w-full">
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
                                <span className="font-extrabold text-[#2D2926]">{title}</span>
                            </p>
                            <span className="feed-card-time text-[#2D2926]/50">{timestamp}</span>
                        </div>
                    </div>
                </div>

                {/* Content: Poster Image */}
                {posterUrl && (
                    <div className="feed-card-poster-container">
                        <div className="feed-card-poster-gradient"></div>
                        <img
                            src={posterUrl}
                            alt={title}
                            className="feed-card-poster-img"
                            loading="lazy"
                        />
                        <div className="feed-card-poster-badges">
                            {rating && (
                                <div className="feed-card-rating">
                                    <span className="material-symbols-outlined text-primary text-xl">grade</span>
                                    <span className="font-bold text-white text-lg">{Number(rating).toFixed(1)}</span>
                                </div>
                            )}
                            
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
                                    <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'fill-1' : ''}`}>favorite</span>
                                    <span className="text-sm font-medium">{likeCount}</span>
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() => setShowComments(true)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
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
                        <button className="icon-only-btn" title="Share via WatchHive">
                            <span className="material-symbols-outlined text-[20px]">share</span>
                        </button>
                        {!item.data?.isWatched && targetTmdbId && (
                            <WatchlistButton tmdbId={targetTmdbId} />
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
                    onCommentAdded={() => setCommentCount(prev => prev + 1)}
                />
            )}
        </>
    );
};
