import { apiClient } from './api';

export interface MindLensData {
    hasEnoughData: boolean;
    message?: string;
    userProfile?: {
        totalEntries: number;
        primaryMood: string;
    };
    themes?: { name: string; score: number }[];
    persona?: {
        name: string;
        description: string;
        icon: string;
        color: string;
    };
    timeDistribution?: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
    insights?: string[];
    generatedAt?: string;
}

export const mindLensApi = {
    getInsights: async (): Promise<MindLensData> => {
        return await apiClient.get<MindLensData>('/mindlens/insights');
    }
};
