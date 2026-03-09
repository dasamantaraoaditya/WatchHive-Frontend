import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import { Avatar, Button, Skeleton, ErrorState, EmptyState } from '../components/common';
import './SearchUsersPage.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useCallback } from 'react';

export const SearchUsersPage: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch(1);
            } else {
                setResults([]);
                setLoading(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = useCallback(async (pageNum = 1) => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const { users, hasMore: more } = await userService.searchUsers(query, pageNum, 10);
            if (pageNum === 1) {
                setResults(users);
            } else {
                setResults(prev => [...prev, ...users]);
            }
            setHasMore(more);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Search failed:', err);
            setError('Failed to fetch users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [query]);

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: () => handleSearch(page + 1),
        hasMore,
        isLoading: loading,
        enabled: isOnline && !error,
    });

    const handleFollowToggle = async (user: User) => {
        // Optimistic update
        setResults(prev => prev.map(u =>
            u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u
        ));

        try {
            if (user.isFollowing) {
                await userService.unfollowUser(user.id);
            } else {
                await userService.followUser(user.id);
            }
        } catch (err) {
            console.error('Toggle follow failed:', err);
            // Revert on error
            setResults(prev => prev.map(u =>
                u.id === user.id ? { ...u, isFollowing: user.isFollowing } : u
            ));
            alert('Failed to update follow status');
        }
    };

    return (
        <div className="search-users-page">
            <div className="container">
                <div className="search-header">
                    <h1>Search Users</h1>
                    <div className="search-input-wrapper">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username or name..."
                            className="search-input"
                            autoFocus
                        />
                        {loading && <div className="spinner-sm" />}
                    </div>
                </div>

                {!isOnline && (
                    <div className="mb-6">
                        <ErrorState message="You are offline." />
                    </div>
                )}

                {error && (
                    <div className="py-8">
                        <ErrorState message={error} onRetry={() => handleSearch(1)} />
                    </div>
                )}

                <div className="search-results-list">
                    {/* Loading Skeletons */}
                    {loading && results.length === 0 && (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="user-skeleton-item">
                                    <Skeleton variant="circle" width={48} height={48} />
                                    <div className="user-skeleton-text">
                                        <Skeleton variant="text" width="40%" height={24} />
                                        <Skeleton variant="text" width="20%" height={16} />
                                    </div>
                                    <Skeleton variant="rect" width={80} height={32} />
                                </div>
                            ))}
                        </>
                    )}

                    {/* Empty State */}
                    {!loading && !error && query.trim() !== '' && results.length === 0 && (
                        <EmptyState
                            title="No users found"
                            message={`We couldn't find anyone matching "${query}"`}
                            icon={<span>👥</span>}
                        />
                    )}

                    {/* Results */}
                    {!loading && results.map(user => (
                        <div key={user.id} className="user-result-card">
                            <Link to={`/watch-hive/profile/${user.id}`} className="user-result-link">
                                <Avatar
                                    src={user.profilePictureUrl}
                                    name={user.displayName || user.username}
                                    size="md"
                                />
                                <div className="user-result-info">
                                    <div className="user-result-name">
                                        {user.displayName || user.displayName}
                                        {user.isPrivate && <span title="Private Profile">🔒</span>}
                                    </div>
                                    <div className="user-result-username">@{user.username}</div>
                                </div>
                            </Link>
                            <Button
                                variant={user.isFollowing ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => handleFollowToggle(user)}
                            >
                                {user.isFollowing ? 'Following' : 'Follow'}
                            </Button>
                        </div>
                    ))}
                    {/* Infinite Scroll Anchor */}
                    <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />

                    {loading && results.length > 0 && (
                        <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                            Searching for more users...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchUsersPage;
