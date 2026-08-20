import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { listsApi, List, ListItem } from '../services/lists.service';
import { RankedItem } from '../components/stacks/RankedItem';
import { RankedItemSkeleton } from '../components/stacks/RankedItemSkeleton';
import { SearchItemSkeleton } from '../components/stacks/SearchItemSkeleton';
import { StackCardSkeleton } from '../components/stacks/StackCardSkeleton';
import { BeeLoader, ErrorState, Modal } from '../components/common';
import { useUI, useCustomAlert } from '../contexts';
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
    const navigate = useNavigate();
    const { setPageTitle, setPageIcon } = useUI();
    const { alert, confirm } = useCustomAlert();

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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editStackName, setEditStackName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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
        setItems([]);
        try {
            const response = await listsApi.getRankedList(listId);
            setCurrentList(response.list);

            const seen = new Set<number>();
            const uniqueItems = (response.items || []).filter(item => {
                if (seen.has(item.tmdbId)) return false;
                seen.add(item.tmdbId);
                return true;
            });

            setItems(uniqueItems);
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
            await alert('Failed to add item to stack', { title: 'Error', severity: 'error' });
        }
    };



    const handleRemove = async (tmdbId: number) => {
        if (!currentList) return;
        const targetItem = items.find(item => item.tmdbId === tmdbId);
        const title = targetItem?.title || 'this title';

        const confirmed = await confirm(`Are you sure you want to remove "${title}" from this stack?`, {
            title: 'Remove from Stack',
            confirmText: 'Remove',
            severity: 'danger'
        });
        if (!confirmed) return;

        try {
            await listsApi.removeFromStack(currentList.id, tmdbId);
            setItems(prev => prev.filter(item => item.tmdbId !== tmdbId));
        } catch (err) {
            await alert('Failed to remove item', { title: 'Error', severity: 'error' });
        }
    };

    const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
        if (!currentList) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;

        setItems(newItems);
        try {
            const reorderData = newItems.map((item, idx) => ({
                tmdbId: item.tmdbId,
                orderIndex: idx
            }));
            await listsApi.reorderStack(currentList.id, reorderData);
        } catch (err) {
            console.error('Failed to save order:', err);
            // Revert state on failure
            loadRankedList(currentList.id);
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
            await alert('Failed to create ranking', { title: 'Error', severity: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditStack = async () => {
        if (!currentList) return;
        if (!editStackName.trim()) return;
        setIsUpdating(true);
        try {
            const updated = await listsApi.updateList(currentList.id, { name: editStackName });
            setLists(prev => prev.map(l => l.id === currentList.id ? updated : l));
            setCurrentList(updated);
            setIsEditModalOpen(false);
        } catch (err) {
            await alert('Failed to rename stack', { title: 'Error', severity: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteStack = async () => {
        if (!currentList) return;
        const confirmed = await confirm(`Are you sure you want to delete the stack "${currentList.name}"? This action cannot be undone.`, {
            title: 'Delete Stack',
            confirmText: 'Delete Stack',
            severity: 'danger'
        });
        if (!confirmed) return;

        try {
            await listsApi.deleteList(currentList.id);
            const remaining = lists.filter(l => l.id !== currentList.id);
            setLists(remaining);
            if (remaining.length > 0) {
                loadRankedList(remaining[0].id);
            } else {
                setCurrentList(null);
                setItems([]);
            }
        } catch (err) {
            await alert('Failed to delete stack', { title: 'Error', severity: 'error' });
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
                                                onClick={() => {
                                                    setIsSearchOpen(false);
                                                    navigate(`/watch-hive/details/${result.media_type === 'tv' ? 'tv' : 'movie'}/${result.id}`, { state: { from: window.location.pathname + window.location.search } });
                                                }}
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
                                                <button
                                                     type="button"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         handleAddItem(result);
                                                     }}
                                                     className="material-symbols-outlined text-[#ffb700] bg-slate-50 hover:bg-[#ffb700] hover:text-white transition-colors w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                     title="Add to stack"
                                                 >
                                                     add
                                                 </button>
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
                {lists.length > 0 && !error && (
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

                        {lists.length < 5 && (
                            <motion.div
                                onClick={() => setIsCreateModalOpen(true)}
                                className="stack-card border-dashed border-[#ffb700]/30 hover:border-[#ffb700]/60 bg-[#ffb700]/5 flex flex-col items-center justify-center text-center select-none min-w-[120px] sm:min-w-[140px]"
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ justifyContent: 'center', alignItems: 'center' }}
                            >
                                <span className="material-symbols-outlined text-[#ffb700] text-xl sm:text-2xl mb-1">add_circle</span>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#ffb700]">New Stack</span>
                            </motion.div>
                        )}
                    </div>
                )}

                {currentList && !error && (
                    <div className="flex flex-col gap-8">
                        {/* Stack Action Header */}
                        <div className="flex items-center justify-between bg-slate-50/50 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm">
                            <div className="min-w-0 pr-4">
                                <span className="text-[9px] font-black text-[#ffb700] uppercase tracking-[0.2em]">Active Stack</span>
                                <h2 className="text-xl sm:text-2xl font-black text-[#2D2926] tracking-tight truncate mt-0.5">
                                    {currentList.name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        setEditStackName(currentList.name);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-[#2D2926]/10 text-[#2D2926]/60 hover:text-[#ffb700] hover:border-[#ffb700]/30 shadow-sm active:scale-95 transition-all"
                                    title="Edit stack name"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                    onClick={handleDeleteStack}
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-red-100 text-[#2D2926]/20 hover:text-red-500 hover:bg-red-50/50 hover:border-red-200 shadow-sm active:scale-95 transition-all"
                                    title="Delete stack"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>

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
                                        <div className="flex flex-col gap-4 px-1 md:px-0">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {items.map((item, index) => (
                                                    <RankedItem
                                                        key={`${currentList.id}-${item.tmdbId}`}
                                                        item={item}
                                                        rank={index + 1}
                                                        totalItems={items.length}
                                                        onRemove={handleRemove}
                                                        onMove={(direction) => handleMoveItem(index, direction)}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
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


                {error ? (
                    <ErrorState 
                        title="The Hive is Currently Down"
                        message="Unable to connect to WatchHive servers right now. Please check your connection or try again later."
                        onRetry={() => {
                            setError(null);
                            setIsLoading(true);
                            loadLists();
                        }}
                    />
                ) : (!currentList && !isLoading && (
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
                ))}

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
                            {isCreating ? <BeeLoader size="small" /> : 'Forge Stack'}
                        </button>
                    </div>
                </Modal>

                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Rename Cinematic Stack"
                >
                    <div className="flex flex-col gap-8 p-2">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">
                                Stack Name
                            </label>
                            <input
                                type="text"
                                value={editStackName}
                                onChange={(e) => setEditStackName(e.target.value)}
                                placeholder="e.g., Sci-Fi Legends..."
                                className="w-full p-6 rounded-[28px] bg-slate-50 border-2 border-black/5 font-black text-lg text-[#2D2926] placeholder:text-slate-200 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/5 transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleEditStack()}
                            />
                        </div>
                        <button
                            onClick={handleEditStack}
                            disabled={!editStackName.trim() || isUpdating}
                            className="w-full bg-[#2D2926] text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isUpdating ? <BeeLoader size="small" /> : 'Save Changes'}
                        </button>
                    </div>
                </Modal>

            </div>
        </PageLayout>
    );
};

export default CinematicStacksPage;
