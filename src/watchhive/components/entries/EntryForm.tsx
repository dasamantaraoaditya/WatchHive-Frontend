import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { entriesApi, CreateEntryData, Entry, SuggestedUser, WatchBuddy } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { HiveDatePicker } from '../common/HiveDatePicker';
import { Avatar } from '../common/Avatar';
import { BeeLoader, ModalBeeOverlay, WHRatingPicker } from '../common';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { suggestionsApi } from '../../services/suggestions.service';
import { PostLogSuccessModal } from './PostLogSuccessModal';

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
        currentSeason?: number | null;
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
    backdrop_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    vote_average?: number;
}



/* ── Custom Brand SVGs for OTT Locations ── */

const CinemaIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#881337" />
        <path d="M4 6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V9H4V6.5Z" fill="#BE123C" />
        <path d="M7 5L5 9M11 5L9 9M15 5L13 9M19 5L17 9" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M4 9H20V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V9Z" fill="#9F1239" />
        <circle cx="12" cy="14" r="2.8" fill="#FFB700" />
        <polygon points="12,12.2 12.6,13.4 13.9,13.6 13,14.5 13.2,15.8 12,15.2 10.8,15.8 11,14.5 10.1,13.6 11.4,13.4" fill="#881337" />
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#F59E0B" />
        <path d="M6 10.5C6 9.67 6.67 9 7.5 9H16.5C17.33 9 18 9.67 18 10.5V14H6V10.5Z" fill="#FFF" />
        <path d="M4.5 12C4.5 11.45 4.95 11 5.5 11H6.5V15.5C6.5 16.05 6.05 16.5 5.5 16.5H5C4.72 16.5 4.5 16.28 4.5 16V12Z" fill="#FEF3C7" />
        <path d="M19.5 12C19.5 11.45 19.05 11 18.5 11H17.5V15.5C17.5 16.05 17.95 16.5 18.5 16.5H19C19.28 16.5 19.5 16.28 19.5 16V12Z" fill="#FEF3C7" />
        <rect x="6.5" y="13.5" width="11" height="2.5" rx="0.8" fill="#FFF" />
        <rect x="7" y="16.5" width="1.8" height="1.8" rx="0.5" fill="#B45309" />
        <rect x="15.2" y="16.5" width="1.8" height="1.8" rx="0.5" fill="#B45309" />
    </svg>
);

const NetflixIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#000000" />
        <path d="M6.5 4H9.5V20H6.5V4Z" fill="#B81D24" />
        <path d="M14.5 4H17.5V20H14.5V4Z" fill="#B81D24" />
        <path d="M6.5 4H9.7L17.5 20H14.3L6.5 4Z" fill="#E50914" />
    </svg>
);

const HotstarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#071026" />
        <path d="M4 14.5C5.5 9 10.5 6.5 16 7" stroke="#00D2D3" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 5L17.6 6.6L19.2 7.2L17.6 7.8L17 9.4L16.4 7.8L14.8 7.2L16.4 6.6Z" fill="#FFB700" />
        <path d="M6.5 11.5V17H8.8C10.5 17 11.5 16 11.5 14.2C11.5 12.5 10.5 11.5 8.8 11.5H6.5ZM8 13H8.7C9.5 13 10 13.5 10 14.2C10 15 9.5 15.5 8.7 15.5H8V13Z" fill="#FFFFFF" />
        <path d="M13.5 14.2H16.5M15 12.7V15.7" stroke="#00D2D3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const PrimeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#00050D" />
        <rect x="2" y="2" width="20" height="2" rx="1" fill="#00A8E8" />
        <polygon points="10,7.5 15.5,10.5 10,13.5" fill="#FFFFFF" />
        <path d="M6 16.5C9 18.2 15 18.2 18 16" stroke="#00A8E8" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M18.2 15.8L16.7 17.5M18.2 15.8L16.5 15" stroke="#00A8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const JioCinemaIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#D80064" />
        <circle cx="12" cy="12" r="7.5" fill="rgba(255,255,255,0.18)" />
        <polygon points="10.5,8.5 15.5,12 10.5,15.5" fill="#FFFFFF" />
    </svg>
);

const YouTubeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#0F0F0F" />
        <rect x="3.5" y="6" width="17" height="12" rx="3.5" fill="#FF0000" />
        <polygon points="10,9 15.5,12 10,15" fill="#FFFFFF" />
    </svg>
);

const AppleTvIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#1C1C1E" />
        <path d="M7.8 7.8c.4-.5.7-1.2.6-1.8-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.7.7.1 1.3-.3 1.7-.8zM8.5 8.7c-.9 0-1.7.5-2.1.5-.5 0-1.1-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1 1.8-.3 4.4.7 5.8.5.7 1 1.4 1.8 1.4.7 0 1-.5 1.8-.5s1.1.5 1.8.5c.8 0 1.3-.7 1.8-1.4.5-.8.8-1.5.8-1.6-.1 0-1.5-.6-1.5-2.2 0-1.4 1.1-2 1.2-2.1-.6-1-1.6-1.4-2.2-1.5z" fill="#FFFFFF" />
        <text x="11.5" y="14.2" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">tv+</text>
    </svg>
);

const MobileIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[4px] shrink-0">
        <rect width="24" height="24" rx="5" fill="#0284C7" />
        <rect x="7" y="4" width="10" height="16" rx="2" fill="#0F172A" stroke="#BAE6FD" strokeWidth="0.8" />
        <polygon points="10.5,9.5 14.5,12 10.5,14.5" fill="#38BDF8" />
        <circle cx="12" cy="18" r="0.75" fill="#BAE6FD" />
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
    { label: 'Disney+ Hotstar', value: 'Disney+ Hotstar', altValues: ['Disney+', 'Hotstar'], renderIcon: () => <HotstarIcon /> },
    { label: 'Prime Video', value: 'Prime Video', altValues: ['Prime'], renderIcon: () => <PrimeIcon /> },
    { label: 'JioCinema', value: 'JioCinema', renderIcon: () => <JioCinemaIcon /> },
    { label: 'YouTube', value: 'YouTube', renderIcon: () => <YouTubeIcon /> },
    { label: 'Apple TV+', value: 'Apple TV+', renderIcon: () => <AppleTvIcon /> },
    { label: 'On the Go', value: 'On the Go', altValues: ['Mobile'], renderIcon: () => <MobileIcon /> },
];



/* ── Timezone-Aware Local ISO Formatter ── */
const toLocalISOString = (dateInput?: Date | string | number | null) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
};

export const EntryForm: React.FC<EntryFormProps> = ({ entry, prefillData, onSuccess, onCancel, isModal = false, defaultIsWatching }) => {
    const navigate = useNavigate();
    const [overrideEntry, setOverrideEntry] = useState<Entry | null>(null);
    const activeEntry = overrideEntry || entry;
    const isEditing = !!activeEntry;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { user } = useAuth();

    const isCompletingActiveWatch = !!entry?.isWatching && defaultIsWatching === false;
    const initialStartedAt = entry?.startedAt
        ? toLocalISOString(entry.startedAt)
        : (entry?.isWatching && (entry.watchedAt || entry.createdAt)
            ? toLocalISOString(entry.watchedAt || entry.createdAt)
            : (!entry && defaultIsWatching ? toLocalISOString(new Date()) : ''));

    // ── Form state ──
    const [startedAtStr, setStartedAtStr] = useState<string>(initialStartedAt);
    const [hasStartedDate, setHasStartedDate] = useState<boolean>(() => {
        if (entry) {
            return Boolean(entry.startedAt || (entry.isWatching && !entry.unspecifiedDate && (entry.watchedAt || entry.createdAt)));
        }
        return Boolean(defaultIsWatching);
    });
    const [hasWatchDate, setHasWatchDate] = useState<boolean>(() => !entry || isCompletingActiveWatch || !!(entry.completedAt || entry.watchedAt));
    const [formData, setFormData] = useState<CreateEntryData>({
        tmdbId: entry?.tmdbId ? Number(entry.tmdbId) : (prefillData?.tmdbId ? Number(prefillData.tmdbId) : 0),
        title: entry?.title || prefillData?.title || '',
        type: entry?.type || prefillData?.type || 'MOVIE',
        watchedAt: isCompletingActiveWatch
            ? toLocalISOString(new Date())
            : entry
                ? ((entry.isWatching ? (entry.startedAt || entry.watchedAt) : (entry.completedAt || entry.watchedAt))
                    ? toLocalISOString((entry.isWatching ? (entry.startedAt || entry.watchedAt) : (entry.completedAt || entry.watchedAt))!)
                    : '')
                : toLocalISOString(new Date()),
        rating: entry?.rating != null && !isNaN(Number(entry.rating)) && Number(entry.rating) > 0 ? Number(entry.rating) : undefined,
        review: entry?.review || '',
        tags: Array.isArray(entry?.tags)
            ? entry.tags
            : (typeof (entry as any)?.tags === 'string'
                ? (entry as any).tags.replace(/[{}]/g, '').split(',').map((t: string) => t.trim()).filter(Boolean)
                : []),
        isRewatch: entry?.isRewatch || false,
        isWatching: defaultIsWatching !== undefined ? defaultIsWatching : (entry?.isWatching || false),
        watchLocation: entry?.watchLocation || '',
        suggestedByUserId: entry?.suggestedByUserId || prefillData?.suggestedByUserId || undefined,
        postToFeed: entry?.postToFeed !== undefined ? entry.postToFeed : true,
        currentSeason: entry?.currentSeason != null ? Number(entry.currentSeason) : (prefillData?.currentSeason != null ? Number(prefillData.currentSeason) : undefined),
        seasons: Array.isArray((entry as any)?.seasons) && (entry as any).seasons.length > 0
            ? (entry as any).seasons.map(Number).filter((n: number) => !isNaN(n) && n > 0)
            : (entry?.currentSeason != null ? [Number(entry.currentSeason)] : (prefillData?.currentSeason != null ? [Number(prefillData.currentSeason)] : undefined)),
    });

    // ── UI state ──
    const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
    const [isLoadingSeasons, setIsLoadingSeasons] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState(prefillData?.title || '');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState<string | null>(prefillData?.posterPath ? `https://image.tmdb.org/t/p/w342${prefillData.posterPath}` : null);
    const [selectedOverview, setSelectedOverview] = useState<string | null>(prefillData?.overview || null);
    const [selectedMovieResult, setSelectedMovieResult] = useState<TmdbResult | null>(null);
    const [successModalData, setSuccessModalData] = useState<{
        entry: Entry;
        title: string;
        tmdbId?: number | null;
        mediaType?: string;
        posterPath?: string | null;
        backdropPath?: string | null;
        rating?: number | null;
        review?: string | null;
        isWatching?: boolean;
        releaseYear?: string | null;
        user?: {
            displayName?: string | null;
            username?: string | null;
            profilePictureUrl?: string | null;
        } | null;
    } | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formTopRef = useRef<HTMLDivElement>(null);

    const [hasWatchedBefore, setHasWatchedBefore] = useState(false);
    const [previousEntry, setPreviousEntry] = useState<any | null>(null);

    // Fetch dynamic seasons whenever TV show tmdbId is selected
    useEffect(() => {
        let isMounted = true;
        if (formData.type === 'TV_SHOW' && formData.tmdbId) {
            setIsLoadingSeasons(true);
            apiClient.get(`/tmdb/tv/${formData.tmdbId}`)
                .then((data: any) => {
                    if (!isMounted) return;
                    let seasonNums: number[] = [];
                    if (Array.isArray(data?.seasons) && data.seasons.length > 0) {
                        seasonNums = data.seasons
                            .map((s: any) => s.season_number)
                            .filter((sn: number) => typeof sn === 'number' && sn > 0)
                            .sort((a: number, b: number) => a - b);
                    } else if (data?.number_of_seasons && data.number_of_seasons > 0) {
                        seasonNums = Array.from({ length: data.number_of_seasons }, (_, i) => i + 1);
                    }
                    setAvailableSeasons(seasonNums);
                })
                .catch(() => {
                    if (!isMounted) return;
                    setAvailableSeasons([]);
                })
                .finally(() => {
                    if (isMounted) setIsLoadingSeasons(false);
                });
        } else {
            setAvailableSeasons([]);
            setIsLoadingSeasons(false);
        }
        return () => { isMounted = false; };
    }, [formData.tmdbId, formData.type]);

    const toggleSeason = (s: number) => {
        setFormData((prev) => {
            const currentList = prev.seasons || (prev.currentSeason ? [prev.currentSeason] : []);
            let nextList: number[];
            if (currentList.includes(s)) {
                nextList = currentList.filter((item) => item !== s);
            } else {
                nextList = [...currentList, s].sort((a, b) => a - b);
            }
            return {
                ...prev,
                seasons: nextList.length > 0 ? nextList : undefined,
                currentSeason: nextList.length > 0 ? nextList[nextList.length - 1] : undefined,
            };
        });
    };

    const checkPreviousWatch = useCallback(async (tmdbId: number, season?: number | null, seasons?: number[] | null) => {
        if (!tmdbId || isEditing) {
            setHasWatchedBefore(false);
            setPreviousEntry(null);
            return;
        }
        try {
            let seasonParam = '';
            if (seasons && seasons.length > 0) {
                seasonParam = `?seasons=${seasons.join(',')}`;
            } else if (season !== undefined && season !== null) {
                seasonParam = `?season=${season}`;
            }
            const res: any = await apiClient.get(`/entries/check/${tmdbId}${seasonParam}`);
            if (res && res.hasWatched) {
                setHasWatchedBefore(true);
                setPreviousEntry(res.existingEntry);
                setFormData(prev => ({ ...prev, isRewatch: true }));
            } else {
                setHasWatchedBefore(false);
                setPreviousEntry(null);
            }
        } catch (err) {
            console.error('Failed to check previous watch status:', err);
        }
    }, [isEditing]);

    const handleSwitchToEditExisting = useCallback((target: any) => {
        if (!target) return;
        setOverrideEntry(target);
        setHasWatchedBefore(false);
        setError(null);
        setFormData(prev => ({
            ...prev,
            tmdbId: target.tmdbId ? Number(target.tmdbId) : prev.tmdbId,
            title: target.title || prev.title,
            type: target.type || prev.type,
            rating: target.rating != null ? Number(target.rating) : prev.rating,
            review: target.review ?? prev.review,
            tags: target.tags ?? prev.tags,
            isRewatch: target.isRewatch ?? prev.isRewatch,
            isWatching: target.isWatching ?? prev.isWatching,
            watchLocation: target.watchLocation ?? prev.watchLocation,
            currentSeason: target.currentSeason ?? prev.currentSeason,
            seasons: target.seasons ?? prev.seasons,
            watchedAt: target.watchedAt ? toLocalISOString(target.watchedAt) : prev.watchedAt,
        }));
        if (target.startedAt) {
            setStartedAtStr(toLocalISOString(target.startedAt));
            setHasStartedDate(true);
        }
        if (target.watchedAt || target.completedAt) {
            setHasWatchDate(true);
        }
        if (Array.isArray(target.watchBuddies) && target.watchBuddies.length > 0) {
            setSelectedBuddies(target.watchBuddies);
        }
        if (target.posterPath && !selectedPoster) {
            setSelectedPoster(`https://image.tmdb.org/t/p/w342${target.posterPath}`);
        }
    }, [selectedPoster]);

    useEffect(() => {
        if (formData.tmdbId && !isEditing) {
            checkPreviousWatch(
                formData.tmdbId,
                formData.type === 'TV_SHOW' ? formData.currentSeason : undefined,
                formData.type === 'TV_SHOW' ? formData.seasons : undefined
            );
        }
    }, [formData.tmdbId, formData.currentSeason, formData.seasons, formData.type, checkPreviousWatch, isEditing]);

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

    // ── Watch Buddies (Group Watch Tagging) state ──
    const [selectedBuddies, setSelectedBuddies] = useState<WatchBuddy[]>(() => Array.isArray(entry?.watchBuddies) ? entry.watchBuddies : []);
    const [showBuddyPicker, setShowBuddyPicker] = useState(false);
    const [buddySearchQuery, setBuddySearchQuery] = useState('');
    const [buddyResults, setBuddyResults] = useState<WatchBuddy[]>([]);
    const [isSearchingBuddies, setIsSearchingBuddies] = useState(false);
    const [frequentBuddies, setFrequentBuddies] = useState<WatchBuddy[]>([]);
    const buddyRef = useRef<HTMLDivElement>(null);

    const fetchBuddySuggestions = useCallback(async (q: string) => {
        setIsSearchingBuddies(true);
        try {
            const list = await userService.getTaggableFriends(q, 15);
            setBuddyResults(list || []);
            if (!q.trim() && frequentBuddies.length === 0) {
                setFrequentBuddies((list || []).slice(0, 5));
            }
        } catch {
            setBuddyResults([]);
        } finally {
            setIsSearchingBuddies(false);
        }
    }, [frequentBuddies.length]);

    const handleToggleBuddy = (buddy: WatchBuddy) => {
        setSelectedBuddies(prev => {
            const exists = prev.some(b => b.id === buddy.id);
            if (exists) {
                return prev.filter(b => b.id !== buddy.id);
            } else {
                return [...prev, buddy];
            }
        });
    };

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

    // ── Close search results & pickers when clicking outside or pressing Escape ──
    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
            if (suggestorRef.current && !suggestorRef.current.contains(e.target as Node)) {
                setShowSuggestorPicker(false);
            }
            if (buddyRef.current && !buddyRef.current.contains(e.target as Node)) {
                setShowBuddyPicker(false);
            }
        };

        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showResults) setShowResults(false);
                if (showSuggestorPicker) setShowSuggestorPicker(false);
                if (showBuddyPicker) setShowBuddyPicker(false);
            }
        };

        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        window.addEventListener('keydown', keyHandler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
            window.removeEventListener('keydown', keyHandler);
        };
    }, [showResults, showSuggestorPicker, showBuddyPicker]);

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
        setFormData((prev) => ({
            ...prev,
            tmdbId: result.id,
            title,
            type: type as 'MOVIE' | 'TV_SHOW',
            currentSeason: undefined,
            seasons: undefined,
        }));
        setSearchQuery(title);
        setShowResults(false);
        setSelectedMovieResult(result);
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
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }
        if (hasWatchedBefore && !formData.isRewatch && !formData.isWatching) {
            setError('You have already watched this title. Rewatch must be enabled to log a duplicate entry.');
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            let savedEntry: Entry;
            const payload: any = { ...formData };
            const now = new Date();
            payload.isWatching = Boolean(formData.isWatching);

            if (payload.isWatching) {
                if (hasStartedDate && startedAtStr) {
                    const sd = new Date(startedAtStr);
                    const safeStarted = !isNaN(sd.getTime()) && sd.getTime() > now.getTime() ? now : sd;
                    payload.startedAt = safeStarted.toISOString();
                    payload.watchedAt = payload.startedAt;
                    payload.unspecifiedDate = false;
                    payload.unspecifiedStartDate = false;
                } else {
                    payload.startedAt = null;
                    payload.unspecifiedStartDate = true;
                    payload.watchedAt = null;
                    payload.unspecifiedDate = true;
                }
            } else {
                // Completed watch
                if (hasWatchDate && payload.watchedAt) {
                    const d = new Date(payload.watchedAt);
                    const safeDate = !isNaN(d.getTime()) && d.getTime() > now.getTime() ? now : d;
                    payload.completedAt = safeDate.toISOString();
                    payload.watchedAt = payload.completedAt;
                    payload.unspecifiedDate = false;
                } else {
                    payload.completedAt = null;
                    payload.watchedAt = null;
                    payload.unspecifiedDate = true;
                }

                if (hasStartedDate && startedAtStr) {
                    const sd = new Date(startedAtStr);
                    if (!isNaN(sd.getTime())) {
                        const safeStarted = sd.getTime() > now.getTime() ? now : sd;
                        payload.startedAt = safeStarted.toISOString();
                        payload.unspecifiedStartDate = false;
                    } else {
                        payload.startedAt = null;
                        payload.unspecifiedStartDate = true;
                    }
                } else {
                    payload.startedAt = null;
                    payload.unspecifiedStartDate = true;
                }

                // If both dates exist, ensure startedAt <= completedAt
                if (payload.startedAt && payload.completedAt) {
                    if (new Date(payload.startedAt).getTime() > new Date(payload.completedAt).getTime()) {
                        payload.startedAt = payload.completedAt;
                    }
                }
            }

            if (payload.type === 'TV_SHOW') {
                const finalSeasons = Array.isArray(formData.seasons) && formData.seasons.length > 0
                    ? formData.seasons
                    : (formData.currentSeason ? [formData.currentSeason] : undefined);
                payload.seasons = finalSeasons || null;
                payload.currentSeason = finalSeasons && finalSeasons.length > 0 ? finalSeasons[finalSeasons.length - 1] : null;
            } else {
                payload.seasons = null;
                payload.currentSeason = null;
            }

            // Group Watch Tagging (Watch Buddies)
            payload.watchBuddyIds = selectedBuddies.map(b => b.id);

            if (isEditing && activeEntry) {
                const { tmdbId, ...updateData } = payload;
                savedEntry = await entriesApi.updateEntry(activeEntry.id, updateData);
            } else {
                savedEntry = await entriesApi.createEntry(payload as CreateEntryData);
            }

            const unwrappedEntry: Entry = (savedEntry as any)?.entry || savedEntry;
            const resolvedTitle = (unwrappedEntry?.title && unwrappedEntry.title !== 'undefined' && unwrappedEntry.title.trim())
                ? unwrappedEntry.title.trim()
                : (payload?.title || formData?.title || activeEntry?.title || 'Movie');
            unwrappedEntry.title = resolvedTitle;

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('watchhive:entry-created', { detail: unwrappedEntry }));
            }

            if (!isEditing) {
                setSuccessModalData({
                    entry: unwrappedEntry,
                    title: resolvedTitle,
                    tmdbId: unwrappedEntry.tmdbId || payload.tmdbId || selectedMovieResult?.id || null,
                    mediaType: unwrappedEntry.type === 'TV_SHOW' ? 'tv' : 'movie',
                    posterPath: (unwrappedEntry as any).posterPath || selectedMovieResult?.poster_path || prefillData?.posterPath || null,
                    backdropPath: (unwrappedEntry as any).backdropPath || selectedMovieResult?.backdrop_path || null,
                    rating: unwrappedEntry.rating != null ? Number(unwrappedEntry.rating) : (payload.rating != null ? Number(payload.rating) : null),
                    review: unwrappedEntry.review || payload.review || null,
                    isWatching: !!payload.isWatching,
                    releaseYear: selectedMovieResult?.release_date
                        ? selectedMovieResult.release_date.slice(0, 4)
                        : (selectedMovieResult?.first_air_date ? selectedMovieResult.first_air_date.slice(0, 4) : null),
                    user: user ? {
                        displayName: user.displayName,
                        username: user.username,
                        profilePictureUrl: user.profilePictureUrl,
                    } : null,
                });
            } else {
                onSuccess?.(unwrappedEntry);
            }
        } catch (err: any) {
            console.error('Entry save error:', err);
            const errData = err.response?.data;
            if (errData?.code === 'ALREADY_WATCHED' && errData?.existingEntry) {
                setHasWatchedBefore(true);
                setPreviousEntry(errData.existingEntry);
                setFormData(prev => ({ ...prev, isRewatch: true }));
                setError(errData.error || 'You have already watched this title. Rewatch must be enabled to log a duplicate entry, or you can edit your existing entry.');
            } else {
                let parsedError = 'Failed to save entry';
                if (errData?.error && typeof errData.error === 'string') {
                    parsedError = errData.error;
                } else if (errData?.message && typeof errData.message === 'string') {
                    parsedError = errData.message;
                } else if (Array.isArray(errData?.errors) && errData.errors.length > 0) {
                    parsedError = errData.errors.map((e: any) => e.msg || e.message || 'Validation error').filter(Boolean).join(', ');
                } else if (err.message && typeof err.message === 'string') {
                    parsedError = err.message;
                }
                setError(parsedError);
            }
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        const finalEntry = successModalData?.entry;
        setSuccessModalData(null);
        if (finalEntry) {
            onSuccess?.(finalEntry);
        }
    };

    const yearOf = (r: TmdbResult) => {
        const d = r.release_date || r.first_air_date;
        return d ? d.slice(0, 4) : '';
    };

    const renderSeasonPicker = () => {
        if (formData.type !== 'TV_SHOW') return null;
        const rawList = formData.seasons || (formData.currentSeason ? [formData.currentSeason] : []);
        const selectedList = Array.isArray(rawList) ? rawList.map(Number).filter(n => !isNaN(n)) : [];

        return (
            <div className="flex flex-col gap-1.5 bg-amber-50/70 border border-[#ffb700]/30 rounded-xl p-2.5 mt-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]">
                            Seasons:
                        </span>
                        {isLoadingSeasons ? (
                            <span className="text-[9px] font-bold text-[#E59700] animate-pulse">Loading TMDb seasons...</span>
                        ) : (
                            <span className="text-[10px] font-bold text-[#525252]">
                                {selectedList.length === 0 ? 'None (Entire Series)' : `Selected: S${selectedList.join(', S')}`}
                            </span>
                        )}
                    </div>
                    {availableSeasons.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    const allSelected = availableSeasons.every((s) => selectedList.includes(s));
                                    setFormData((prev) => ({
                                        ...prev,
                                        seasons: allSelected ? undefined : [...availableSeasons],
                                        currentSeason: allSelected ? undefined : availableSeasons[availableSeasons.length - 1],
                                    }));
                                }}
                                className="text-[10px] font-black text-[#2D2926] hover:text-[#E59700] underline"
                            >
                                {availableSeasons.every((s) => selectedList.includes(s)) ? 'Deselect All' : 'Select All'}
                            </button>
                            {selectedList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, seasons: undefined, currentSeason: undefined }))}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-700"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(availableSeasons.length > 0 ? availableSeasons : [1, 2, 3, 4, 5]).map((s) => {
                        const isSelected = selectedList.includes(s);
                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSeason(s)}
                                className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all flex items-center gap-1 ${
                                    isSelected
                                        ? 'bg-[#FFB700] border-[#E59700] text-[#2D2926] shadow-xs'
                                        : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#FFF9F0] hover:border-[#FFB700]/40'
                                }`}
                            >
                                {isSelected && <span className="text-xs leading-none">✓</span>}
                                S{s}
                            </button>
                        );
                    })}
                    <input
                        type="number"
                        min="1"
                        max="99"
                        placeholder="+ S#"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (!isNaN(val) && val > 0) {
                                    toggleSeason(val);
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }
                        }}
                        className="w-14 px-1.5 py-1 text-[10px] font-black rounded-lg border border-[#E5E5E5] text-[#2D2926] bg-white text-center focus:outline-none focus:border-[#FFB700]"
                        title="Add custom season number and press Enter"
                    />
                </div>
                <span className="text-[9px] text-[#2D2926]/50">
                    {selectedList.length === 0
                        ? 'Tip: Leave unselected to log the whole series, or click season(s) to log specific seasons.'
                        : `Multi-select active: ${selectedList.length} season${selectedList.length > 1 ? 's' : ''} selected.`}
                </span>
            </div>
        );
    };

    const hasSelection = formData.tmdbId > 0 && formData.title.length > 0;

    return (
        <div className={`w-full ${!isModal ? 'max-w-4xl mx-auto py-2 md:py-6' : ''} relative`}>
            {isLoading && (
                <ModalBeeOverlay
                    message={
                        isEditing
                            ? (activeEntry?.isWatching && !formData.isWatching ? 'Completing your watch...' : 'Updating your entry...')
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
                                    {activeEntry?.isWatching && !formData.isWatching ? 'task_alt' : 'edit'}
                                </span>
                            ) : (
                                <span className="text-[#ffb700] material-symbols-outlined text-[28px]">
                                    {formData.isWatching ? 'visibility' : 'movie'}
                                </span>
                            )}
                            {isEditing
                                ? (activeEntry?.isWatching && !formData.isWatching ? 'Complete Your Watch' : 'Edit Your Entry')
                                : (formData.isWatching ? 'Track What You\'re Watching' : 'Log a Watch')}
                        </h2>
                        <p className="text-xs text-[#2D2926]/50 font-bold uppercase tracking-wider">
                            {isEditing
                                ? (activeEntry?.isWatching && !formData.isWatching
                                    ? 'Give your rating and final thoughts to complete this watch.'
                                    : 'Refine your rating, review, and details below.')
                                : 'Search for a movie or TV show, rate it, and add it to your history.'}
                        </p>
                    </div>
                )}

                <div ref={formTopRef} />

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-100 font-bold p-3.5 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg shrink-0">warning</span>
                            <span>{error}</span>
                        </div>
                        {previousEntry && !isEditing && (
                            <button
                                type="button"
                                onClick={() => handleSwitchToEditExisting(previousEntry)}
                                className="shrink-0 px-3.5 py-1.5 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                Edit Existing Entry Instead
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                        {/* ── Left Column: Media Information, Rating & Review ── */}
                        <div className="flex flex-col gap-5">

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
                                                <div className="flex items-center gap-2 flex-wrap mt-1 mb-2">
                                                    <span className="inline-block px-2 py-0.5 bg-[#ffb700]/15 text-[#2D2926] font-black text-[9px] uppercase tracking-wider rounded-md">
                                                        {formData.type === 'TV_SHOW' ? '📺 TV Show' : '🎬 Movie'}
                                                    </span>
                                                    {formData.type === 'TV_SHOW' && renderSeasonPicker()}
                                                </div>
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
                                    {formData.type === 'TV_SHOW' && renderSeasonPicker()}
                                </div>
                            )}

                            {/* Movie Checkpoint Slider Rating */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50 px-1">
                                    Rate this Cinematic Experience
                                </label>
                                <WHRatingPicker
                                    rating={formData.rating}
                                    onRatingChanged={(v) => setFormData((prev) => ({ ...prev, rating: v }))}
                                />
                            </div>

                            {/* Rich Notebook Review */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">Write a Review or Log Thoughts</label>
                                <div className="relative">
                                    <textarea
                                        value={formData.review || ''}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, review: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/90 border border-[#ffb700]/25 outline-none focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/10 rounded-2xl text-[#2D2926] text-sm leading-relaxed transition-all min-h-[130px]"
                                        rows={4}
                                        placeholder="Pour your cinematic critique here... how was the cinematography, acting, writing, or sound design?"
                                    />
                                    <span className="absolute bottom-2.5 right-3 text-[9px] font-black text-[#2D2926]/40 uppercase tracking-wider">
                                        {(formData.review || '').length} chars
                                    </span>
                                </div>
                            </div>

                            {/* Watch Options: Rewatch & Post to Feed */}
                            <div className="flex flex-col gap-2.5">
                                {hasWatchedBefore && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col gap-2.5 animate-fade-in shadow-xs">
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">history</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                                                        You already watched this title!
                                                    </h4>
                                                    <span className="bg-amber-500/25 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                        Rewatch Required
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-amber-900/80 leading-relaxed">
                                                    Rewatch is enabled by default to record this viewing, creating another entry in your Hive history.
                                                </p>
                                            </div>
                                        </div>

                                        {previousEntry && (
                                            <div className="bg-white/95 border border-amber-200/60 rounded-xl p-3 flex flex-col gap-2 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/40">
                                                        Previously Logged Watch
                                                    </div>
                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSwitchToEditExisting(previousEntry)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">edit_note</span>
                                                            Edit This Instead
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                                    <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-extrabold">
                                                        <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                                                        <span>
                                                            Watched on {previousEntry.watchedAt ? new Date(previousEntry.watchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Previous session'}
                                                        </span>
                                                    </div>
                                                    {previousEntry.rating ? (
                                                        <div className="flex items-center gap-1 bg-amber-100/80 text-amber-950 px-2 py-0.5 rounded-md text-[11px] font-black">
                                                            <span className="material-symbols-outlined text-amber-500 text-[13px]">star</span>
                                                            <span>{previousEntry.rating}/10</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-stone-400">Unrated</span>
                                                    )}
                                                </div>

                                                {previousEntry.watchLocation && (
                                                    <div className="flex items-center gap-1.5 text-stone-600 text-[11px] font-semibold">
                                                        <span className="material-symbols-outlined text-[13px] text-amber-600">location_on</span>
                                                        <span>Watched at <strong>{previousEntry.watchLocation}</strong></span>
                                                    </div>
                                                )}

                                                {previousEntry.review && (
                                                    <div className="text-[11px] font-medium text-stone-700 italic bg-amber-50/50 rounded-lg p-2 border-l-2 border-amber-400">
                                                        "{previousEntry.review}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Rewatch Toggle Card */}
                                    <label
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                                            formData.isRewatch
                                                ? 'bg-amber-500/[0.07] border-[#ffb700] shadow-sm'
                                                : 'bg-white/80 border-[#2D2926]/12 hover:border-[#ffb700]/40 hover:bg-[#FFF9F0]/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                            <div
                                                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                    formData.isRewatch
                                                        ? 'bg-[#ffb700] text-[#2D2926] font-black'
                                                        : 'bg-[#2D2926]/5 text-[#2D2926]/50 group-hover:text-[#ffb700]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">replay</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-[#2D2926] text-xs uppercase tracking-wider group-hover:text-[#ffb700] transition-colors">
                                                    Rewatch
                                                </span>
                                                <span className="text-[10px] font-medium text-[#2D2926]/50 truncate">
                                                    Repeat viewing
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative inline-flex items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={formData.isRewatch}
                                                onChange={(e) => {
                                                    if (hasWatchedBefore && !e.target.checked) {
                                                        setError('You already watched this title. Rewatch must be enabled to log a duplicate entry.');
                                                        return;
                                                    }
                                                    setError(null);
                                                    setFormData((prev) => ({ ...prev, isRewatch: e.target.checked }));
                                                }}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-10 h-5.5 rounded-full border transition-colors duration-200 shadow-inner ${
                                                    formData.isRewatch
                                                        ? 'bg-[#ffb700] border-[#ffb700]'
                                                        : 'bg-[#2D2926]/15 border-[#2D2926]/20'
                                                }`}
                                            />
                                            <div
                                                className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white shadow-md border border-[#2D2926]/10 transition-transform duration-200 ${
                                                    formData.isRewatch ? 'translate-x-4.5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </label>

                                    {/* Post to Feed Toggle Card */}
                                    <label
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                                            formData.postToFeed
                                                ? 'bg-amber-500/[0.07] border-[#ffb700] shadow-sm'
                                                : 'bg-white/80 border-[#2D2926]/12 hover:border-[#ffb700]/40 hover:bg-[#FFF9F0]/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                            <div
                                                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                    formData.postToFeed
                                                        ? 'bg-[#ffb700] text-[#2D2926] font-black'
                                                        : 'bg-[#2D2926]/5 text-[#2D2926]/50 group-hover:text-[#ffb700]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">campaign</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-[#2D2926] text-xs uppercase tracking-wider group-hover:text-[#ffb700] transition-colors">
                                                    Post to Feed
                                                </span>
                                                <span className="text-[10px] font-medium text-[#2D2926]/50 truncate">
                                                    Share to hive
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative inline-flex items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={formData.postToFeed ?? true}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, postToFeed: e.target.checked }))}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-10 h-5.5 rounded-full border transition-colors duration-200 shadow-inner ${
                                                    formData.postToFeed
                                                        ? 'bg-[#ffb700] border-[#ffb700]'
                                                        : 'bg-[#2D2926]/15 border-[#2D2926]/20'
                                                }`}
                                            />
                                            <div
                                                className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white shadow-md border border-[#2D2926]/10 transition-transform duration-200 ${
                                                    formData.postToFeed ? 'translate-x-4.5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Right Column: Watch Timeline, Locations, Buddies & Tags ── */}
                        <div className="flex flex-col gap-5">

                            {/* Watch Status & Date Management Card */}
                            <div className="flex flex-col gap-4 p-4 sm:p-5 bg-white border border-[#ffb700]/25 rounded-3xl shadow-sm">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">
                                        Watch Status & Timeline
                                    </label>
                                    <span className="text-[9px] font-bold text-[#ffb700] uppercase tracking-wider">
                                        {formData.isWatching ? 'Currently Watching' : 'Completed Watch'}
                                    </span>
                                </div>

                                {/* Watch Status Segmented Selector */}
                                <div className="flex items-center p-1 bg-[#FFF9F0] border border-[#ffb700]/30 rounded-2xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.isWatching) {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    isWatching: false,
                                                    watchedAt: prev.watchedAt || toLocalISOString(new Date()),
                                                }));
                                                setHasWatchDate(true);
                                            }
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            !formData.isWatching
                                                ? 'bg-[#ffb700] text-[#2D2926] shadow-sm'
                                                : 'text-[#2D2926]/60 hover:text-[#2D2926] hover:bg-white/60'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[17px]">task_alt</span>
                                        <span>Completed Watch</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!formData.isWatching) {
                                                const currentOrNow = startedAtStr || formData.watchedAt || toLocalISOString(new Date());
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    isWatching: true,
                                                    watchedAt: currentOrNow,
                                                }));
                                                if (!hasStartedDate && startedAtStr) {
                                                    setHasStartedDate(true);
                                                }
                                            }
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            formData.isWatching
                                                ? 'bg-[#22c55e] text-white shadow-sm'
                                                : 'text-[#2D2926]/60 hover:text-[#2D2926] hover:bg-white/60'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[17px]">play_circle</span>
                                        <span>Currently Watching</span>
                                    </button>
                                </div>

                                {/* Completed Watch Controls */}
                                {!formData.isWatching ? (
                                    <div className="flex flex-col gap-3.5">
                                        {/* Completed Watching Section */}
                                        <div className="flex flex-col gap-2 p-3 bg-white/90 border border-[#ffb700]/25 rounded-2xl">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ffb700]">
                                                        event_available
                                                    </span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-[#2D2926]">
                                                        Completed Watching
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                                                        Finished
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (hasWatchDate) {
                                                            setHasWatchDate(false);
                                                            setFormData((prev) => ({ ...prev, watchedAt: '' }));
                                                        } else {
                                                            setHasWatchDate(true);
                                                            setFormData((prev) => ({ ...prev, watchedAt: toLocalISOString(new Date()) }));
                                                        }
                                                    }}
                                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                                        !hasWatchDate
                                                            ? 'bg-amber-500/20 text-amber-950 border-amber-500/40'
                                                            : 'bg-[#FFF9F0] text-[#2D2926]/70 border-[#ffb700]/30 hover:bg-[#ffb700]/20'
                                                    }`}
                                                >
                                                    {!hasWatchDate ? 'Set Exact Time' : 'Past Watch'}
                                                </button>
                                            </div>

                                            {hasWatchDate ? (
                                                <HiveDatePicker
                                                    value={formData.watchedAt}
                                                    fieldTitle="Watch Date & Time"
                                                    icon="task_alt"
                                                    onChange={(val: string) => {
                                                        if (!val) {
                                                            setHasWatchDate(false);
                                                            setFormData((prev) => ({ ...prev, watchedAt: '' }));
                                                        } else {
                                                            setHasWatchDate(true);
                                                            setFormData((prev) => ({ ...prev, watchedAt: val }));
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between px-3 py-2 bg-[#FFF9F0] border border-[#ffb700]/25 rounded-xl animate-fade-in">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D2926]/70">
                                                        <span className="material-symbols-outlined text-[17px] text-amber-600">history_toggle_off</span>
                                                        <span>Past viewing: <strong className="text-[#2D2926]">No exact time</strong></span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setHasWatchDate(true);
                                                            setFormData((prev) => ({ ...prev, watchedAt: toLocalISOString(new Date()) }));
                                                        }}
                                                        className="px-2.5 py-1 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs"
                                                    >
                                                        + Set Time
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Started Watching Section */}
                                        <div className="flex flex-col gap-2 p-3 bg-white/90 border border-[#ffb700]/25 rounded-2xl">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ffb700]">
                                                        play_circle
                                                    </span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-[#2D2926]">
                                                        Started Watching
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20">
                                                        Optional
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (hasStartedDate) {
                                                            setHasStartedDate(false);
                                                            setStartedAtStr('');
                                                        } else {
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(formData.watchedAt || toLocalISOString(new Date()));
                                                        }
                                                    }}
                                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                                        !hasStartedDate
                                                            ? 'bg-amber-500/20 text-amber-950 border-amber-500/40'
                                                            : 'bg-[#FFF9F0] text-[#2D2926]/70 border-[#ffb700]/30 hover:bg-[#ffb700]/20'
                                                    }`}
                                                >
                                                    {!hasStartedDate ? 'Set Exact Time' : "Don't know start"}
                                                </button>
                                            </div>

                                            {hasStartedDate ? (
                                                <HiveDatePicker
                                                    value={startedAtStr}
                                                    fieldTitle="Start Date & Time"
                                                    icon="play_circle"
                                                    emptyText="Start date not set"
                                                    onChange={(val: string) => {
                                                        if (!val) {
                                                            setHasStartedDate(false);
                                                            setStartedAtStr('');
                                                        } else {
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(val);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between px-3 py-2 bg-[#FFF9F0] border border-[#ffb700]/25 rounded-xl animate-fade-in">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D2926]/70">
                                                        <span className="material-symbols-outlined text-[17px] text-amber-600">help_outline</span>
                                                        <span>Started: <strong className="text-[#2D2926]">Unknown / Not specified</strong></span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(formData.watchedAt || toLocalISOString(new Date()));
                                                        }}
                                                        className="px-2.5 py-1 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs"
                                                    >
                                                        + Add Start Date
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Currently Watching Controls */
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-2 p-3 bg-white/90 border border-[#ffb700]/25 rounded-2xl">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px] text-emerald-600">
                                                        play_circle
                                                    </span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-[#2D2926]">
                                                        Started Watching Date
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (hasStartedDate) {
                                                            setHasStartedDate(false);
                                                            setStartedAtStr('');
                                                            setFormData((prev) => ({ ...prev, watchedAt: '' }));
                                                        } else {
                                                            const nowStr = toLocalISOString(new Date());
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(nowStr);
                                                            setFormData((prev) => ({ ...prev, watchedAt: nowStr }));
                                                        }
                                                    }}
                                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                                        !hasStartedDate
                                                            ? 'bg-amber-500/20 text-amber-950 border-amber-500/40'
                                                            : 'bg-[#FFF9F0] text-[#2D2926]/70 border-[#ffb700]/30 hover:bg-[#ffb700]/20'
                                                    }`}
                                                >
                                                    {!hasStartedDate ? 'Set Exact Time' : "Don't know start"}
                                                </button>
                                            </div>

                                            {hasStartedDate ? (
                                                <HiveDatePicker
                                                    value={startedAtStr || formData.watchedAt}
                                                    fieldTitle="Start Date & Time"
                                                    icon="play_circle"
                                                    emptyText="Start date not set"
                                                    onChange={(val: string) => {
                                                        if (!val) {
                                                            setHasStartedDate(false);
                                                            setStartedAtStr('');
                                                            setFormData((prev) => ({ ...prev, watchedAt: '' }));
                                                        } else {
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(val);
                                                            setFormData((prev) => ({ ...prev, watchedAt: val }));
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between px-3 py-2 bg-[#FFF9F0] border border-[#ffb700]/25 rounded-xl animate-fade-in">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D2926]/70">
                                                        <span className="material-symbols-outlined text-[17px] text-amber-600">help_outline</span>
                                                        <span>Started: <strong className="text-[#2D2926]">Unknown / In progress</strong></span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const nowStr = toLocalISOString(new Date());
                                                            setHasStartedDate(true);
                                                            setStartedAtStr(nowStr);
                                                            setFormData((prev) => ({ ...prev, watchedAt: nowStr }));
                                                        }}
                                                        className="px-2.5 py-1 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs"
                                                    >
                                                        + Set Time
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[19px] text-emerald-600 shrink-0">info</span>
                                            <p className="text-[11px] font-medium text-emerald-950 leading-relaxed">
                                                Added to your <strong>Currently Watching</strong> queue. Rating and review are optional while watching.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Where did you watch it? - Compact Brand Pills */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">
                                        Where did you watch it?
                                    </label>
                                    {formData.watchLocation && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, watchLocation: '' }))}
                                            className="text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {LOCATION_PRESETS.map((l) => {
                                        const isSelected = formData.watchLocation === l.value || (l.altValues?.includes(formData.watchLocation || '') ?? false);
                                        return (
                                            <button
                                                key={l.value}
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, watchLocation: isSelected ? '' : l.value }))}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-white border-[#ffb700] text-[#2D2926] shadow-[0_2px_8px_-2px_rgba(255,183,0,0.35)] ring-1 ring-[#ffb700]'
                                                        : 'bg-white/80 border-[#2D2926]/10 text-[#2D2926]/75 hover:bg-white hover:border-[#ffb700]/40 hover:text-[#2D2926]'
                                                }`}
                                            >
                                                <div className="shrink-0 flex items-center justify-center">
                                                    {l.renderIcon()}
                                                </div>
                                                <span className="text-[11px] font-extrabold tracking-tight">
                                                    {l.label}
                                                </span>
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[14px] text-[#ffb700] font-black">
                                                        check_circle
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="relative flex items-center mt-1">
                                    <span className="material-symbols-outlined absolute left-3 text-[#ffb700] text-[18px]">location_on</span>
                                    <input
                                        type="text"
                                        value={formData.watchLocation || ''}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, watchLocation: e.target.value }))}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white/90 border border-[#ffb700]/25 outline-none focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/10 rounded-xl text-xs text-[#2D2926] font-medium transition-all placeholder:text-[#2D2926]/40"
                                        placeholder="Or type custom location (e.g. IMAX Laser, Flight, Living Room)..."
                                    />
                                </div>
                            </div>

                            {/* Watched With / Watching With (Group Watch / Friends Tagging) */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] text-[#ffb700]">groups</span>
                                        {formData.isWatching ? 'Watching With' : 'Watched With'}
                                    </span>
                                    <span className="text-[#ffb700] text-[9px] font-bold">
                                        {formData.isWatching ? 'Tag friends you are watching this with' : 'Tag friends you watched this with'}
                                    </span>
                                </label>

                                {/* Selected Buddies Chips */}
                                {Array.isArray(selectedBuddies) && selectedBuddies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                                        {selectedBuddies.map((buddy) => (
                                            <span
                                                key={buddy.id}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#ffb700]/30 text-[#2D2926] shadow-xs text-xs font-black"
                                            >
                                                <Avatar
                                                    src={buddy.profilePictureUrl}
                                                    name={buddy.displayName || buddy.username}
                                                    size="xxs"
                                                    showBorder={false}
                                                />
                                                <span className="truncate max-w-[120px]">{buddy.displayName || buddy.username}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBuddy(buddy)}
                                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#2D2926]/10 hover:bg-red-500 hover:text-white text-[#2D2926] transition-colors ml-0.5 text-[9px] font-black cursor-pointer"
                                                    aria-label={`Remove ${buddy.username}`}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Quick Frequent Buddy Chips */}
                                {frequentBuddies.filter(fb => !selectedBuddies.some(sb => sb.id === fb.id)).length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-wider">Quick Tag:</span>
                                        {frequentBuddies
                                            .filter(fb => !selectedBuddies.some(sb => sb.id === fb.id))
                                            .slice(0, 4)
                                            .map((buddy) => (
                                                <button
                                                    key={buddy.id}
                                                    type="button"
                                                    onClick={() => handleToggleBuddy(buddy)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/70 hover:bg-[#ffb700]/30 border border-[#ffb700]/30 text-[#2D2926] text-[10px] font-extrabold transition-colors cursor-pointer"
                                                >
                                                    <span>+ {buddy.displayName || buddy.username}</span>
                                                </button>
                                            ))}
                                    </div>
                                )}

                                {/* Buddy Search Input & Autocomplete Dropdown */}
                                <div className="relative" ref={buddyRef}>
                                    <div className="relative flex items-center">
                                        <span className="material-symbols-outlined absolute left-3 text-[#ffb700]/50 text-[18px]">person_add</span>
                                        <input
                                            type="text"
                                            value={buddySearchQuery}
                                            onFocus={() => {
                                                setShowBuddyPicker(true);
                                                if (buddyResults.length === 0) fetchBuddySuggestions('');
                                            }}
                                            onChange={(e) => {
                                                setBuddySearchQuery(e.target.value);
                                                setShowBuddyPicker(true);
                                                fetchBuddySuggestions(e.target.value);
                                            }}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                            placeholder={formData.isWatching ? "Search friends to tag who you're watching with..." : "Search friends to tag who you watched with..."}
                                        />
                                    </div>

                                    {showBuddyPicker && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#ffb700]/30 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 flex flex-col gap-1 animate-fade-in">
                                            {/* Header with Close Button */}
                                            <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 mb-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Tag Friends
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBuddyPicker(false)}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#2D2926] transition-colors text-xs cursor-pointer font-bold"
                                                    title="Close list"
                                                    aria-label="Close list"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            {isSearchingBuddies ? (
                                                <div className="p-3 text-center text-xs text-slate-400 font-bold">Searching friends...</div>
                                            ) : buddyResults.length === 0 ? (
                                                <div className="p-3.5 text-center flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                                        <span className="material-symbols-outlined text-base">person_search</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-bold">
                                                        {buddySearchQuery ? `No friends matching "${buddySearchQuery}"` : "No friends found in your hive"}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowBuddyPicker(false)}
                                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#2D2926] rounded-xl text-xs font-black transition-colors cursor-pointer"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            ) : (
                                                buddyResults.map(u => {
                                                    const isSelected = selectedBuddies.some(b => b.id === u.id);
                                                    return (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => {
                                                                handleToggleBuddy(u);
                                                                setBuddySearchQuery('');
                                                            }}
                                                            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left cursor-pointer ${
                                                                isSelected ? 'bg-amber-100/60 hover:bg-amber-100' : 'hover:bg-[#ffb700]/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <Avatar
                                                                    src={u.profilePictureUrl}
                                                                    name={u.displayName || u.username}
                                                                    size="xxs"
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-xs font-bold text-[#2D2926] truncate">{u.displayName || u.username}</span>
                                                                    <span className="text-[9px] text-[#2D2926]/40 font-bold truncate">@{u.username}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                                isSelected ? 'bg-amber-500 text-black' : 'bg-slate-100 text-[#2D2926]/70'
                                                            }`}>
                                                                {isSelected ? '✓ Tagged' : '+ Tag'}
                                                            </span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Suggested By & Tags Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                {/* Suggested By Friend Selector */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">
                                        Suggested By
                                    </label>
                                    
                                    {suggestedUser ? (
                                        <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar 
                                                    src={suggestedUser.profilePictureUrl} 
                                                    name={suggestedUser.displayName || suggestedUser.username} 
                                                    size="xs" 
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-[#2D2926] truncate">{suggestedUser.displayName || suggestedUser.username}</span>
                                                    <span className="text-[9px] text-amber-700 font-bold truncate">@{suggestedUser.username}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSuggestedUser(null);
                                                    setFormData(prev => ({ ...prev, suggestedByUserId: null }));
                                                }}
                                                className="text-xs text-amber-700 font-bold hover:text-red-500 px-2 py-1 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer shrink-0"
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
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                                    placeholder="Search follower..."
                                                />
                                            </div>

                                            {showSuggestorPicker && (
                                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#ffb700]/30 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 flex flex-col gap-1 animate-fade-in">
                                                    {/* Header with Close Button */}
                                                    <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 mb-0.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                            Followers
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowSuggestorPicker(false)}
                                                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#2D2926] transition-colors text-xs cursor-pointer font-bold"
                                                            title="Close list"
                                                            aria-label="Close list"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    {isSearchingSuggestors ? (
                                                        <div className="p-3 text-center text-xs text-slate-400 font-bold">Loading followers...</div>
                                                    ) : suggestorResults.length === 0 ? (
                                                        <div className="p-3.5 text-center flex flex-col items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                                                <span className="material-symbols-outlined text-base">group_off</span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 font-bold">
                                                                {suggestorSearchQuery ? `No followers matching "${suggestorSearchQuery}"` : "No friends in your hive yet"}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowSuggestorPicker(false)}
                                                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#2D2926] rounded-xl text-xs font-black transition-colors cursor-pointer"
                                                                >
                                                                    Dismiss
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setShowSuggestorPicker(false);
                                                                        navigate('/watch-hive/search?tab=people');
                                                                    }}
                                                                    className="px-3 py-1 bg-[#ffb700] hover:bg-[#ffc83b] text-[#2D2926] rounded-xl text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">person_search</span>
                                                                    Find friends
                                                                </button>
                                                            </div>
                                                        </div>
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
                                                                className="w-full flex items-center gap-2.5 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors text-left cursor-pointer"
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

                                {/* Cinematic Tags */}
                                <div className="flex flex-col gap-2">
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
                                            className="w-full pl-9 pr-14 py-2.5 bg-white/80 border border-[#ffb700]/20 outline-none focus:border-[#ffb700] focus:bg-white rounded-xl text-xs text-[#2D2926] transition-all"
                                            placeholder="Tag + Enter..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="absolute right-1.5 px-2 py-1 bg-[#ffb700] hover:bg-[#ffb700]/90 text-[#2D2926] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {Array.isArray(formData.tags) && formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {formData.tags.map((tag) => (
                                                <span key={tag} className="flex items-center gap-1 bg-[#ffb700]/15 border border-[#ffb700]/30 text-[#2D2926] px-2 py-1 rounded-lg text-[11px] font-black transition-colors">
                                                    #{tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-[#2D2926]/10 hover:bg-red-500 hover:text-white text-[#2D2926] transition-colors ml-0.5 focus:outline-none text-[8px] font-black cursor-pointer"
                                                        aria-label={`Remove tag ${tag}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Error Banner (Footer / Instant Visibility) ── */}
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-200/80 font-bold p-3.5 rounded-2xl mt-5 mb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-xs">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg shrink-0 text-red-500">error</span>
                                <span className="leading-snug">{error}</span>
                            </div>
                            {previousEntry && !isEditing && (
                                <button
                                    type="button"
                                    onClick={() => handleSwitchToEditExisting(previousEntry)}
                                    className="shrink-0 px-3.5 py-1.5 bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                    Edit Existing Entry Instead
                                </button>
                            )}
                        </div>
                    )}

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
                                            ? (activeEntry?.isWatching && !formData.isWatching ? 'task_alt' : 'edit_note')
                                            : (formData.isWatching ? 'visibility' : 'add')}
                                    </span>
                                    {isEditing
                                        ? (activeEntry?.isWatching && !formData.isWatching ? 'Complete Watch' : 'Update Entry')
                                        : (formData.isWatching ? 'Track Watching' : 'Log Entry')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {successModalData && (
                <PostLogSuccessModal
                    isOpen={!!successModalData}
                    onClose={handleCloseSuccessModal}
                    title={successModalData.title}
                    tmdbId={successModalData.tmdbId}
                    mediaType={successModalData.mediaType}
                    posterPath={successModalData.posterPath}
                    backdropPath={successModalData.backdropPath}
                    rating={successModalData.rating}
                    review={successModalData.review}
                    isWatching={successModalData.isWatching}
                    releaseYear={successModalData.releaseYear}
                    user={successModalData.user}
                />
            )}
        </div>
    );
};

export default EntryForm;
