import { apiClient } from './api';

export interface Comment {
    id: string;
    userId: string;
    entryId: string;
    content: string;
    createdAt: string;
    parentCommentId: string | null;
    user: {
        id: string;
        username: string;
        displayName: string;
        profilePictureUrl: string | null;
    };
    replies?: Comment[];
}

export interface LikedUser {
    id: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    likedAt?: string;
}

export interface EntryLikesResponse {
    likes: LikedUser[];
    pagination: {
        page: number;
        limit: number;
        offset: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export const interactionService = {
    // Likes
    likeEntry: async (entryId: string) => {
        return await apiClient.post<{ message: string, like: any, likeCount: number }>(`/likes/${entryId}`);
    },

    unlikeEntry: async (entryId: string) => {
        return await apiClient.delete<{ message: string, likeCount: number }>(`/likes/${entryId}`);
    },

    getEntryLikes: async (entryId: string, limit = 3, offset = 0) => {
        return await apiClient.get<EntryLikesResponse>(
            `/likes/${entryId}?limit=${limit}&offset=${offset}`
        );
    },

    // Comments
    getComments: async (entryId: string, page = 1) => {
        return await apiClient.get<{ comments: Comment[], pagination: any }>(`/comments/${entryId}?page=${page}`);
    },

    addComment: async (entryId: string, content: string, parentCommentId?: string) => {
        return await apiClient.post<{ message: string, comment: Comment, commentCount: number }>(
            `/comments/${entryId}`,
            { content, ...(parentCommentId ? { parentCommentId } : {}) }
        );
    },

    deleteComment: async (commentId: string) => {
        return await apiClient.delete<{ message: string, commentCount: number }>(`/comments/${commentId}`);
    },
};
