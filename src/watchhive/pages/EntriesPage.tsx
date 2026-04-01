import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { entriesApi, Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList, EntryCard } from '../components/entries/EntryList';
import { useAuth } from '../contexts';
import { WatchlistGrid, ProfileStats } from '../components/profile';
import { BeeLoader } from '../components/common';

export const EntriesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined);
    const [refreshKey, setRefreshKey] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle auto-open form from navigation state
    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
            setEditingEntry(undefined);
            // Clear the state so it doesn't re-open on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'history' | 'watching' | 'watchlist' | 'stats'>('history');
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

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">
            {/* Embedded Header for Mobile */}
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-6 lg:px-20 py-3 md:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[#ffb700]"><span className="material-symbols-outlined text-3xl">history</span></div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#2D2926]">Activity</h2>
                    </div>
                </div>
            </header>

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
                                onClick={() => setActiveTab('stats')}
                                className={`pb-3 md:pb-4 px-4 md:px-2 font-bold whitespace-nowrap transition-colors relative text-sm md:text-base scroll-snap-align-start ${activeTab === 'stats' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Insights
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
                                
                                {watchingEntries.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500 bg-white border border-slate-100 rounded-xl font-medium shadow-sm">No active sessions. Start watching something!</div>
                                ) : (
                                    <div className="watchlist-grid">
                                        {watchingEntries.map(entry => (
                                            <EntryCard 
                                                key={entry.id} 
                                                entry={entry}
                                                onDelete={async (id) => {
                                                    if (window.confirm('Remove from currently watching?')) {
                                                        await entriesApi.deleteEntry(id);
                                                        fetchWatching();
                                                    }
                                                }}
                                            />
                                        ))}
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

                        {activeTab === 'stats' && (
                            <section className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out] mb-12 mt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-800">
                                        <span className="material-symbols-outlined text-[#ffb700]">analytics</span>
                                        Hive Analytics
                                    </h3>
                                </div>
                                <div className="w-full bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <ProfileStats />
                                </div>
                            </section>
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
