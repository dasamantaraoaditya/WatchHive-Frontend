import React, { useState, useRef, useCallback, useEffect } from 'react';
import { suggestionsApi } from '../../services/suggestions.service';
import apiClient from '../../services/api.js';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { BeeLoader } from '../common';
import { User } from '../../types';

interface SuggestMovieModalProps {
    isOpen?: boolean;
    toUserId?: string;
    toUserName?: string;
    onClose: () => void;
    onSuccess?: () => void;
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
}

export const SuggestMovieModal: React.FC<SuggestMovieModalProps> = ({
    isOpen = true,
    toUserId,
    toUserName,
    onClose,
    onSuccess
}) => {
    if (!isOpen) return null;

    const { user: currentUser } = useAuth();

    // Movie Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<TmdbResult | null>(null);

    // Multi-Recipient State
    const [friends, setFriends] = useState<User[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [friendSearch, setFriendSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => {
        return toUserId ? new Set([toUserId]) : new Set();
    });

    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to format avatar URL
    const getAvatarUrl = (url: string | null | undefined, seed: string) => {
        if (!url) {
            return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const baseUrl = backendUrl.replace(/\/api\/v1\/?$/, '');
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Load connected friends on mount
    useEffect(() => {
        if (!currentUser) return;
        const loadFriends = async () => {
            setIsLoadingFriends(true);
            try {
                const [following, followers] = await Promise.all([
                    userService.getFollowing(currentUser.id).catch(() => []),
                    userService.getFollowers(currentUser.id).catch(() => [])
                ]);

                // Combine & deduplicate friends
                const friendMap = new Map<string, User>();
                [...following, ...followers].forEach(u => {
                    if (u.id !== currentUser.id) {
                        friendMap.set(u.id, u);
                    }
                });

                const allFriends = Array.from(friendMap.values());
                setFriends(allFriends);

                // If no pre-selected toUserId and there are friends, default to empty or keep initial
            } catch (err) {
                console.error('Failed to load friends for suggestions:', err);
            } finally {
                setIsLoadingFriends(false);
            }
        };
        loadFriends();
    }, [currentUser]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 5);
            setSearchResults(results);
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

    const toggleUserSelection = (id: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        const filtered = filteredFriends;
        if (selectedUserIds.size >= filtered.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(filtered.map(f => f.id)));
        }
    };

    const handleSendSuggestion = async () => {
        if (!selectedMovie) return;
        const targetIds = Array.from(selectedUserIds);
        if (targetIds.length === 0) {
            setError('Please select at least one friend to receive this suggestion.');
            return;
        }

        setIsSending(true);
        setError(null);
        try {
            await suggestionsApi.sendSuggestion({
                toUserIds: targetIds,
                tmdbId: selectedMovie.id,
                title: selectedMovie.title || selectedMovie.name || 'Unknown',
                mediaType: (selectedMovie.media_type as 'movie' | 'tv') || 'movie',
                message: message.trim() || undefined
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send suggestion');
        } finally {
            setIsSending(false);
        }
    };

    // Filter friends by search string
    const filteredFriends = friends.filter(f => {
        const q = friendSearch.toLowerCase().trim();
        if (!q) return true;
        return (
            f.username.toLowerCase().includes(q) ||
            (f.displayName && f.displayName.toLowerCase().includes(q))
        );
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D2926]/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] font-display">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#ffb700]/20 max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[#ffb700]/10 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-[#2D2926]">
                            {selectedMovie
                                ? `Suggest this ${selectedMovie.media_type === 'tv' ? 'Series' : 'Movie'}`
                                : 'Suggest a Movie or Series'}
                        </h2>
                        <p className="text-xs font-bold text-slate-400">
                            {toUserName
                                ? `Recommending to ${toUserName}`
                                : 'Share movie or TV recommendations with your hive'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#2D2926] cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5">
                    {/* STEP 1: Search and Select Movie */}
                    {!selectedMovie ? (
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                1. Search for a Movie or TV Show
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb700] text-xl">
                                    search
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    autoFocus
                                    className="w-full pl-11 pr-4 py-3.5 bg-[#FFF9F0]/60 border-2 border-[#ffb700]/15 rounded-2xl outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all font-bold text-xs sm:text-sm text-[#2D2926]"
                                    placeholder="Search Inception, Breaking Bad..."
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <BeeLoader size="small" message="" className="py-0" />
                                    </div>
                                )}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-1 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                                    {searchResults.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSelectedMovie(r)}
                                            className="flex items-center gap-3.5 p-2.5 hover:bg-[#FFF9F0] rounded-2xl border border-transparent hover:border-[#ffb700]/20 transition-all text-left group cursor-pointer"
                                        >
                                            {r.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                                                    className="w-10 h-14 object-cover rounded-xl shadow-xs shrink-0"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-slate-300">movie</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-xs sm:text-sm text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                    {r.title || r.name}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                    {r.media_type === 'tv' ? 'TV Series' : 'Movie'} • {(r.release_date || r.first_air_date || '').slice(0, 4)}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-[#ffb700] text-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                add_circle
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STEP 2: Selected Movie Preview & Multi-Recipient Selection */
                        <div className="flex flex-col gap-5 animate-[fade-in_0.25s_ease-out]">
                            {/* Selected Movie Banner */}
                            <div className="flex items-center gap-3.5 p-3.5 bg-[#FFF9F0] border border-[#ffb700]/30 rounded-2xl relative shadow-2xs">
                                {selectedMovie.poster_path ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w185${selectedMovie.poster_path}`}
                                        className="w-14 h-20 object-cover rounded-xl shadow-xs shrink-0"
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-14 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                                        <span className="material-symbols-outlined text-2xl">movie</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 pr-6">
                                    <span className="px-2 py-0.5 bg-[#ffb700]/15 text-[#ffb700] rounded text-[9px] font-black uppercase tracking-wider">
                                        {selectedMovie.media_type === 'tv' ? 'TV Series' : 'Movie'}
                                    </span>
                                    <h3 className="text-sm font-black text-[#2D2926] truncate mt-1">
                                        {selectedMovie.title || selectedMovie.name}
                                    </h3>
                                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                        {selectedMovie.overview || 'No synopsis available.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedMovie(null); setSearchResults([]); }}
                                    className="absolute top-2.5 right-2.5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-2xs cursor-pointer transition-colors"
                                    title="Change Movie"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>

                            {/* Multi-Recipient Selection Section */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        2. Select Recipients ({selectedUserIds.size} Selected)
                                    </label>
                                    {friends.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-[10px] font-black text-[#ffb700] hover:underline cursor-pointer uppercase tracking-wider"
                                        >
                                            {selectedUserIds.size >= filteredFriends.length ? 'Clear All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                {/* Friend Filter Input (if more than 3 friends) */}
                                {friends.length > 3 && (
                                    <div className="relative mb-1">
                                        <input
                                            type="text"
                                            value={friendSearch}
                                            onChange={(e) => setFriendSearch(e.target.value)}
                                            placeholder="Search friends..."
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#2D2926] outline-none focus:border-[#ffb700]"
                                        />
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                            search
                                        </span>
                                    </div>
                                )}

                                {/* Friends Checkbox List */}
                                {isLoadingFriends ? (
                                    <div className="py-6 flex justify-center">
                                        <BeeLoader size="small" message="Loading friends..." />
                                    </div>
                                ) : friends.length === 0 ? (
                                    <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                                        Follow other users to suggest titles to them!
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                        {filteredFriends.map(friend => {
                                            const isSelected = selectedUserIds.has(friend.id);
                                            return (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => toggleUserSelection(friend.id)}
                                                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#FFF9F0] border-[#ffb700]/40 shadow-2xs'
                                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <img
                                                            src={getAvatarUrl(friend.profilePictureUrl, friend.username)}
                                                            onError={(e) => {
                                                                e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(friend.username)}`;
                                                            }}
                                                            alt={friend.username}
                                                            className="w-8 h-8 rounded-xl object-cover border border-black/5 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-black text-[#2D2926] truncate">
                                                                {friend.displayName || friend.username}
                                                            </h5>
                                                            <p className="text-[10px] font-bold text-slate-400 truncate">
                                                                @{friend.username}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                                        isSelected ? 'bg-[#ffb700] text-white' : 'border border-slate-300 bg-slate-50'
                                                    }`}>
                                                        {isSelected && (
                                                            <span className="material-symbols-outlined text-xs font-black">check</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Personal Note */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    3. Optional Note
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/10 transition-all min-h-[75px] text-xs font-medium text-[#2D2926] placeholder:text-slate-400"
                                    placeholder="Why do you recommend watching this?"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-rose-600 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-[#FFF9F0]/40 border-t border-[#ffb700]/10 shrink-0">
                    <button
                        disabled={!selectedMovie || selectedUserIds.size === 0 || isSending}
                        onClick={handleSendSuggestion}
                        className="w-full py-3.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-[#ffb700]/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale cursor-pointer"
                    >
                        {isSending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Sending Suggestion...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">send</span>
                                <span>
                                    {selectedUserIds.size > 1
                                        ? `Send Suggestion to ${selectedUserIds.size} Friends`
                                        : selectedUserIds.size === 1
                                        ? 'Send Suggestion'
                                        : 'Select Recipients to Send'}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuggestMovieModal;
