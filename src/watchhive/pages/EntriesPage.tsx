import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList } from '../components/entries/EntryList';

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
                                <h1 className="text-3xl font-black tracking-tight text-[#2D2926]">Watch History</h1>
                                <p className="text-[#2D2926]/60 mt-1 font-medium">Track and manage your cinematic journey</p>
                            </div>
                            <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-[#ffb700] text-white font-bold py-3 px-6 rounded-xl hover:brightness-105 transition-all shadow-sm w-full sm:w-auto">
                                <span className="material-symbols-outlined font-bold text-[20px]">add</span>
                                Log a Watch
                            </button>
                        </div>
                        <EntryList key={refreshKey} onEdit={handleEdit} />
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
