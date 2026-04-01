import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types/user.types';
import userService from '../services/userService';
import { Avatar, ErrorState, EmptyState, BeeLoader, HeaderActions, MovieDetailsModal } from '../components/common';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import apiClient from '../services/api';

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
}

type SearchMode = 'users' | 'movies';

export const SearchUsersPage: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [searchMode, setSearchMode] = useState<SearchMode>('movies'); // Default to movies as requested
    const [query, setQuery] = useState('');
    
    // User Search State
    const [userResults, setUserResults] = useState<User[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [userHasMore, setUserHasMore] = useState(false);
    
    // Movie Search State
    const [movieResults, setMovieResults] = useState<TmdbResult[]>([]);
    const [moviePage, setMoviePage] = useState(1);
    const [movieHasMore, setMovieHasMore] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [selectedMovie, setSelectedMovie] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch(1);
            } else {
                setUserResults([]);
                setMovieResults([]);
                setLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [query, searchMode]);

    const handleSearch = useCallback(async (pageNum = 1) => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            if (searchMode === 'users') {
                const { users, hasMore } = await userService.searchUsers(query, pageNum, 10);
                if (pageNum === 1) {
                    setUserResults(users);
                } else {
                    setUserResults(prev => [...prev, ...users]);
                }
                setUserHasMore(hasMore);
                setUserPage(pageNum);
            } else {
                const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${pageNum}`);
                const filtered = (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
                if (pageNum === 1) {
                    setMovieResults(filtered);
                } else {
                    setMovieResults(prev => [...prev, ...filtered]);
                }
                setMovieHasMore(data.page < data.total_pages);
                setMoviePage(pageNum);
            }
        } catch (err: any) {
            console.error('Search failed:', err);
            setError(`Failed to fetch ${searchMode}. Please try again.`);
        } finally {
            setLoading(false);
        }
    }, [query, searchMode]);

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: () => handleSearch((searchMode === 'users' ? userPage : moviePage) + 1),
        hasMore: searchMode === 'users' ? userHasMore : movieHasMore,
        isLoading: loading,
        enabled: isOnline && !error,
    });

    const handleFollowToggle = async (e: React.MouseEvent, user: User) => {
        e.preventDefault();
        e.stopPropagation();
        setUserResults(prev => prev.map(u =>
            u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u
        ));
        try {
            if (user.isFollowing) {
                await userService.unfollowUser(user.id);
            } else {
                await userService.followUser(user.id);
            }
        } catch (err) {
            setUserResults(prev => prev.map(u =>
                u.id === user.id ? { ...u, isFollowing: user.isFollowing } : u
            ));
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">
            
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-6 py-3 md:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[#ffb700]"><span className="material-symbols-outlined text-3xl">search</span></div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#2D2926]">Search</h2>
                    </div>
                    <HeaderActions />
                </div>
            </header>

            <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8 pb-32">
                
                <div className="flex flex-col items-center justify-center text-center gap-4 py-2 md:py-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-2">
                            Explore the <span className="text-[#ffb700]">Universe</span>
                        </h1>
                        <p className="text-[#2D2926]/40 text-sm md:text-base font-bold uppercase tracking-widest">
                            {searchMode === 'users' ? 'Find your tribe in the hive' : 'Discover cinematic masterpieces'}
                        </p>
                    </div>

                    {/* Mode Toggle - "Honey Switch" */}
                    <div className="bg-[#2D2926]/5 p-1.5 rounded-[24px] flex items-center gap-1 mt-4 border border-[#2D2926]/5 shadow-inner">
                        <button 
                            onClick={() => setSearchMode('movies')}
                            className={`relative px-6 py-2.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${
                                searchMode === 'movies' ? 'text-white' : 'text-[#2D2926]/40 hover:text-[#2D2926]/60'
                            }`}
                        >
                            {searchMode === 'movies' && (
                                <motion.div layoutId="searchModeBg" className="absolute inset-0 bg-[#ffb700] rounded-[20px] shadow-lg shadow-[#ffb700]/20" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">movie</span>
                                Movies
                            </span>
                        </button>
                        <button 
                            onClick={() => setSearchMode('users')}
                            className={`relative px-6 py-2.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${
                                searchMode === 'users' ? 'text-white' : 'text-[#2D2926]/40 hover:text-[#2D2926]/60'
                            }`}
                        >
                            {searchMode === 'users' && (
                                <motion.div layoutId="searchModeBg" className="absolute inset-0 bg-[#2D2926] rounded-[20px] shadow-lg shadow-black/20" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">group</span>
                                People
                            </span>
                        </button>
                    </div>

                    <div className="w-full max-w-2xl relative group mt-6">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                            <span className="material-symbols-outlined text-[#ffb700] text-3xl group-focus-within:rotate-12 transition-all">search</span>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchMode === 'users' ? "Search by username or name..." : "Search movies, series, or anime..."}
                            className="w-full py-5 pl-16 pr-14 text-lg bg-white border-2 border-[#ffb700]/10 rounded-full shadow-sm text-[#2D2926] font-bold outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all placeholder:text-[#2D2926]/20 placeholder:font-bold"
                            autoFocus
                        />
                        {loading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffb700]"></div>
                            </div>
                        )}
                    </div>
                </div>

                {!isOnline && <ErrorState message="You are offline. Universal search requires a connection." />}
                {error && <ErrorState message={error} onRetry={() => handleSearch(1)} />}

                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="wait">
                        {loading && (userResults.length === 0 && movieResults.length === 0) ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-20 flex justify-center"
                            >
                                <BeeLoader size="medium" />
                            </motion.div>
                        ) : searchMode === 'users' ? (
                            <motion.div 
                                key="users"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col gap-4"
                            >
                                {userResults.map(user => (
                                    <Link 
                                        key={user.id} 
                                        to={`/watch-hive/profile/${user.id}`} 
                                        className="group flex items-center justify-between p-4 bg-white border border-[#ffb700]/10 rounded-3xl shadow-sm hover:shadow-md hover:border-[#ffb700]/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar src={user.profilePictureUrl} name={user.displayName || user.username} size="md" />
                                            <div>
                                                <h3 className="font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors">{user.displayName || user.username}</h3>
                                                <span className="text-xs font-bold text-[#2D2926]/40 uppercase tracking-widest">@{user.username}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleFollowToggle(e, user)}
                                            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                                user.isFollowing ? 'bg-[#2D2926]/5 text-[#2D2926]/60' : 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/20'
                                            }`}
                                        >
                                            {user.isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    </Link>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="movies"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            >
                                {movieResults.map(movie => (
                                    <button
                                        key={movie.id}
                                        onClick={() => setSelectedMovie({ id: movie.id, type: movie.media_type as 'movie' | 'tv' })}
                                        className="group flex items-center gap-4 p-4 bg-white border border-[#ffb700]/10 rounded-3xl text-left shadow-sm hover:shadow-md hover:border-[#ffb700]/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-16 h-24 bg-[#2D2926]/5 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                            {movie.poster_path ? (
                                                <img src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[#2D2926]/10 uppercase">NO IMG</div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded bg-[#ffb700]/10 text-[#ffb700] text-[8px] font-black uppercase tracking-tighter">
                                                    {movie.media_type}
                                                </span>
                                                <span className="text-[10px] font-bold text-[#2D2926]/30">
                                                    {(movie.release_date || movie.first_air_date || '').substring(0, 4)}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-[#2D2926] leading-tight group-hover:text-[#ffb700] transition-colors truncate">
                                                {movie.title || movie.name}
                                            </h3>
                                            {movie.vote_average ? (
                                                <div className="flex items-center gap-1 mt-1 text-[#ffb700]">
                                                    <span className="material-symbols-outlined text-[14px] filled">star</span>
                                                    <span className="text-[10px] font-black">{movie.vote_average.toFixed(1)}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <span className="material-symbols-outlined text-[#ffb700] bg-[#ffb700]/5 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#ffb700] group-hover:text-white transition-all">info</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!loading && query.trim() !== '' && (searchMode === 'users' ? userResults : movieResults).length === 0 && (
                        <div className="py-20 text-center">
                            <EmptyState
                                title={`No ${searchMode} found`}
                                message={`We couldn't find any results matching "${query}"`}
                                icon={<span className="text-6xl text-[#ffb700] opacity-40">🔭</span>}
                            />
                        </div>
                    )}

                    <div ref={observerTarget} className="h-4 w-full" />
                </div>
            </main>

            <MovieDetailsModal 
                isOpen={!!selectedMovie}
                onClose={() => setSelectedMovie(null)}
                tmdbId={selectedMovie?.id || null}
                mediaType={selectedMovie?.type || null}
            />
        </div>
    );
};

export default SearchUsersPage;
