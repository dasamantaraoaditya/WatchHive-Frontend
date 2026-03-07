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
    createdAt: string;
    updatedAt: string;
    isFollowing?: boolean;
    _count?: {
        followers: number;
        following: number;
        entries: number;
    };
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
    isPrivate?: boolean;
}
