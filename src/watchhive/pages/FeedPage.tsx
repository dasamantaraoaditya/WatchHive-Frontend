import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts';
import { feedApi, FeedItem } from '../services/feed.service';
import { FeedCard } from '../components/feed/FeedCard';
import { Avatar, FeedCardSkeleton, ErrorState, EmptyState, Button } from '../components/common';
import './FeedPage.css';
import '../components/feed/Feed.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const FeedPage: React.FC = () => {
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // State
    const [items, setItems] = useState<FeedItem[]>([]);
    const [nextPage, setNextPage] = useState<number | null>(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchFeed = useCallback(async (pageNum: number) => {
        if (!pageNum) return;

        // If first page, clear items immediately only if retrying or refresh
        // But better to show loading state above existing items or replace?
        // Typically pagination appends. First load replaces.
        if (pageNum === 1) {
            setLoading(true);
            setError(null);
        } else {
            setLoading(true);
        }

        try {
            const res = await feedApi.getFeed(pageNum);

            if (pageNum === 1) {
                setItems(res.items);
                setInitialLoading(false);
            } else {
                setItems(prev => {
                    // Deduplicate
                    const newItems = res.items.filter(newItem =>
                        !prev.some(existing => existing.id === newItem.id)
                    );
                    return [...prev, ...newItems];
                });
            }

            setHasMore(res.hasMore);
            setNextPage(res.nextPage);
        } catch (err: any) {
            console.error('Failed to load feed', err);
            setError('Unable to load your feed at the moment.');
            setInitialLoading(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOnline) {
            fetchFeed(1);
        }
    }, [fetchFeed, isOnline]);

    // Handle offline
    if (!isOnline && items.length === 0) {
        return (
            <div className="feed-page pt-20">
                <div className="container">
                    <ErrorState
                        message="You are offline. Please check your internet connection."
                        illustration={<span style={{ fontSize: '3rem' }}>📡</span>}
                        onRetry={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="feed-page">
            <div className="container">
                <div className="feed-page__header">
                    <div className="feed-page__welcome">
                        <Avatar
                            src={user?.profilePictureUrl}
                            name={user?.displayName || user?.username || '?'}
                            size="lg"
                            showBorder
                        />
                        <div className="feed-page__greeting">
                            <h1>
                                Welcome, <span className="gradient-text">{user?.displayName || user?.username}</span>
                            </h1>
                            <p>Here's what's happening in your cinema world.</p>
                        </div>
                    </div>
                </div>

                <div className="feed-container">
                    {/* Error State (Dismissable or retryable) */}
                    {error && (
                        <div className="mb-6">
                            <ErrorState
                                message={error}
                                onRetry={() => fetchFeed(1)}
                            />
                        </div>
                    )}

                    {/* Feed Items */}
                    {items.map((item) => (
                        <FeedCard key={`${item.type}-${item.id}`} item={item} />
                    ))}

                    {/* Skeletons for loading */}
                    {(loading || initialLoading) && (
                        <>
                            <FeedCardSkeleton />
                            <FeedCardSkeleton />
                            <FeedCardSkeleton />
                        </>
                    )}

                    {/* Load More Button */}
                    {!loading && !initialLoading && hasMore && nextPage && !error && (
                        <div className="text-center mt-8 mb-12">
                            <Button
                                variant="secondary"
                                onClick={() => fetchFeed(nextPage)}
                                className="px-8"
                            >
                                Load More
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !initialLoading && items.length === 0 && !error && (
                        <EmptyState
                            title="Your feed is empty"
                            message="Follow users or rate movies to see activity here!"
                            icon={
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                            }
                            actionLabel="Find People"
                            onAction={() => window.location.href = '/watch-hive/search'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedPage;
