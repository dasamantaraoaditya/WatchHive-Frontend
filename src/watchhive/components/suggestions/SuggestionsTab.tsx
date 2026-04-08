import React, { useState, useEffect, useCallback } from 'react';
import { suggestionsApi, GroupedSuggestion } from '../../services/suggestions.service';
import { SuggestionCard } from './SuggestionCard';
import { SkeletonGrid, ErrorState, EmptyState } from '../common';

export const SuggestionsTab: React.FC = () => {
    const [groups, setGroups] = useState<GroupedSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-800">
                    <span className="material-symbols-outlined text-[#ffb700]">auto_awesome</span>
                    Sent for You
                </h3>
            </div>

            {groups.length === 0 ? (
                <div className="mt-4 w-full flex justify-center">
                    <EmptyState
                        title="No suggestions yet"
                        message="When your friends suggest movies to you, they'll show up here in a beautiful grid!"
                        icon={<span className="text-5xl drop-shadow-sm">🐝</span>}
                    />
                </div>
            ) : (
                <>
                    <div className="watchlist-grid">
                        {groups.map((group) => (
                            <SuggestionCard 
                                key={`${group.mediaType}-${group.tmdbId}`} 
                                group={group} 
                                onStatusChange={fetchSuggestions}
                            />
                        ))}
                    </div>
                    
                    <div className="mt-8 flex items-center gap-3 p-6 bg-white border border-dashed border-[#ffb700]/30 rounded-3xl">
                        <span className="material-symbols-outlined text-[#ffb700]">info</span>
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
