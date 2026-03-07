import React, { useState } from 'react';
import { FeedItem } from '../../services/feed.service';
import { useTmdbDetails } from '../../hooks/useTmdbDetails';
import { Link } from 'react-router-dom';
import { Card, Avatar, WatchlistButton } from '../common';
import { interactionService } from '../../services/interaction.service';
import { CommentsModal } from '../comments/CommentsModal';
import './Feed.css';

interface FeedCardProps {
    item: FeedItem;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

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
    const posterPath = isSuggestion ? item.data.poster_path : details?.poster_path;
    const posterUrl = posterPath ? `${TMDB_IMG}${posterPath}` : null;

    const username = isSuggestion ? 'WatchHive Suggestion' : (entryData?.user?.username || 'User');
    const displayName = isSuggestion ? (item.reason || 'Trending Now') : (entryData?.user?.displayName || username);
    const userId = !isSuggestion ? entryData?.user?.id : null;

    const avatarUrl = isSuggestion
        ? '/watchhive_logo.png' // Ensure logo exists or use empty as fallback
        : (entryData?.user?.profilePictureUrl || undefined);

    const rating = isSuggestion ? item.data.vote_average : entryData?.rating;
    const review = !isSuggestion ? entryData?.review : (item.data.overview ? item.data.overview.slice(0, 150) + '...' : '');
    const timestamp = !isSuggestion ? new Date(entryData.createdAt).toLocaleDateString() : 'Just Now';

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

    return (
        <>
            <Card variant="glass" className={`feed-card ${isSuggestion ? 'feed-card--suggestion' : ''} mb-6`}>
                {/* Suggestion Badge */}
                {isSuggestion && (
                    <div className="suggestion-badge">
                        <span>✨ Recommended for You</span>
                    </div>
                )}

                {/* Header */}
                <div className="feed-card__header">
                    <Link to={userId ? `/watch-hive/profile/${userId}` : '#'}>
                        <Avatar
                            src={avatarUrl}
                            name={username}
                            size="md"
                            showBorder={false}
                        />
                    </Link>
                    <div className="feed-card__user-info">
                        {isSuggestion ? (
                            <span className="feed-card__username">{displayName}</span>
                        ) : (
                            <Link to={`/watch-hive/profile/${userId}`} className="feed-card__username">
                                {displayName}
                            </Link>
                        )}
                        <div className="feed-card__meta">
                            <Link to={userId ? `/watch-hive/profile/${userId}` : '#'} className="feed-card__handle">
                                @{username}
                            </Link>
                            <span className="feed-card__dot">•</span>
                            <span>{timestamp}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="feed-card__content">
                    {posterUrl && (
                        <div className="feed-card__poster-wrapper">
                            <img
                                src={posterUrl}
                                alt={title}
                                className="feed-card__poster"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="feed-card__details">
                        <div className="feed-card__title-row">
                            <h3 className="feed-card__title">{title}</h3>
                            {rating && (
                                <span className="feed-card__rating">
                                    <span className="text-yellow-400 mr-1">★</span>
                                    {Number(rating).toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Tags */}
                        {!isSuggestion && entryData.tags && entryData.tags.length > 0 && (
                            <div className="feed-card__tags">
                                {entryData.tags.map((tag: string, i: number) => (
                                    <span key={i} className="feed-card__tag">#{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className="feed-card__review">
                            {review ? (
                                <p>{review}</p>
                            ) : (
                                <i className="text-secondary opacity-75">No review provided.</i>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {!isSuggestion && (
                    <div className="feed-card__actions">
                        <button
                            className={`feed-action ${isLiked ? 'feed-action--active' : ''}`}
                            onClick={handleLike}
                        >
                            <span className="feed-action-icon">{isLiked ? '❤️' : '🤍'}</span>
                            <span>{likeCount}</span>
                        </button>
                        <button
                            className="feed-action"
                            onClick={() => setShowComments(true)}
                        >
                            <span className="feed-action-icon">💬</span>
                            <span>{commentCount}</span>
                        </button>
                        <button className="feed-action feed-action--share">
                            <span className="feed-action-icon">↗</span>
                            <span>Share</span>
                        </button>
                        {!item.data?.isWatched && targetTmdbId && (
                            <div className="ml-auto">
                                <WatchlistButton tmdbId={targetTmdbId} />
                            </div>
                        )}
                    </div>
                )}
                {isSuggestion && targetTmdbId && (
                    <div className="feed-card__actions justify-end">
                        {!item.data?.isWatched && <WatchlistButton tmdbId={targetTmdbId} />}
                    </div>
                )}
            </Card>

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
