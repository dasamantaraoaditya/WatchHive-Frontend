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
    EmptyState,
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

    const handleComplete = async (entry: Entry) => {
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

    return (
        <PageLayout maxWidth="5xl">
            {!showForm ? (
                <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#ffb700]/10 shadow-sm rounded-3xl p-6 md:p-10 animate-slide-up">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[#2D2926]">Activity</h1>
                            <p className="text-[#2D2926]/40 mt-1 font-bold text-sm uppercase tracking-widest">Track and manage your cinematic journey</p>
                        </div>
                        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-[#ffb700] text-white font-black uppercase tracking-widest py-4 px-8 rounded-2xl hover:brightness-105 transition-all shadow-lg shadow-[#ffb700]/20 w-full sm:w-auto text-xs">
                            <span className="material-symbols-outlined font-bold text-[20px]">add</span>
                            Log a Watch
                        </button>
                    </div>
                    
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
                            <EntryList key={refreshKey} onEdit={handleEdit} />
                        </section>
                    )}
                    
                    {activeTab === 'watching' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <FilterBar 
                                sortBy={watchingSort}
                                onSortChange={setWatchingSort}
                                sortOptions={[
                                    { value: 'recent', label: 'Recently Added' },
                                    { value: 'title', label: 'Title: A-Z' }
                                ]}
                                count={sortedWatchingEntries.length}
                                countLabel="Active Sessions"
                            />
                            
                            {isWatchingLoading && watchingEntries.length === 0 ? (
                                <SkeletonGrid count={3} />
                            ) : sortedWatchingEntries.length === 0 ? (
                                <div className="py-20 w-full flex justify-center bg-white border border-black/5 rounded-3xl shadow-sm">
                                    <EmptyState
                                        title="No active sessions"
                                        message="The hive is quiet. Start watching something to track it here!"
                                        icon={<span className="text-5xl drop-shadow-sm">📺</span>}
                                        actionLabel="Log a Watch"
                                        onAction={handleAddNew}
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
                        <section className="w-full flex animate-fade-in flex-col gap-6 mt-6">
                            <WatchlistGrid />
                        </section>
                    )}

                    {activeTab === 'suggestions' && (
                        <section className="flex flex-col gap-6 animate-fade-in mt-6">
                            <SuggestionsTab />
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
