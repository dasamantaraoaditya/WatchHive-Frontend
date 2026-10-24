import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { entriesApi, CreateEntryData, Entry, SuggestedUser } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { HiveDatePicker } from '../common/HiveDatePicker';
import { Avatar } from '../common/Avatar';
import { BeeLoader, ModalBeeOverlay, WHRatingPicker } from '../common';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { suggestionsApi } from '../../services/suggestions.service';

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



/* ── Custom Brand SVGs for OTT Locations ── */

const CinemaIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#cinemaBg)" />
        <path d="M4 8h16M4 12h16M4 16h16" stroke="#FFD700" strokeWidth="0.8" strokeDasharray="1.5 1.5" strokeOpacity="0.4" />
        <path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 6z" fill="#D32F2F" stroke="#FFD700" strokeWidth="1" />
        <circle cx="12" cy="12" r="2.2" fill="#FFD700" />
        <polygon points="11,10.5 14,12 11,13.5" fill="#B71C1C" />
        <defs>
            <linearGradient id="cinemaBg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7F1D1D" />
                <stop offset="100%" stopColor="#350808" />
            </linearGradient>
        </defs>
    </svg>
);

const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#homeBg)" />
        <path d="M5 11V8a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 8v3M4 12a1.5 1.5 0 0 1 1.5-1.5h13a1.5 1.5 0 0 1 1.5 1.5v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" fill="#FFF" fillOpacity="0.9" />
        <rect x="6.5" y="12.5" width="4.5" height="3.5" rx="0.8" fill="#F59E0B" />
        <rect x="13" y="12.5" width="4.5" height="3.5" rx="0.8" fill="#F59E0B" />
        <defs>
            <linearGradient id="homeBg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
        </defs>
    </svg>
);

const NetflixIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="#000000" />
        {/* Left vertical pillar */}
        <path d="M6 3.5h3.6v17H6z" fill="#B81D24" />
        {/* Right vertical pillar */}
        <path d="M14.4 3.5h3.6v17h-3.6z" fill="#B81D24" />
        {/* Center diagonal sash (bright red) with 3D shadow */}
        <path 
            d="M6 3.5h3.6l8.4 17h-3.6L6 3.5z" 
            fill="#E50914" 
            style={{ filter: 'drop-shadow(-1px 0px 2px rgba(0, 0, 0, 0.45))' }}
        />
    </svg>
);

const HotstarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#hotstarBg)" />
        {/* Disney+ Swoosh Arc */}
        <path d="M4 14C5.2 8.5 9.8 5.8 15.5 6.2c1.2.1 2.5.4 3.5.8" stroke="url(#disneyArcGrad)" strokeWidth="1.6" strokeLinecap="round" />
        {/* Hotstar Star Emblem */}
        <path d="M16.5 4.5L17.5 7.5L20.5 8.5L17.5 9.5L16.5 12.5L15.5 9.5L12.5 8.5L15.5 7.5Z" fill="url(#starGrad)" />
        <circle cx="16.5" cy="8.5" r="0.8" fill="#FFF" />
        {/* "D" shape at bottom-left */}
        <path d="M6 11.5v6.5h2.2c2.2 0 3.8-1.2 3.8-3.25S10.4 11.5 8.2 11.5H6zm1.8 1.5h.4c1.2 0 2 .6 2 1.75s-.8 1.75-2 1.75h-.4V13z" fill="#FFF" />
        <path d="M13 14.75h2.5M14.25 13.5v2.5" stroke="#00D2D3" strokeWidth="1.2" strokeLinecap="round" />
        <defs>
            <linearGradient id="hotstarBg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0B133A" />
                <stop offset="60%" stopColor="#0F1F54" />
                <stop offset="100%" stopColor="#060C24" />
            </linearGradient>
            <linearGradient id="disneyArcGrad" x1="4" y1="10" x2="19" y2="6" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF" />
                <stop offset="100%" stopColor="#00D2D3" />
            </linearGradient>
            <linearGradient id="starGrad" x1="12.5" y1="4.5" x2="20.5" y2="12.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE066" />
                <stop offset="50%" stopColor="#FFB700" />
                <stop offset="100%" stopColor="#FF8800" />
            </linearGradient>
        </defs>
    </svg>
);

const PrimeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="#00050D" />
        <rect width="24" height="3" rx="1.5" fill="#00A8E8" />
        {/* Play triangle */}
        <polygon points="10,8 15,11 10,14" fill="#FFFFFF" />
        {/* Amazon Smile Arrow in Vibrant Cyan */}
        <path d="M5.5 17C8.5 18.5 14.5 18.5 18.5 16.5" stroke="#00A8E8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18.8 16.2l-1.8 1.4M18.8 16.2l-1.5-.8" stroke="#00A8E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const JioCinemaIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#jioGrad)" />
        <circle cx="12" cy="12" r="7.5" fill="rgba(255,255,255,0.18)" />
        <polygon points="10.5,8.5 15.5,12 10.5,15.5" fill="#FFFFFF" />
        <defs>
            <linearGradient id="jioGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#D80064" />
                <stop offset="100%" stopColor="#80003C" />
            </linearGradient>
        </defs>
    </svg>
);

const YouTubeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="#0F0F0F" />
        <rect x="3.5" y="6" width="17" height="12" rx="3.5" fill="#FF0000" />
        <polygon points="10,9 15.5,12 10,15" fill="#FFFFFF" />
    </svg>
);

const AppleTvIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="#1C1C1E" />
        <path d="M7.8 7.8c.4-.5.7-1.2.6-1.8-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.7.7.1 1.3-.3 1.7-.8zM8.5 8.7c-.9 0-1.7.5-2.1.5-.5 0-1.1-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1 1.8-.3 4.4.7 5.8.5.7 1 1.4 1.8 1.4.7 0 1-.5 1.8-.5s1.1.5 1.8.5c.8 0 1.3-.7 1.8-1.4.5-.8.8-1.5.8-1.6-.1 0-1.5-.6-1.5-2.2 0-1.4 1.1-2 1.2-2.1-.6-1-1.6-1.4-2.2-1.5z" fill="#FFFFFF" />
        <text x="12" y="14" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">tv+</text>
    </svg>
);

const MobileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <rect width="24" height="24" rx="5" fill="url(#mobileGrad)" />
        <rect x="7" y="3.5" width="10" height="17" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
        <circle cx="12" cy="18" r="0.8" fill="#38BDF8" />
        <polygon points="10.8,9.5 14,11.5 10.8,13.5" fill="#38BDF8" />
        <defs>
            <linearGradient id="mobileGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
        </defs>
    </svg>
);

/* ── OTT Presets Mapping ── */
interface LocationPreset {
    label: string;
    value: string;
    altValues?: string[];
    renderIcon: () => React.ReactNode;
}

const LOCATION_PRESETS: LocationPreset[] = [
    { label: 'Cinema', value: 'Cinema', renderIcon: () => <CinemaIcon /> },
    { label: 'Home', value: 'Home', renderIcon: () => <HomeIcon /> },
    { label: 'Netflix', value: 'Netflix', renderIcon: () => <NetflixIcon /> },
    { label: 'Hotstar', value: 'Disney+ Hotstar', altValues: ['Disney+', 'Hotstar'], renderIcon: () => <HotstarIcon /> },
    { label: 'Prime', value: 'Prime Video', altValues: ['Prime'], renderIcon: () => <PrimeIcon /> },
    { label: 'JioCinema', value: 'JioCinema', renderIcon: () => <JioCinemaIcon /> },
    { label: 'YouTube', value: 'YouTube', renderIcon: () => <YouTubeIcon /> },
    { label: 'Apple TV+', value: 'Apple TV+', renderIcon: () => <AppleTvIcon /> },
    { label: 'On the Go', value: 'On the Go', altValues: ['Mobile'], renderIcon: () => <MobileIcon /> },
];



/* ── Timezone-Aware Local ISO Formatter ── */
const toLocalISOString = (dateInput: Date | string | number) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
};

export const EntryForm: React.FC<EntryFormProps> = ({ entry, prefillData, onSuccess, onCancel, isModal = false, defaultIsWatching }) => {
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
        isWatching: defaultIsWatching !== undefined ? defaultIsWatching : (entry?.isWatching || false),
        watchLocation: entry?.watchLocation || '',
        suggestedByUserId: entry?.suggestedByUserId || prefillData?.suggestedByUserId || undefined,
        postToFeed: entry?.postToFeed !== undefined ? entry.postToFeed : true,
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

    // Auto-fetch suggested user profile if only ID is available, or check matching suggestions
    useEffect(() => {
        const targetUserId = formData.suggestedByUserId || entry?.suggestedByUserId || prefillData?.suggestedByUserId;
        if (targetUserId && !suggestedUser) {
            userService.getUser(targetUserId).then((profile: any) => {
                if (profile) {
                    setSuggestedUser({
                        id: profile.id,
                        username: profile.username,
                        displayName: profile.displayName || null,
                        profilePictureUrl: profile.profilePictureUrl || null
                    });
                }
            }).catch((err: any) => console.error('Failed to load prefilled suggested user:', err));
        } else if (!targetUserId && !suggestedUser && formData.tmdbId > 0) {
            suggestionsApi.getMySuggestions().then(groups => {
                const matchGroup = (groups || []).find(g => Number(g.tmdbId) === Number(formData.tmdbId));
                if (matchGroup && matchGroup.suggestors && matchGroup.suggestors.length > 0) {
                    const s = matchGroup.suggestors[0];
                    setSuggestedUser({
                        id: s.id,
                        username: s.username,
                        displayName: s.displayName || null,
                        profilePictureUrl: s.profilePictureUrl || null
                    });
                    setFormData(prev => ({ ...prev, suggestedByUserId: s.id }));
                }
            }).catch((err: any) => console.error('Failed to check matching suggestions for tmdbId:', err));
        }
    }, [formData.suggestedByUserId, formData.tmdbId, entry?.suggestedByUserId, prefillData?.suggestedByUserId]);

    const [showSuggestorPicker, setShowSuggestorPicker] = useState(false);
    const [suggestorSearchQuery, setSuggestorSearchQuery] = useState('');
    const [suggestorResults, setSuggestorResults] = useState<SuggestedUser[]>([]);
    const [isSearchingSuggestors, setIsSearchingSuggestors] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const suggestorRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cachedFollowersRef = useRef<SuggestedUser[] | null>(null);

    const fetchConnections = useCallback(async (q: string) => {
        setIsSearchingSuggestors(true);
        try {
            if (!cachedFollowersRef.current || cachedFollowersRef.current.length === 0) {
                const followers = await userService.getFollowers(user?.id).catch(() => []);
                if (followers && followers.length > 0) {
                    cachedFollowersRef.current = followers as SuggestedUser[];
                }
            }
            const allFollowers = cachedFollowersRef.current || [];
            if (q.trim().length > 0) {
                const query = q.trim().toLowerCase();
                const filtered = allFollowers.filter(u => 
                    (u.displayName && u.displayName.toLowerCase().includes(query)) ||
                    u.username.toLowerCase().includes(query)
                );
                setSuggestorResults(filtered);
            } else {
                setSuggestorResults(allFollowers);
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
            if (payload.watchedAt) {
                const d = new Date(payload.watchedAt);
                const now = new Date();
                const safeDate = !isNaN(d.getTime()) && d.getTime() > now.getTime() ? now : d;
                payload.watchedAt = safeDate.toISOString();
            }
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
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('watchhive:entry-created', { detail: savedEntry }));
            }
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
        <div className={`w-full ${!isModal ? 'max-w-4xl mx-auto py-2 md:py-6' : ''} relative`}>
            {isLoading && (
                <ModalBeeOverlay
                    message={
                        isEditing
                            ? (entry?.isWatching && !formData.isWatching ? 'Completing your watch...' : 'Updating your entry...')
                            : (formData.isWatching ? "Saving what you're watching..." : 'Logging to your Hive...')
                    }
                />
            )}
            <div className={`${!isModal ? 'bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-5 md:p-8' : 'p-0'}`}>
                {!isModal && (
                    <div className="flex flex-col gap-2 mb-6 border-b border-[#ffb700]/10 pb-4">
                        <h2 className="text-2xl font-black text-[#2D2926] flex items-center gap-2.5">
                            {isEditing ? (
                                <span className="text-[#ffb700] material-symbols-outlined text-[28px]">
                                    {entry?.isWatching && !formData.isWatching ? 'task_alt' : 'edit'}
                                </span>
                            ) : (
                                <span className="text-[#ffb700] material-symbols-outlined text-[28px]">
                                    {formData.isWatching ? 'visibility' : 'movie'}
                                </span>
                            )}
                            {isEditing
                                ? (entry?.isWatching && !formData.isWatching ? 'Complete Your Watch' : 'Edit Your Entry')
                                : (formData.isWatching ? 'Track What You\'re Watching' : 'Log a Watch')}
                        </h2>
                        <p className="text-xs text-[#2D2926]/50 font-bold uppercase tracking-wider">
                            {isEditing
                                ? (entry?.isWatching && !formData.isWatching
                                    ? 'Give your rating and final thoughts to complete this watch.'
                                    : 'Refine your rating, review, and details below.')
                                : 'Search for a movie or TV show, rate it, and add it to your history.'}
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
                                                <div className="absolute right-3.5">
                                                    <BeeLoader size="mini" message="" />
                                                </div>
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
                                                        className="w-full sm:w-auto px-3.5 py-2 bg-[#ffb700] hover:bg-[#ffc83b] active:scale-95 text-[#2D2926] rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all text-center cursor-pointer flex-shrink-0"
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

                            {/* Movie Checkpoint Slider Rating */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50 dark:text-white/50 px-1">
                                    Rate this Cinematic Experience
                                </label>
                                <WHRatingPicker
                                    rating={formData.rating}
                                    onRatingChanged={(v) => setFormData((prev) => ({ ...prev, rating: v }))}
                                />
                            </div>

                            {/* Date Picker & Switches */}
                            <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-white dark:bg-[#221c13] border border-[#ffb700]/25 rounded-3xl shadow-sm">
                                <HiveDatePicker
                                    label="When did you watch this?"
                                    value={formData.watchedAt}
                                    onChange={(val: string) => setFormData((prev) => ({ ...prev, watchedAt: val || toLocalISOString(new Date()) }))}
                                />

                                {/* Dividing Line with Title */}
                                <div className="flex items-center gap-2 pt-1 pb-0.5">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#ffb700]/30 to-transparent" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2D2926]/50 dark:text-white/50 whitespace-nowrap">
                                        Watch Options & Status
                                    </span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#ffb700]/30 to-transparent" />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    {/* Rewatch Toggle Card */}
                                    <label
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                                            formData.isRewatch
                                                ? 'bg-amber-500/[0.07] border-[#ffb700] shadow-sm'
                                                : 'bg-white/80 dark:bg-white/[0.03] border-[#2D2926]/12 dark:border-white/10 hover:border-[#ffb700]/40 hover:bg-[#FFF9F0]/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                    formData.isRewatch
                                                        ? 'bg-[#ffb700] text-black font-black'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/10 text-[#2D2926]/50 dark:text-white/50 group-hover:text-[#ffb700]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-[#2D2926] dark:text-white text-xs uppercase tracking-wider group-hover:text-[#ffb700] transition-colors">
                                                    Rewatch
                                                </span>
                                                <span className="text-[10px] font-medium text-[#2D2926]/50 dark:text-white/50 truncate">
                                                    Repeat viewing of this movie or show
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border transition-all duration-200 ${
                                                    formData.isRewatch
                                                        ? 'bg-[#ffb700] text-black font-extrabold border-[#ffb700] shadow-xs'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/5 text-[#2D2926]/40 dark:text-white/40 border-[#2D2926]/10 dark:border-white/10'
                                                }`}
                                            >
                                                {formData.isRewatch ? 'YES' : 'NO'}
                                            </span>
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isRewatch}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, isRewatch: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`w-11 h-6 rounded-full border transition-colors duration-200 shadow-inner ${
                                                        formData.isRewatch
                                                            ? 'bg-[#ffb700] border-[#ffb700]'
                                                            : 'bg-[#2D2926]/15 dark:bg-white/20 border-[#2D2926]/20 dark:border-white/25'
                                                    }`}
                                                />
                                                <div
                                                    className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md border border-[#2D2926]/10 transition-transform duration-200 ${
                                                        formData.isRewatch ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </label>

                                    {/* Currently Watching Toggle Card */}
                                    <label
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                                            formData.isWatching
                                                ? 'bg-emerald-500/[0.08] border-emerald-500 shadow-sm'
                                                : 'bg-white/80 dark:bg-white/[0.03] border-[#2D2926]/12 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                    formData.isWatching
                                                        ? 'bg-[#22c55e] text-white font-black'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/10 text-[#2D2926]/50 dark:text-white/50 group-hover:text-[#22c55e]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-[#2D2926] dark:text-white text-xs uppercase tracking-wider group-hover:text-[#22c55e] transition-colors">
                                                    Currently Watching
                                                </span>
                                                <span className="text-[10px] font-medium text-[#2D2926]/50 dark:text-white/50 truncate">
                                                    Keep in your active queue to track progress
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border transition-all duration-200 ${
                                                    formData.isWatching
                                                        ? 'bg-[#22c55e] text-white font-extrabold border-[#22c55e] shadow-xs'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/5 text-[#2D2926]/40 dark:text-white/40 border-[#2D2926]/10 dark:border-white/10'
                                                }`}
                                            >
                                                {formData.isWatching ? 'YES' : 'NO'}
                                            </span>
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isWatching}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, isWatching: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`w-11 h-6 rounded-full border transition-colors duration-200 shadow-inner ${
                                                        formData.isWatching
                                                            ? 'bg-[#22c55e] border-[#22c55e]'
                                                            : 'bg-[#2D2926]/15 dark:bg-white/20 border-[#2D2926]/20 dark:border-white/25'
                                                    }`}
                                                />
                                                <div
                                                    className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md border border-[#2D2926]/10 transition-transform duration-200 ${
                                                        formData.isWatching ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </label>

                                    {/* Post to Feed Toggle Card */}
                                    <label
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                                            formData.postToFeed
                                                ? 'bg-amber-500/[0.07] border-[#ffb700] shadow-sm'
                                                : 'bg-white/80 dark:bg-white/[0.03] border-[#2D2926]/12 dark:border-white/10 hover:border-[#ffb700]/40 hover:bg-[#FFF9F0]/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                    formData.postToFeed
                                                        ? 'bg-[#ffb700] text-black font-black'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/10 text-[#2D2926]/50 dark:text-white/50 group-hover:text-[#ffb700]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">campaign</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-[#2D2926] dark:text-white text-xs uppercase tracking-wider group-hover:text-[#ffb700] transition-colors">
                                                    Post to Feed
                                                </span>
                                                <span className="text-[10px] font-medium text-[#2D2926]/50 dark:text-white/50 truncate">
                                                    Share this watch log to your community feed
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border transition-all duration-200 ${
                                                    formData.postToFeed
                                                        ? 'bg-[#ffb700] text-black font-extrabold border-[#ffb700] shadow-xs'
                                                        : 'bg-[#2D2926]/5 dark:bg-white/5 text-[#2D2926]/40 dark:text-white/40 border-[#2D2926]/10 dark:border-white/10'
                                                }`}
                                            >
                                                {formData.postToFeed ? 'YES' : 'NO'}
                                            </span>
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.postToFeed ?? true}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, postToFeed: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`w-11 h-6 rounded-full border transition-colors duration-200 shadow-inner ${
                                                        formData.postToFeed
                                                            ? 'bg-[#ffb700] border-[#ffb700]'
                                                            : 'bg-[#2D2926]/15 dark:bg-white/20 border-[#2D2926]/20 dark:border-white/25'
                                                    }`}
                                                />
                                                <div
                                                    className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md border border-[#2D2926]/10 transition-transform duration-200 ${
                                                        formData.postToFeed ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Right Column: Rich Review, Colorful Locations, Tags (7/12 cols) ── */}
                        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#FFF9F0]/25 p-5 sm:p-5.5 md:p-6.5 rounded-[24px] border border-[#ffb700]/10 backdrop-blur-sm">

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
                                        const isSelected = formData.watchLocation === l.value || (l.altValues?.includes(formData.watchLocation || '') ?? false);
                                        return (
                                            <button
                                                key={l.value}
                                                type="button"
                                                className={`flex-1 min-w-[76px] sm:min-w-[85px] max-w-[120px] flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all group/loc relative overflow-hidden cursor-pointer
                                                ${isSelected
                                                        ? 'bg-white border-[#ffb700] shadow-[0_4px_15px_-4px_rgba(255,183,0,0.22)] scale-[1.03]'
                                                        : 'bg-white/50 border-[#ffb700]/10 text-[#2D2926]/60 hover:border-[#ffb700]/30 hover:bg-white hover:scale-[1.02]'}`}
                                                onClick={() => setFormData((prev) => ({ ...prev, watchLocation: isSelected ? '' : l.value }))}
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
                                        className="absolute right-2 px-3 py-1 bg-[#ffb700] hover:bg-[#ffb700]/90 text-[#2D2926] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Add +
                                    </button>
                                </div>

                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {formData.tags.map((tag) => (
                                            <span key={tag} className="flex items-center gap-1 bg-[#ffb700]/15 border border-[#ffb700]/30 text-[#2D2926] px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors">
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#2D2926]/10 hover:bg-red-500 hover:text-white text-[#2D2926] transition-colors ml-1 focus:outline-none text-[8px] font-black cursor-pointer"
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
                                            <Avatar 
                                                src={suggestedUser.profilePictureUrl} 
                                                name={suggestedUser.displayName || suggestedUser.username} 
                                                size="xs" 
                                            />
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
                                                placeholder="Search follower username to tag suggestor..."
                                            />
                                        </div>

                                        {showSuggestorPicker && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#ffb700]/30 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                                                {isSearchingSuggestors ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 font-bold">Loading followers...</div>
                                                ) : suggestorResults.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 font-bold">No followers found</div>
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
                                                            <Avatar 
                                                                src={u.profilePictureUrl} 
                                                                name={u.displayName || u.username} 
                                                                size="xxs" 
                                                            />
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
                            className="flex items-center justify-center gap-1.5 px-7 py-3 bg-[#ffb700] text-[#2D2926] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-105 shadow-md shadow-[#ffb700]/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none cursor-pointer active:scale-97"
                            disabled={isLoading || (!isEditing && !hasSelection)}
                        >
                            {isLoading ? (
                                <>
                                    <BeeLoader size="mini" message="" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm font-bold">
                                        {isEditing
                                            ? (entry?.isWatching && !formData.isWatching ? 'task_alt' : 'edit_note')
                                            : (formData.isWatching ? 'visibility' : 'add')}
                                    </span>
                                    {isEditing
                                        ? (entry?.isWatching && !formData.isWatching ? 'Complete Watch' : 'Update Entry')
                                        : (formData.isWatching ? 'Track Watching' : 'Log Entry')}
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
