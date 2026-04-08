import React, { useEffect } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { WatchlistCard } from './WatchlistCard';
import './Profile.css';
import { EmptyState, SkeletonGrid } from '../common';
import { ListItem } from '../../services/lists.service';

interface WatchlistGridProps {
    items?: ListItem[];
    isLoading?: boolean;
}

export const WatchlistGrid: React.FC<WatchlistGridProps> = ({ 
    items: propItems, 
    isLoading: propLoading 
}) => {
    const { watchlist: contextWatchlist, isLoading: contextLoading, fetchWatchlist } = useWatchlist();

    // Use props if provided, otherwise context
    const items = propItems || (contextWatchlist?.items || []);
    const loading = propLoading !== undefined ? propLoading : (contextLoading && !contextWatchlist);

    useEffect(() => {
        // Only fetch context watchlist if we aren't using prop items
        if (!propItems) {
            fetchWatchlist();
        }
    }, [fetchWatchlist, propItems]);

    if (loading) {
        return <SkeletonGrid count={6} />;
    }

    if (items.length === 0) {
        return (
            <div className="py-8 text-center text-secondary">
                <EmptyState
                    title={propItems ? "Watchlist is empty" : "Your watchlist is empty"}
                    message={propItems ? "This user hasn't added anything to watch yet." : "Add movies and shows you want to watch!"}
                    icon="👀"
                />
            </div>
        );
    }

    return (
        <div className="watchlist-grid">
            {items.map((item) => (
                <WatchlistCard
                    key={item.id}
                    tmdbId={item.tmdbId}
                    mediaType={item.mediaType as 'movie' | 'tv' || 'movie'}
                />
            ))}
        </div>
    );
};
