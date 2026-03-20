import apiClient from './api';

export interface FeedItem {
    type: 'ENTRY' | 'SUGGESTION';
    id: string;
    data: any; // Ideally this should be Entry | TMDbMovie but using any for flexibility
    timestamp?: string;
    reason?: string;
}

export interface FeedResponse {
    items: FeedItem[];
    nextPage: number | null;
    hasMore: boolean;
}

export interface TrendingItem {
    title: string;
    context: string;
    buzzes: number;
    tmdbId?: number;
}

export const feedApi = {
    // Fetch paginated feed
    getFeed: async (page = 1, limit = 10): Promise<FeedResponse> => {
        // apiClient.get returns response.data directly based on api.ts implementation
        return apiClient.get('/feed', { params: { page, limit } });
    },
    
    // Fetch trending topics
    getTrending: async (): Promise<{ trending: TrendingItem[] }> => {
        return apiClient.get('/feed/trending');
    }
};

export default feedApi;
