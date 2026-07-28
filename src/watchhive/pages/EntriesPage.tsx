import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { entriesApi, Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList, EntryCard } from '../components/entries/EntryList';
import { useAuth, useUI, useCustomAlert } from '../contexts';
import { WatchlistGrid } from '../components/profile';
import { 
    SkeletonCard, 
    SkeletonGrid,
    FilterBar
} from '../components/common';
import { SuggestionsTab } from '../components/suggestions/SuggestionsTab';
import { PageLayout } from '../components/layout';

export const EntriesPage: React.FC = () => {
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('Activity');
        setPageIcon('history');
    }, [setPageTitle, setPageIcon]);

    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined);
    const [refreshKey, setRefreshKey] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const { user } = useAuth();
    const { alert, confirm } = useCustomAlert();

    const paramTab = searchParams.get('tab') || searchParams.get('activeTab');
    const initialTab = (paramTab && ['history', 'watching', 'watchlist', 'suggestions'].includes(paramTab))
        ? (paramTab as 'history' | 'watching' | 'watchlist' | 'suggestions')
        : 'watching';

    const [activeTab, setActiveTab] = useState<'history' | 'watching' | 'watchlist' | 'suggestions'>(initialTab);

    // Keep activeTab in sync with URL searchParams
    useEffect(() => {
        const urlTab = searchParams.get('tab') || searchParams.get('activeTab');
        if (urlTab && ['history', 'watching', 'watchlist', 'suggestions'].includes(urlTab)) {
            setActiveTab(urlTab as any);
        }
    }, [searchParams]);

    const handleTabSwitch = (tab: 'history' | 'watching' | 'watchlist' | 'suggestions') => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };
    const [watchingEntries, setWatchingEntries] = useState<Entry[]>([]);
    const [isWatchingLoading, setIsWatchingLoading] = useState(false);
    const [watchingPagination, setWatchingPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
    const [watchingSort, setWatchingSort] = useState('recent-desc');
    const [searchQueries, setSearchQueries] = useState({
        history: '',
        watching: '',
        watchlist: '',
        suggestions: ''
    });
    const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');

    // Debounce the search query for the history tab to avoid redundant API hits
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedHistorySearch(searchQueries.history);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQueries.history]);

    // Handle auto-open form or switch tab from navigation state
    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
            setEditingEntry(undefined);
            navigate(location.pathname, { replace: true, state: { ...location.state, openForm: false } });
        }
        const stateTab = location.state?.activeTab;
        if (stateTab && ['history', 'watching', 'watchlist', 'suggestions'].includes(stateTab)) {
            setActiveTab(stateTab as any);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const fetchWatching = useCallback(async (offset = 0) => {
        if (!user) return;
        setIsWatchingLoading(true);
        try {
            const response = await entriesApi.getEntries({ userId: user.id, isWatching: true, limit: 20, offset });
            const filtered = response.entries.filter((e: Entry) => e.isWatching);
            setWatchingEntries(prev => offset > 0 ? [...prev, ...filtered] : filtered);
            setWatchingPagination(response.pagination);
        } catch (err) {
            console.error('Failed to fetch watching entries', err);
        } finally {
            setIsWatchingLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && activeTab === 'watching') {
            fetchWatching(0);
        }
    }, [user?.id, activeTab, fetchWatching]);

    const handleLoadMoreWatching = useCallback(() => {
        if (watchingPagination.hasMore && !isWatchingLoading) {
            fetchWatching(watchingPagination.offset + watchingPagination.limit);
        }
    }, [watchingPagination, isWatchingLoading, fetchWatching]);

    const { observerTarget: watchingObserverTarget } = useInfiniteScroll({
        onLoadMore: handleLoadMoreWatching,
        hasMore: watchingPagination.hasMore,
        isLoading: isWatchingLoading,
        enabled: activeTab === 'watching',
    });

    const handleSuccess = () => {
        setShowForm(false);
        setEditingEntry(undefined);
        setRefreshKey((prev) => prev + 1);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingEntry(undefined);
    };

    const handleEdit = (entry: Entry) => {
        setEditingEntry(entry);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingEntry(undefined);
        setShowForm(true);
    };

    const handleComplete = async () => {
        // The modal handles the actual update now. Just refresh the list.
        fetchWatching(0);
        setRefreshKey(prev => prev + 1);
    };

    const handleDeleteWatching = async (id: string) => {
        const confirmed = await confirm('Are you sure you want to delete this currently watching session?', {
            title: 'Delete Session',
            confirmText: 'Delete',
            severity: 'danger'
        });
        if (!confirmed) return;
        try {
            await entriesApi.deleteEntry(id);
            setWatchingEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err: any) {
            await alert(err.response?.data?.error || 'Failed to delete entry', {
                title: 'Error',
                severity: 'error'
            });
        }
    };

    const sortedWatchingEntries = [...watchingEntries]
        .sort((a, b) => {
            const [field, order] = watchingSort.split('-') as [string, string];
            if (field === 'recent') {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return order === 'desc' ? dateB - dateA : dateA - dateB;
            }
            if (field === 'title') {
                const titleA = a.title || '';
                const titleB = b.title || '';
                return order === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
            }
            return 0;
        });

    const filteredWatchingEntries = sortedWatchingEntries.filter(entry => 
        entry.title.toLowerCase().includes(searchQueries.watching.toLowerCase())
    );

    return (
        <PageLayout maxWidth="5xl">
            {!showForm ? (
                <>

                    
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-black/5 gap-0 md:gap-8 mt-4 overflow-x-auto no-scrollbar scroll-strip" style={{ scrollSnapType: 'x mandatory' }}>
                        <button 
                            onClick={() => handleTabSwitch('watching')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'watching' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Currently Watching
                        </button>
                        <button 
                            onClick={() => handleTabSwitch('history')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'history' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Watch History
                        </button>
                        <button 
                            onClick={() => handleTabSwitch('watchlist')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'watchlist' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Watchlist
                        </button>
                        <button 
                            onClick={() => handleTabSwitch('suggestions')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'suggestions' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Suggestions
                        </button>
                    </div>

                    {activeTab === 'watching' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <FilterBar 
                                search={searchQueries.watching}
                                onSearchChange={(val) => setSearchQueries(prev => ({ ...prev, watching: val }))}
                                placeholder="Search currently watching list..."
                                sortBy={watchingSort}
                                onSortChange={setWatchingSort}
                                sortOptions={[
                                    { value: 'recent-desc', label: 'Recently Added' },
                                    { value: 'recent-asc', label: 'Oldest Added' },
                                    { value: 'title-asc', label: 'Title: A-Z' },
                                    { value: 'title-desc', label: 'Title: Z-A' }
                                ]}
                                count={filteredWatchingEntries.length}
                                countLabel={searchQueries.watching ? "Matching Sessions" : "Active Sessions"}
                            />
                            
                            {isWatchingLoading && watchingEntries.length === 0 ? (
                                <SkeletonGrid count={3} />
                            ) : filteredWatchingEntries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-8 bg-white rounded-[32px] border border-black/5 shadow-sm">
                                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-black/5 relative">
                                        <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-lg opacity-40"></span>
                                        <span className="material-symbols-outlined text-4xl text-slate-300 relative z-10">
                                            {searchQueries.watching ? "travel_explore" : "live_tv"}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                                        {searchQueries.watching ? "No matching sessions" : "No active sessions"}
                                    </h3>
                                    <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed mb-6">
                                        {searchQueries.watching 
                                            ? `We couldn't find any active sessions matching "${searchQueries.watching}"` 
                                            : "The hive is quiet. Start watching a movie or TV show to track your active sessions!"}
                                    </p>
                                    {!searchQueries.watching && (
                                        <button
                                            onClick={handleAddNew}
                                            className="bg-[#ffb700] hover:brightness-105 text-white font-black py-3.5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#ffb700]/20 active:scale-95 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base font-bold">add</span>
                                            Log a Watch
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="watchlist-grid">
                                    {filteredWatchingEntries.map(entry => (
                                        <EntryCard 
                                            key={entry.id} 
                                            entry={entry}
                                            onComplete={handleComplete}
                                            onDelete={handleDeleteWatching}
                                            onClick={(e) => navigate(`/watch-hive/details/${e.type === 'TV_SHOW' ? 'tv' : 'movie'}/${e.tmdbId}`, { state: { from: window.location.pathname + window.location.search } })}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Sentinel — always rendered so observer attaches correctly */}
                            <div ref={watchingObserverTarget} className="h-1 w-full" />

                            {/* Loading more skeleton */}
                            {isWatchingLoading && watchingEntries.length > 0 && (
                                <div className="watchlist-grid mt-4">
                                    {[...Array(3)].map((_, i) => <SkeletonCard key={`more-watching-${i}`} />)}
                                </div>
                            )}

                            {/* End of list */}
                            {!watchingPagination.hasMore && filteredWatchingEntries.length > 0 && !isWatchingLoading && (
                                <div className="flex items-center gap-4 py-6">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                                        <span>🐝</span> All caught up
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'history' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <EntryList 
                                key={refreshKey} 
                                onEdit={handleEdit}
                                onAddNew={handleAddNew}
                                searchQuery={searchQueries.history}
                                onSearchChange={(val) => setSearchQueries(prev => ({ ...prev, history: val }))}
                                filters={{ search: debouncedHistorySearch }}
                            />
                        </section>
                    )}

                    {activeTab === 'watchlist' && (
                        <section className="w-full flex animate-fade-in flex-col gap-6 mt-6">
                            <WatchlistGrid 
                                searchQuery={searchQueries.watchlist} 
                                onSearchChange={(val) => setSearchQueries(prev => ({ ...prev, watchlist: val }))}
                            />
                        </section>
                    )}

                    {activeTab === 'suggestions' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <SuggestionsTab 
                                searchQuery={searchQueries.suggestions} 
                                onSearchChange={(val) => setSearchQueries(prev => ({ ...prev, suggestions: val }))}
                            />
                        </section>
                    )}
                </>
            ) : (
                <div className="animate-slide-up">
                    <EntryForm
                        entry={editingEntry}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            )}
        </PageLayout>
    );
};

export default EntriesPage;
