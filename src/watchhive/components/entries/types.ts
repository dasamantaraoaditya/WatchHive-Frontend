// Shared types used across EntryList, EntryCard and ExpandedCard

export interface TmdbDetails {
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    genres: { name: string }[];
    runtime?: number | null;
    release_date?: string;
    first_air_date?: string;
    number_of_seasons?: number;
    tagline?: string;
    watch_providers?: any;
}

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};
