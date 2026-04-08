import React, { useEffect } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { WatchlistCard } from './WatchlistCard';
import './Profile.css';
import { EmptyState, SkeletonGrid } from '../common';

export const WatchlistGrid: React.FC = () => {
    const { watchlist, isLoading, fetchWatchlist } = useWatchlist();

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    if (isLoading && !watchlist) {
        return <SkeletonGrid count={6} />;
    }

    if (!watchlist || (watchlist.items || []).length === 0) {
        return (
            <div className="py-8 text-center text-secondary">
                <EmptyState
                    title="Your watchlist is empty"
                    message="Add movies and shows you want to watch!"
                    icon="👀"
                />
            </div>
        );
    }

    return (
        <div className="watchlist-grid">
            {(watchlist.items || []).map((item) => (
                <WatchlistCard
                    key={item.id}
                    tmdbId={item.tmdbId}
                    // @ts-ignore: mediaType isn't in ListItem type yet?
                    // I updated lists.service.ts so it should be there.
                    mediaType={item.mediaType || 'movie'}
                />
            ))}
        </div>
    );
};
