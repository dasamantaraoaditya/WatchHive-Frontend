import React, { useState, useEffect, useCallback } from 'react';
import { suggestionsApi, GroupedSuggestion } from '../../services/suggestions.service';
import apiClient from '../../services/api.js';
import { SuggestionCard } from './SuggestionCard';
import { SkeletonCard, SkeletonGrid, ErrorState, FilterBar } from '../common';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface SuggestionsTabProps {
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
}

interface DetailedGroupedSuggestion extends GroupedSuggestion {
    title: string;
    overview: string;
    posterPath: string | null;
}

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ 
    searchQuery = '',
    onSearchChange
}) => {
    const [groups, setGroups] = useState<DetailedGroupedSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('recent-desc');
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await suggestionsApi.getMySuggestions();
            
            // Preload details in parallel for instant client-side filtering and rendering
            const groupsWithDetails = await Promise.all(
                data.map(async (group) => {
                    try {
                        const endpoint = group.mediaType === 'tv' ? 'tv' : 'movie';
                        const tmdbData: any = await apiClient.get(`/tmdb/${endpoint}/${group.tmdbId}`);
                        return {
                            ...group,
                            title: tmdbData.title || tmdbData.name || 'Untitled',
                            overview: tmdbData.overview || '',
                            posterPath: tmdbData.poster_path || null
                        };
                    } catch (e) {
                        return {
                            ...group,
                            title: 'Untitled',
                            overview: '',
                            posterPath: null
                        };
                    }
                })
            );

            setGroups(groupsWithDetails);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch suggestions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    const filteredGroups = groups
        .filter(group => {
            if (!searchQuery) return true;
            return (
                group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                group.overview.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        .sort((a, b) => {
            const [field, order] = sortBy.split('-') as [string, string];
            if (field === 'recent') {
                const dateA = new Date(a.suggestions[0]?.createdAt || 0).getTime();
                const dateB = new Date(b.suggestions[0]?.createdAt || 0).getTime();
                return order === 'desc' ? dateB - dateA : dateA - dateB;
            }
            if (field === 'title') {
                const titleA = a.title || '';
                const titleB = b.title || '';
                return order === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
            }
            return 0;
        });

    // Reset visible count on search/sort change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchQuery, sortBy]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    }, []);

    const hasMoreSuggestions = visibleCount < filteredGroups.length;

    const { observerTarget } = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore: hasMoreSuggestions,
        isLoading: false,
        enabled: !isLoading && !error,
    });

    if (isLoading) {
        return (
            <section className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out] mb-12">
                <FilterBar 
                    search={searchQuery}
                    onSearchChange={onSearchChange}
                    placeholder="Search suggestions from friends..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={[
                        { value: 'recent-desc', label: 'Recently Suggested' },
                        { value: 'recent-asc', label: 'Oldest Suggested' },
                        { value: 'title-asc', label: 'Title: A-Z' },
                        { value: 'title-desc', label: 'Title: Z-A' }
                    ]}
                    count={0}
                    countLabel="Titles Suggested"
                    isLoading={isLoading}
                />
                <SkeletonGrid count={4} />
            </section>
        );
    }

    if (error) {
        return (
            <div className="py-8 flex justify-center w-full">
                <ErrorState message={error} onRetry={fetchSuggestions} />
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out] mb-12">
            <FilterBar 
                search={searchQuery}
                onSearchChange={onSearchChange}
                placeholder="Search suggestions from friends..."
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOptions={[
                    { value: 'recent-desc', label: 'Recently Suggested' },
                    { value: 'recent-asc', label: 'Oldest Suggested' },
                    { value: 'title-asc', label: 'Title: A-Z' },
                    { value: 'title-desc', label: 'Title: Z-A' }
                ]}
                count={filteredGroups.length}
                countLabel={searchQuery ? "Matching Suggestions" : "Titles Suggested"}
                isLoading={isLoading}
            />

            {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/5 relative">
                        <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                        <span className="material-symbols-outlined text-4xl text-slate-300 relative z-10">
                            {searchQuery ? "travel_explore" : "auto_awesome"}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                        {searchQuery ? "No matching suggestions" : "No suggestions yet"}
                    </h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
                        {searchQuery
                            ? `We couldn't find any suggestions matching "${searchQuery}"`
                            : "When friends from your hive suggest movies or shows, they'll appear here!"}
                    </p>
                </div>
                ) : (
                <>
                    <div className="watchlist-grid outline-none">
                        {filteredGroups.slice(0, visibleCount).map((group) => (
                            <SuggestionCard 
                                key={`${group.mediaType}-${group.tmdbId}`} 
                                group={group} 
                                onStatusChange={fetchSuggestions}
                                preloadedDetails={{
                                    title: group.title,
                                    overview: group.overview,
                                    poster_path: group.posterPath
                                }}
                            />
                        ))}
                    </div>

                    <div ref={observerTarget} className="h-4 w-full mt-4" />

                    {hasMoreSuggestions && (
                        <div className="watchlist-grid mt-4">
                            {[...Array(4)].map((_, i) => <SkeletonCard key={`sug-more-${i}`} />)}
                        </div>
                    )}
                    
                    <div className="mt-8 flex items-center gap-3 p-6 bg-white border border-dashed border-[#ffb700]/30 rounded-3xl group hover:border-[#ffb700]/50 transition-colors">
                        <span className="material-symbols-outlined text-[#ffb700] animate-pulse">info</span>
                        <p className="text-sm text-[#2D2926]/60 font-medium italic">
                            Duplicates are automatically grouped into a single card for a cleaner view.
                        </p>
                    </div>
                </>
            )}
        </section>
    );
};

export default SuggestionsTab;
