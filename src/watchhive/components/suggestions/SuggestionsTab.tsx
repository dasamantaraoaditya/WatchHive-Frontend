import React, { useState, useEffect, useCallback } from 'react';
import { suggestionsApi, GroupedSuggestion } from '../../services/suggestions.service';
import { SuggestionCard } from './SuggestionCard';
import { SkeletonGrid, ErrorState, EmptyState, FilterBar } from '../common';

export const SuggestionsTab: React.FC = () => {
    const [groups, setGroups] = useState<GroupedSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('recent');

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await suggestionsApi.getMySuggestions();
            setGroups(data);
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
        .sort((a, b) => {
            const dateA = new Date(a.suggestions[0]?.createdAt || 0).getTime();
            const dateB = new Date(b.suggestions[0]?.createdAt || 0).getTime();
            if (sortBy === 'recent') return dateB - dateA;
            return 0;
        });

    if (isLoading) {
        return <SkeletonGrid count={4} />;
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
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOptions={[
                    { value: 'recent', label: 'Recently Suggested' }
                ]}
                count={groups.length}
                countLabel="Titles Suggested"
            />

            {groups.length === 0 ? (
                <div className="py-20 w-full flex justify-center bg-white border border-[#ffb700]/10 rounded-3xl shadow-sm">
                    <EmptyState
                        title="No suggestions yet"
                        message="When your friends suggest movies to you, they'll show up here in a beautiful grid!"
                        icon={<span className="text-5xl drop-shadow-sm">🐝</span>}
                    />
                </div>
            ) : (
                <>
                    <div className="watchlist-grid outline-none">
                        {filteredGroups.map((group) => (
                            <SuggestionCard 
                                key={`${group.mediaType}-${group.tmdbId}`} 
                                group={group} 
                                onStatusChange={fetchSuggestions}
                            />
                        ))}
                    </div>
                    
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
