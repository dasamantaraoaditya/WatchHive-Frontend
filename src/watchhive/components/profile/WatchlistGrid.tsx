import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { WatchlistCard } from './WatchlistCard';
import './Profile.css';
import { SkeletonGrid, FilterBar, SearchMediaModal } from '../common';
import { ListItem } from '../../services/lists.service';

interface WatchlistGridProps {
    items?: ListItem[];
    isLoading?: boolean;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
}

export const WatchlistGrid: React.FC<WatchlistGridProps> = ({ 
    items: propItems, 
    isLoading: propLoading,
    searchQuery = '',
    onSearchChange
}) => {
    const { watchlist: contextWatchlist, isLoading: contextLoading, fetchWatchlist, addToList } = useWatchlist();
    const [sortBy, setSortBy] = useState('recent');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Use props if provided, otherwise context
    const items = propItems ?? (contextWatchlist?.items ?? []);
    const loading = propLoading !== undefined ? propLoading : contextLoading;

    useEffect(() => {
        // Only fetch context watchlist if we aren't using prop items
        if (!propItems) {
            fetchWatchlist();
        }
    }, [fetchWatchlist, propItems]);

    const handleAddToWatchlist = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
        setIsAdding(true);
        try {
            await addToList(tmdbId, mediaType);
            setShowAddModal(false);
            if (!propItems) fetchWatchlist();
        } catch (err) {
            console.error('Failed to add to watchlist', err);
        } finally {
            setIsAdding(false);
        }
    };

    const filteredItems = [...items]
        .filter(item => {
            if (!searchQuery) return true;
            return (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            if (sortBy === 'recent') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
            return 0;
        });

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <FilterBar 
                    search={searchQuery}
                    onSearchChange={onSearchChange}
                    placeholder="Search your watchlist..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={[
                        { value: 'recent', label: 'Recently Added' },
                        { value: 'title', label: 'Title: A-Z' }
                    ]}
                    count={0}
                    countLabel="Saved Titles"
                />
                <SkeletonGrid count={6} />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <FilterBar 
                    search={searchQuery}
                    onSearchChange={onSearchChange}
                    placeholder="Search your watchlist..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={[
                        { value: 'recent', label: 'Recently Added' },
                        { value: 'title', label: 'Title: A-Z' }
                    ]}
                    count={filteredItems.length}
                    countLabel={searchQuery ? "Matching Titles" : "Saved Titles"}
                />

                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/5 relative">
                            <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                            <span className="material-symbols-outlined text-4xl text-slate-300 relative z-10">
                                {searchQuery ? "travel_explore" : "bookmark"}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                            {searchQuery ? "No matching titles" : "Nothing saved yet"}
                        </h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed mb-6">
                            {searchQuery
                                ? `No watchlist items match "${searchQuery}"`
                                : "Add movies and shows you want to watch next and they'll appear here."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                disabled={isAdding}
                                className="bg-[#ffb700] hover:brightness-105 text-white font-black py-3.5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#ffb700]/20 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-base font-bold">bookmark_add</span>
                                Add to Watchlist
                            </button>
                        )}
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

            <SearchMediaModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add to Watchlist"
                onSelect={handleAddToWatchlist}
            />
        </>
    );
};
