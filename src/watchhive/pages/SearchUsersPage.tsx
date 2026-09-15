import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types/user.types';
import userService from '../services/userService';
import searchService, {
    MediaResult,
    TrendingFilterOption,
    TRENDING_FILTERS,
} from '../services/search.service';
import { TrendingItem } from '../services/feed.service';
import { Avatar, ErrorState, EmptyState } from '../components/common';
import { calculateFuzzyScore } from '../components/entries/EntryForm';
import { useUI } from '../contexts';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import apiClient from '../services/api';
import { MovieSearchSkeleton } from '../components/search/MovieSearchSkeleton';
import { UserSearchSkeleton } from '../components/search/UserSearchSkeleton';
import { PageLayout } from '../components/layout';

type ActiveSearchTab = 'media' | 'people';

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
    const [searchParams] = useSearchParams();
    const isOnline = useOnlineStatus();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPageTitle('Explore');
        setPageIcon('explore');
    }, [setPageTitle, setPageIcon]);

    const initialMode = searchParams.get('mode') === 'movies' || searchParams.get('tab') === 'media' ? 'media' : 'media';
    const initialQuery = searchParams.get('q') || '';
    const initialDeep = searchParams.get('deep') === 'true';

    // State
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<ActiveSearchTab>(initialMode);

    // Discovery State
    const [selectedFilter, setSelectedFilter] = useState<TrendingFilterOption>(TRENDING_FILTERS[0]);
    const [discoveryMedia, setDiscoveryMedia] = useState<MediaResult[]>([]);
    const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const [isSuggestedLoading, setIsSuggestedLoading] = useState(true);
    const [communityBuzz, setCommunityBuzz] = useState<TrendingItem[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [followingLoadingMap, setFollowingLoadingMap] = useState<Record<string, boolean>>({});

    // Deep Search Filters (Available in Media search tab)
    const [isDeepSearch, setIsDeepSearch] = useState(initialDeep);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
    const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'movie' | 'tv'>('all');
    const [selectedSortBy, setSelectedSortBy] = useState<string>('popularity.desc');

    // Search Results State
    const [movieResults, setMovieResults] = useState<MediaResult[]>([]);
    const [moviePage, setMoviePage] = useState(1);
    const [movieHasMore, setMovieHasMore] = useState(false);

    const [userResults, setUserResults] = useState<User[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [userHasMore, setUserHasMore] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [hoveredRequestedUserId, setHoveredRequestedUserId] = useState<string | null>(null);

    // ==========================================
    // 1. Initial Discovery Loading
    // ==========================================
    const loadRecentSearches = useCallback(() => {
        setRecentSearches(searchService.getRecentSearches());
    }, []);

    const loadSuggestedUsers = useCallback(async () => {
        setIsSuggestedLoading(true);
        try {
            const users = await searchService.getSuggestedUsers();
            setSuggestedUsers(users);
        } catch (err) {
            console.error('Error loading suggested cinephiles:', err);
        } finally {
            setIsSuggestedLoading(false);
        }
    }, []);

    const loadCommunityBuzz = useCallback(async () => {
        try {
            const buzz = await searchService.getCommunityTrending();
            setCommunityBuzz(buzz);
        } catch (err) {
            console.error('Error loading buzzing topics:', err);
        }
    }, []);

    const loadDiscoveryMedia = useCallback(async (filter: TrendingFilterOption) => {
        setSelectedFilter(filter);
        setIsDiscoveryLoading(true);
        try {
            let items: MediaResult[] = [];
            if (filter.category === 'popular') {
                items = await searchService.getPopular(filter.mediaType === 'tv' ? 'tv' : 'movie');
            } else {
                items = await searchService.getTrending(filter.mediaType, 'week');
            }
            setDiscoveryMedia(items);
        } catch (err) {
            console.error('Error loading discovery media:', err);
        } finally {
            setIsDiscoveryLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecentSearches();
        loadSuggestedUsers();
        loadCommunityBuzz();
        loadDiscoveryMedia(TRENDING_FILTERS[0]);
    }, [loadRecentSearches, loadSuggestedUsers, loadCommunityBuzz, loadDiscoveryMedia]);

    // ==========================================
    // 2. Active Search Logic
    // ==========================================
    const performSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
        const cleanQuery = searchQuery.trim();
        if (cleanQuery.length < 2 && !isDeepSearch) {
            setMovieResults([]);
            setUserResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            // Search Media
            let mediaPromise: Promise<{ results: MediaResult[]; hasMore: boolean }>;
            if (isDeepSearch) {
                const params = new URLSearchParams();
                if (cleanQuery) params.set('query', cleanQuery);
                if (selectedYear) params.set('year', selectedYear);
                if (selectedGenreId) params.set('genreId', selectedGenreId.toString());
                if (selectedMediaType !== 'all') params.set('mediaType', selectedMediaType);
                params.set('sortBy', selectedSortBy);
                params.set('page', pageNum.toString());

                mediaPromise = apiClient.get<any>(`/tmdb/discover?${params.toString()}`).then((data: any) => {
                    const raw = (data.results || []).map((r: any) => ({
                        ...r,
                        media_type: r.media_type || (selectedMediaType === 'tv' ? 'tv' : 'movie'),
                    }));
                    let filtered = raw.map((r: any) => ({
                        id: Number(r.id),
                        title: r.title || r.name || r.original_title || r.original_name || 'Untitled',
                        posterPath: r.poster_path || r.backdrop_path || null,
                        backdropPath: r.backdrop_path || null,
                        releaseDate: r.release_date || r.first_air_date || null,
                        overview: r.overview || null,
                        mediaType: (r.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
                        voteAverage: typeof r.vote_average === 'number' ? r.vote_average : undefined,
                        year: (r.release_date || r.first_air_date || '').substring(0, 4),
                    }));

                    if (cleanQuery) {
                        filtered = [...filtered].sort((a: any, b: any) => {
                            const scoreA = calculateFuzzyScore(cleanQuery, a.title);
                            const scoreB = calculateFuzzyScore(cleanQuery, b.title);
                            return scoreB - scoreA;
                        });
                    }
                    return {
                        results: filtered,
                        hasMore: data.page < data.total_pages,
                    };
                });
            } else {
                mediaPromise = searchService.searchMedia(cleanQuery, pageNum).then(({ results, page, totalPages }) => {
                    // Smart fuzzy ranking for typos and misspellings
                    const sorted = [...results].sort((a, b) => {
                        const scoreA = calculateFuzzyScore(cleanQuery, a.title);
                        const scoreB = calculateFuzzyScore(cleanQuery, b.title);
                        return scoreB - scoreA;
                    });
                    return {
                        results: sorted,
                        hasMore: page < totalPages,
                    };
                });
            }

            // Search Users
            const usersPromise = searchService.searchUsers(cleanQuery, pageNum, 10);

            const [mediaRes, usersRes] = await Promise.all([mediaPromise, usersPromise]);

            if (pageNum === 1) {
                setMovieResults(mediaRes.results);
                setUserResults(usersRes.users);
            } else {
                setMovieResults(prev => [...prev, ...mediaRes.results]);
                setUserResults(prev => [...prev, ...usersRes.users]);
            }

            setMovieHasMore(mediaRes.hasMore);
            setUserHasMore(usersRes.hasMore);
            setMoviePage(pageNum);
            setUserPage(pageNum);
        } catch (err: any) {
            console.error('Search failed:', err);
            setSearchError('Search is currently unavailable. Please check your connection or try again.');
        } finally {
            setIsSearching(false);
        }
    }, [isDeepSearch, selectedYear, selectedGenreId, selectedMediaType, selectedSortBy]);

    // Debounced Search Trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2 || isDeepSearch) {
                performSearch(query, 1);
            } else {
                setMovieResults([]);
                setUserResults([]);
                setIsSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, isDeepSearch, selectedYear, selectedGenreId, selectedMediaType, selectedSortBy, performSearch]);

    // Infinite scroll for active search tab
    const { observerTarget } = useInfiniteScroll({
        onLoadMore: () => performSearch(query, (activeTab === 'media' ? moviePage : userPage) + 1),
        hasMore: activeTab === 'media' ? movieHasMore : userHasMore,
        isLoading: isSearching,
        enabled: isOnline && !searchError && query.trim().length >= 2,
    });

    // ==========================================
    // 3. User Interactions & Navigation
    // ==========================================
    const handleSelectTerm = (term: string) => {
        setQuery(term);
        const updated = searchService.addRecentSearch(term);
        setRecentSearches(updated);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleRemoveRecentSearch = (e: React.MouseEvent, term: string) => {
        e.stopPropagation();
        const updated = searchService.removeRecentSearch(term);
        setRecentSearches(updated);
    };

    const handleClearRecentSearches = () => {
        searchService.clearRecentSearches();
        setRecentSearches([]);
    };

    const handleMediaClick = (media: MediaResult) => {
        searchService.addRecentSearch(media.title);
        loadRecentSearches();
        navigate(`/watch-hive/details/${media.mediaType}/${media.id}`);
    };

    const handleUserClick = (user: User) => {
        searchService.addRecentSearch(user.displayName || user.username);
        loadRecentSearches();
        navigate(`/watch-hive/profile/${user.id}`);
    };

    const handleFollowToggle = async (e: React.MouseEvent, targetUser: User) => {
        e.preventDefault();
        e.stopPropagation();

        const userId = targetUser.id;
        if (followingLoadingMap[userId]) return;

        setFollowingLoadingMap(prev => ({ ...prev, [userId]: true }));

        const originalFollowing = targetUser.isFollowing;
        const originalRequested = targetUser.isRequested;

        let nextFollowing = originalFollowing;
        let nextRequested = originalRequested;

        if (originalFollowing || originalRequested) {
            nextFollowing = false;
            nextRequested = false;
        } else {
            const isPrivate = targetUser.privacyLevel === 'FOLLOWERS_ONLY' || targetUser.privacyLevel === 'PRIVATE' || targetUser.isPrivate;
            if (isPrivate) {
                nextRequested = true;
            } else {
                nextFollowing = true;
            }
        }

        // Optimistic update on both suggested and search results
        setUserResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: nextFollowing, isRequested: nextRequested } : u));
        setSuggestedUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: nextFollowing, isRequested: nextRequested } : u));

        try {
            if (originalFollowing || originalRequested) {
                await userService.unfollowUser(userId);
            } else {
                await userService.followUser(userId);
            }
        } catch (err) {
            console.error('Follow toggle error:', err);
            // Rollback
            setUserResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: originalFollowing, isRequested: originalRequested } : u));
            setSuggestedUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: originalFollowing, isRequested: originalRequested } : u));
        } finally {
            setFollowingLoadingMap(prev => ({ ...prev, [userId]: false }));
        }
    };

    const showSearchResults = query.trim().length >= 2;

    return (
        <PageLayout maxWidth="5xl">
            {/* Header Title and Search Bar */}
            <div className="flex flex-col items-center justify-center text-center gap-3 pt-2 pb-4 animate-slide-up">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-2">
                        Explore the <span className="text-[#ffb700]">Universe</span>
                    </h1>
                    <p className="text-[#2D2926]/40 text-[11px] md:text-xs font-black uppercase tracking-[0.2em]">
                        Find your tribe &amp; discover cinematic masterpieces
                    </p>
                </div>

                {/* Main Search Input */}
                <div className="w-full max-w-2xl relative group mt-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-[#ffb700]">
                        <span className="material-symbols-outlined text-2xl group-focus-within:rotate-12 transition-all">search</span>
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && query.trim()) {
                                handleSelectTerm(query.trim());
                            }
                        }}
                        placeholder="Search movies, TV shows, cinephiles..."
                        className="w-full py-4 pl-14 pr-12 text-base md:text-lg bg-white border-2 border-black/5 rounded-full shadow-lg shadow-black/5 text-[#2D2926] font-bold outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all placeholder:text-slate-300 placeholder:font-bold"
                    />
                    {query.trim().length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                if (searchInputRef.current) searchInputRef.current.focus();
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    )}
                    {isSearching && (
                        <div className="absolute inset-y-0 right-12 flex items-center pr-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#ffb700] border-t-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Active Search Tabs (when searching query >= 2 chars) */}
                {showSearchResults && (
                    <div className="bg-[#2D2926]/5 p-1.5 rounded-full flex items-center gap-1 mt-4 border border-black/5 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setActiveTab('media')}
                            className={`relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'media' ? 'text-black' : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {activeTab === 'media' && (
                                <motion.div layoutId="searchTabBg" className="absolute inset-0 bg-[#ffb700] rounded-full shadow-md shadow-[#ffb700]/20" />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base">movie</span>
                                Media ({movieResults.length})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('people')}
                            className={`relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'people' ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {activeTab === 'people' && (
                                <motion.div layoutId="searchTabBg" className="absolute inset-0 bg-slate-800 rounded-full shadow-md shadow-black/20" />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base">group</span>
                                People ({userResults.length})
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Offline Alert */}
            {!isOnline && <ErrorState message="You are offline. Universal search requires a network connection." />}

            {/* Error Message */}
            {searchError && (
                <div className="mt-4">
                    <ErrorState message={searchError} onRetry={() => performSearch(query, 1)} />
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEW A: ACTIVE SEARCH VIEW (query >= 2 characters)        */}
            {/* ========================================================= */}
            {showSearchResults ? (
                <div className="mt-6 flex flex-col gap-6">
                    {/* MEDIA TAB CONTENT */}
                    {activeTab === 'media' && (
                        <div className="flex flex-col gap-4">
                            {/* Optional Deep Search Filters Control */}
                            <div className="w-full flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsDeepSearch(prev => !prev)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                            isDeepSearch
                                                ? 'bg-[#ffb700] text-black shadow-md shadow-[#ffb700]/30'
                                                : 'bg-white border border-black/10 text-[#2D2926] hover:border-[#ffb700] hover:text-[#ffb700]'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-base transition-transform duration-300 ${isDeepSearch ? 'rotate-180 text-black' : 'text-[#ffb700]'}`}>
                                            tune
                                        </span>
                                        <span>{isDeepSearch ? 'Deep Filters Active' : 'Filter Options'}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isDeepSearch ? 'bg-black/15 text-black' : 'bg-[#ffb700]/15 text-[#ffb700]'}`}>
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
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 bg-white/95 backdrop-blur-xl border border-[#ffb700]/25 rounded-3xl shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                                                {/* Year */}
                                                <div className="flex flex-col gap-1 col-span-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Year</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 2024"
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(e.target.value)}
                                                        className="w-full px-3 py-2 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700]"
                                                    />
                                                </div>
                                                {/* Format */}
                                                <div className="flex flex-col gap-1 col-span-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Format</label>
                                                    <select
                                                        value={selectedMediaType}
                                                        onChange={(e) => setSelectedMediaType(e.target.value as any)}
                                                        className="w-full px-3 py-2 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] cursor-pointer"
                                                    >
                                                        <option value="all">All Types</option>
                                                        <option value="movie">Movies</option>
                                                        <option value="tv">TV Shows</option>
                                                    </select>
                                                </div>
                                                {/* Genre */}
                                                <div className="flex flex-col gap-1 col-span-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Genre</label>
                                                    <select
                                                        value={selectedGenreId}
                                                        onChange={(e) => setSelectedGenreId(Number(e.target.value))}
                                                        className="w-full px-3 py-2 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] cursor-pointer"
                                                    >
                                                        {TMDB_GENRES.map(g => (
                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* Sort */}
                                                <div className="flex flex-col gap-1 col-span-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sort By</label>
                                                    <select
                                                        value={selectedSortBy}
                                                        onChange={(e) => setSelectedSortBy(e.target.value)}
                                                        className="w-full px-3 py-2 bg-[#FFF9F0]/60 border border-[#ffb700]/20 rounded-xl font-bold text-xs text-[#2D2926] outline-none focus:border-[#ffb700] cursor-pointer"
                                                    >
                                                        <option value="popularity.desc">🔥 Popularity</option>
                                                        <option value="primary_release_date.desc">📅 Release Date</option>
                                                        <option value="vote_average.desc">⭐ Rating</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Media List Results */}
                            {isSearching && movieResults.length === 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <MovieSearchSkeleton key={i} />
                                    ))}
                                </div>
                            ) : movieResults.length === 0 ? (
                                <div className="py-16 text-center">
                                    <EmptyState
                                        title="No movies or series found"
                                        message={`Try searching with another title or adjusting filters.`}
                                        icon={<span className="material-symbols-outlined text-5xl text-slate-300">movie_filter</span>}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {movieResults.map(movie => (
                                        <button
                                            key={`${movie.mediaType}-${movie.id}`}
                                            type="button"
                                            onClick={() => handleMediaClick(movie)}
                                            className="group flex items-center gap-4 p-4 bg-white border border-black/5 rounded-3xl text-left shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
                                        >
                                            <div className="w-16 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                {movie.posterPath ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w185${movie.posterPath}`}
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">
                                                        NO IMG
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
                                                        {movie.mediaType === 'tv' ? '📺 TV' : '🎬 Movie'}
                                                    </span>
                                                    {movie.year && (
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            {movie.year}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-black text-[#2D2926] text-base leading-snug group-hover:text-[#ffb700] transition-colors truncate">
                                                    {movie.title}
                                                </h3>
                                                {movie.voteAverage !== undefined && movie.voteAverage > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <div className="flex text-[#ffb700]">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`material-symbols-outlined text-[13px] ${
                                                                        i < Math.round((movie.voteAverage || 0) / 2) ? 'filled text-[#ffb700]' : 'opacity-20 text-slate-400'
                                                                    }`}
                                                                >
                                                                    star
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-black text-[#ffb700]">
                                                            {movie.voteAverage.toFixed(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#ffb700] transition-colors flex-shrink-0">
                                                <span className="material-symbols-outlined text-slate-400 group-hover:text-black transition-colors text-lg">
                                                    arrow_forward
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PEOPLE TAB CONTENT */}
                    {activeTab === 'people' && (
                        <div className="flex flex-col gap-3">
                            {isSearching && userResults.length === 0 ? (
                                <div className="flex flex-col gap-3">
                                    {[...Array(6)].map((_, i) => (
                                        <UserSearchSkeleton key={i} />
                                    ))}
                                </div>
                            ) : userResults.length === 0 ? (
                                <div className="py-16 text-center">
                                    <EmptyState
                                        title="No users found"
                                        message={`Try searching with another username or name.`}
                                        icon={<span className="material-symbols-outlined text-5xl text-slate-300">person_search</span>}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {userResults.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleUserClick(user)}
                                            className="group flex items-center justify-between p-4 bg-white border border-black/5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <Avatar
                                                    src={user.profilePictureUrl}
                                                    name={user.displayName || user.username}
                                                    size="lg"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-black text-[#2D2926] text-base group-hover:text-[#ffb700] transition-colors truncate">
                                                            {user.displayName || user.username}
                                                        </h3>
                                                        {user.isPrivate && (
                                                            <span className="material-symbols-outlined text-sm text-slate-400">
                                                                lock
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-[#ffb700] tracking-tight">
                                                        @{user.username}
                                                    </p>
                                                    {user.bio && (
                                                        <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm">
                                                            {user.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleFollowToggle(e, user)}
                                                    onMouseEnter={() => setHoveredRequestedUserId(user.id)}
                                                    onMouseLeave={() => setHoveredRequestedUserId(null)}
                                                    disabled={followingLoadingMap[user.id]}
                                                    className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                                        user.isFollowing
                                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            : user.isRequested
                                                            ? 'bg-amber-50 text-amber-600 hover:bg-rose-50 hover:text-rose-600 border border-amber-200'
                                                            : 'bg-[#ffb700] text-black shadow-md shadow-[#ffb700]/20 hover:brightness-105'
                                                    }`}
                                                >
                                                    {followingLoadingMap[user.id] ? (
                                                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                                    ) : user.isFollowing ? (
                                                        'Following'
                                                    ) : user.isRequested ? (
                                                        hoveredRequestedUserId === user.id ? 'Cancel ✕' : 'Requested 🔒'
                                                    ) : (
                                                        'Follow'
                                                    )}
                                                </button>
                                                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 transition-colors">
                                                    chevron_right
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Infinite scroll loader trigger */}
                    <div ref={observerTarget} className="h-14 w-full" />
                    {isSearching && (movieResults.length > 0 || userResults.length > 0) && (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ffb700] border-t-transparent"></div>
                        </div>
                    )}
                </div>
            ) : (
                /* ========================================================= */
                /* VIEW B: DISCOVERY VIEW (query < 2 characters)              */
                /* ========================================================= */
                <div className="mt-6 flex flex-col gap-8 pb-12">
                    {/* 1. Recent Searches Section */}
                    {recentSearches.length > 0 && (
                        <section className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-slate-400">history</span>
                                    <h2 className="text-sm font-black text-[#2D2926] tracking-tight uppercase">
                                        Recent Searches
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearRecentSearches}
                                    className="text-xs font-black text-[#ffb700] hover:text-[#e59700] transition-colors uppercase tracking-wider"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {recentSearches.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => handleSelectTerm(term)}
                                        className="group flex items-center gap-2 px-3.5 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[#2D2926] shadow-sm hover:border-[#ffb700]/50 hover:bg-[#FFF9F0]/60 transition-all flex-shrink-0"
                                    >
                                        <span>{term}</span>
                                        <span
                                            onClick={(e) => handleRemoveRecentSearch(e, term)}
                                            className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-500 hover:!text-red-500 transition-colors"
                                        >
                                            close
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 2. Suggested Cinephiles Section */}
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl text-[#ffb700]">stars</span>
                                <h2 className="text-lg font-black text-[#2D2926] tracking-tight">
                                    Suggested Cinephiles 🐝
                                </h2>
                            </div>
                            {suggestedUsers.length > 0 && (
                                <button
                                    type="button"
                                    onClick={loadSuggestedUsers}
                                    className="text-xs font-bold text-slate-400 hover:text-[#ffb700] transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                    Refresh
                                </button>
                            )}
                        </div>

                        {isSuggestedLoading ? (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-36 h-44 bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-2.5 border border-black/5 animate-pulse flex-shrink-0"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100" />
                                        <div className="w-20 h-3.5 bg-slate-100 rounded-full" />
                                        <div className="w-14 h-2.5 bg-slate-100 rounded-full" />
                                        <div className="w-full h-7 bg-slate-100 rounded-xl mt-1" />
                                    </div>
                                ))}
                            </div>
                        ) : suggestedUsers.length === 0 ? null : (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {suggestedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        className="w-36 sm:w-40 bg-white border border-black/5 rounded-3xl p-3.5 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex-shrink-0 group"
                                    >
                                        <div className="flex flex-col items-center w-full">
                                            <Avatar
                                                src={user.profilePictureUrl}
                                                name={user.displayName || user.username}
                                                size="md"
                                            />
                                            <h3 className="font-bold text-xs text-[#2D2926] group-hover:text-[#ffb700] transition-colors mt-2 truncate w-full">
                                                {user.displayName || user.username}
                                            </h3>
                                            <p className="text-[10px] font-semibold text-slate-400 truncate w-full">
                                                @{user.username}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleFollowToggle(e, user)}
                                            disabled={followingLoadingMap[user.id]}
                                            className={`w-full mt-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                                                user.isFollowing
                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    : 'bg-[#ffb700] text-black shadow-sm hover:brightness-105'
                                            }`}
                                        >
                                            {followingLoadingMap[user.id] ? (
                                                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            ) : user.isFollowing ? (
                                                'Following'
                                            ) : (
                                                'Follow'
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 3. Community Buzz Topics Section */}
                    {communityBuzz.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 px-1">
                                <span className="material-symbols-outlined text-xl text-[#ffb700]">trending_up</span>
                                <h2 className="text-lg font-black text-[#2D2926] tracking-tight">
                                    Buzzing in the Hive 🐝
                                </h2>
                            </div>
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                                {communityBuzz.map((item, idx) => (
                                    <button
                                        key={`${item.title}-${idx}`}
                                        type="button"
                                        onClick={() => handleSelectTerm(item.title)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-full text-xs font-bold text-[#2D2926] shadow-sm hover:border-[#ffb700] hover:bg-[#FFF9F0] transition-all flex-shrink-0 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm text-[#ffb700]">bolt</span>
                                        <span>
                                            <strong className="font-extrabold">{item.title}</strong> · <span className="text-slate-400 font-medium">{item.context || 'Trending'}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 4. Trending & Popular Media Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-2xl text-amber-500">local_fire_department</span>
                                <h2 className="text-xl font-black text-[#2D2926] tracking-tight">
                                    Trending &amp; Popular
                                </h2>
                            </div>
                            {discoveryMedia.length > 0 && (
                                <span className="text-xs font-bold text-slate-400">
                                    {discoveryMedia.length} titles
                                </span>
                            )}
                        </div>

                        {/* Filter Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {TRENDING_FILTERS.map((filter) => {
                                const isSelected = selectedFilter.id === filter.id;
                                return (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        onClick={() => loadDiscoveryMedia(filter)}
                                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                                            isSelected
                                                ? 'bg-[#ffb700] text-black shadow-md shadow-[#ffb700]/25'
                                                : 'bg-white border border-black/10 text-slate-600 hover:text-black hover:border-black/20'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Discovery Media Grid */}
                        {isDiscoveryLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="aspect-[2/3] bg-white rounded-3xl animate-pulse border border-black/5"
                                    />
                                ))}
                            </div>
                        ) : discoveryMedia.length === 0 ? (
                            <div className="py-16 text-center">
                                <EmptyState
                                    title="No trending titles available"
                                    message="Unable to load media titles at the moment."
                                    actionLabel="Retry Loading"
                                    onAction={() => loadDiscoveryMedia(selectedFilter)}
                                    icon={<span className="material-symbols-outlined text-5xl text-slate-300">movie_creation</span>}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                {discoveryMedia.map((media) => (
                                    <div
                                        key={`${media.mediaType}-${media.id}`}
                                        onClick={() => handleMediaClick(media)}
                                        className="group relative aspect-[2/3] bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                    >
                                        {/* Poster Image */}
                                        {media.posterPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w342${media.posterPath}`}
                                                alt={media.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-800 text-white/40">
                                                <span className="material-symbols-outlined text-3xl mb-1">movie</span>
                                                <span className="text-[10px] font-black uppercase">No Image</span>
                                            </div>
                                        )}

                                        {/* Top Badges */}
                                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                                            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">
                                                {media.mediaType === 'tv' ? '📺 TV' : '🎬 MOVIE'}
                                            </span>
                                            {media.voteAverage !== undefined && media.voteAverage > 0 && (
                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#ffb700] text-black text-[10px] font-black shadow-sm">
                                                    <span className="material-symbols-outlined text-[11px] filled">star</span>
                                                    {media.voteAverage.toFixed(1)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom Gradient & Text Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 pt-16 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end text-left pointer-events-none z-10">
                                            <h3 className="font-extrabold text-white text-xs sm:text-sm line-clamp-2 leading-tight drop-shadow-md">
                                                {media.title}
                                            </h3>
                                            {media.year && (
                                                <span className="text-[11px] font-bold text-white/70 mt-0.5">
                                                    {media.year}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </PageLayout>
    );
};

export default SearchUsersPage;
