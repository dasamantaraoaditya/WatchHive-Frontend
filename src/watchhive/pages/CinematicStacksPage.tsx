import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { listsApi, List, ListItem } from '../services/lists.service';
import { RankedItem } from '../components/stacks/RankedItem';
import { BeeLoader, EmptyState, ErrorState, Modal } from '../components/common';
import apiClient from '../services/api';

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
}

export const CinematicStacksPage: React.FC = () => {
    const [lists, setLists] = useState<List[]>([]);
    const [currentList, setCurrentList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [activeGenre, setActiveGenre] = useState<string | null>(null);
    
    // Creation Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newStackName, setNewStackName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Search & Add logic
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadLists = useCallback(async () => {
        try {
            const allLists = await listsApi.getLists();
            const rankingStacks = allLists.filter(l => l.type === 'RANKING_STACK');
            setLists(rankingStacks);
            
            if (rankingStacks.length > 0 && !currentList) {
                loadRankedList(rankingStacks[0].id);
            } else if (rankingStacks.length === 0) {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Failed to load lists:', err);
            setError('Failed to load your stacks');
            setIsLoading(false);
        }
    }, [currentList]);

    const loadRankedList = async (listId: string) => {
        setIsLoading(true);
        try {
            const response = await listsApi.getRankedList(listId);
            setCurrentList(response.list);
            setItems(response.items);
            setActiveGenre(null);
        } catch (err) {
            setError('Failed to load ranked items');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLists();
    }, [loadLists]);

    // Search Logic
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 5);
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(q), 350);
    };

    const handleAddItem = async (result: TmdbResult) => {
        if (!currentList) return;
        try {
            await listsApi.addToStack(currentList.id, result.id, result.media_type === 'tv' ? 'tv' : 'movie');
            // Reload list to get the new item with correct order
            loadRankedList(currentList.id);
            setSearchQuery('');
            setShowResults(false);
        } catch (err) {
            alert('Failed to add item to stack');
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleReorder = async (newItems: ListItem[]) => {
        if (activeGenre) return;
        setItems(newItems);
        try {
            const reorderData = newItems.map((item, index) => ({
                tmdbId: item.tmdbId,
                orderIndex: index
            }));
            await listsApi.reorderStack(currentList!.id, reorderData);
        } catch (err) {
            console.error('Failed to save order:', err);
        }
    };

    const handleRemove = async (tmdbId: number) => {
        if (!currentList) return;
        try {
            await listsApi.removeFromStack(currentList.id, tmdbId);
            setItems(prev => prev.filter(item => item.tmdbId !== tmdbId));
        } catch (err) {
            alert('Failed to remove item');
        }
    };

    const handleCreateStack = async () => {
        if (!newStackName.trim()) return;
        setIsCreating(true);
        try {
            const newList = await listsApi.createList({
                name: newStackName,
                type: 'RANKING_STACK',
                isPublic: true
            });
            setLists(prev => [newList, ...prev]);
            loadRankedList(newList.id);
            setIsCreateModalOpen(false);
            setNewStackName('');
        } catch (err) {
            alert('Failed to create stack');
        } finally {
            setIsCreating(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!activeGenre) return items;
        return items.filter(item => 
            item.tags?.some(t => t.toLowerCase() === activeGenre.toLowerCase())
        );
    }, [items, activeGenre]);

    const genres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance'];

    if (isLoading && lists.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <BeeLoader size="large" message="Stacking your favorites..." />
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col min-h-screen bg-transparent p-4 md:p-8 pb-24">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl md:text-3xl font-black text-[#2D2926] mb-0">
                        Cinematic <span className="text-[#ffb700]">Stacks</span>
                    </h1>
                    <button 
                        className="bg-[#ffb700] hover:bg-[#ffc70b] text-[#2D2926] font-black px-4 py-2 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all active:scale-95"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        New Stack
                    </button>
                </div>
                <p className="text-xs font-bold text-[#2D2926]/40 uppercase tracking-widest">
                    Rank, curate, and share your personal movie legends
                </p>
            </header>

            {/* Stacks Selector */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-6">
                {lists.map(list => (
                    <button
                        key={list.id}
                        onClick={() => loadRankedList(list.id)}
                        className={`flex-shrink-0 px-5 py-3 rounded-2xl font-black text-xs transition-all ${
                            currentList?.id === list.id 
                                ? 'bg-[#2D2926] text-white shadow-lg scale-105' 
                                : 'bg-white text-[#2D2926]/60 hover:bg-white/80 border border-white/20'
                        }`}
                    >
                        {list.name}
                    </button>
                ))}
            </div>

            {currentList && (
                <>
                    {/* Direct Search & Add Bar */}
                    <div className="relative mb-8 max-w-xl" ref={searchRef}>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#2D2926]/40">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder={`Add a movie to "${currentList.name}"...`}
                                className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white border border-[#ffb700]/10 font-bold text-[#2D2926] placeholder:text-[#2D2926]/30 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/5 transition-all shadow-sm"
                            />
                            {isSearching && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <BeeLoader size="small" />
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl z-50 overflow-hidden py-2">
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleAddItem(result)}
                                            className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#ffb700]/5 transition-colors text-left group"
                                        >
                                            <div className="w-10 h-14 bg-[#2D2926]/10 rounded-lg overflow-hidden flex-shrink-0">
                                                {result.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w92${result.poster_path}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[#2D2926]/20">NO IMG</div>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-extrabold text-sm text-[#2D2926] leading-tight truncate">{result.title || result.name}</p>
                                                <p className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-widest mt-0.5">
                                                    {(result.release_date || result.first_air_date || '').substring(0, 4)} • {result.media_type}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-[#ffb700] p-2 rounded-full bg-[#ffb700]/10 scale-0 group-hover:scale-100 transition-transform">add_circle</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
                        <span className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-widest mr-2 shrink-0">Genre:</span>
                        <button
                            onClick={() => setActiveGenre(null)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                !activeGenre ? 'bg-[#ffb700] text-[#2D2926] shadow-sm' : 'bg-white/40 text-[#2D2926]/40 hover:bg-white/60'
                            }`}
                        >
                            All
                        </button>
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setActiveGenre(genre)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                    activeGenre === genre ? 'bg-[#ffb700] text-[#2D2926] shadow-sm' : 'bg-white/40 text-[#2D2926]/40 hover:bg-white/60'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>

                    {/* Meta Info */}
                    {activeGenre && (
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-[#ffb700] bg-[#ffb700]/10 px-3 py-1 rounded-full flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                                Filter active: Reordering disabled
                            </p>
                            <button 
                                onClick={() => setActiveGenre(null)}
                                className="text-[10px] font-black text-[#2D2926]/40 hover:text-[#2D2926] underline"
                            >
                                Clear filter
                            </button>
                        </div>
                    )}

                    {/* Rankings List */}
                    <div className="flex-grow max-w-2xl">
                        {isLoading && items.length === 0 ? (
                            <div className="py-20 flex justify-center">
                                <BeeLoader size="medium" />
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <Reorder.Group
                                axis="y"
                                values={filteredItems}
                                onReorder={handleReorder}
                                className="flex flex-col gap-3"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {filteredItems.map((item) => (
                                        <RankedItem
                                            key={`${currentList.id}-${item.tmdbId}`}
                                            item={item}
                                            rank={items.indexOf(item) + 1} 
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </AnimatePresence>
                            </Reorder.Group>
                        ) : (
                            <div className="py-20 text-center bg-white/30 backdrop-blur-md rounded-3xl border border-white/20 p-12 shadow-sm">
                                <span className="text-5xl mb-6 block">🎬</span>
                                <h3 className="text-lg font-black text-[#2D2926]">
                                    {activeGenre ? `No ${activeGenre} titles here` : 'Your stack is ready for greatness'}
                                </h3>
                                <p className="text-xs font-bold text-[#2D2926]/40 mt-2 max-w-[280px] mx-auto leading-relaxed">
                                    {activeGenre ? 'Try a different genre or add more titles.' : 'Use the search bar above or add from your feed to start ranking.'}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!currentList && !isLoading && (
                 <div className="flex-grow flex items-center justify-center p-8">
                    <EmptyState 
                        title="Welcome to Cinematic Stacks"
                        message="Forge your personal movie legends. Create a stack to begin your ranking journey."
                        icon={<span className="text-6xl drop-shadow-xl">🏔️</span>}
                    />
                 </div>
            )}

            {error && <ErrorState message={error} onRetry={() => loadLists()} />}

            {/* Create Stack Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Assemble a New Stack"
            >
                <div className="flex flex-col gap-6 p-2">
                    <div>
                        <label className="text-[11px] font-black text-[#2D2926]/40 uppercase tracking-[0.2em] mb-3 block">
                            Stack Name
                        </label>
                        <input
                            type="text"
                            value={newStackName}
                            onChange={(e) => setNewStackName(e.target.value)}
                            placeholder="e.g., Must-Watch SciFi, Best of 2024..."
                            className="w-full p-5 rounded-2xl bg-[#ffb700]/5 border border-[#ffb700]/10 font-bold text-[#2D2926] placeholder:text-[#2D2926]/20 focus:outline-none focus:border-[#ffb700] transition-all"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateStack()}
                        />
                    </div>
                    <button
                        onClick={handleCreateStack}
                        disabled={!newStackName.trim() || isCreating}
                        className="w-full bg-[#2D2926] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isCreating ? <BeeLoader size="small" /> : 'Create Stack'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
