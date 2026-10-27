import apiClient from './api.js';

export interface Suggestion {
    id: string;
    fromUserId: string;
    toUserId: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    message: string | null;
    status: 'pending' | 'accepted' | 'ignored';
    createdAt: string;
    recipient?: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    };
}

export interface GroupedSuggestion {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    suggestions: Suggestion[];
    suggestors: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    }[];
    recipients?: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    }[];
}

export interface CreateSuggestionData {
    toUserId?: string;
    toUserIds?: string[];
    tmdbId: number;
    title: string;
    mediaType?: 'movie' | 'tv';
    message?: string;
}

export const suggestionsApi = {
    sendSuggestion: async (data: CreateSuggestionData): Promise<Suggestion> => {
        return await apiClient.post<Suggestion>('/suggestions', data);
    },

    getMySuggestions: async (): Promise<GroupedSuggestion[]> => {
        return await apiClient.get<GroupedSuggestion[]>('/suggestions/me');
    },

    getSentSuggestions: async (): Promise<GroupedSuggestion[]> => {
        return await apiClient.get<GroupedSuggestion[]>('/suggestions/sent');
    },

    deleteSuggestion: async (id: string): Promise<void> => {
        await apiClient.delete(`/suggestions/${id}`);
    },

    getSmartSuggestions: async (mode: 'social' | 'critic' | 'explore' = 'social', limit: number = 10): Promise<SmartSuggestResponse> => {
        return await apiClient.get<SmartSuggestResponse>('/suggestions/smart-suggest', {
            params: { mode, limit }
        });
    }
};

export interface SmartSuggestBadge {
    type: 'friend_pick' | 'network_buzz' | 'critical_acclaim' | 'palate_cleanser' | 'taste_match' | 'watchlist';
    label: string;
    avatarUrl?: string | null;
    meta?: string;
}

export interface SmartSuggestItem {
    tmdbId: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath: string | null;
    backdropPath: string | null;
    overview: string | null;
    releaseDate: string | null;
    voteAverage: number;
    voteCount: number;
    score: number;
    badges: SmartSuggestBadge[];
    genreNames: string[];
    suggestedBy?: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
        note?: string | null;
    } | null;
}

export interface SmartSuggestResponse {
    mode: 'social' | 'critic' | 'explore';
    items: SmartSuggestItem[];
    lastWatchedTitle?: string | null;
    lastWatchedGenre?: string | null;
}

export default suggestionsApi;
