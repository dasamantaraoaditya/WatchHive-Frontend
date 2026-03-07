import api from './api';

export interface FollowStatus {
    isFollowing: boolean;
    isRequested: boolean;
    followedAt: string | null;
}

export const followsService = {
    followUser: async (userId: string) => {
        return await api.post<{ message: string, status: 'requested' | 'following' }>(`/follows/${userId}`);
    },

    unfollowUser: async (userId: string) => {
        return await api.delete<{ message: string }>(`/follows/${userId}`);
    },

    getFollowStatus: async (userId: string) => {
        return await api.get<FollowStatus>(`/follows/${userId}/status`);
    },

    getPendingRequests: async () => {
        return await api.get<any[]>('/follows/requests/pending');
    },

    acceptRequest: async (requestId: string) => {
        return await api.post<{ message: string }>(`/follows/requests/${requestId}/accept`);
    },

    rejectRequest: async (requestId: string) => {
        return await api.post<{ message: string }>(`/follows/requests/${requestId}/reject`);
    }
};

export default followsService;
