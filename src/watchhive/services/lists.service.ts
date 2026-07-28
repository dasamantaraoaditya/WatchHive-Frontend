import apiClient from './api.js';

export type ListType = 'WATCHLIST' | 'RANKING_STACK' | 'COLLECTION';

export interface ListItem {
    id: string;
    listId: string;
    tmdbId: number;
    mediaType?: string;
    orderIndex: number;
    addedAt: string;
    // Metadata from entries (if joined)
    localRating?: string;
    localReview?: string;
    tags?: string[];
    watchedAt?: string;
    title?: string;
}

export interface List {
    id: string;
    userId: string;
    name: string;
    description?: string;
    type: ListType;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    items?: ListItem[];
}

export interface RankedListResponse {
    list: List;
    items: ListItem[];
}

export const listsApi = {
    getLists: async (): Promise<List[]> => {
        return await apiClient.get<List[]>('/lists');
    },

    createList: async (data: Partial<List>): Promise<List> => {
        return await apiClient.post<List>('/lists', data);
    },

    updateList: async (listId: string, data: Partial<List>): Promise<List> => {
        return await apiClient.patch<List>(`/lists/${listId}`, data);
    },

    deleteList: async (listId: string): Promise<void> => {
        await apiClient.delete(`/lists/${listId}`);
    },

    getWatchlist: async (): Promise<List> => {
        return await apiClient.get<List>('/lists/watchlist');
    },

    getRankedList: async (listId: string, filters?: { genre?: string }): Promise<RankedListResponse> => {
        const query = filters?.genre ? `?genre=${filters.genre}` : '';
        return await apiClient.get<RankedListResponse>(`/lists/${listId}/ranked${query}`);
    },

    addToStack: async (listId: string, tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<ListItem> => {
        return await apiClient.post<ListItem>(`/lists/${listId}/items`, { tmdbId, mediaType });
    },

    removeFromStack: async (listId: string, tmdbId: number): Promise<void> => {
        await apiClient.delete(`/lists/${listId}/items/${tmdbId}`);
    },

    reorderStack: async (listId: string, items: { tmdbId: number; orderIndex: number }[]): Promise<void> => {
        await apiClient.patch(`/lists/${listId}/reorder`, { items });
    },

    // Aliases for the default watchlist
    addToWatchlist: async (listId: string, tmdbId: number, mediaType?: 'movie' | 'tv'): Promise<ListItem> => {
        return await listsApi.addToStack(listId, tmdbId, mediaType);
    },

    removeFromWatchlist: async (listId: string, tmdbId: number): Promise<void> => {
        return await listsApi.removeFromStack(listId, tmdbId);
    },

    getUserWatchlist: async (userId: string): Promise<List> => {
        return await apiClient.get<List>(`/users/${userId}/watchlist`);
    },

    getUserRankings: async (userId: string): Promise<List[]> => {
        return await apiClient.get<List[]>(`/lists/user/${userId}/rankings`);
    }
};

export default listsApi;
