import { apiClient } from './api';

export interface MoodPrediction {
    mood: string;
    status: string;
    description: string;
    icon: string;
    confidence: number;
    recentTitles: string[];
}

export interface BehavioralTrail {
    title: string;
    value: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
}

export interface UserBadge {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    isUnlocked: boolean;
    progress: number;
    target: number;
}

export interface DailyTimeSeriesPoint {
    date: string;
    count: number;
    items?: { id: string; title: string; type: string; rating?: string; watchedAt?: string }[];
}

export interface MindLensData {
    hasEnoughData: boolean;
    message?: string;
    userProfile?: {
        totalEntries: number;
        primaryMood: string;
    };
    persona?: {
        name: string;
        description: string;
        icon: string;
        imageUrl?: string;
        color: string;
    };
    moodPrediction?: MoodPrediction;
    behavioralTrails?: BehavioralTrail[];
    badges?: UserBadge[];
    dailyTimeSeries?: DailyTimeSeriesPoint[];
    themes?: { name: string; score: number }[];
    timeDistribution?: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
    insights?: string[];
    aesthetics?: string[];
    generatedAt?: string;
}

export const mindLensApi = {
    getInsights: async (): Promise<MindLensData> => {
        return await apiClient.get<MindLensData>('/mindlens/insights');
    }
};
