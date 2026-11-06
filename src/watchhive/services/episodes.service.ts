import apiClient from './api';

export interface WatchedEpisodeRecord {
    id: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeName?: string | null;
    watchedAt: string;
    rating?: string | null;
    review?: string | null;
}

export interface ShowProgress {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    currentSeason: number | null;
    currentEpisode: number | null;
    totalEpisodesWatched: number;
    totalEpisodesCount: number | null;
    progressPercentage: number;
    watchedEpisodes: WatchedEpisodeRecord[];
    nextEpisodeUp: {
        seasonNumber: number;
        episodeNumber: number;
        name?: string;
        stillPath?: string;
        airDate?: string;
    } | null;
}

export interface ContinueWatchingItem {
    entryId?: string;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    currentSeason: number;
    currentEpisode: number;
    totalEpisodesWatched: number;
    totalEpisodesCount: number | null;
    progressPercentage: number;
    nextEpisodeUp: {
        seasonNumber: number;
        episodeNumber: number;
        name?: string;
        stillPath?: string;
        airDate?: string;
    } | null;
    lastWatchedAt: string;
}

export interface FriendShowProgress {
    user: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    currentSeason: number | null;
    currentEpisode: number | null;
    totalEpisodesWatched: number;
    totalEpisodesCount: number | null;
    isWatching: boolean;
}

export const episodesApi = {
    getShowProgress: async (tmdbId: number): Promise<ShowProgress> => {
        const response: any = await apiClient.get(`/shows/${tmdbId}/progress`);
        return response;
    },

    toggleEpisodeWatch: async (
        tmdbId: number,
        data: {
            seasonNumber: number;
            episodeNumber: number;
            episodeId?: number;
            episodeName?: string;
            isWatched?: boolean;
            rating?: number;
            review?: string;
            postToFeed?: boolean;
        }
    ): Promise<{ success: boolean; progress: ShowProgress }> => {
        const response: any = await apiClient.post(`/shows/${tmdbId}/episodes/watch`, data);
        return response;
    },

    batchCatchUp: async (
        tmdbId: number,
        data: {
            upToSeason: number;
            upToEpisode: number;
        }
    ): Promise<{ success: boolean; progress: ShowProgress }> => {
        const response: any = await apiClient.post(`/shows/${tmdbId}/episodes/batch-catch-up`, data);
        return response;
    },

    getContinueWatching: async (limit: number = 15): Promise<ContinueWatchingItem[]> => {
        const response: any = await apiClient.get(`/users/me/continue-watching?limit=${limit}`);
        return response.items || [];
    },

    getFriendsProgress: async (tmdbId: number): Promise<FriendShowProgress[]> => {
        const response: any = await apiClient.get(`/shows/${tmdbId}/friends-progress`);
        return response.friends || [];
    },
};
