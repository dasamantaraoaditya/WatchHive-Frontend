import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { listsApi, List, ListItem } from '../services/lists.service';
import { RankedItem } from '../components/stacks/RankedItem';
import { BeeLoader, ErrorState, Modal } from '../components/common';
import apiClient from '../services/api';
import '../components/stacks/Stacks.css';

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
    
    // UI Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newStackName, setNewStackName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Search Overlay
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
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

    // Search & Add Logic
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 8);
            setSearchResults(results);
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
            loadRankedList(currentList.id);
            setIsSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            alert('Failed to add item to stack');
        }
    };

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

    const genres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance', 'Documentary', 'Anime'];

    if (isLoading && lists.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <BeeLoader size="large" message="Sifting through the hive..." />
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col min-h-screen bg-transparent p-4 md:p-8 pb-32 max-w-5xl mx-auto">
            
            {/* Immersive Search Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-2xl p-6 pt-12 flex flex-col gap-8"
                    >
                        <div className="flex items-center gap-4 max-w-2xl mx-auto w-full">
                            <button 
                                onClick={() => setIsSearchOpen(false)}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926]"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="flex-grow relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#ffb700]">search</span>
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Which legend are we adding?"
                                    className="w-full pl-12 pr-4 py-4 rounded-3xl bg-transparent border-2 border-[#ffb700] font-bold text-lg text-[#2D2926] placeholder:text-[#2D2926]/20 focus:outline-none focus:ring-4 focus:ring-[#ffb700]/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto w-full flex-grow overflow-y-auto no-scrollbar">
                            {isSearching ? (
                                <div className="py-20 flex justify-center">
                                    <BeeLoader size="medium" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                                    {searchResults.map((result) => (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            key={result.id}
                                            onClick={() => handleAddItem(result)}
                                            className="p-3 rounded-2xl bg-[#ffb700]/5 hover:bg-[#ffb700]/10 border border-[#ffb700]/10 flex items-center gap-4 text-left transition-colors"
                                        >
                                            <div className="w-14 h-20 bg-[#2D2926]/5 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                                {result.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w154${result.poster_path}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[#2D2926]/10 uppercase">NO IMG</div>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-extrabold text-sm text-[#2D2926] leading-tight truncate mb-1">{result.title || result.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#ffb700]/20 text-[8px] font-black text-[#ffb700] uppercase tracking-tighter">
                                                        {result.media_type}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#2D2926]/40">
                                                        {(result.release_date || result.first_air_date || '').substring(0, 4)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-[#ffb700] bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">add</span>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : searchQuery.length > 2 && (
                                <div className="py-20 text-center opacity-40 font-black uppercase tracking-widest text-sm">
                                    No legends found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-12">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#2D2926] leading-none mb-2 tracking-tight">
                            Cinematic <span className="text-[#ffb700]">Stacks</span>
                        </h1>
                        <p className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-[0.3em]">
                            Forge your personal movie legends
                        </p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-14 h-14 bg-[#2D2926] text-white rounded-2xl flex items-center justify-center shadow-2xl transition-all"
                        title="New Stack"
                    >
                        <span className="material-symbols-outlined text-3xl">add_box</span>
                    </motion.button>
                </div>
            </header>

            {/* Stacks Selector - Card Based */}
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-8 -mx-4 px-4 md:mx-0 md:px-0">
                {lists.map(list => (
                    <motion.div
                        key={list.id}
                        onClick={() => loadRankedList(list.id)}
                        className={`stack-card ${currentList?.id === list.id ? 'stack-card--active' : ''}`}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="stack-card__name truncate">{list.name}</span>
                        <div className="flex items-center justify-between">
                            <span className="stack-card__count">{items.length} titles</span>
                            {currentList?.id === list.id && (
                                <span className="material-symbols-outlined text-[14px] text-[#ffb700]">verified</span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {currentList && (
                <div className="flex flex-col gap-8">
                    
                    {/* Filter & Toolbar Area */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                <button
                                    onClick={() => setActiveGenre(null)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                        !activeGenre ? 'bg-[#ffb700] text-white shadow-xl scale-105' : 'bg-white/40 text-[#2D2926]/30 hover:bg-white'
                                    }`}
                                >
                                    All Genres
                                </button>
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => setActiveGenre(genre)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                            activeGenre === genre ? 'bg-[#ffb700] text-white shadow-xl scale-105' : 'bg-white/40 text-[#2D2926]/30 hover:bg-white'
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeGenre && (
                             <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 bg-[#ffb700]/10 border border-[#ffb700]/20 p-4 rounded-2xl"
                            >
                                <span className="material-symbols-outlined text-[#ffb700]">info</span>
                                <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest m-0">
                                    Reordering is locked while "{activeGenre}" filter is active.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Rankings List */}
                    <div className="flex-grow">
                        {isLoading && items.length === 0 ? (
                            <div className="py-20 flex justify-center">
                                <BeeLoader size="medium" />
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <Reorder.Group
                                axis="y"
                                values={filteredItems}
                                onReorder={handleReorder}
                                className="flex flex-col gap-4 pl-4" // Left padding for rank badge
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
                            <div className="stacks-empty-hero">
                                <span className="stacks-empty-icon">🏔️</span>
                                <h3 className="text-xl font-black text-[#2D2926] mb-2">
                                    {activeGenre ? `No ${activeGenre} titles found` : 'Your stack is pure potential'}
                                </h3>
                                <p className="text-xs font-bold text-[#2D2926]/40 max-w-[280px] leading-relaxed">
                                    Add your first movie to start forging this legend.
                                </p>
                                <button 
                                    onClick={() => setIsSearchOpen(true)}
                                    className="mt-8 bg-[#ffb700] text-[#2D2926] font-black px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all text-xs uppercase tracking-widest active:scale-95"
                                >
                                    Add Your First Legend
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating "Add Item" Action Button */}
            {currentList && (
                <motion.button 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="fixed bottom-24 right-6 md:right-12 w-16 h-16 bg-[#ffb700] text-[#2D2926] rounded-full flex items-center justify-center shadow-2xl z-[500] border-4 border-white"
                >
                    <span className="material-symbols-outlined text-3xl font-black">playlist_add</span>
                </motion.button>
            )}

            {!currentList && !isLoading && (
                 <div className="flex-grow flex items-center justify-center">
                    <div className="text-center max-w-sm px-6">
                        <span className="text-6xl mb-8 block grayscale opacity-40">🐝</span>
                        <h2 className="text-2xl font-black text-[#2D2926] mb-4">No stacks in the hive yet</h2>
                        <p className="text-sm font-bold text-[#2D2926]/40 mb-8 leading-relaxed">
                            Create your first ranking stack to start curating your cinematic masterpieces.
                        </p>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full bg-[#2D2926] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
                        >
                            Build Your First Stack
                        </button>
                    </div>
                 </div>
            )}

            {error && <ErrorState message={error} onRetry={() => loadLists()} />}

            {/* Create Stack Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Forge a New Stack"
            >
                <div className="flex flex-col gap-8 p-2">
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-[0.2em] px-1">
                            Name of the Legend
                        </label>
                        <input
                            type="text"
                            value={newStackName}
                            onChange={(e) => setNewStackName(e.target.value)}
                            placeholder="e.g., The Midnight Classics..."
                            className="w-full p-6 rounded-3xl bg-[#ffb700]/5 border-2 border-[#ffb700]/10 font-bold text-lg text-[#2D2926] placeholder:text-[#2D2926]/10 focus:outline-none focus:border-[#ffb700] transition-all"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateStack()}
                        />
                    </div>
                    <button
                        onClick={handleCreateStack}
                        disabled={!newStackName.trim() || isCreating}
                        className="w-full bg-[#2D2926] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isCreating ? <BeeLoader size="small" /> : 'Forge Stack'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
