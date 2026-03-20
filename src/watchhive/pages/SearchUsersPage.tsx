import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import { Avatar, Skeleton, ErrorState, EmptyState } from '../components/common';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

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
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">
            
            {/* Embedded Header for Mobile mostly */}
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-6 lg:px-20 py-3 md:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[#ffb700]"><span className="material-symbols-outlined text-3xl">search</span></div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#2D2926]">Search Hive</h2>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
                
                {/* Search Header Container */}
                <div className="flex flex-col items-center justify-center text-center gap-6 py-4 md:py-10">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-3">Discover the <span className="text-[#ffb700]">Hive</span></h1>
                        <p className="text-[#2D2926]/60 text-lg md:text-xl font-medium max-w-lg mx-auto">Find friends, critics, and fellow curators sharing their cinematic journeys.</p>
                    </div>

                    <div className="w-full max-w-2xl relative group mt-4">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                            <span className="material-symbols-outlined text-[#ffb700] text-3xl group-focus-within:drop-shadow-sm transition-all">search</span>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username or name..."
                            className="w-full py-5 pl-16 pr-14 text-lg bg-white border-2 border-[#ffb700]/20 rounded-full shadow-sm text-[#2D2926] font-bold outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all placeholder:text-[#2D2926]/30 placeholder:font-medium"
                            autoFocus
                        />
                        {loading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffb700]"></div>
                            </div>
                        )}
                        {!loading && query.length > 0 && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-6 text-[#2D2926]/30 hover:text-[#ffb700] transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>cancel</span>
                            </button>
                        )}
                    </div>
                </div>

                {!isOnline && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200">
                        <ErrorState message="You are offline. Search is unavailable." />
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200">
                        <ErrorState message={error} onRetry={() => handleSearch(1)} />
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {/* Loading Skeletons */}
                    {loading && results.length === 0 && (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#ffb700]/10 rounded-2xl shadow-sm animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0"></div>
                                        <div className="flex flex-col gap-2">
                                            <div className="w-32 h-5 bg-gray-200 rounded"></div>
                                            <div className="w-20 h-4 bg-gray-100 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && query.trim() !== '' && results.length === 0 && (
                        <div className="py-12 bg-white border border-[#ffb700]/20 rounded-3xl text-center shadow-sm">
                            <EmptyState
                                title="No users found"
                                message={`We couldn't find anyone matching "${query}"`}
                                icon={<span className="text-6xl text-[#ffb700] drop-shadow-sm pb-4 inline-block">👀</span>}
                            />
                        </div>
                    )}

                    {/* Results map */}
                    {!loading && results.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/40 pl-2">
                                Search Results
                            </div>
                            {results.map(user => (
                                <div key={user.id} className="group flex items-center justify-between p-4 sm:p-5 bg-white border border-[#ffb700]/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#ffb700]/30 transition-all cursor-pointer">
                                    <Link to={`/watch-hive/profile/${user.id}`} className="flex items-center gap-4 flex-1">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#ffb700] to-transparent rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                            <div className="p-0.5 bg-[#FFF9F0] rounded-full border border-[#ffb700]/20">
                                                <Avatar src={user.profilePictureUrl} name={user.displayName || user.username} size="md" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-[#2D2926] leading-tight group-hover:text-[#ffb700] transition-colors">{user.displayName || user.username}</h3>
                                                {user.isPrivate && <span className="material-symbols-outlined text-[16px] text-[#2D2926]/40" title="Private Profile">lock</span>}
                                            </div>
                                            <span className="text-sm font-medium text-[#2D2926]/50">@{user.username}</span>
                                        </div>
                                    </Link>
                                    
                                    <button
                                        onClick={() => handleFollowToggle(user)}
                                        className={`ml-4 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                            user.isFollowing 
                                            ? 'bg-[#2D2926]/5 text-[#2D2926]/70 hover:bg-[#2D2926]/10 border border-[#2D2926]/10' 
                                            : 'bg-[#ffb700] text-white hover:brightness-105 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[18px]">
                                                {user.isFollowing ? 'person_remove' : 'person_add'}
                                            </span>
                                            {user.isFollowing ? 'Following' : 'Follow'}
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Infinite Scroll Anchor */}
                    <div ref={observerTarget} className="h-4 w-full" />

                    {loading && results.length > 0 && (
                        <div className="text-center py-6 font-bold text-[#2D2926]/40 flex items-center justify-center gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#ffb700]"></div>
                            Searching the hive for more...
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchUsersPage;
