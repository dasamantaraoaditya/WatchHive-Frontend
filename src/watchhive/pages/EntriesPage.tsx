import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { entriesApi, Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList, EntryCard } from '../components/entries/EntryList';
import { useAuth } from '../contexts';
import { WatchlistGrid } from '../components/profile';
import { 
    SkeletonCard, 
    SkeletonGrid,
    EmptyState,
    FilterBar
} from '../components/common';
import { useUI } from '../contexts';
import { SuggestionsTab } from '../components/suggestions/SuggestionsTab';

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

    // Handle auto-open form or switch tab from navigation state
    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
            setEditingEntry(undefined);
            // Clear the state so it doesn't re-open on refresh
            navigate(location.pathname, { replace: true, state: { ...location.state, openForm: false } });
        }
        const stateTab = location.state?.activeTab;
        if (stateTab && ['history', 'watching', 'watchlist', 'suggestions'].includes(stateTab)) {
            setActiveTab(stateTab as any);
            // Clear state to prevent sticking on this tab if user navigates away and back
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'history' | 'watching' | 'watchlist' | 'suggestions'>('history');
    const [watchingEntries, setWatchingEntries] = useState<Entry[]>([]);
    const [isWatchingLoading, setIsWatchingLoading] = useState(false);
    const [watchingSearch, setWatchingSearch] = useState('');
    const [watchingSort, setWatchingSort] = useState('recent');

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
        setRefreshKey((prev) => prev + 1); // Trigger list refresh
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

    const handleComplete = async (entry: Entry) => {
        if (!window.confirm(`Mark "${entry.title}" as completed?`)) return;
        try {
            await entriesApi.updateEntry(entry.id, {
                isWatching: false,
                watchedAt: new Date().toISOString()
            });
            fetchWatching();
            setRefreshKey(prev => prev + 1); // Refresh history tab too
        } catch (err) {
            console.error('Failed to complete watching', err);
            alert('Failed to update entry');
        }
    };

    const sortedWatchingEntries = [...watchingEntries]
        .filter(entry => 
            entry.title.toLowerCase().includes(watchingSearch.toLowerCase())
        )
        .sort((a, b) => {
            if (watchingSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (watchingSort === 'title') return a.title.localeCompare(b.title);
            return 0;
        });

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">

            <main className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
                {!showForm ? (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#ffb700]/20 shadow-sm rounded-3xl p-6 md:px-10">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-[#2D2926]">Activity</h1>
                                <p className="text-[#2D2926]/60 mt-1 font-medium">Track and manage your cinematic journey</p>
                            </div>
                            <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-[#ffb700] text-white font-bold py-3 px-6 rounded-xl hover:brightness-105 transition-all shadow-sm w-full sm:w-auto">
                                <span className="material-symbols-outlined font-bold text-[20px]">add</span>
                                Log a Watch
                            </button>
                        </div>
                        
                        {/* Navigation Tabs */}
                        <div className="flex border-b border-slate-200 gap-0 md:gap-8 mt-2 overflow-x-auto no-scrollbar scroll-strip" style={{ scrollSnapType: 'x mandatory' }}>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`pb-3 md:pb-4 px-4 md:px-2 font-bold whitespace-nowrap transition-colors relative text-sm md:text-base scroll-snap-align-start ${activeTab === 'history' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Watch History
                            </button>
                            <button 
                                onClick={() => setActiveTab('watching')}
                                className={`pb-3 md:pb-4 px-4 md:px-2 font-bold whitespace-nowrap transition-colors relative text-sm md:text-base scroll-snap-align-start ${activeTab === 'watching' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Currently Watching
                            </button>
                            <button 
                                onClick={() => setActiveTab('watchlist')}
                                className={`pb-3 md:pb-4 px-4 md:px-2 font-bold whitespace-nowrap transition-colors relative text-sm md:text-base scroll-snap-align-start ${activeTab === 'watchlist' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Watchlist
                            </button>
                            <button 
                                onClick={() => setActiveTab('suggestions')}
                                className={`pb-3 md:pb-4 px-4 md:px-2 font-bold whitespace-nowrap transition-colors relative text-sm md:text-base scroll-snap-align-start ${activeTab === 'suggestions' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Suggestions
                            </button>
                        </div>

                        {activeTab === 'history' && (
                            <section className="flex flex-col animate-[fade-in_0.3s_ease-out]">
                                <EntryList key={refreshKey} onEdit={handleEdit} />
                            </section>
                        )}
                        
                        {activeTab === 'watching' && (
                            <section className="flex flex-col gap-2 animate-[fade-in_0.3s_ease-out] mb-12 mt-4">
                                <FilterBar 
                                    search={watchingSearch}
                                    onSearchChange={setWatchingSearch}
                                    sortBy={watchingSort}
                                    onSortChange={setWatchingSort}
                                    sortOptions={[
                                        { value: 'recent', label: 'Recently Added' },
                                        { value: 'title', label: 'Title: A-Z' }
                                    ]}
                                    count={sortedWatchingEntries.length}
                                    countLabel="Active Sessions"
                                    placeholder="Search currently watching..."
                                />
                                
                                {isWatchingLoading && watchingEntries.length === 0 ? (
                                    <SkeletonGrid count={3} />
                                ) : sortedWatchingEntries.length === 0 ? (
                                    <div className="py-20 w-full flex justify-center bg-white border border-[#ffb700]/10 rounded-3xl shadow-sm">
                                        <EmptyState
                                            title={watchingSearch ? "No matching sessions" : "No active sessions"}
                                            message={watchingSearch ? `No results for "${watchingSearch}"` : "The hive is quiet. Start watching something to track it here!"}
                                            icon={<span className="text-5xl drop-shadow-sm">📺</span>}
                                            actionLabel={watchingSearch ? "Clear Search" : "Log a Watch"}
                                            onAction={() => watchingSearch ? setWatchingSearch('') : handleAddNew()}
                                        />
                                    </div>
                                ) : (
                                    <div className="watchlist-grid">
                                        {sortedWatchingEntries.map(entry => (
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
                            <section className="flex flex-col gap-2 animate-[fade-in_0.3s_ease-in] mb-12 mt-4">
                                <WatchlistGrid />
                            </section>
                        )}

                        {activeTab === 'suggestions' && (
                            <SuggestionsTab />
                        )}


                    </>
                ) : (
                    <EntryForm
                        entry={editingEntry}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                )}
            </main>
        </div>
    );
};

export default EntriesPage;
