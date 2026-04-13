import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { listsApi, List, ListItem } from '../services/lists.service';
import { RankedItem } from '../components/stacks/RankedItem';
import { RankedItemSkeleton } from '../components/stacks/RankedItemSkeleton';
import { SearchItemSkeleton } from '../components/stacks/SearchItemSkeleton';
import { StackCardSkeleton } from '../components/stacks/StackCardSkeleton';
import { BeeLoader, ErrorState, Modal } from '../components/common';
import { useUI } from '../contexts';
import apiClient from '../services/api';
import { PageLayout } from '../components/layout';
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
            <PageLayout maxWidth="5xl">
                <div className="space-y-8 animate-pulse">
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(3)].map((_, i) => <StackCardSkeleton key={i} />)}
                    </div>
                    <div className="flex flex-col gap-4">
                        {[...Array(5)].map((_, i) => <RankedItemSkeleton key={i} />)}
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="5xl">
            <div className="flex flex-col gap-8 pb-24 animate-slide-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-[#2D2926] tracking-tighter">
                            Cinematic <span className="text-[#ffb700]">Stacks</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Curate your all-time rankings</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => lists.length < 5 ? setIsCreateModalOpen(true) : null}
                        disabled={lists.length >= 5}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                            lists.length >= 5 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                                : 'bg-[#2D2926] text-white shadow-black/5 hover:bg-black'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        <span>New Stack</span>
                    </motion.button>
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
                                    className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-[#2D2926] hover:bg-slate-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                <div className="flex-grow relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#ffb700] text-2xl group-focus-within:rotate-12 transition-transform">search</span>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Add a cinematic masterpiece..."
                                        className="w-full pl-16 pr-6 py-5 rounded-[32px] bg-white border-2 border-black/5 font-black text-lg text-[#2D2926] placeholder:text-slate-300 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all shadow-xl shadow-black/5"
                                    />
                                </div>
                            </div>

                            <div className="max-w-2xl mx-auto w-full flex-grow overflow-y-auto no-scrollbar">
                                {isSearching ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                                        {[...Array(6)].map((_, i) => <SearchItemSkeleton key={i} />)}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                                        {searchResults.map((result) => (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={result.id}
                                                onClick={() => handleAddItem(result)}
                                                className="p-4 rounded-[28px] bg-white border border-black/5 hover:border-[#ffb700]/30 flex items-center gap-4 text-left transition-all shadow-sm hover:shadow-xl hover:shadow-black/5"
                                            >
                                                <div className="w-16 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                                                    {result.poster_path ? (
                                                        <img src={`https://image.tmdb.org/t/p/w154${result.poster_path}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-200 uppercase">NO IMG</div>
                                                    )}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-black text-[15px] text-[#2D2926] leading-tight truncate mb-1">{result.title || result.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 rounded-lg bg-slate-50 border border-black/5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                            {result.media_type}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-300">
                                                            {(result.release_date || result.first_air_date || '').substring(0, 4)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-[#ffb700] bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center">add</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : searchQuery.length > 2 && (
                                    <div className="py-20 text-center animate-fade-in">
                                        <div className="text-5xl mb-6">🔭</div>
                                        <h3 className="text-xl font-black text-[#2D2926] mb-2">No legends found</h3>
                                        <p className="text-slate-400 font-bold text-sm lowercase tracking-widest">"{searchQuery}" resulted in a quiet void</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Stacks Selector */}
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
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
                                <div className="flex flex-col gap-4">
                                    {[...Array(5)].map((_, i) => <RankedItemSkeleton key={i} />)}
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
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setIsSearchOpen(true)}
                                            className={`group relative w-full mt-4 flex items-center gap-6 p-6 rounded-[32px] border-2 border-dashed transition-all ${
                                                items.length === 0
                                                    ? 'border-[#ffb700]/40 bg-[#ffb700]/5 hover:bg-[#ffb700]/10 hover:border-[#ffb700]'
                                                    : 'border-black/5 bg-transparent hover:border-[#ffb700]/40 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="text-2xl font-black text-slate-200 group-hover:text-[#ffb700] transition-colors">
                                                {items.length + 1}
                                            </div>
                                            <div className={`w-12 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                                items.length === 0 ? 'bg-[#ffb700]/20' : 'bg-slate-100 group-hover:bg-[#ffb700]/10'
                                            }`}>
                                                <span className={`material-symbols-outlined text-3xl transition-colors ${
                                                    items.length === 0 ? 'text-[#ffb700]' : 'text-slate-300 group-hover:text-[#ffb700]'
                                                }`}>add</span>
                                            </div>
                                            <div className="text-left min-w-0 pr-2">
                                                <p className={`text-[15px] font-black tracking-tight mb-1 transition-colors ${
                                                    items.length === 0 ? 'text-[#ffb700]' : 'text-slate-400 group-hover:text-[#ffb700]'
                                                }`}>
                                                    {items.length === 0 ? 'Begin your ranking legency' : 'Add another legend'}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    {10 - items.length} slots left in this stack
                                                </p>
                                            </div>
                                        </motion.button>
                                    )}

                                    {items.length >= 10 && (
                                        <div className="mt-4 flex items-center gap-4 p-6 rounded-[32px] bg-slate-50 border border-black/5">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-[#ffb700]">lock</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    Ranking Complete
                                                </p>
                                                <p className="text-[13px] font-bold text-slate-400">You've reached the maximum of 10 titles for this stack.</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}


                {!currentList && !isLoading && (
                     <div className="flex-grow flex items-center justify-center py-20">
                        <div className="text-center max-w-sm">
                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <span className="text-5xl">🍯</span>
                            </div>
                            <h2 className="text-3xl font-black text-[#2D2926] tracking-tighter mb-4">Empty Stacks</h2>
                            <p className="text-slate-400 font-bold text-sm mb-10 leading-relaxed px-4">
                                Your rankings define your cinematic DNA. Create your first stack to start curating your all-time favourites.
                            </p>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-full bg-[#2D2926] text-white py-6 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-black transition-all active:scale-95"
                            >
                                Build Your First Stack
                            </button>
                        </div>
                     </div>
                )}

                {error && <ErrorState message={error} onRetry={() => loadLists()} />}

                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create Cinematic Stack"
                >
                    <div className="flex flex-col gap-8 p-2">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">
                                Stack Name
                            </label>
                            <input
                                type="text"
                                value={newStackName}
                                onChange={(e) => setNewStackName(e.target.value)}
                                placeholder="e.g., Sci-Fi Legends, 90s Noir..."
                                className="w-full p-6 rounded-[28px] bg-slate-50 border-2 border-black/5 font-black text-lg text-[#2D2926] placeholder:text-slate-200 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/5 transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateStack()}
                            />
                            <p className="text-[10px] font-black text-slate-300 px-2 uppercase tracking-widest">
                                {lists.length}/5 stacks used
                            </p>
                        </div>
                        <button
                            onClick={handleCreateStack}
                            disabled={!newStackName.trim() || isCreating}
                            className="w-full bg-[#2D2926] text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isCreating ? <BeeLoader size="small" /> : 'Forg Stack'}
                        </button>
                    </div>
                </Modal>
            </div>
        </PageLayout>
    );
};

export default CinematicStacksPage;
