import React, { useState, useEffect, useMemo } from 'react';
import { PreviewEntry, ImportPreviewResult, dataService } from '../../services/data.service';
import { useUI } from '../../contexts';
import { BeeLoader } from '../common';

interface ImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: ImportPreviewResult | null;
    onConfirm: (payload: { entries: any[]; lists?: any[]; defaultToCurrentYear?: boolean }) => Promise<void>;
    isImporting: boolean;
    defaultToCurrentYear?: boolean;
    onToggleDefaultToCurrentYear?: (val: boolean) => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
    isOpen,
    onClose,
    previewData,
    onConfirm,
    isImporting,
    defaultToCurrentYear = false,
    onToggleDefaultToCurrentYear,
}) => {
    const [entries, setEntries] = useState<PreviewEntry[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unmatched' | 'matched'>('all');
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [localDefaultToCurrentYear, setLocalDefaultToCurrentYear] = useState(defaultToCurrentYear);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const { registerModal } = useUI();

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        setLocalDefaultToCurrentYear(defaultToCurrentYear);
    }, [defaultToCurrentYear]);

    useEffect(() => {
        if (!isOpen) return;
        return registerModal();
    }, [isOpen, registerModal]);

    useEffect(() => {
        if (previewData?.entries) {
            setEntries([...previewData.entries]);
            const hasUnmatched = previewData.entries.some(e => e.matchStatus === 'UNMATCHED');
            setActiveFilter(hasUnmatched ? 'unmatched' : 'all');
        }
    }, [previewData]);

    const { matchedCount, unmatchedCount, duplicateCount, missingDateCount } = useMemo(() => {
        let matched = 0, unmatched = 0, duplicates = 0, noDate = 0;
        for (const e of entries) {
            if (e.matchStatus === 'MATCHED') matched++;
            if (e.matchStatus === 'UNMATCHED') unmatched++;
            if (e.isDuplicate) duplicates++;
            if (!e.watchedAt) noDate++;
        }
        return { matchedCount: matched, unmatchedCount: unmatched, duplicateCount: duplicates, missingDateCount: noDate };
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries
            .map((entry, originalIndex) => ({ entry, originalIndex }))
            .filter(({ entry }) => {
                // Skip duplicates by default! Only show them if user selects duplicates
                if (!showDuplicates && entry.isDuplicate) return false;
                if (activeFilter === 'unmatched') return entry.matchStatus === 'UNMATCHED';
                if (activeFilter === 'matched') return entry.matchStatus === 'MATCHED';
                return true;
            });
    }, [entries, activeFilter, showDuplicates]);

    if (!isOpen || !previewData) return null;

    const handleOpenSearch = (index: number) => {
        setActiveSearchIndex(index);
        const item = entries[index];
        const defaultQuery = item.title;
        setSearchQuery(defaultQuery);
        executeSearch(defaultQuery);
    };

    const executeSearch = async (query: string) => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const results = await dataService.searchTmdb(query);
            setSearchResults(results);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectMatch = (originalIndex: number, match: any) => {
        const updated = [...entries];
        const target = updated[originalIndex];
        target.tmdbId = match.id;
        target.matchedTitle = match.title || match.name;
        target.matchedYear = (match.release_date || match.first_air_date || '').slice(0, 4);
        target.posterPath = match.poster_path;
        target.type = match.media_type === 'tv' ? 'TV_SHOW' : 'MOVIE';
        target.matchStatus = 'MATCHED';

        setEntries(updated);
        setActiveSearchIndex(null);
        setSearchResults([]);

        // If no more unmatched entries left, auto-switch to 'all' view
        const remainingUnmatched = updated.filter(e => e.matchStatus === 'UNMATCHED').length;
        if (remainingUnmatched === 0 && activeFilter === 'unmatched') {
            setActiveFilter('all');
        }
    };

    const handleRemoveEntry = (originalIndex: number) => {
        const updated = entries.filter((_, i) => i !== originalIndex);
        setEntries(updated);
        if (activeSearchIndex === originalIndex) {
            setActiveSearchIndex(null);
        }
    };

    const handleConfirm = () => {
        const importableEntries = showDuplicates
            ? entries
            : entries.filter(e => !e.isDuplicate);

        const pendingUnmatched = importableEntries.filter(e => e.matchStatus === 'UNMATCHED');
        if (pendingUnmatched.length > 0 || importableEntries.length === 0) return;

        onConfirm({
            entries: importableEntries,
            lists: previewData.lists,
            defaultToCurrentYear: localDefaultToCurrentYear,
        });
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] shrink-0">
                            <span className="material-symbols-outlined text-lg sm:text-xl">fact_check</span>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-xl font-black text-slate-800 truncate">
                                Review & Match Entries
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">
                                {showDuplicates ? entries.length : entries.length - duplicateCount} items to import · {unmatchedCount > 0 ? `${unmatchedCount} require matching` : 'All items matched'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all shrink-0 ml-2"
                    >
                        <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
                    </button>
                </div>

                {/* Status & Filter Bar */}
                <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    {/* Status badges & Controls */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0 max-w-full">
                        {unmatchedCount > 0 ? (
                            <>
                                <span className="h-8 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs shrink-0">
                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                    {showDuplicates ? matchedCount : entries.filter(e => e.matchStatus === 'MATCHED' && !e.isDuplicate).length} Ready
                                </span>
                                <span className="h-8 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs shrink-0">
                                    <span className="material-symbols-outlined text-xs">warning</span>
                                    {unmatchedCount} Need Match
                                </span>
                            </>
                        ) : (
                            <span className="h-8 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs shrink-0">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                {showDuplicates ? matchedCount : entries.filter(e => e.matchStatus === 'MATCHED' && !e.isDuplicate).length} Ready to Import
                            </span>
                        )}
                        {duplicateCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowDuplicates(prev => !prev)}
                                className={`h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer ${
                                    showDuplicates
                                        ? 'bg-amber-100/90 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                }`}
                                title={showDuplicates ? "Duplicates are currently shown in All. Click to skip them." : "Duplicates are skipped by default. Click to show them in All."}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {showDuplicates ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                                <span>{duplicateCount} Duplicates ({showDuplicates ? 'Shown' : 'Skipped'})</span>
                            </button>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs w-full sm:w-auto shrink-0">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center ${
                                activeFilter === 'all' ? 'bg-[#ffb700] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            All ({showDuplicates ? entries.length : entries.length - duplicateCount})
                        </button>
                        <button
                            onClick={() => setActiveFilter('unmatched')}
                            className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center ${
                                activeFilter === 'unmatched' ? 'bg-[#ffb700] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Unmatched ({unmatchedCount})
                        </button>
                        <button
                            onClick={() => setActiveFilter('matched')}
                            className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center ${
                                activeFilter === 'matched' ? 'bg-[#ffb700] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Matched ({showDuplicates ? matchedCount : entries.filter(e => e.matchStatus === 'MATCHED' && !e.isDuplicate).length})
                        </button>
                    </div>
                </div>

                {/* Default to Current Year Toggle Bar */}
                <div className="px-4 sm:px-6 py-3 bg-amber-50/60 border-b border-amber-200/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                                    Default to current year if no date provided
                                </span>
                                {missingDateCount > 0 ? (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                                        {missingDateCount} undated item{missingDateCount > 1 ? 's' : ''}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                        (all entries include watch dates)
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
                                {localDefaultToCurrentYear
                                    ? `Items without a watch date will be logged under ${currentYear}`
                                    : 'Off — items missing dates will be recorded without a watch date'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 select-none">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors ${
                            localDefaultToCurrentYear ? 'bg-[#ffb700]/20 text-[#b07d00]' : 'bg-slate-200/80 text-slate-500'
                        }`}>
                            {localDefaultToCurrentYear ? 'On' : 'Off'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={localDefaultToCurrentYear}
                                onChange={(e) => {
                                    setLocalDefaultToCurrentYear(e.target.checked);
                                    onToggleDefaultToCurrentYear?.(e.target.checked);
                                }}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb700] shadow-inner transition-colors"></div>
                        </label>
                    </div>
                </div>

                {/* Banner Alerts */}
                {unmatchedCount > 0 && (
                    <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-3.5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 sm:gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-base sm:text-lg shrink-0 mt-0.5">info</span>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            <strong>{unmatchedCount} title(s) could not be matched automatically.</strong> Click{' '}
                            <strong>"Search TMDb"</strong> on any item to correct title mismatches, or remove items you don't want to import. All entries must be matched to complete the import.
                        </p>
                    </div>
                )}


                {/* Entries List (2-column on desktop, 1-column on mobile) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                            <p className="text-sm font-bold">No entries in this view</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-start">
                            {filteredEntries.map(({ entry, originalIndex }) => {
                                const isSearching = activeSearchIndex === originalIndex;
                                return (
                                <div
                                    key={originalIndex}
                                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                                        isSearching ? 'md:col-span-2 ring-2 ring-[#ffb700] shadow-md' : ''
                                    } ${
                                        entry.matchStatus === 'MATCHED'
                                            ? 'border-slate-100 bg-white hover:border-slate-200 shadow-xs'
                                            : 'border-amber-200 bg-amber-50/20 shadow-sm'
                                    }`}
                                >
                                    <div className="p-3.5 sm:p-4 flex flex-col justify-between gap-3 flex-1">
                                        {/* Top section: Poster + Details */}
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* Poster */}
                                            <div className="w-13 h-18 sm:w-14 sm:h-20 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                                {entry.posterPath ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w92${entry.posterPath}`}
                                                        alt={entry.matchedTitle || entry.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-300 text-2xl">movie</span>
                                                )}
                                            </div>

                                            {/* Text Details (Full width available on mobile) */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                                    <h4 className="text-sm sm:text-base font-black text-slate-800 line-clamp-2 leading-tight" title={entry.matchedTitle || entry.title}>
                                                        {entry.matchedTitle || entry.title}
                                                    </h4>
                                                    {entry.matchedYear && (
                                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 shrink-0">
                                                            ({entry.matchedYear})
                                                        </span>
                                                    )}
                                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-black uppercase text-slate-500 shrink-0">
                                                        {entry.type === 'TV_SHOW' ? 'TV' : 'MOVIE'}
                                                    </span>
                                                </div>

                                                {/* Original file title if different from matched */}
                                                {entry.matchedTitle && entry.matchedTitle.toLowerCase() !== entry.title.toLowerCase() && (
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5" title={entry.title}>
                                                        From file: <span className="italic font-medium">"{entry.title}"</span>
                                                    </p>
                                                )}

                                                {/* Meta badges: rating & date & location */}
                                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                    {entry.rating ? (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                            ⭐ {entry.rating}/10
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-slate-400">No rating</span>
                                                    )}

                                                    {entry.watchedAt ? (
                                                        <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <span>📅</span>
                                                            <span>
                                                                {new Date(entry.watchedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                {new Date(entry.watchedAt).getHours() !== 12 || new Date(entry.watchedAt).getMinutes() !== 0 ? (
                                                                    <span className="text-slate-400 font-bold ml-1">
                                                                        · {new Date(entry.watchedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                    ) : localDefaultToCurrentYear ? (
                                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1" title={`No watch date in file — will default to current year (${currentYear})`}>
                                                            <span>📅</span>
                                                            <span>No date (defaults to {currentYear})</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1" title="No watch date in file — no date watched will be recorded">
                                                            <span>📅</span>
                                                            <span>No date recorded</span>
                                                        </span>
                                                    )}

                                                    {entry.watchLocation && (
                                                        <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <span>📍</span> {entry.watchLocation}
                                                        </span>
                                                    )}

                                                    {entry.isRewatch && (
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[11px]">replay</span> Rewatch
                                                        </span>
                                                    )}

                                                    {entry.inWatchlist && (
                                                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                                                            Watchlist
                                                        </span>
                                                    )}
                                                </div>

                                                {entry.review && (
                                                    <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-1.5">
                                                        "{entry.review}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Bar: Duplicate status on left, Actions on right */}
                                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                                            <div className="min-w-0 flex-1">
                                                {entry.isDuplicate ? (
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 inline-flex items-center gap-1 max-w-full truncate" title={entry.duplicateReason}>
                                                        <span className="material-symbols-outlined text-[12px] shrink-0">content_copy</span>
                                                        <span className="truncate">{entry.duplicateReason || 'Already in library (will skip)'}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[11px]">check_circle</span> Ready
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSearch(originalIndex)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs ${
                                                        entry.matchStatus === 'MATCHED'
                                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                            : 'bg-[#ffb700] hover:bg-[#ffaa00] text-white shadow-md shadow-[#ffb700]/20'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-xs">
                                                        {entry.matchStatus === 'MATCHED' ? 'edit' : 'search'}
                                                    </span>
                                                    {entry.matchStatus === 'MATCHED' ? 'Change' : 'Match'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEntry(originalIndex)}
                                                    className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"
                                                    title="Exclude from import"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                {/* Inline TMDb Search Box */}
                                {activeSearchIndex === originalIndex && (
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 animate-[slide-down_0.15s_ease-out]">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && executeSearch(searchQuery)}
                                                    placeholder="Search movie or TV show title..."
                                                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ffb700] text-slate-800"
                                                />
                                                <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">
                                                    search
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => executeSearch(searchQuery)}
                                                disabled={searching}
                                                className="px-4 py-2 bg-[#ffb700] text-white font-black text-[10px] uppercase rounded-xl hover:bg-[#ffaa00] transition-all disabled:opacity-50"
                                            >
                                                {searching ? 'Searching...' : 'Search'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSearchIndex(null); setSearchResults([]); }}
                                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        </div>

                                        {/* Search Suggestions */}
                                        {searchResults.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto">
                                                {searchResults.slice(0, 6).map(res => (
                                                    <button
                                                        key={`${res.id}-${res.media_type}`}
                                                        type="button"
                                                        onClick={() => handleSelectMatch(originalIndex, res)}
                                                        className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/80 hover:border-[#ffb700] hover:shadow-sm text-left transition-all group"
                                                    >
                                                        <div className="w-8 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                            {res.poster_path ? (
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w92${res.poster_path}`}
                                                                    alt={res.title || res.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-slate-300 text-sm flex items-center justify-center h-full">movie</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#ffb700]">
                                                                {res.title || res.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {(res.release_date || res.first_air_date || '').slice(0, 4)} · {res.media_type === 'tv' ? 'TV' : 'Movie'}
                                                            </p>
                                                        </div>
                                                        <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-[#ffb700] shrink-0 mr-1">
                                                            check_circle
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                        {unmatchedCount > 0 ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Match all {unmatchedCount} remaining items to enable import
                            </span>
                        ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                All items verified and ready
                            </span>
                        )}
                        {!showDuplicates && duplicateCount > 0 && (
                            <span className="text-slate-400 font-medium">
                                · ({duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} skipped)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isImporting}
                            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={
                                (showDuplicates ? entries : entries.filter(e => !e.isDuplicate)).filter(e => e.matchStatus === 'UNMATCHED').length > 0 ||
                                (showDuplicates ? entries.length : entries.filter(e => !e.isDuplicate).length) === 0 ||
                                isImporting
                            }
                            className="flex-1 sm:flex-none px-6 py-3 bg-[#ffb700] hover:bg-[#ffaa00] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-[#ffb700]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isImporting ? (
                                <>
                                    <BeeLoader size="mini" message="" />
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">download_done</span>
                                    Import {showDuplicates ? matchedCount : entries.filter(e => e.matchStatus === 'MATCHED' && !e.isDuplicate).length} Entries
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportPreviewModal;
