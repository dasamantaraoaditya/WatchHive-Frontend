import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types/user.types';
import userService from '../services/userService';
import { Avatar, ErrorState, EmptyState } from '../components/common';
import { calculateFuzzyScore } from '../components/entries/EntryForm';
import { useUI } from '../contexts';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import apiClient from '../services/api';
import { MovieSearchSkeleton } from '../components/search/MovieSearchSkeleton';
import { UserSearchSkeleton } from '../components/search/UserSearchSkeleton';
import { PageLayout } from '../components/layout';

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

const TMDB_GENRES = [
    { id: 0, name: 'All Genres' },
    { id: 28, name: 'Action 💥' },
    { id: 12, name: 'Adventure 🗺️' },
    { id: 16, name: 'Animation 🎨' },
    { id: 35, name: 'Comedy 😂' },
    { id: 80, name: 'Crime 🕵️' },
    { id: 99, name: 'Documentary 📹' },
    { id: 18, name: 'Drama 🎭' },
    { id: 10751, name: 'Family 👨‍👩‍👧' },
    { id: 14, name: 'Fantasy 🪄' },
    { id: 27, name: 'Horror 👻' },
    { id: 10402, name: 'Music 🎵' },
    { id: 9648, name: 'Mystery 🔍' },
    { id: 10749, name: 'Romance ❤️' },
    { id: 878, name: 'Sci-Fi 🚀' },
    { id: 53, name: 'Thriller ⚡' },
];

export const SearchUsersPage: React.FC = () => {
    const navigate = useNavigate();
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('Explore');
        setPageIcon('explore');
    }, [setPageTitle, setPageIcon]);

    const [searchParams] = useSearchParams();
    const isOnline = useOnlineStatus();
    const initialMode = searchParams.get('mode') === 'movies' ? 'movies' : 'users';
    const initialDeep = searchParams.get('deep') === 'true';
    const initialQuery = searchParams.get('q') || '';

    const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
    const [query, setQuery] = useState(initialQuery);

    // Deep Search Filters
    const [isDeepSearch, setIsDeepSearch] = useState(initialDeep);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
    const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'movie' | 'tv'>('all');
    const [selectedSortBy, setSelectedSortBy] = useState<string>('popularity.desc');
    
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

    const [hoveredRequestedUserId, setHoveredRequestedUserId] = useState<string | null>(null);

    const handleSearch = useCallback(async (pageNum = 1) => {
        if (!query.trim() && !isDeepSearch) return;
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
                let filtered: TmdbResult[] = [];
                let hasMoreRes = false;

                if (isDeepSearch) {
                    const params = new URLSearchParams();
                    if (query.trim()) params.set('query', query.trim());
                    if (selectedYear) params.set('year', selectedYear);
                    if (selectedGenreId) params.set('genreId', selectedGenreId.toString());
                    if (selectedMediaType !== 'all') params.set('mediaType', selectedMediaType);
                    params.set('sortBy', selectedSortBy);
                    params.set('page', pageNum.toString());

                    const data: any = await apiClient.get(`/tmdb/discover?${params.toString()}`);
                    const raw = (data.results || []).map((r: any) => ({
                        ...r,
                        media_type: r.media_type || (selectedMediaType === 'tv' ? 'tv' : 'movie')
                    }));

                    if (query.trim()) {
                        filtered = [...raw].sort((a, b) => {
                            const scoreA = calculateFuzzyScore(query, a.title || a.name || '');
                            const scoreB = calculateFuzzyScore(query, b.title || b.name || '');
                            return scoreB - scoreA;
                        });
                    } else {
                        filtered = raw;
                    }
                    hasMoreRes = data.page < data.total_pages;
                } else {
                    const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${pageNum}`);
                    const raw = (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
                    
                    // Smart fuzzy ranking for typos and misspellings
                    filtered = [...raw].sort((a, b) => {
                        const scoreA = calculateFuzzyScore(query, a.title || a.name || '');
                        const scoreB = calculateFuzzyScore(query, b.title || b.name || '');
                        return scoreB - scoreA;
                    });
                    hasMoreRes = data.page < data.total_pages;
                }

                if (pageNum === 1) {
                    setMovieResults(filtered);
                } else {
                    setMovieResults(prev => [...prev, ...filtered]);
                }
                setMovieHasMore(hasMoreRes);
                setMoviePage(pageNum);
            }
        } catch (err: any) {
            console.error('Search failed:', err);
            setError(`Failed to fetch ${searchMode}. Please try again.`);
        } finally {
            setLoading(false);
        }
    }, [query, searchMode, isDeepSearch, selectedYear, selectedGenreId, selectedMediaType, selectedSortBy]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim() || isDeepSearch) {
                handleSearch(1);
            } else {
                setUserResults([]);
                setMovieResults([]);
                setLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [query, searchMode, isDeepSearch, selectedYear, selectedGenreId, selectedMediaType, selectedSortBy, handleSearch]);

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: () => handleSearch((searchMode === 'users' ? userPage : moviePage) + 1),
        hasMore: searchMode === 'users' ? userHasMore : movieHasMore,
        isLoading: loading,
        enabled: isOnline && !error,
    });

    const handleFollowToggle = async (e: React.MouseEvent, targetUser: User) => {
        e.preventDefault();
        e.stopPropagation();

        const originalFollowing = targetUser.isFollowing;
        const originalRequested = targetUser.isRequested;

        let nextFollowing = originalFollowing;
        let nextRequested = originalRequested;

        if (originalFollowing) {
            nextFollowing = false;
            nextRequested = false;
        } else if (originalRequested) {
            nextFollowing = false;
            nextRequested = false;
        } else {
            const isPrivateAccount = targetUser.privacyLevel === 'FOLLOWERS_ONLY' || 
                                     targetUser.privacyLevel === 'PRIVATE' || 
                                     targetUser.isPrivate;
            if (isPrivateAccount) {
                nextRequested = true;
            } else {
                nextFollowing = true;
            }
        }

        setUserResults(prev => prev.map(u =>
            u.id === targetUser.id ? { ...u, isFollowing: nextFollowing, isRequested: nextRequested } : u
        ));

        try {
            if (originalFollowing || originalRequested) {
                await userService.unfollowUser(targetUser.id);
            } else {
                const response: any = await userService.followUser(targetUser.id);
                if (response && response.status === 'following') {
                    setUserResults(prev => prev.map(u =>
                        u.id === targetUser.id ? { ...u, isFollowing: true, isRequested: false } : u
                    ));
                }
            }
        } catch (err) {
            setUserResults(prev => prev.map(u =>
                u.id === targetUser.id ? { ...u, isFollowing: originalFollowing, isRequested: originalRequested } : u
            ));
        }
    };

    return (
        <PageLayout maxWidth="4xl">
            <div className="flex flex-col items-center justify-center text-center gap-4 py-2 md:py-6 animate-slide-up">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-2">
                        Explore the <span className="text-[#ffb700]">Universe</span>
                    </h1>
                    <p className="text-[#2D2926]/40 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                        {searchMode === 'users' ? 'Find your tribe in the hive' : 'Discover cinematic masterpieces'}
                    </p>
                </div>

                {/* Mode Toggle - "Honey Switch" */}
                <div className="bg-[#2D2926]/5 p-1.5 rounded-[24px] flex items-center gap-1 mt-4 border border-black/5 shadow-inner">
                    <button 
                        onClick={() => setSearchMode('users')}
                        className={`relative px-6 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            searchMode === 'users' ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {searchMode === 'users' && (
                            <motion.div layoutId="searchModeBg" className="absolute inset-0 bg-slate-800 rounded-[20px] shadow-lg shadow-black/20" />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">group</span>
                            People
                        </span>
                    </button>
                    <button 
                        onClick={() => setSearchMode('movies')}
                        className={`relative px-6 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            searchMode === 'movies' ? 'text-white' : 'text-slate-400 hover:text-slate-600'
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
                        className="w-full py-5 pl-16 pr-14 text-lg bg-white border-2 border-black/5 rounded-full shadow-lg shadow-black/5 text-[#2D2926] font-bold outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all placeholder:text-slate-300 placeholder:font-bold"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffb700]"></div>
                        </div>
                    )}
                </div>

                {/* Deep Search Control Bar */}
                {searchMode === 'movies' && (
                    <div className="w-full max-w-2xl flex flex-col gap-3 mt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                            <button
                                type="button"
                                onClick={() => setIsDeepSearch(prev => !prev)}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                    isDeepSearch 
                                        ? 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/30 scale-[1.02]' 
                                        : 'bg-white border-2 border-black/5 text-[#2D2926] hover:border-[#ffb700] hover:text-[#ffb700] shadow-sm'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isDeepSearch ? 'rotate-180 text-white' : 'text-[#ffb700]'}`}>
                                    tune
                                </span>
                                <span>{isDeepSearch ? 'Deep Search Active' : 'Deep Search Filters'}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isDeepSearch ? 'bg-white/20 text-white' : 'bg-[#ffb700]/15 text-[#ffb700]'}`}>
                                    {isDeepSearch ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            {isDeepSearch && (
                                <div className="flex items-center gap-2">
                                    {(selectedYear || selectedGenreId > 0 || selectedMediaType !== 'all') && (
                                        <span className="text-[10px] font-black text-[#ffb700] bg-[#ffb700]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                            Filters Active
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedYear('');
                                            setSelectedGenreId(0);
                                            setSelectedMediaType('all');
                                            setSelectedSortBy('popularity.desc');
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                                    >
                                        Reset ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {isDeepSearch && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, scale: 0.96 }}
                                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                                    exit={{ height: 0, opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-xl border-2 border-[#ffb700]/25 rounded-[28px] shadow-xl shadow-[#ffb700]/5 grid grid-cols-2 gap-3.5 sm:flex sm:flex-row sm:flex-wrap items-center text-left">
                                        {/* Year Filter */}
                                        <div className="flex flex-col gap-1.5 col-span-1 sm:flex-1 min-w-[110px]">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#ffb700]">calendar_today</span>
                                                Release Year
                                            </label>
                                            <input
                                                type="number"
                                                min="1900"
                                                max="2030"
                                                placeholder="e.g. 2024"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] focus:bg-white transition-all"
                                            />
                                        </div>

                                        {/* Format Filter */}
                                        <div className="flex flex-col gap-1.5 col-span-1 sm:flex-1 min-w-[110px]">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#ffb700]">movie</span>
                                                Format
                                            </label>
                                            <select
                                                value={selectedMediaType}
                                                onChange={(e) => setSelectedMediaType(e.target.value as any)}
                                                className="w-full px-3.5 py-2.5 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] focus:bg-white cursor-pointer transition-all"
                                            >
                                                <option value="all">All Types</option>
                                                <option value="movie">Movies Only</option>
                                                <option value="tv">TV Series</option>
                                            </select>
                                        </div>

                                        {/* Genre Filter */}
                                        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1 sm:flex-1 min-w-[140px]">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#ffb700]">theater_comedy</span>
                                                Genre
                                            </label>
                                            <select
                                                value={selectedGenreId}
                                                onChange={(e) => setSelectedGenreId(Number(e.target.value))}
                                                className="w-full px-3.5 py-2.5 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] focus:bg-white cursor-pointer transition-all"
                                            >
                                                {TMDB_GENRES.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Sort Order */}
                                        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1 sm:flex-1 min-w-[140px]">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#ffb700]">sort</span>
                                                Sort By
                                            </label>
                                            <select
                                                value={selectedSortBy}
                                                onChange={(e) => setSelectedSortBy(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] focus:bg-white cursor-pointer transition-all"
                                            >
                                                <option value="popularity.desc">🔥 Popularity</option>
                                                <option value="primary_release_date.desc">📅 Release Date</option>
                                                <option value="vote_average.desc">⭐ Highest Rating</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {!isOnline && <ErrorState message="You are offline. Universal search requires a connection." />}
            {error && <ErrorState message={error} onRetry={() => handleSearch(1)} />}

            <div className="flex flex-col gap-4 mt-8 pb-12">
                <AnimatePresence mode="wait">
                    {loading && (userResults.length === 0 && movieResults.length === 0) ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={searchMode === 'movies' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-col gap-4"}
                        >
                            {searchMode === 'movies' 
                                ? [...Array(6)].map((_, i) => <MovieSearchSkeleton key={i} />)
                                : [...Array(6)].map((_, i) => <UserSearchSkeleton key={i} />)
                            }
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
                                    className="group flex items-center justify-between p-5 bg-white border border-black/5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar src={user.profilePictureUrl} name={user.displayName || user.username} size="lg" />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ffb700] rounded-lg border-2 border-white flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined text-[12px] font-black">token</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors">{user.displayName || user.username}</h3>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">@{user.username}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleFollowToggle(e, user)}
                                        onMouseEnter={() => setHoveredRequestedUserId(user.id)}
                                        onMouseLeave={() => setHoveredRequestedUserId(null)}
                                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                            user.isFollowing 
                                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                            : user.isRequested
                                            ? 'bg-amber-100 text-amber-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 border border-amber-200'
                                            : 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/20 hover:brightness-105'
                                        }`}
                                    >
                                        {user.isFollowing 
                                            ? 'Following' 
                                            : user.isRequested 
                                            ? (hoveredRequestedUserId === user.id ? 'Cancel Request ✕' : 'Requested 🔒') 
                                            : 'Follow'}
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
                                    onClick={() => navigate(`/watch-hive/details/${movie.media_type === 'tv' ? 'tv' : 'movie'}/${movie.id}`, { state: { from: window.location.pathname + window.location.search } })}
                                    className="group flex items-center gap-4 p-4 bg-white border border-black/5 rounded-[32px] text-left shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
                                >
                                    <div className="w-20 h-28 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                        {movie.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-200 uppercase">NO IMG</div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tight">
                                                {movie.media_type}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-300">
                                                {(movie.release_date || movie.first_air_date || '').substring(0, 4)}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-[#2D2926] text-lg leading-tight group-hover:text-[#ffb700] transition-colors truncate">
                                            {movie.title || movie.name}
                                        </h3>
                                        {movie.vote_average ? (
                                            <div className="flex items-center gap-1 mt-2">
                                                <div className="flex text-[#ffb700]">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-outlined text-[12px] ${i < Math.round(movie.vote_average! / 2) ? 'filled' : 'opacity-20'}`}>star</span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-[#ffb700] ml-1">{movie.vote_average.toFixed(1)}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#ffb700] transition-colors">
                                        <span className="material-symbols-outlined text-[#ffb700] group-hover:text-white transition-colors">arrow_forward</span>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && query.trim() !== '' && (searchMode === 'users' ? userResults : movieResults).length === 0 && (
                    <div className="py-20 text-center animate-fade-in">
                        <EmptyState
                            title={`No ${searchMode} found`}
                            message={`We couldn't find any results matching "${query}"`}
                            icon={<span className="text-6xl drop-shadow-sm">🔭</span>}
                        />
                    </div>
                )}

                <div ref={observerTarget} className="h-20 w-full" />
                
                {loading && (userResults.length > 0 || movieResults.length > 0) && (
                    <div className={searchMode === 'movies' ? "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4" : "flex flex-col gap-4 mt-4"}>
                        {searchMode === 'movies' 
                            ? [...Array(2)].map((_, i) => <MovieSearchSkeleton key={`more-${i}`} />)
                            : <UserSearchSkeleton key="more-user" />
                        }
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default SearchUsersPage;
