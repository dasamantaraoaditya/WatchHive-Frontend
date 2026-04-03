import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { listsApi, List, ListItem } from '../services/lists.service';
import { RankedItem } from '../components/stacks/RankedItem';
import { BeeLoader, ErrorState, Modal } from '../components/common';
import { useUI } from '../contexts';
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
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('Rankings');
        setPageIcon('format_list_numbered');
    }, [setPageTitle, setPageIcon]);

    const [lists, setLists] = useState<List[]>([]);
    const [currentList, setCurrentList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    

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
            setError('Failed to load your rankings');
            setIsLoading(false);
        }
    }, [currentList]);

    const loadRankedList = async (listId: string) => {
        setIsLoading(true);
        try {
            const response = await listsApi.getRankedList(listId);
            setCurrentList(response.list);
            setItems(response.items);
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
        if (lists.length >= 5) return; // Max 5 rankings
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
            alert('Failed to create ranking');
        } finally {
            setIsCreating(false);
        }
    };


    if (isLoading && lists.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <BeeLoader size="large" message="Sifting through the hive..." />
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">

            <div className="stacks-page p-4 pt-4 md:pt-8 md:p-8 pb-24 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-[#2D2926] md:hidden">My <span className="text-[#ffb700]">Rankings</span></h1>
                    <div className="flex gap-4 items-center ml-auto">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => lists.length < 5 ? setIsCreateModalOpen(true) : null}
                            disabled={lists.length >= 5}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${
                                lists.length >= 5 
                                    ? 'bg-[#2D2926]/10 text-[#2D2926]/30 cursor-not-allowed' 
                                    : 'bg-[#2D2926] text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">add_box</span>
                            <span>New</span>
                        </motion.button>
                    </div>
                </div>
            
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


            {/* Stacks Selector - Card Based */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-4 -mx-4 px-4 md:mx-0 md:px-0">
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
                            <span className="stack-card__count">{currentList?.id === list.id ? `${items.length}/10` : '— /10'}</span>
                            {currentList?.id === list.id && (
                                <span className="material-symbols-outlined text-[14px] text-[#ffb700]">verified</span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {currentList && (
                <div className="flex flex-col gap-8">
                    

                    {/* Rankings List */}
                    <div className="flex-grow">
                        {isLoading && items.length === 0 ? (
                            <div className="py-20 flex justify-center">
                                <BeeLoader size="medium" />
                            </div>
                        ) : (
                            <>
                                {/* Ranked items list */}
                                {items.length > 0 && (
                                    <Reorder.Group
                                        axis="y"
                                        values={items}
                                        onReorder={handleReorder}
                                        className="flex flex-col gap-4 px-1 md:px-0"
                                    >
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {items.map((item) => (
                                                <RankedItem
                                                    key={`${currentList.id}-${item.tmdbId}`}
                                                    item={item}
                                                    rank={items.indexOf(item) + 1}
                                                    onRemove={handleRemove}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                )}

                                {items.length < 10 && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setIsSearchOpen(true)}
                                        className={`relative w-full mt-4 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-2 border-dashed transition-all ${
                                            items.length === 0
                                                ? 'border-[#ffb700] bg-[#ffb700]/5 hover:bg-[#ffb700]/10'
                                                : 'border-[#2D2926]/10 bg-transparent hover:border-[#ffb700]/40 hover:bg-[#ffb700]/5'
                                        }`}
                                    >
                                        {/* Rank number placeholder */}
                                        <div className={`ranked-item__rank opacity-40`}>
                                            {items.length + 1}
                                        </div>
                                        <div className={`w-8 h-12 md:w-10 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            items.length === 0 ? 'bg-[#ffb700]/20' : 'bg-[#2D2926]/5'
                                        }`}>
                                            <span className={`material-symbols-outlined text-xl md:text-2xl ${
                                                items.length === 0 ? 'text-[#ffb700]' : 'text-[#2D2926]/20'
                                            }`}>add</span>
                                        </div>
                                        <div className="text-left min-w-0 pr-2">
                                            <p className={`text-xs md:text-sm font-black truncate ${
                                                items.length === 0 ? 'text-[#ffb700]' : 'text-[#2D2926]/40'
                                            }`}>
                                                {items.length === 0 ? 'Add your first title' : 'Add another title'}
                                            </p>
                                            <p className="text-[8px] md:text-[10px] font-bold text-[#2D2926]/30 uppercase tracking-[0.1em] md:tracking-widest whitespace-nowrap">
                                                {10 - items.length} slot{10 - items.length !== 1 ? 's' : ''} remaining
                                            </p>
                                        </div>
                                    </motion.button>
                                )}

                                {items.length >= 10 && (
                                    <div className="mt-4 pl-4 flex items-center gap-3 p-4 rounded-2xl bg-[#ffb700]/5 border border-[#ffb700]/20">
                                        <span className="material-symbols-outlined text-[#ffb700]">info</span>
                                        <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest">
                                            Ranking full — max 10 titles per ranking
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}


            {!currentList && !isLoading && (
                 <div className="flex-grow flex items-center justify-center">
                    <div className="text-center max-w-sm px-6">
                        <span className="text-6xl mb-8 block grayscale opacity-40">🐝</span>
                        <h2 className="text-2xl font-black text-[#2D2926] mb-4">No rankings yet</h2>
                        <p className="text-sm font-bold text-[#2D2926]/40 mb-8 leading-relaxed">
                            Create your first ranking to start curating your all-time favourites.
                        </p>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full bg-[#2D2926] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
                        >
                            Build Your First Ranking
                        </button>
                    </div>
                 </div>
            )}

            {error && <ErrorState message={error} onRetry={() => loadLists()} />}

            {/* Create Stack Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Ranking"
            >
                <div className="flex flex-col gap-8 p-2">
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-[0.2em] px-1">
                            Name of the Ranking
                        </label>
                        <input
                            type="text"
                            value={newStackName}
                            onChange={(e) => setNewStackName(e.target.value)}
                            placeholder="e.g., All-Time Legends, Guilty Pleasures..."
                            className="w-full p-6 rounded-3xl bg-[#ffb700]/5 border-2 border-[#ffb700]/10 font-bold text-lg text-[#2D2926] placeholder:text-[#2D2926]/10 focus:outline-none focus:border-[#ffb700] transition-all"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateStack()}
                        />
                        <p className="text-[10px] font-bold text-[#2D2926]/30 px-1">
                            {lists.length}/5 rankings used
                        </p>
                    </div>
                    <button
                        onClick={handleCreateStack}
                        disabled={!newStackName.trim() || isCreating}
                        className="w-full bg-[#2D2926] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isCreating ? <BeeLoader size="small" /> : 'Create Ranking'}
                    </button>
                </div>
            </Modal>
            </div>
        </div>
    );
};
