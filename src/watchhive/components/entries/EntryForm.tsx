import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { entriesApi, CreateEntryData, Entry, SuggestedUser } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { HiveDatePicker } from '../common/HiveDatePicker';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

export function calculateFuzzyScore(query: string, targetTitle: string): number {
    if (!query || !targetTitle) return 0;
    const q = query.toLowerCase().trim();
    const t = targetTitle.toLowerCase().trim();

    if (q === t) return 100;
    if (t.startsWith(q)) return 95;
    if (t.includes(q)) return 85;

    const cleanQ = q.replace(/[^a-z0-9]/g, '');
    const cleanT = t.replace(/[^a-z0-9]/g, '');

    if (cleanT.includes(cleanQ)) return 80;

    const qWords = q.split(/\s+/);
    const tWords = t.split(/\s+/);
    let matchedWords = 0;
    for (const qw of qWords) {
        if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
            matchedWords++;
        }
    }
    const tokenScore = (matchedWords / qWords.length) * 70;

    const editDist = levenshteinDistance(cleanQ, cleanT);
    const maxLen = Math.max(cleanQ.length, cleanT.length);
    const similarityRatio = maxLen > 0 ? (1 - editDist / maxLen) * 60 : 0;

    return Math.max(tokenScore, similarityRatio);
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

interface EntryFormProps {
    entry?: Entry;
    prefillData?: { 
        tmdbId: number; 
        title: string; 
        type: 'MOVIE' | 'TV_SHOW'; 
        posterPath?: string | null; 
        overview?: string | null;
        suggestedByUserId?: string | null;
        suggestedByUser?: SuggestedUser | null;
    };
    onSuccess?: (entry: Entry) => void;
    onCancel?: () => void;
    isModal?: boolean;
    defaultIsWatching?: boolean;
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

/* ── Premium Fractional Star Component ── */
const FractionalStar: React.FC<{ fill: number; size: number; active: boolean }> = ({ fill, size, active }) => {
    const id = React.useId();
    // branding gold color vs soft background gray
    const strokeColor = active ? '#ffb700' : 'rgba(45, 41, 38, 0.15)';
    
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm transition-all duration-300 transform hover:scale-115">
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

/* ── Star Rating Component with Snapping Snaps ── */
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
        // Snap to nearest 0.5 step for incredibly user-friendly rating snaps!
        return Math.max(0.5, Math.min(10, Math.round(rawRating * 2) / 2));
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
            onChange(Math.max(0, Math.min(10, Math.round(val * 2) / 2)));
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="Rating">
            {/* The Interactive Star Row */}
            <div 
                ref={containerRef}
                className="flex items-center gap-1.5 cursor-pointer py-1.5"
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
                            size={36} 
                            active={displayValue > starStart} 
                        />
                    );
                })}
            </div>
            
            {/* The High-Precision Numeric Control */}
            <div className="flex items-center gap-1 bg-gradient-to-br from-[#FFF9F0] to-white border border-[#ffb700]/25 px-3 py-1.5 rounded-xl shadow-sm">
                <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={value ?? ''}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="w-12 bg-transparent text-[#ffb700] font-black text-lg outline-none border-none p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.0"
                />
                <span className="text-[#2D2926]/30 font-black text-[10px] uppercase tracking-widest">/ 10</span>
            </div>
        </div>
    );
};

/* ── Custom Brand SVGs for OTT Locations ── */

const CinemaIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <path d="M4 4h16a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V6a2 2 0 0 1 2-2z" fill="url(#ticketGrad)" stroke="#FFD700" strokeWidth="1" />
        <line x1="8" y1="5" x2="8" y2="19" stroke="#FFD700" strokeDasharray="2 2" />
        <circle cx="15" cy="12" r="1.5" fill="#FFF" />
        <defs>
            <linearGradient id="ticketGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#B33939" />
                <stop offset="100%" stopColor="#210808" />
            </linearGradient>
        </defs>
    </svg>
);

const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 12a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" fill="url(#sofaGrad)" />
        <rect x="5" y="12" width="6" height="5" rx="1" fill="#FFF" fillOpacity="0.25" />
        <rect x="13" y="12" width="6" height="5" rx="1" fill="#FFF" fillOpacity="0.25" />
        <defs>
            <linearGradient id="sofaGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#F39C12" />
                <stop offset="100%" stopColor="#D35400" />
            </linearGradient>
        </defs>
    </svg>
);

const NetflixIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="#141414" />
        <path d="M7 4.5h3l3.5 10.5V4.5h3v15h-3L7 9.5v10H7V4.5z" fill="#E50914" />
        <path d="M10 4.5v15l3.5-10.5V4.5H10z" fill="#B20710" />
    </svg>
);

const DisneyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#disneyGrad)" />
        <path d="M12 4c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-0.5 7h-1v-1h1v1zm3 0h-1v-1h1v1z" fill="#FFF" fillOpacity="0.4" />
        <path d="M5 8c1-1 2.5-1.5 4-1.5s3 .5 4 1.5M3 12c0-3 1.5-5 3.5-6M21 12c0 3-1.5 5-3.5 6" stroke="#FFF" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="1 2.5" />
        <polygon points="12,7 13.5,10 16,10 14,11.5 15,14 12,12.5 9,14 10,11.5 8,10 10.5,10" fill="#FFF" />
        <defs>
            <linearGradient id="disneyGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0B133A" />
                <stop offset="60%" stopColor="#1E3E8F" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
    </svg>
);

const PrimeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#primeGrad)" />
        <path d="M6 14.5c3 1.5 9 1.5 12 0" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 14.5l-3-.3M18 14.5v-2.5" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="10,8 15,11 10,14" fill="#FFF" />
        <defs>
            <linearGradient id="primeGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#00A8E8" />
                <stop offset="100%" stopColor="#005A9C" />
            </linearGradient>
        </defs>
    </svg>
);

const MobileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect x="6" y="2" width="12" height="20" rx="2.5" fill="url(#mobileGrad)" stroke="#FFF" strokeWidth="0.5" />
        <circle cx="12" cy="19.5" r="1" fill="#FFF" fillOpacity="0.8" />
        <rect x="8" y="4" width="8" height="12" rx="0.5" fill="#1e272e" />
        <polygon points="11,8 14,10 11,12" fill="#00D2D3" />
        <defs>
            <linearGradient id="mobileGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#00D2D3" />
                <stop offset="100%" stopColor="#01A3A4" />
            </linearGradient>
        </defs>
    </svg>
);

const AnimaxIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#animaxGrad)" />
        <path d="M7 16.5L12 6L17 16.5M9 13.2H15" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
            <linearGradient id="animaxGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#8A2BE2" />
                <stop offset="100%" stopColor="#4B0082" />
            </linearGradient>
        </defs>
    </svg>
);

/* ── OTT Presets Mapping ── */
const LOCATION_PRESETS = [
    { label: 'Cinema', value: 'Cinema', renderIcon: () => <CinemaIcon /> },
    { label: 'Home', value: 'Home', renderIcon: () => <HomeIcon /> },
    { label: 'Netflix', value: 'Netflix', renderIcon: () => <NetflixIcon /> },
    { label: 'Disney+', value: 'Disney+', renderIcon: () => <DisneyIcon /> },
    { label: 'Prime', value: 'Prime Video', renderIcon: () => <PrimeIcon /> },
    { label: 'Animax', value: 'Animax', renderIcon: () => <AnimaxIcon /> },
    { label: 'Mobile', value: 'On the Go', renderIcon: () => <MobileIcon /> },
];

/* ── Cinephile Mood Phrases ── */
const getRatingMood = (rating: number | undefined): { text: string; color: string; icon: string } => {
    if (rating === undefined || rating === 0) return { text: "Select a rating to record your thoughts", color: "text-[#2D2926]/40", icon: "rate_review" };
    if (rating <= 2.0) return { text: "Disaster / Complete Waste of Time 🗑️", color: "text-red-600 bg-red-50 border-red-100", icon: "sentiment_very_dissatisfied" };
    if (rating <= 4.0) return { text: "Poor / Not Recommended 👎", color: "text-orange-600 bg-orange-50 border-orange-100", icon: "sentiment_dissatisfied" };
    if (rating <= 5.5) return { text: "Mediocre / Average🍿", color: "text-yellow-700 bg-yellow-50 border-yellow-100", icon: "sentiment_neutral" };
    if (rating <= 7.0) return { text: "Decent / Enjoyable 👍", color: "text-lime-700 bg-lime-50 border-lime-100", icon: "sentiment_satisfied" };
    if (rating <= 8.5) return { text: "Excellent / Highly Recommended 🔥", color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: "sentiment_very_satisfied" };
    if (rating <= 9.5) return { text: "Outstanding / Near Flawless 🌟", color: "text-amber-700 bg-amber-50 border-amber-100", icon: "grade" };
    return { text: "Absolute Masterpiece / Cinematic Perfection 🏆", color: "text-yellow-600 bg-amber-50 border-amber-200 font-extrabold animate-pulse", icon: "emoji_events" };
};

/* ── Timezone-Aware Local ISO Formatter ── */
const toLocalISOString = (dateInput: Date | string | number) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
};

export const EntryForm: React.FC<EntryFormProps> = ({ entry, prefillData, onSuccess, onCancel, isModal = false, defaultIsWatching = false }) => {
    const navigate = useNavigate();
    const isEditing = !!entry;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { user } = useAuth();

    // ── Form state ──
    const [formData, setFormData] = useState<CreateEntryData>({
        tmdbId: entry?.tmdbId || prefillData?.tmdbId || 0,
        title: entry?.title || prefillData?.title || '',
        type: entry?.type || prefillData?.type || 'MOVIE',
        watchedAt: entry?.watchedAt 
            ? toLocalISOString(entry.watchedAt) 
            : toLocalISOString(new Date()),
        rating: entry?.rating || undefined,
        review: entry?.review || '',
        tags: entry?.tags || [],
        isRewatch: entry?.isRewatch || false,
        isWatching: entry?.isWatching || defaultIsWatching,
        watchLocation: entry?.watchLocation || '',
        suggestedByUserId: entry?.suggestedByUserId || prefillData?.suggestedByUserId || undefined,
    });

    // ── UI state ──
    const [searchQuery, setSearchQuery] = useState(prefillData?.title || '');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState<string | null>(prefillData?.posterPath ? `https://image.tmdb.org/t/p/w342${prefillData.posterPath}` : null);
    const [selectedOverview, setSelectedOverview] = useState<string | null>(prefillData?.overview || null);
    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [suggestedUser, setSuggestedUser] = useState<SuggestedUser | null>(
        entry?.suggestedByUser || prefillData?.suggestedByUser || null
    );

    // Auto-fetch suggested user profile if only ID is available
    useEffect(() => {
        const targetUserId = formData.suggestedByUserId || entry?.suggestedByUserId || prefillData?.suggestedByUserId;
        if (targetUserId && !suggestedUser) {
            userService.getUserProfile(targetUserId).then(profile => {
                if (profile) {
                    setSuggestedUser({
                        id: profile.id,
                        username: profile.username,
                        displayName: profile.displayName,
                        profilePictureUrl: profile.profilePictureUrl
                    });
                }
            }).catch(err => console.error('Failed to load prefilled suggested user:', err));
        }
    }, [formData.suggestedByUserId, entry?.suggestedByUserId, prefillData?.suggestedByUserId]);

    const [showSuggestorPicker, setShowSuggestorPicker] = useState(false);
    const [suggestorSearchQuery, setSuggestorSearchQuery] = useState('');
    const [suggestorResults, setSuggestorResults] = useState<SuggestedUser[]>([]);
    const [isSearchingSuggestors, setIsSearchingSuggestors] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const suggestorRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchConnections = useCallback(async (q: string) => {
        setIsSearchingSuggestors(true);
        try {
            if (q.trim().length > 0) {
                const res = await userService.searchUsers(q);
                setSuggestorResults((res.users || []) as SuggestedUser[]);
            } else {
                const followers = await userService.getFollowers(user?.id || '').catch(() => []);
                const following = await userService.getFollowing(user?.id || '').catch(() => []);
                const combined = Array.from(new Map([...(followers || []), ...(following || [])].map(u => [u.id, u])).values());
                setSuggestorResults(combined as SuggestedUser[]);
            }
        } catch {
            setSuggestorResults([]);
        } finally {
            setIsSearchingSuggestors(false);
        }
    }, [user?.id]);

    // ── Close search results when clicking outside ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
            if (suggestorRef.current && !suggestorRef.current.contains(e.target as Node)) {
                setShowSuggestorPicker(false);
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
            const rawResults: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');

            // Smart fuzzy ranking for typos and misspellings
            const fuzzySorted = [...rawResults].sort((a, b) => {
                const scoreA = calculateFuzzyScore(q, a.title || a.name || '');
                const scoreB = calculateFuzzyScore(q, b.title || b.name || '');
                return scoreB - scoreA;
            }).slice(0, 8);

            setSearchResults(fuzzySorted);
            setShowResults(true);
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
            const payload = { ...formData };
            // If user has provided a rating or review, or is logging a completed watch, ensure isWatching is set to false
            if (payload.rating !== undefined || (payload.review && payload.review.trim().length > 0)) {
                payload.isWatching = false;
            }

            if (isEditing && entry) {
                const { tmdbId, ...updateData } = payload;
                savedEntry = await entriesApi.updateEntry(entry.id, updateData);
            } else {
                savedEntry = await entriesApi.createEntry(payload as CreateEntryData);
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
        <div className={`w-full ${!isModal ? 'max-w-4xl mx-auto py-2 md:py-6' : ''}`}>
            <div className={`${!isModal ? 'bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-5 md:p-8' : 'p-0'}`}>
                {!isModal && (
                    <div className="flex flex-col gap-2 mb-6 border-b border-[#ffb700]/10 pb-4">
                        <h2 className="text-2xl font-black text-[#2D2926] flex items-center gap-2.5">
                            {isEditing ? (
                                <span className="text-[#ffb700] material-symbols-outlined text-[28px]">edit</span>
                            ) : (
                                <span className="text-[#ffb700] material-symbols-outlined text-[28px]">movie</span>
                            )}
                            {isEditing ? 'Edit Your Entry' : 'Log a Watch'}
                        </h2>
                        <p className="text-xs text-[#2D2926]/50 font-bold uppercase tracking-wider">
                            {isEditing ? 'Refine your rating, review, and details below.' : 'Search for a movie or TV show, rate it, and add it to your history.'}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-100 font-bold p-3.5 rounded-2xl mb-6 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* ── Left Column: Media Information & Rating (5/12 cols) ── */}
                        <div className="lg:col-span-5 flex flex-col gap-5">
                            
                            {/* Search or Selected Media Header */}
                            {!isEditing ? (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/40">What did you watch?</label>
                                    <div className="relative" ref={searchRef}>
                                        <div className="relative flex items-center">
                                            <span className="material-symbols-outlined absolute left-3.5 text-[#ffb700] text-[20px]">search</span>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                                className="w-full pl-10 pr-10 py-3 bg-[#FFF9F0]/40 border-2 border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/10 rounded-2xl text-sm font-black text-[#2D2926] transition-all"
                                                placeholder="Search movies or TV shows…"
                                                autoComplete="off"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3.5 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#ffb700]"></div>
                                            )}
                                        </div>

                                        {/* Dropdown Results */}
                                        {showResults && (
                                            <div className="absolute top-full mt-1.5 left-0 right-0 max-h-72 overflow-y-auto bg-white border border-[#ffb700]/15 rounded-2xl shadow-[0_10px_35px_-10px_rgba(255,183,0,0.12)] z-50 p-1.5 flex flex-col gap-1">
                                                {searchResults.map((r) => (
                                                    <button
                                                        key={r.id}
                                                        type="button"
                                                        className="w-full flex items-center gap-3.5 p-2 hover:bg-[#ffb700]/5 rounded-xl transition-colors cursor-pointer text-left focus:outline-none"
                                                        onClick={() => handleSelectResult(r)}
                                                    >
                                                        {r.poster_path ? (
                                                            <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-9 h-13 object-cover rounded-lg shadow-sm border border-[#2D2926]/5" />
                                                        ) : (
                                                            <div className="w-9 h-13 bg-[#FFF9F0] border border-[#ffb700]/15 rounded-lg flex items-center justify-center text-[#ffb700]/40">
                                                                <span className="material-symbols-outlined text-sm">image_not_supported</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-extrabold text-[#2D2926] text-sm truncate">{r.title || r.name}</h4>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-[#2D2926]/40 mt-0.5 font-black tracking-widest uppercase">
                                                                <span className={r.media_type === 'tv' ? 'text-blue-500' : 'text-[#ffb700]'}>
                                                                    {r.media_type === 'tv' ? 'TV' : 'Movie'}
                                                                </span>
                                                                {yearOf(r) && <span>• {yearOf(r)}</span>}
                                                                {r.vote_average != null && r.vote_average > 0 && (
                                                                    <span className="flex items-center gap-0.5 text-amber-500"> • ⭐ {(r.vote_average).toFixed(1)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {/* Deep Search Callout Banner */}
                                                <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-t border-[#ffb700]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs font-bold text-[#2D2926] mt-1.5">
                                                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px] min-w-0">
                                                        <span className="text-amber-500 flex-shrink-0 text-sm">💡</span>
                                                        <span className="truncate">Can't find exact match? Try <strong>Deep Search</strong></span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowResults(false);
                                                            navigate(`/watch-hive/search?mode=movies&deep=true&q=${encodeURIComponent(searchQuery)}`);
                                                        }}
                                                        className="w-full sm:w-auto px-3.5 py-2 bg-[#ffb700] hover:bg-[#ffc83b] active:scale-95 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all text-center cursor-pointer flex-shrink-0"
                                                    >
                                                        Deep Search 🔎
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selection Preview Card */}
                                    {hasSelection && (
                                        <div className="mt-3 flex gap-4 p-4 bg-gradient-to-br from-[#FFF9F0] to-white border border-[#ffb700]/20 rounded-2xl relative shadow-sm items-start overflow-hidden group">
                                            <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-[#ffb700]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                            {selectedPoster && (
                                                <img src={selectedPoster} alt={formData.title} className="w-16 lg:w-20 aspect-[2/3] object-cover rounded-xl shadow-md border-2 border-white relative z-10" />
                                            )}
                                            <div className="flex-1 pt-1 min-w-0 relative z-10">
                                                <h3 className="text-base font-black text-[#2D2926] truncate leading-snug">{formData.title}</h3>
                                                <span className="inline-block px-2 py-0.5 bg-[#ffb700]/10 text-[#ffb700] font-black text-[9px] uppercase tracking-wider rounded-md mt-1 mb-2">
                                                    {formData.type === 'TV_SHOW' ? '📺 TV Show' : '🎬 Movie'}
                                                </span>
                                                {selectedOverview && (
                                                    <p className="text-[#2D2926]/50 text-xs leading-relaxed line-clamp-2 max-w-sm">{selectedOverview}</p>
                                                )}
                                                <button
                                                    type="button"
                                                    className="mt-3 flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-white hover:bg-red-500 bg-red-50 border border-red-100 hover:border-red-500 px-2.5 py-1 rounded-xl transition-all"
                                                    onClick={() => {
                                                        setFormData((prev) => ({ ...prev, tmdbId: 0, title: '', type: 'MOVIE' }));
                                                        setSearchQuery('');
                                                        setSelectedPoster(null);
                                                        setSelectedOverview(null);
                                                    }}
                                                    aria-label="Clear selection"
                                                >
                                                    <span className="material-symbols-outlined text-xs">close</span>
                                                    Clear Selection
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/40">Title</label>
                                    <div className="p-3.5 bg-gradient-to-br from-[#FFF9F0]/80 to-white rounded-2xl border border-[#ffb700]/25 font-black text-base text-[#2D2926] flex items-center gap-2.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[#ffb700]">movie</span>
                                        {formData.title}
                                    </div>
                                </div>
                            )}

                            {/* Premium Snapping Star Rating */}
                            <div className={`flex flex-col gap-2.5 p-4 sm:p-4.5 ${isModal ? 'bg-[#FFF9F0]/40 rounded-3xl' : 'bg-white border border-[#ffb700]/15 rounded-3xl shadow-sm'}`}>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">Rate this Cinematic Experience</label>
                                <StarRating value={formData.rating} onChange={(v) => setFormData((prev) => ({ ...prev, rating: v }))} />
                                
                                {/* Interactive Mood Badge */}
                                {(() => {
                                    const mood = getRatingMood(formData.rating);
                                    return (
                                        <div className={`flex items-center gap-2 mt-1.5 px-3 py-2 border rounded-xl ${mood.color} text-xs font-bold transition-all duration-300`}>
                                            <span className="material-symbols-outlined text-base">{mood.icon}</span>
                                            <span>{mood.text}</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Date Picker & Switches */}
                            <div className={`flex flex-col gap-3.5 p-4 sm:p-4.5 ${isModal ? 'bg-[#FFF9F0]/40 rounded-3xl' : 'bg-white border border-[#ffb700]/15 rounded-3xl shadow-sm'}`}>
                                <HiveDatePicker
                                    label="When did you watch this?"
                                    value={formData.watchedAt}
                                    onChange={(val: string) => setFormData((prev) => ({ ...prev, watchedAt: val || toLocalISOString(new Date()) }))}
                                />

                                <div className="h-[1px] bg-[#ffb700]/10 my-1" />

                                <div className="flex flex-col gap-2.5">
                                    {/* Rewatch Toggle */}
                                    <label className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FFF9F0]/50 transition-all cursor-pointer group">
                                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                            <span className="font-extrabold text-[#2D2926] text-xs uppercase tracking-wider group-hover:text-[#ffb700] transition-colors">Rewatch</span>
                                            <span className="text-[10px] font-bold text-[#2D2926]/40 truncate">Toggle if this is a repeat viewing of this movie or show</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all duration-300
                                                ${formData.isRewatch 
                                                    ? 'bg-[#ffb700]/10 text-[#ffb700]' 
                                                    : 'bg-[#2D2926]/5 text-[#2D2926]/30'}`}>
                                                {formData.isRewatch ? 'YES' : 'NO'}
                                            </span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isRewatch}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, isRewatch: e.target.checked }))}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-10 h-5.5 bg-[#2D2926]/10 peer-focus:outline-none rounded-full peer-checked:bg-[#ffb700] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[18px] shadow-inner"></div>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Currently Watching Toggle */}
                                    <label className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FFF9F0]/50 transition-all cursor-pointer group">
                                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                            <span className="font-extrabold text-[#2D2926] text-xs uppercase tracking-wider group-hover:text-[#22c55e] transition-colors">Currently Watching</span>
                                            <span className="text-[10px] font-bold text-[#2D2926]/40 truncate">Keep in your active queue to track ongoing progress</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all duration-300
                                                ${formData.isWatching 
                                                    ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                                                    : 'bg-[#2D2926]/5 text-[#2D2926]/30'}`}>
                                                {formData.isWatching ? 'YES' : 'NO'}
                                            </span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isWatching}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, isWatching: e.target.checked }))}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-10 h-5.5 bg-[#2D2926]/10 peer-focus:outline-none rounded-full peer-checked:bg-[#22c55e] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[18px] shadow-inner"></div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Right Column: Rich Review, Colorful Locations, Tags (7/12 cols) ── */}
                        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#FFF9F0]/25 p-4.5 sm:p-5.5 md:p-6.5 rounded-[32px] border border-[#ffb700]/10 backdrop-blur-sm">
                            
                            {/* Rich Notebook Review */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">Write a Review or Log Thoughts</label>
                                <div className="relative">
                                    <textarea
                                        value={formData.review || ''}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, review: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/10 rounded-2xl text-[#2D2926] text-sm leading-relaxed transition-all min-h-[140px]"
                                        rows={4}
                                        placeholder="Pour your cinematic critique here... how was the cinematography, acting, writing, or sound design?"
                                    />
                                    <span className="absolute bottom-2.5 right-3 text-[9px] font-black text-[#2D2926]/30 uppercase tracking-wider">
                                        {(formData.review || '').length} chars
                                    </span>
                                </div>
                            </div>

                            {/* Colorful Watch Location Brand Selectors */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">Where did you watch it?</label>
                                <div className="flex flex-wrap gap-2">
                                    {LOCATION_PRESETS.map((l) => {
                                        const isSelected = formData.watchLocation === l.value;
                                        return (
                                            <button
                                                key={l.value}
                                                type="button"
                                                className={`flex-1 min-w-[76px] sm:min-w-[85px] max-w-[120px] flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all group/loc relative overflow-hidden cursor-pointer
                                                ${isSelected 
                                                    ? 'bg-white border-[#ffb700] shadow-[0_4px_15px_-4px_rgba(255,183,0,0.22)] scale-[1.03]' 
                                                    : 'bg-white/50 border-[#ffb700]/10 text-[#2D2926]/60 hover:border-[#ffb700]/30 hover:bg-white hover:scale-[1.02]'}`}
                                                onClick={() => setFormData((prev) => ({ ...prev, watchLocation: prev.watchLocation === l.value ? '' : l.value }))}
                                            >
                                                <div className="transition-transform group-hover/loc:scale-110 duration-300">
                                                    {l.renderIcon()}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${isSelected ? 'text-[#2D2926]' : 'text-[#2D2926]/40'}`}>
                                                    {l.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="relative flex items-center mt-1">
                                    <span className="material-symbols-outlined absolute left-3 text-[#ffb700]/50 text-[18px]">location_on</span>
                                    <input
                                        type="text"
                                        value={formData.watchLocation || ''}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, watchLocation: e.target.value }))}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                        placeholder="Or type custom location (e.g. IMAX, Airplane, Living Room)..."
                                    />
                                </div>
                            </div>

                            {/* Tags Input System */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">Cinematic Tags</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3 text-[#ffb700]/50 text-[18px]">sell</span>
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
                                        className="w-full pl-9 pr-20 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                        placeholder="Add tag (e.g. masterpiece, visual-splendor) and press Enter..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="absolute right-2 px-3 py-1 bg-[#ffb700]/10 hover:bg-[#ffb700] text-[#ffb700] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Add +
                                    </button>
                                </div>

                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {formData.tags.map((tag) => (
                                            <span key={tag} className="flex items-center gap-1 bg-[#ffb700]/5 border border-[#ffb700]/20 text-[#ffb700] px-2.5 py-1.5 rounded-lg text-xs font-black hover:bg-[#ffb700]/10 transition-colors">
                                                #{tag}
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveTag(tag)} 
                                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#ffb700]/10 hover:bg-red-500 hover:text-white text-[#ffb700] transition-colors ml-1 focus:outline-none text-[8px] font-black"
                                                    aria-label={`Remove tag ${tag}`}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Suggested By Friend Selector */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50 flex items-center justify-between">
                                    <span>Suggested By</span>
                                    <span className="text-[#ffb700] text-[9px] font-bold">Tag a friend who recommended this</span>
                                </label>
                                
                                {suggestedUser ? (
                                    <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl">
                                        <div className="flex items-center gap-2.5">
                                            {suggestedUser.profilePictureUrl ? (
                                                <img src={suggestedUser.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-amber-300" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-[#ffb700] text-white font-black text-xs flex items-center justify-center">
                                                    {suggestedUser.displayName?.[0] || suggestedUser.username[0]}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-[#2D2926]">{suggestedUser.displayName || suggestedUser.username}</span>
                                                <span className="text-[10px] text-amber-700 font-bold">@{suggestedUser.username}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSuggestedUser(null);
                                                setFormData(prev => ({ ...prev, suggestedByUserId: null }));
                                            }}
                                            className="text-xs text-amber-700 font-bold hover:text-red-500 px-2 py-1 rounded-lg hover:bg-amber-100/60 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative" ref={suggestorRef}>
                                        <div className="relative flex items-center">
                                            <span className="material-symbols-outlined absolute left-3 text-[#ffb700]/50 text-[18px]">lightbulb</span>
                                            <input
                                                type="text"
                                                value={suggestorSearchQuery}
                                                onFocus={() => {
                                                    setShowSuggestorPicker(true);
                                                    if (suggestorResults.length === 0) fetchConnections('');
                                                }}
                                                onChange={(e) => {
                                                    setSuggestorSearchQuery(e.target.value);
                                                    setShowSuggestorPicker(true);
                                                    fetchConnections(e.target.value);
                                                }}
                                                className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                                placeholder="Search follower/friend username to tag suggestor..."
                                            />
                                        </div>

                                        {showSuggestorPicker && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#ffb700]/30 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                                                {isSearchingSuggestors ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 font-bold">Loading connections...</div>
                                                ) : suggestorResults.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 font-bold">No connected friends found</div>
                                                ) : (
                                                    suggestorResults.map(u => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSuggestedUser(u);
                                                                setFormData(prev => ({ ...prev, suggestedByUserId: u.id }));
                                                                setShowSuggestorPicker(false);
                                                                setSuggestorSearchQuery('');
                                                            }}
                                                            className="w-full flex items-center gap-2.5 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors text-left"
                                                        >
                                                            {u.profilePictureUrl ? (
                                                                <img src={u.profilePictureUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-[#ffb700] text-white font-black text-[10px] flex items-center justify-center">
                                                                    {u.displayName?.[0] || u.username[0]}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-xs font-bold text-[#2D2926] truncate">{u.displayName || u.username}</span>
                                                                <span className="text-[9px] text-[#2D2926]/40 font-bold truncate">@{u.username}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Actions Footer ── */}
                    <div className={`flex flex-row items-center justify-end gap-3 border-t border-[#ffb700]/15 pt-5 mt-6 ${isMobile && isModal ? 'pb-8' : ''}`}>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#2D2926] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 focus:outline-none cursor-pointer active:scale-97"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-1.5 px-7 py-3 bg-[#ffb700] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-105 shadow-md shadow-[#ffb700]/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none cursor-pointer active:scale-97"
                            disabled={isLoading || (!isEditing && !hasSelection)}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm font-bold">
                                        {isEditing ? 'edit_note' : 'add'}
                                    </span>
                                    {isEditing ? 'Update Entry' : 'Log Entry'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntryForm;
