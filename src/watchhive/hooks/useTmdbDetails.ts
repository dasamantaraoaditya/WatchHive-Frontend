import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';

const tmdbCache = new Map<string, any>();

export const useTmdbDetails = (tmdbId: number, type: 'MOVIE' | 'TV_SHOW' | 'EPISODE') => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!tmdbId) return;

        let endpoint = type === 'TV_SHOW' ? 'tv' : 'movie';
        if (type === 'EPISODE') {
            endpoint = 'tv';
        }

        const cacheKey = `${endpoint}-${tmdbId}`;

        if (tmdbCache.has(cacheKey)) {
            setDetails(tmdbCache.get(cacheKey));
            return;
        }

        setLoading(true);

        const fetchDetails = async () => {
            try {
                const raw: any = await apiClient.get(`/tmdb/${endpoint}/${tmdbId}`);
                // TMDB returns providers under the key 'watch/providers' (with a slash).
                // Normalize it to 'watch_providers' so components can access it consistently.
                const data = {
                    ...raw,
                    watch_providers: raw['watch/providers']?.results || raw['watch_providers'] || {},
                };
                delete data['watch/providers'];
                tmdbCache.set(cacheKey, data);
                setDetails(data);
            } catch (err) {
                console.error(`Error fetching TMDb details for ${type} ${tmdbId}`, err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [tmdbId, type]);

    return { details, loading, error };
};
