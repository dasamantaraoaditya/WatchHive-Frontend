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
}

export interface CreateSuggestionData {
    toUserId: string;
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

    deleteSuggestion: async (id: string): Promise<void> => {
        await apiClient.delete(`/suggestions/${id}`);
    }
};

export default suggestionsApi;
