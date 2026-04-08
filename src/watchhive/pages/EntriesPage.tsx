import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { entriesApi, Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList, EntryCard } from '../components/entries/EntryList';
import { useAuth } from '../contexts';
import { WatchlistGrid } from '../components/profile';
import { 
    BeeLoader, 
    SkeletonCard, 
    SkeletonGrid
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
                            <section className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out] mb-12 mt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-800">
                                        <span className="material-symbols-outlined text-[#ffb700]">history</span>
                                        Active Sessions
                                    </h3>
                                    <div className="flex gap-2">
                                        {isWatchingLoading && <BeeLoader size="small" message="" className="py-0" />}
                                    </div>
                                </div>
                                
                                {isWatchingLoading && watchingEntries.length === 0 ? (
                                    <SkeletonGrid count={3} />
                                ) : watchingEntries.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500 bg-white border border-slate-100 rounded-xl font-medium shadow-sm">No active sessions. Start watching something!</div>
                                ) : (
                                    <div className="watchlist-grid">
                                        {watchingEntries.map(entry => (
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
                            <section className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out] mb-12 mt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-800">
                                        <span className="material-symbols-outlined text-[#ffb700]">bookmark</span>
                                        Watchlist: Saved for Later
                                    </h3>
                                </div>
                                <div className="w-full">
                                    <WatchlistGrid />
                                </div>
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
