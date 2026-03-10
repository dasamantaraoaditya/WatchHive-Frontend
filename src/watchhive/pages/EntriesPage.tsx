import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Entry } from '../services/entries.service';
import { EntryForm } from '../components/entries/EntryForm';
import { EntryList } from '../components/entries/EntryList';
import './EntriesPage.css';

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
        <div className="entries-page">
            {!showForm ? (
                <>
                    <div className="entries-page-header">
                        <div className="header-content">
                            <h1>My Watch History</h1>
                            <p>Track and manage your movie and TV show entries</p>
                        </div>
                        <button onClick={handleAddNew} className="add-entry-btn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Entry
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
        </div>
    );
};

export default EntriesPage;
