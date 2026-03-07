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

export const feedApi = {
    // Fetch paginated feed
    getFeed: async (page = 1, limit = 20): Promise<FeedResponse> => {
        // apiClient.get returns response.data directly based on api.ts implementation
        return apiClient.get('/feed', { params: { page, limit } });
    }
};

export default feedApi;
