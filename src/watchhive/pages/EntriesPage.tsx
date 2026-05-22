import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { entriesApi, Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList, EntryCard } from '../components/entries/EntryList';
import { useAuth, useUI } from '../contexts';
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

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'history' | 'watching' | 'watchlist' | 'suggestions'>('history');
    const [watchingEntries, setWatchingEntries] = useState<Entry[]>([]);
    const [isWatchingLoading, setIsWatchingLoading] = useState(false);
    const [watchingSort, setWatchingSort] = useState('recent');
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

    useEffect(() => {
        if (user && activeTab === 'watching') {
            fetchWatching();
        }
    }, [user?.id, activeTab]);

    const fetchWatching = async () => {
        if (!user) return;
        setIsWatchingLoading(true);
        try {
            const response = await entriesApi.getEntries({ userId: user.id, isWatching: true, limit: 10 });
            const filtered = response.entries.filter((e: Entry) => e.isWatching);
            setWatchingEntries(filtered);
        } catch (err) {
            console.error('Failed to fetch watching entries', err);
        } finally {
            setIsWatchingLoading(false);
        }
    };

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
        fetchWatching();
        setRefreshKey(prev => prev + 1);
    };

    const sortedWatchingEntries = [...watchingEntries]
        .sort((a, b) => {
            if (watchingSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (watchingSort === 'title') return a.title.localeCompare(b.title);
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
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'history' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Watch History
                        </button>
                        <button 
                            onClick={() => setActiveTab('watching')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'watching' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Currently Watching
                        </button>
                        <button 
                            onClick={() => setActiveTab('watchlist')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'watchlist' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Watchlist
                        </button>
                        <button 
                            onClick={() => setActiveTab('suggestions')}
                            className={`pb-4 px-4 md:px-2 font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-colors relative scroll-snap-align-start ${activeTab === 'suggestions' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Suggestions
                        </button>
                    </div>

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
                    
                    {activeTab === 'watching' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <FilterBar 
                                search={searchQueries.watching}
                                onSearchChange={(val) => setSearchQueries(prev => ({ ...prev, watching: val }))}
                                placeholder="Search currently watching list..."
                                sortBy={watchingSort}
                                onSortChange={setWatchingSort}
                                sortOptions={[
                                    { value: 'recent', label: 'Recently Added' },
                                    { value: 'title', label: 'Title: A-Z' }
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
                                        />
                                    ))}
                                    {isWatchingLoading && <SkeletonCard />}
                                </div>
                            )}
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
