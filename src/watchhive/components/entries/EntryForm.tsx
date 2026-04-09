import React, { useState, useEffect, useRef, useCallback } from 'react';
import { entriesApi, CreateEntryData, Entry } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { HiveDatePicker } from '../common/HiveDatePicker';

interface EntryFormProps {
    entry?: Entry;
    prefillData?: { tmdbId: number; title: string; type: 'MOVIE' | 'TV_SHOW'; posterPath?: string | null; overview?: string | null };
    onSuccess?: (entry: Entry) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    vote_average?: number;
}

/* ── Star Rating Component (Tailwind Modified) ── */
/* ── Premium Fractional Star Component ── */
const FractionalStar: React.FC<{ fill: number; size: number; active: boolean }> = ({ fill, size, active }) => {
    const id = React.useId();
    // Use the branding color for filled parts, and a subtle dark for empty parts
    const strokeColor = active ? '#ffb700' : 'rgba(45, 41, 38, 0.2)';
    
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm transition-transform hover:scale-110">
            <defs>
                <linearGradient id={id} x1="0" x2="100%" y1="0" y2="0">
                    <stop offset={`${fill * 100}%`} stopColor="#ffb700" />
                    <stop offset={`${fill * 100}%`} stopColor="transparent" />
                </linearGradient>
            </defs>
            <path 
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                fill={`url(#${id})`}
                stroke={strokeColor}
                strokeWidth={active ? "1" : "1.5"}
                strokeLinejoin="round"
            />
        </svg>
    );
};

/* ── Sophisticated Rating Component ── */
const StarRating: React.FC<{
    value: number | undefined; 
    onChange: (v: number | undefined) => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    
    const displayValue = hoverValue ?? (value ?? 0);

    const calculateRating = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const width = rect.width;
        
        // Map 0-width to 0-10 rating, clamped
        const rawRating = (x / width) * 10;
        // Round to 1 decimal place
        return Math.max(0, Math.min(10, Math.round(rawRating * 10) / 10));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (disabled) return;
        setHoverValue(calculateRating(e));
    };

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;
        const newRating = calculateRating(e);
        // If clicking the same exact value, toggle off
        if (value === newRating) onChange(undefined);
        else onChange(newRating);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) {
            onChange(undefined);
        } else {
            onChange(Math.max(0, Math.min(10, Math.round(val * 10) / 10)));
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-6" role="radiogroup" aria-label="Rating">
            {/* The Interactive Star Row */}
            <div 
                ref={containerRef}
                className="flex items-center gap-1 cursor-crosshair py-2"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverValue(null)}
                onClick={handleClick}
            >
                {[0, 1, 2, 3, 4].map((i) => {
                    // Each star represents 2 points (0-2, 2-4, 4-6, 6-8, 8-10)
                    const starStart = i * 2;
                    const starFill = Math.max(0, Math.min(1, (displayValue - starStart) / 2));
                    
                    return (
                        <FractionalStar 
                            key={i} 
                            fill={starFill} 
                            size={40} 
                            active={displayValue > starStart} 
                        />
                    );
                })}
            </div>
            
            {/* The High-Precision Numeric Control */}
            <div className="flex items-center gap-2 bg-gradient-to-br from-[#FFF9F0] to-white border border-[#ffb700]/20 px-4 py-2 rounded-2xl shadow-sm">
                <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value ?? ''}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="w-14 bg-transparent text-[#ffb700] font-black text-xl outline-none border-none p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.0"
                />
                <span className="text-[#2D2926]/40 font-black text-xs uppercase tracking-widest">/ 10</span>
            </div>
        </div>
    );
};

/* ── Watch location quick picks ── */
const LOCATION_PRESETS = [
    { label: 'Cinema', value: 'Cinema', icon: 'theater_comedy' },
    { label: 'Home', value: 'Home', icon: 'home' },
    { label: 'Netflix', value: 'Netflix', icon: 'cast' },
    { label: 'Disney+', value: 'Disney+', icon: 'vpk' },
    { label: 'Prime', value: 'Prime Video', icon: 'live_tv' },
    { label: 'Mobile', value: 'On the Go', icon: 'smartphone' },
];

export const EntryForm: React.FC<EntryFormProps> = ({ entry, prefillData, onSuccess, onCancel, isModal = false }) => {
    const isEditing = !!entry;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Form state ──
    const [formData, setFormData] = useState<CreateEntryData>({
        tmdbId: entry?.tmdbId || prefillData?.tmdbId || 0,
        title: entry?.title || prefillData?.title || '',
        type: entry?.type || prefillData?.type || 'MOVIE',
        watchedAt: entry?.watchedAt 
            ? new Date(entry.watchedAt).toISOString().slice(0, 16) 
            : new Date().toISOString().slice(0, 16),
        rating: entry?.rating || undefined,
        review: entry?.review || '',
        tags: entry?.tags || [],
        isRewatch: entry?.isRewatch || false,
        isWatching: entry?.isWatching || false,
        watchLocation: entry?.watchLocation || '',
    });

    // ── UI state ──
    const [searchQuery, setSearchQuery] = useState(prefillData?.title || '');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState<string | null>(prefillData?.posterPath ? `https://image.tmdb.org/t/p/w342${prefillData.posterPath}` : null);
    const [selectedOverview, setSelectedOverview] = useState<string | null>(prefillData?.overview || null);
    const [showMoreDetails, setShowMoreDetails] = useState(!!(entry?.review || entry?.tags?.length || entry?.watchLocation));
    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Close search results when clicking outside ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 8);
            setSearchResults(results);
            setShowResults(results.length > 0);
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

    const handleSelectResult = (result: TmdbResult) => {
        const title = result.title || result.name || '';
        const type = result.media_type === 'tv' ? 'TV_SHOW' : 'MOVIE';
        setFormData((prev) => ({ ...prev, tmdbId: result.id, title, type: type as 'MOVIE' | 'TV_SHOW' }));
        setSearchQuery(title);
        setShowResults(false);
        if (result.poster_path) setSelectedPoster(`https://image.tmdb.org/t/p/w342${result.poster_path}`);
        else setSelectedPoster(null);
        setSelectedOverview(result.overview || null);
    };

    const handleAddTag = () => {
        const t = tagInput.trim();
        if (t && !formData.tags?.includes(t)) {
            setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), t] }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({ ...prev, tags: prev.tags?.filter((t) => t !== tag) || [] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.tmdbId || !formData.title) {
            setError('Please search for and select a movie or TV show');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            let savedEntry: Entry;
            if (isEditing && entry) {
                const { tmdbId, ...updateData } = formData;
                savedEntry = await entriesApi.updateEntry(entry.id, updateData);
            } else {
                savedEntry = await entriesApi.createEntry(formData as CreateEntryData);
            }
            onSuccess?.(savedEntry);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save entry');
        } finally {
            setIsLoading(false);
        }
    };

    const yearOf = (r: TmdbResult) => {
        const d = r.release_date || r.first_air_date;
        return d ? d.slice(0, 4) : '';
    };

    const hasSelection = formData.tmdbId > 0 && formData.title.length > 0;

    return (
        <div className={`w-full ${!isModal ? 'max-w-4xl mx-auto py-4 md:py-8' : ''}`}>
            <div className={`${!isModal ? 'bg-white border border-[#ffb700]/20 shadow-sm rounded-3xl p-4 md:p-10' : 'p-0'}`}>
                {!isModal && (
                    <div className="flex flex-col gap-2 mb-8 border-b border-[#ffb700]/10 pb-6">
                        <h2 className="text-3xl font-black text-[#2D2926] flex items-center gap-3">
                            {isEditing ? <span className="text-[#ffb700] material-symbols-outlined text-[32px]">edit</span> : <span className="text-[#ffb700] material-symbols-outlined text-[32px]">movie</span>}
                            {isEditing ? 'Edit Existing Entry' : 'Log your latest Watch'}
                        </h2>
                        <p className="text-[#2D2926]/50 font-medium">
                            {isEditing ? 'Update the details below to ensure historical accuracy.' : 'Search the global hive database, rate it, and add to your collection.'}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 border border-red-200 font-bold p-4 rounded-xl mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined">warning</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'}`}>
                    
                    {/* ── Step 1: Search & Select ── */}
                    {!isEditing && (
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-[#2D2926]/40">1. What did you watch?</label>
                            <div className="relative" ref={searchRef}>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-[#ffb700] text-[24px]">search</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                        className="w-full pl-12 pr-4 py-4 bg-[#FFF9F0]/50 border-2 border-[#ffb700]/30 outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 rounded-2xl text-lg font-bold text-[#2D2926] transition-all"
                                        placeholder="Search movies or TV shows…"
                                        autoComplete="off"
                                    />
                                    {isSearching && <div className="absolute right-4 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#ffb700]"></div>}
                                </div>

                                {/* Results dropdown */}
                                {showResults && (
                                    <div className="absolute top-full mt-2 left-0 right-0 max-h-80 overflow-y-auto bg-white border border-[#ffb700]/20 rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,183,0,0.15)] z-50 p-2 flex flex-col gap-1">
                                        {searchResults.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className="w-full flex items-center gap-4 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors cursor-pointer text-left focus:outline-none"
                                                onClick={() => handleSelectResult(r)}
                                            >
                                                {r.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-12 h-16 object-cover rounded-md shadow-sm border border-[#2D2926]/5" />
                                                ) : (
                                                    <div className="w-12 h-16 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-md flex items-center justify-center text-[#ffb700]/50">
                                                        <span className="material-symbols-outlined">image_not_supported</span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-[#2D2926] truncate">{r.title || r.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-[#2D2926]/50 mt-1 font-bold tracking-widest uppercase">
                                                        <span className={r.media_type === 'tv' ? 'text-blue-500' : 'text-[#ffb700]'}>{r.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                                                        {yearOf(r) && <span>• {yearOf(r)}</span>}
                                                        {r.vote_average != null && r.vote_average > 0 && <span className="flex items-center gap-1"> • ⭐ {(r.vote_average).toFixed(1)}</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selection preview */}
                            {hasSelection && (
                                <div className="mt-4 flex gap-6 p-4 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl relative shadow-sm items-start">
                                    {selectedPoster && (
                                        <img src={selectedPoster} alt={formData.title} className="w-24 lg:w-32 aspect-[2/3] object-cover rounded-xl shadow-md border border-white" />
                                    )}
                                    <div className="flex-1 pt-2">
                                        <h3 className="text-2xl font-black text-[#2D2926] mb-2">{formData.title}</h3>
                                        <span className="inline-block px-3 py-1 bg-[#ffb700]/20 text-[#ffb700] font-bold text-xs uppercase tracking-widest rounded-lg mb-4">
                                            {formData.type === 'TV_SHOW' ? '📺 TV Show' : formData.type === 'EPISODE' ? '📼 Episode' : '🎬 Movie'}
                                        </span>
                                        {selectedOverview && <p className="text-[#2D2926]/60 text-sm max-w-lg leading-relaxed line-clamp-3">{selectedOverview}</p>}
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#ffb700]/20 hover:bg-red-50 text-[#2D2926]/40 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center font-bold"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, tmdbId: 0, title: '', type: 'MOVIE' }));
                                            setSearchQuery('');
                                            setSelectedPoster(null);
                                            setSelectedOverview(null);
                                        }}
                                        aria-label="Clear selection"
                                    >✕</button>
                                </div>
                            )}
                        </div>
                    )}

                    {isEditing && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">Locked Target Variable</label>
                            <div className="p-4 bg-[#FFF9F0] rounded-2xl border border-[#ffb700]/20 font-black text-2xl text-[#2D2926]">
                                {formData.title}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Rate ── */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">{(isEditing) ? '1' : '2'}. How would you rate it?</label>
                        <StarRating value={formData.rating} onChange={(v) => setFormData((prev) => ({ ...prev, rating: v }))} />
                    </div>

                    {/* ── Step 3: When ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <HiveDatePicker
                                label={(isEditing) ? '2. When did you experience it?' : '3. When did you experience it?'}
                                value={formData.watchedAt}
                                onChange={(val: string) => setFormData((prev) => ({ ...prev, watchedAt: val || new Date().toISOString().slice(0, 16) }))}
                            />

                        <div className="flex flex-col sm:flex-row gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group w-max outline-none focus:ring-4 focus:ring-[#ffb700]/10 rounded-xl p-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRewatch}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, isRewatch: e.target.checked }))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-[#2D2926]/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ffb700] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                                </div>
                                <span className="font-extrabold text-[#2D2926] group-hover:text-[#ffb700] transition-colors uppercase tracking-widest text-sm">Rewatch</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group w-max outline-none focus:ring-4 focus:ring-[#ffb700]/10 rounded-xl p-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.isWatching}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, isWatching: e.target.checked }))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-[#2D2926]/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#22c55e] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                                </div>
                                <span className="font-extrabold text-[#2D2926] group-hover:text-[#22c55e] transition-colors uppercase tracking-widest text-sm">Currently Watching</span>
                            </label>
                        </div>
                    </div>

                    {/* ── Optional Details Toggle ── */}
                    <div className="border-t border-[#ffb700]/10 pt-6 mt-4">
                        <button
                            type="button"
                            className="bg-transparent border-none text-[#ffb700] font-bold uppercase tracking-widest text-sm flex items-center gap-2 hover:underline focus:outline-none"
                            onClick={() => setShowMoreDetails((v) => !v)}
                        >
                            <span>{showMoreDetails ? 'Hide additional metrics' : 'Add custom annotations (Optional)'}</span>
                            <span className="material-symbols-outlined text-lg">{showMoreDetails ? 'expand_less' : 'expand_more'}</span>
                        </button>
                    </div>

                    {showMoreDetails && (
                        <div className="flex flex-col gap-8 bg-[#FFF9F0]/30 p-6 sm:p-8 rounded-2xl border border-[#ffb700]/10">
                            
                            {/* Watch Location */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">Where were you?</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {LOCATION_PRESETS.map((l) => (
                                        <button
                                            key={l.value}
                                            type="button"
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group/loc
                                            ${formData.watchLocation === l.value ? 'bg-[#ffb700] text-white border-[#ffb700] shadow-md scale-[1.02]' : 'bg-white border-[#ffb700]/10 text-[#2D2926]/40 hover:border-[#ffb700]/30 hover:bg-[#FFF9F0]'}`}
                                            onClick={() => setFormData((prev) => ({ ...prev, watchLocation: prev.watchLocation === l.value ? '' : l.value }))}
                                        >
                                            <span className={`material-symbols-outlined text-2xl transition-transform group-hover/loc:scale-110 ${formData.watchLocation === l.value ? 'text-white' : 'text-[#ffb700]/60'}`}>
                                                {l.icon}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{l.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.watchLocation || ''}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, watchLocation: e.target.value }))}
                                    className="w-full mt-2 px-4 py-3 bg-white border border-[#ffb700]/20 outline-none focus:border-[#ffb700] rounded-xl text-[#2D2926]"
                                    placeholder="Or type a custom location / environment..."
                                />
                            </div>

                            {/* Review */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">Thematic Review & Thoughts</label>
                                <textarea
                                    value={formData.review || ''}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, review: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 rounded-xl text-[#2D2926] resize-y min-h-[120px]"
                                    rows={4}
                                    placeholder="Unleash your architectural critique..."
                                />
                            </div>

                            {/* Tags */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">Custom Index Tags</label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-[#ffb700]/20 outline-none focus:border-[#ffb700] rounded-xl text-[#2D2926]"
                                    placeholder="Type a tag and press Enter"
                                />
                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag) => (
                                            <span key={tag} className="flex items-center gap-1 bg-[#ffb700]/10 border border-[#ffb700]/30 text-[#ffb700] px-3 py-1.5 rounded-lg text-sm font-black">
                                                #{tag}
                                                <button type="button" onClick={() => handleRemoveTag(tag)} className="w-5 h-5 flex items-center justify-center rounded-full bg-[#ffb700]/20 text-[#ffb700] hover:bg-red-100 hover:text-red-500 transition-colors ml-1 focus:outline-none">
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className={`
                        flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-[#ffb700]/20 pt-8 mt-4
                        ${isMobile && isModal ? 'pb-10' : ''}
                    `}>
                        {onCancel && (
                            <button type="button" onClick={onCancel} className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-[#2D2926]/60 font-bold tracking-widest uppercase hover:bg-[#2D2926]/5 rounded-xl transition-all disabled:opacity-50 focus:outline-none" disabled={isLoading}>
                                Abandon Setup
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`
                                w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#ffb700] text-white font-black text-lg rounded-2xl hover:brightness-105 shadow-[0_8px_30px_-10px_rgba(255,183,0,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                                ${isMobile ? 'order-first' : ''}
                            `}
                            disabled={isLoading || (!isEditing && !hasSelection)}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Synchronizing...
                                </>
                            ) : isEditing ? 'Update Entry' : 'Log Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntryForm;
