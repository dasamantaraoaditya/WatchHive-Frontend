import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { WatchlistCard } from './WatchlistCard';
import './Profile.css';
import { EmptyState, SkeletonGrid, FilterBar } from '../common';
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
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('recent');

    // Use props if provided, otherwise context
    const items = propItems || (contextWatchlist?.items || []);
    const loading = propLoading !== undefined ? propLoading : (contextLoading && !contextWatchlist);

    useEffect(() => {
        // Only fetch context watchlist if we aren't using prop items
        if (!propItems) {
            fetchWatchlist();
        }
    }, [fetchWatchlist, propItems]);

    const filteredItems = [...items]
        .filter(item => 
            item.title?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'recent') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
            return 0;
        });

    if (loading) {
        return <SkeletonGrid count={6} />;
    }

    return (
        <div className="flex flex-col gap-6">
            <FilterBar 
                search={search}
                onSearchChange={setSearch}
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOptions={[
                    { value: 'recent', label: 'Recently Added' },
                    { value: 'title', label: 'Title: A-Z' }
                ]}
                count={filteredItems.length}
                countLabel="Saved Titles"
                placeholder="Search your watchlist..."
            />

            {filteredItems.length === 0 ? (
                <div className="py-20 w-full flex justify-center bg-white border border-[#ffb700]/10 rounded-3xl shadow-sm">
                    <EmptyState
                        title={search ? "No matching titles" : "Your watchlist is empty"}
                        message={search ? `No results for "${search}"` : "The hive is waiting. Add movies and shows you want to watch!"}
                        icon={<span className="text-5xl drop-shadow-sm">👀</span>}
                        actionLabel={search ? "Clear Search" : undefined}
                        onAction={search ? () => setSearch('') : undefined}
                    />
                </div>
            ) : (
                <div className="watchlist-grid animate-[fade-in_0.3s_ease-out]">
                    {filteredItems.map((item) => (
                        <WatchlistCard
                            key={item.id}
                            tmdbId={item.tmdbId}
                            mediaType={item.mediaType as 'movie' | 'tv' || 'movie'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
