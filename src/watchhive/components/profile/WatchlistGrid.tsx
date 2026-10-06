import React, { useState, useCallback, useEffect } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { WatchlistCard } from './WatchlistCard';
import './Profile.css';
import { SkeletonCard, SkeletonGrid, FilterBar, SearchMediaModal, ErrorState } from '../common';
import { ListItem } from '../../services/lists.service';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface WatchlistGridProps {
    items?: ListItem[];
    isLoading?: boolean;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    readOnly?: boolean;
}

export const WatchlistGrid: React.FC<WatchlistGridProps> = ({ 
    items: propItems, 
    isLoading: propLoading,
    searchQuery = '',
    onSearchChange,
    readOnly = false
}) => {
    const { watchlist: contextWatchlist, isLoading: contextLoading, hasLoaded: contextHasLoaded, error: contextError, fetchWatchlist, addToList } = useWatchlist();
    const [sortBy, setSortBy] = useState('recent-desc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Use props if provided, otherwise context — treat null/undefined items as empty array
    const items: ListItem[] = propItems ?? (contextWatchlist?.items ?? []);
    const loading = propLoading !== undefined ? propLoading : contextLoading;
    // Only show skeleton if we're actively loading AND haven't loaded before
    const showSkeleton = loading && !contextHasLoaded;

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
            const [field, order] = sortBy.split('-') as [string, string];
            if (field === 'recent') {
                const dateA = new Date(a.addedAt || 0).getTime();
                const dateB = new Date(b.addedAt || 0).getTime();
                return order === 'desc' ? dateB - dateA : dateA - dateB;
            }
            if (field === 'title') {
                const titleA = a.title || '';
                const titleB = b.title || '';
                return order === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
            }
            return 0;
        });

    // Reset visible count when filter/sort changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchQuery, sortBy]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    }, []);

    const hasMoreItems = visibleCount < filteredItems.length;

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore: hasMoreItems,
        isLoading: false,
    });

    // Show skeleton on first load only
    if (showSkeleton) {
        return (
            <div className="flex flex-col gap-6">
                <FilterBar 
                    search={searchQuery}
                    onSearchChange={onSearchChange}
                    placeholder="Search your watchlist..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={[
                        { value: 'recent-desc', label: 'Recently Added' },
                        { value: 'recent-asc', label: 'Oldest Added' },
                        { value: 'title-asc', label: 'Title: A-Z' },
                        { value: 'title-desc', label: 'Title: Z-A' }
                    ]}
                    count={0}
                    countLabel="Saved Titles"
                    isLoading={loading}
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
                        { value: 'recent-desc', label: 'Recently Added' },
                        { value: 'recent-asc', label: 'Oldest Added' },
                        { value: 'title-asc', label: 'Title: A-Z' },
                        { value: 'title-desc', label: 'Title: Z-A' }
                    ]}
                    count={filteredItems.length}
                    countLabel={searchQuery ? "Matching Titles" : "Saved Titles"}
                    isLoading={loading}
                />

                {contextError && !propItems ? (
                    <ErrorState
                        title="The Hive is Currently Down"
                        message={contextError}
                        onRetry={() => fetchWatchlist()}
                    />
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/5 relative">
                            <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                            <span className="material-symbols-outlined text-4xl text-slate-300 relative z-10">
                                {searchQuery ? "travel_explore" : "bookmark_add"}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                            {searchQuery ? "No matching titles" : "Your watchlist is empty"}
                        </h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed mb-6">
                            {searchQuery
                                ? `No watchlist items match "${searchQuery}". Try a different search term.`
                                : readOnly
                                    ? "This user hasn't saved any movies or shows to their watchlist yet."
                                    : "Nothing saved yet! Add movies and shows you want to watch and build your personal hive queue."}
                        </p>
                        {!searchQuery && !readOnly && (
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
                    <>
                        <div className="watchlist-grid animate-[fade-in_0.3s_ease-out]">
                            {filteredItems.slice(0, visibleCount).map((item) => (
                                <WatchlistCard
                                    key={item.id}
                                    tmdbId={item.tmdbId}
                                    mediaType={item.mediaType as 'movie' | 'tv' || 'movie'}
                                    suggestedByUserId={item.suggestedByUserId}
                                    suggestedByUser={item.suggestedByUser}
                                    readOnly={readOnly}
                                />
                            ))}
                        </div>

                        <div ref={observerTarget} className="h-4 w-full mt-4" />

                        {hasMoreItems && (
                            <div className="watchlist-grid mt-4">
                                {[...Array(4)].map((_, i) => <SkeletonCard key={`wl-more-${i}`} />)}
                            </div>
                        )}
                    </>
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
