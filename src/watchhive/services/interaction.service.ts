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

export const interactionService = {
    // Likes
    likeEntry: async (entryId: string) => {
        return await apiClient.post<{ message: string, like: any, likeCount: number }>(`/likes/${entryId}`);
    },

    unlikeEntry: async (entryId: string) => {
        return await apiClient.delete<{ message: string, likeCount: number }>(`/likes/${entryId}`);
    },

    // Comments
    getComments: async (entryId: string, page = 1) => {
        return await apiClient.get<{ comments: Comment[], pagination: any }>(`/comments/${entryId}?page=${page}`);
    },

    addComment: async (entryId: string, content: string) => {
        return await apiClient.post<{ message: string, comment: Comment, commentCount: number }>(`/comments/${entryId}`, { content });
    },

    deleteComment: async (commentId: string) => {
        return await apiClient.delete<{ message: string, commentCount: number }>(`/comments/${commentId}`);
    },
};
