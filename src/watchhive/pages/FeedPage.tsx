import React, { useState, useEffect, useCallback } from 'react';

import { feedApi, FeedItem } from '../services/feed.service';
import { userService } from '../services/userService';
import { User } from '../types';
import { FeedCard } from '../components/feed/FeedCard';
import { Avatar, FeedCardSkeleton, ErrorState, EmptyState, BeeLoader } from '../components/common';
import './FeedPage.css';
import '../components/feed/Feed.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useUI } from '../contexts';

export const FeedPage: React.FC = () => {
    const isOnline = useOnlineStatus();
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('The Hive Feed');
        setPageIcon('diversity_3');
    }, [setPageTitle, setPageIcon]);

    // State
    const [items, setItems] = useState<FeedItem[]>([]);
    const [nextPage, setNextPage] = useState<number | null>(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [trendingItems, setTrendingItems] = useState<any[]>([]);
    const [loadingTrending, setLoadingTrending] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!isOnline) {
                setLoadingSuggestions(false);
                return;
            }
            try {
                const users = await userService.getSuggestedUsers();
                setSuggestedUsers(users);
            } catch (err) {
                console.error('Failed to load suggested users', err);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [isOnline]);

    useEffect(() => {
        const fetchTrending = async () => {
            if (!isOnline) {
                setLoadingTrending(false);
                return;
            }
            try {
                const res = await feedApi.getTrending();
                setTrendingItems(res.trending || []);
            } catch (err) {
                console.error('Failed to load trending items', err);
            } finally {
                setLoadingTrending(false);
            }
        };
        fetchTrending();
    }, [isOnline]);

    const handleFollow = async (userId: string) => {
        try {
            await userService.followUser(userId);
            setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to follow user', err);
        }
    };

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

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: () => nextPage && fetchFeed(nextPage),
        hasMore,
        isLoading: loading || initialLoading,
        enabled: isOnline && !error,
    });

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
        <div className="feed-page-layout">
            <div className="feed-page-main">
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

                    {/* Infinite Scroll Anchor */}
                    <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />

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

            {/* Right Sidebar Widgets */}
            <aside className="feed-right-sidebar pr-6">


                <section className="widget-section">
                    <div className="widget-header">
                        <h3>
                            <span className="material-symbols-outlined text-primary leading-none">trending_up</span>
                            Trending in Hive
                        </h3>
                    </div>
                    <div className="widget-content">
                        {loadingTrending ? (
                            <BeeLoader size="small" message="Calculating buzz..." />
                        ) : trendingItems.length > 0 ? (
                            trendingItems.map((item, index) => (
                                <div className="trending-item" key={index}>
                                    <p className="trending-context">{item.context}</p>
                                    <p className="trending-title">{item.title}</p>
                                    <p className="trending-stats">{item.buzzes.toLocaleString()} Buzzes</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 mb-2">No trending topics right now.</p>
                        )}
                    </div>
                </section>

                <section className="widget-section">
                    <h3 className="mb-4 font-bold text-[#2D2926]">Suggested Follows</h3>
                    <div className="widget-content">
                        {loadingSuggestions ? (
                            <BeeLoader size="small" message="Finding people for you..." className="py-2" />
                        ) : suggestedUsers.length > 0 ? (
                            suggestedUsers.map(user => (
                                <div className="suggestion-item" key={user.id}>
                                    <Avatar src={user.profilePictureUrl || null} name={user.displayName || user.username} size="sm" />
                                    <div className="suggestion-info">
                                        <p className="suggestion-name">{user.displayName || user.username}</p>
                                        <p className="suggestion-role text-xs text-[#2D2926]/40 line-clamp-1">{user.bio ? user.bio : 'Movie Fan'}</p>
                                    </div>
                                    <button className="btn-follow" onClick={() => handleFollow(user.id)}>Follow</button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-[#2D2926]/50 mb-2">No suggestions right now.</p>
                        )}
                    </div>
                    <button className="btn-show-more">Show more</button>
                </section>
            </aside>

        </div>
    );
};

export default FeedPage;
