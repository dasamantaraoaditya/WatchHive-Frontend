// User related types
export interface User {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    bio: string | null;
    profilePictureUrl: string | null;
    location: string | null;
    isPrivate: boolean;
    privacyLevel: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
    showWatchEntries: boolean;
    showCurrentlyWatching: boolean;
    showWatchlist: boolean;
    xp: number;
    level: number;
    badges: Badge[];
    createdAt: string;
    updatedAt: string;
    // Auth capability flags — set by the backend, never expose raw googleId/passwordHash
    hasGoogleLinked?: boolean;
    hasPassword?: boolean;
    isFollowing?: boolean;
    isRequested?: boolean;
    isIncomingRequest?: boolean;
    incomingRequestId?: string | null;
    _count?: {
        followers: number;
        following: number;
        entries: number;
    };
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
}

export interface UserStats {
    totalMovies: number;
    totalTVShows: number;
    totalWatchTime: number;
    followersCount: number;
    followingCount: number;
    mostWatchedGenres: string[];
}

export interface UpdateUserData {
    displayName?: string;
    bio?: string;
    location?: string;
    privacyLevel?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
    showWatchEntries?: boolean;
    showCurrentlyWatching?: boolean;
    showWatchlist?: boolean;
}
