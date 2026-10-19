import { apiClient } from './api';

export interface TasteBreadth {
    entropy: number;
    normalizedBreadth: number;
    label: string;
    description: string;
    genreDistribution: {
        genre: string;
        percentage: number;
        weight: number;
    }[];
}

export interface AffectiveState {
    mood: string;
    status: string;
    quadrant: string;
    valence: number;
    arousal: number;
    description: string;
    icon: string;
    confidence: number;
    recentTitles: string[];
}

export interface CriticalRigor {
    averageRating: number;
    variance: number;
    standardDeviation: number;
    label: string;
    reviewRatio: number;
    totalRated: number;
}

export interface CognitiveArchetype {
    id: string;
    name: string;
    tagline: string;
    description: string;
    icon: string;
    color: string;
    scientificBasis: string;
    coreTraits: string[];
}

export interface MoodPrediction {
    mood: string;
    status: string;
    description: string;
    icon: string;
    confidence: number;
    recentTitles: string[];
    quadrant?: string;
    valence?: number;
    arousal?: number;
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

export interface RecommenderStat {
    userId: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    totalSuggested: number;
    watchedCount: number;
    currentlyWatchingCount: number;
    conversionRate: number;
    avgRating: number | null;
    smoothedRating?: number;
    trustScore?: number;
    highHitCount: number;
    influenceScore: number;
    badge: string;
}

export interface SuggestionAnalytics {
    summary: {
        totalSuggestionsReceived: number;
        totalSuggestionsWatched: number;
        overallConversionRate: number;
        topInfluencerName: string | null;
        topInfluencerUsername: string | null;
        bestTasteMatchUsername: string | null;
    };
    recommenders: RecommenderStat[];
    outgoingImpact: {
        totalSent: number;
    };
}

export interface MindLensData {
    hasEnoughData: boolean;
    milestoneStage?: 'CALIBRATING' | 'FOUNDATIONAL' | 'FULL';
    calibrationProgress?: {
        current: number;
        target: number;
    };
    message?: string;
    userProfile?: {
        totalEntries: number;
        primaryMood: string;
        tasteBreadth?: TasteBreadth;
        criticalRigor?: CriticalRigor;
    };
    persona?: {
        name: string;
        tagline?: string;
        description: string;
        icon: string;
        imageUrl?: string;
        color: string;
        scientificBasis?: string;
        traits?: string[];
    };
    archetype?: CognitiveArchetype;
    tasteBreadth?: TasteBreadth;
    affectiveState?: AffectiveState;
    criticalRigor?: CriticalRigor;
    moodPrediction?: MoodPrediction;
    behavioralTrails?: BehavioralTrail[];
    badges?: UserBadge[];
    dailyTimeSeries?: DailyTimeSeriesPoint[];
    suggestionAnalytics?: SuggestionAnalytics;
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
    },
};
