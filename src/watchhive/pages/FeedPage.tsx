import React, { useState, useEffect, useCallback } from 'react';

import { feedApi, FeedItem } from '../services/feed.service';
import { userService } from '../services/userService';
import { User } from '../types';
import { FeedCard } from '../components/feed/FeedCard';
import { Avatar, FeedCardSkeleton, TrendingWidgetSkeleton, SuggestionWidgetSkeleton, ErrorState, EmptyState } from '../components/common';
import './FeedPage.css';
import '../components/feed/Feed.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useUI } from '../contexts';
import { PageLayout } from '../components/layout';

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
        <PageLayout maxWidth="none" className="w-full px-4 md:px-12">
            <div className="feed-page-layout flex flex-row gap-8 items-start justify-between w-full">
                {/* Main Feed Content Area - Centered in the remaining space */}
                <div className="flex-1 flex justify-center min-w-0">
                    <div className="w-full max-w-[680px] flex flex-col gap-6">
                        {/* Error State */}
                        {error && (
                            <ErrorState
                                message={error}
                                onRetry={() => fetchFeed(1)}
                            />
                        )}

                        {/* Feed Items */}
                        {items.length > 0 ? (
                            items.map((item) => (
                                <FeedCard key={`${item.type}-${item.id}`} item={item} />
                            ))
                        ) : !loading && !initialLoading && !error ? (
                            <EmptyState
                                title="Your feed is empty"
                                message="Follow users or rate movies to see activity here!"
                                icon={<span className="material-symbols-outlined text-4xl text-primary">feed</span>}
                                actionLabel="Discover People"
                                onAction={() => window.location.href = '/watch-hive/search'}
                            />
                        ) : null}

                        {/* Skeletons */}
                        {(loading || initialLoading) && (
                            <>
                                <FeedCardSkeleton />
                                <FeedCardSkeleton />
                            </>
                        )}

                        {/* Infinite Scroll Anchor */}
                        <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />
                    </div>
                </div>

                {/* Right Sidebar Widgets */}
                <aside className="feed-right-sidebar">
                    <div className="flex flex-col gap-8 sticky top-[100px] w-[320px]">
                        {/* Trending Section */}
                        <section className="widget-section">
                            <div className="widget-header">
                                <h3>
                                    <span className="material-symbols-outlined text-primary leading-none">trending_up</span>
                                    Trending in Hive
                                </h3>
                            </div>
                            <div className="widget-content">
                                {loadingTrending ? (
                                    <TrendingWidgetSkeleton />
                                ) : trendingItems.length > 0 ? (
                                    trendingItems.map((item, index) => (
                                        <div className="trending-item" key={index}>
                                            <p className="trending-context">{item.context || 'Trending'}</p>
                                            <p className="trending-title">{item.title}</p>
                                            <p className="trending-stats">{(item.buzzes || 0).toLocaleString()} Buzzes</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">No trending topics right now.</p>
                                )}
                            </div>
                        </section>

                        {/* Suggestions Section */}
                        <section className="widget-section">
                            <div className="widget-header">
                                <h3>
                                    <span className="material-symbols-outlined text-primary leading-none">group_add</span>
                                    Who to Follow
                                </h3>
                            </div>
                            <div className="widget-content">
                                {loadingSuggestions ? (
                                    <SuggestionWidgetSkeleton />
                                ) : suggestedUsers.length > 0 ? (
                                    suggestedUsers.map(user => (
                                        <div className="suggestion-item" key={user.id}>
                                            <Avatar src={user.profilePictureUrl || null} name={user.displayName || user.username} size="sm" />
                                            <div className="suggestion-info">
                                                <p className="suggestion-name">{user.displayName || user.username}</p>
                                                <p className="suggestion-role text-xs text-[#2D2926]/40 line-clamp-1">{user.bio || 'Movie Fan'}</p>
                                            </div>
                                            <button className="btn-follow" onClick={() => handleFollow(user.id)}>Follow</button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-[#2D2926]/50">No suggestions right now.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </PageLayout>
    );
};

export default FeedPage;
