import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import listsApi, { List } from '../services/lists.service';
import { useAuth } from './AuthContext';

interface WatchlistContextType {
    watchlist: List | null;
    isLoading: boolean;
    // We pass listId explicitly or handle internally? Internal is better for 'default watchlist'
    addToList: (tmdbId: number, mediaType?: 'movie' | 'tv') => Promise<void>;
    removeFromList: (tmdbId: number) => Promise<void>;
    isInWatchlist: (tmdbId: number) => boolean;
    fetchWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = () => {
    const context = useContext(WatchlistContext);
    if (!context) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
};

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [watchlist, setWatchlist] = useState<List | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchWatchlist = useCallback(async () => {
        if (!isAuthenticated) {
            setWatchlist(null);
            return;
        }
        setIsLoading(true);
        try {
            const list = await listsApi.getWatchlist();
            setWatchlist(list);
        } catch (error) {
            console.error('Failed to fetch watchlist', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWatchlist();
        } else {
            setWatchlist(null);
        }
    }, [isAuthenticated, fetchWatchlist]);

    const addToList = async (tmdbId: number, mediaType: 'movie' | 'tv' = 'movie') => {
        if (!isAuthenticated) return;

        // If watchlist is null (not fetched yet or error), try fetch first? 
        // Or create optimistic item.
        let targetList = watchlist;
        if (!targetList) {
            // Fetch first before adding? Or just call API which creates if missing.
            // API endpoint `/lists/watchlist` ensures creation.
            // But addToWatchlist needs listId.
            // We first need listId.
            try {
                const list = await listsApi.getWatchlist();
                setWatchlist(list);
                targetList = list;
            } catch (e) {
                return;
            }
        }

        if (!targetList) return;

        // Optimistic
        const tempId = `temp-${Date.now()}`;
        const previousItems = targetList.items;
        setWatchlist({
            ...targetList,
            items: [...targetList.items, {
                id: tempId,
                tmdbId,
                mediaType,
                listId: targetList.id,
                orderIndex: 0,
                addedAt: new Date().toISOString()
            }]
        });

        try {
            const newItem = await listsApi.addToWatchlist(targetList.id, tmdbId, mediaType);
            setWatchlist(prev => prev ? {
                ...prev,
                items: prev.items.map(i => i.id === tempId ? newItem : i)
            } : null);
        } catch (error) {
            console.error('Failed to add to watchlist', error);
            // Revert
            setWatchlist(prev => prev ? { ...prev, items: previousItems } : null);
            throw error;
        }
    };

    const removeFromList = async (tmdbId: number) => {
        if (!watchlist || !isAuthenticated) return;

        const previousItems = watchlist.items;
        setWatchlist({
            ...watchlist,
            items: watchlist.items.filter(i => i.tmdbId !== tmdbId)
        });

        try {
            await listsApi.removeFromWatchlist(watchlist.id, tmdbId);
        } catch (error) {
            console.error('Failed to remove from watchlist', error);
            // Revert
            setWatchlist(prev => prev ? { ...prev, items: previousItems } : null);
            throw error;
        }
    };

    const isInWatchlist = (tmdbId: number) => {
        return watchlist?.items.some(i => Number(i.tmdbId) === Number(tmdbId)) || false;
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, isLoading, addToList, removeFromList, isInWatchlist, fetchWatchlist }}>
            {children}
        </WatchlistContext.Provider>
    );
};
