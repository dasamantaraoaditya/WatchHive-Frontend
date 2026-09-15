import apiClient from './api';
import { User } from '../types';
import { TrendingItem } from './feed.service';

export interface MediaResult {
    id: number;
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    releaseDate?: string | null;
    overview?: string | null;
    mediaType: 'movie' | 'tv';
    voteAverage?: number;
    year: string;
}

export type TrendingFilterCategory = 'trending' | 'popular';

export interface TrendingFilterOption {
    id: string;
    label: string;
    mediaType: 'all' | 'movie' | 'tv';
    category: TrendingFilterCategory;
}

export const TRENDING_FILTERS: TrendingFilterOption[] = [
    { id: 'allTrending', label: '🔥 All Trending', mediaType: 'all', category: 'trending' },
    { id: 'trendingMovies', label: '🎬 Movies', mediaType: 'movie', category: 'trending' },
    { id: 'trendingTv', label: '📺 TV Shows', mediaType: 'tv', category: 'trending' },
    { id: 'popularMovies', label: '⭐ Popular Movies', mediaType: 'movie', category: 'popular' },
    { id: 'popularTv', label: '📺 Popular TV', mediaType: 'tv', category: 'popular' },
];

export const RECENT_SEARCHES_KEY = 'watchhive_recent_searches';

export function normalizeMediaResult(raw: any, fallbackMediaType?: 'movie' | 'tv'): MediaResult {
    const mediaType = (raw.media_type || fallbackMediaType || 'movie') === 'tv' ? 'tv' : 'movie';
    const releaseDate = raw.release_date || raw.first_air_date || null;
    const year = releaseDate ? String(releaseDate).substring(0, 4) : '';
    const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
    const posterPath = raw.poster_path || raw.backdrop_path || null;
    const voteAverage = typeof raw.vote_average === 'number' ? raw.vote_average : undefined;

    return {
        id: Number(raw.id),
        title,
        posterPath,
        backdropPath: raw.backdrop_path || null,
        releaseDate,
        overview: raw.overview || null,
        mediaType,
        voteAverage,
        year,
    };
}

export const searchService = {
    // TMDB Trending
    async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaResult[]> {
        try {
            const data: any = await apiClient.get(`/tmdb/trending/${mediaType}/${timeWindow}`);
            const results = data.results || [];
            return results
                .map((r: any) => normalizeMediaResult(r, mediaType === 'all' ? undefined : mediaType))
                .filter((r: MediaResult) => r.mediaType === 'movie' || r.mediaType === 'tv');
        } catch (error) {
            console.error('Error fetching trending media:', error);
            return [];
        }
    },

    // TMDB Popular
    async getPopular(type: 'movie' | 'tv' = 'movie'): Promise<MediaResult[]> {
        try {
            const endpoint = type === 'tv' ? '/tmdb/popular/tv' : '/tmdb/popular';
            const data: any = await apiClient.get(endpoint);
            const results = data.results || [];
            return results
                .map((r: any) => normalizeMediaResult(r, type))
                .filter((r: MediaResult) => r.mediaType === 'movie' || r.mediaType === 'tv');
        } catch (error) {
            console.error('Error fetching popular media:', error);
            return [];
        }
    },

    // Community Trending / Buzzing
    async getCommunityTrending(): Promise<TrendingItem[]> {
        try {
            const data: any = await apiClient.get('/feed/trending');
            return data.trending || [];
        } catch (error) {
            console.error('Error fetching community trending:', error);
            return [];
        }
    },

    // Suggested Cinephiles
    async getSuggestedUsers(): Promise<User[]> {
        try {
            const data: any = await apiClient.get('/users/suggested');
            return data.users || [];
        } catch (error) {
            console.error('Error fetching suggested users:', error);
            return [];
        }
    },

    // Search Media
    async searchMedia(query: string, page = 1): Promise<{ results: MediaResult[]; page: number; totalPages: number }> {
        const cleanQuery = query.trim();
        if (!cleanQuery) return { results: [], page: 1, totalPages: 0 };
        const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(cleanQuery)}&page=${page}`);
        const rawResults = (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
        const results = rawResults.map((r: any) => normalizeMediaResult(r));
        return {
            results,
            page: data.page || page,
            totalPages: data.total_pages || 1,
        };
    },

    // Search Users
    async searchUsers(query: string, page = 1, limit = 10): Promise<{ users: User[]; hasMore: boolean }> {
        const cleanQuery = query.trim();
        if (!cleanQuery) return { users: [], hasMore: false };
        const data: any = await apiClient.get(`/users/search?q=${encodeURIComponent(cleanQuery)}&page=${page}&limit=${limit}`);
        return {
            users: data.users || [],
            hasMore: data.hasMore || false,
        };
    },

    // Local Recent Searches
    getRecentSearches(): string[] {
        try {
            const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    },

    addRecentSearch(term: string): string[] {
        const clean = term.trim();
        if (!clean) return this.getRecentSearches();
        try {
            const current = this.getRecentSearches();
            const filtered = current.filter(item => item.toLowerCase() !== clean.toLowerCase());
            filtered.unshift(clean);
            const trimmed = filtered.slice(0, 8);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
            return trimmed;
        } catch (_) {
            return [];
        }
    },

    removeRecentSearch(term: string): string[] {
        try {
            const current = this.getRecentSearches();
            const filtered = current.filter(item => item.toLowerCase() !== term.trim().toLowerCase());
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
            return filtered;
        } catch (_) {
            return [];
        }
    },

    clearRecentSearches(): void {
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (_) {}
    },
};

export default searchService;
