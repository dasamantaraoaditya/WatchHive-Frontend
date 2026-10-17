import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Avatar } from '../common';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

export interface AddToWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    tmdbId: number;
    mediaType?: 'movie' | 'tv';
    title?: string;
    posterPath?: string | null;
    initialSuggestedByUserId?: string | null;
    initialSuggestedByUser?: {
        id: string;
        username: string;
        displayName?: string | null;
        profilePictureUrl?: string | null;
    } | null;
    onConfirm: (suggestedByUserId: string | null) => Promise<void>;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
    isOpen,
    onClose,
    tmdbId: _tmdbId,
    mediaType = 'movie',
    title = 'this title',
    posterPath,
    initialSuggestedByUserId,
    initialSuggestedByUser,
    onConfirm,
}) => {
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState<{
        id: string;
        username: string;
        displayName?: string | null;
        profilePictureUrl?: string | null;
    } | null>(initialSuggestedByUser || null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync initial user if provided
    useEffect(() => {
        if (initialSuggestedByUser) {
            setSelectedUser(initialSuggestedByUser);
        } else if (initialSuggestedByUserId && !selectedUser) {
            userService.getUser(initialSuggestedByUserId)
                .then(u => setSelectedUser(u))
                .catch(() => {});
        } else if (!isOpen) {
            setSelectedUser(null);
            setSearchQuery('');
            setSearchResults([]);
            setShowUserDropdown(false);
        }
    }, [isOpen, initialSuggestedByUserId, initialSuggestedByUser]);

    const cachedFollowersRef = useRef<User[] | null>(null);

    const fetchUsers = useCallback(async (q: string) => {
        setIsLoadingUsers(true);
        try {
            if (!cachedFollowersRef.current) {
                const followers = await userService.getFollowers(currentUser?.id || '').catch(() => []);
                cachedFollowersRef.current = followers || [];
            }
            const allFollowers = cachedFollowersRef.current;
            if (q.trim().length > 0) {
                const query = q.trim().toLowerCase();
                const filtered = allFollowers.filter(u => 
                    (u.displayName && u.displayName.toLowerCase().includes(query)) ||
                    u.username.toLowerCase().includes(query)
                );
                setSearchResults(filtered);
            } else {
                setSearchResults(allFollowers);
            }
        } catch (err) {
            console.error('Failed to search followers for suggestion:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [currentUser?.id]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        setShowUserDropdown(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchUsers(val);
        }, 250);
    };

    const handleInputFocus = () => {
        setShowUserDropdown(true);
        if (searchResults.length === 0) {
            fetchUsers(searchQuery);
        }
    };

    const handleSelectUser = (u: User) => {
        setSelectedUser({
            id: u.id,
            username: u.username,
            displayName: u.displayName || null,
            profilePictureUrl: u.profilePictureUrl || null,
        });
        setShowUserDropdown(false);
        setSearchQuery('');
    };

    const handleClearSelectedUser = () => {
        setSelectedUser(null);
        setSearchQuery('');
    };

    const handleAdd = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedUser?.id || null);
            onClose();
        } catch (err) {
            console.error('Failed to add to watchlist', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add to Watchlist"
            maxWidth="max-w-md"
        >
            <div className="flex flex-col gap-5 pt-2">
                {/* Media Preview Header */}
                <div className="flex items-center gap-3.5 p-3.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5">
                    {posterPath ? (
                        <img
                            src={posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w200${posterPath}`}
                            alt={title}
                            className="w-12 h-16 object-cover rounded-xl shadow-xs shrink-0"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-12 h-16 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                            {mediaType === 'tv' ? '📺' : '🎬'}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ffb700]">
                            {mediaType === 'tv' ? '📺 TV Series' : '🎬 Movie'}
                        </span>
                        <h4 className="text-sm font-black text-[#2D2926] dark:text-white truncate">
                            {title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                            Plan to watch later
                        </p>
                    </div>
                </div>

                {/* Suggested By Section */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-[#2D2926]/70 dark:text-stone-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <span>💡 Suggested By</span>
                            <span className="text-[10px] text-slate-400 font-bold lowercase">(optional)</span>
                        </span>
                        <span className="text-[10px] text-amber-600 font-bold">Track who influenced you</span>
                    </label>

                    {selectedUser ? (
                        <div className="flex items-center justify-between p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar
                                    src={selectedUser.profilePictureUrl || undefined}
                                    name={selectedUser.displayName || selectedUser.username}
                                    size="sm"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black text-[#2D2926] dark:text-white truncate">
                                        {selectedUser.displayName || selectedUser.username}
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
                                        @{selectedUser.username}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearSelectedUser}
                                className="p-1.5 rounded-full hover:bg-amber-200/50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Remove suggestion tag"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg select-none">
                                    person_search
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={handleInputFocus}
                                    placeholder="Search follower who suggested this..."
                                    className="w-full pl-9 pr-8 py-2.5 bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#ffb700] rounded-xl text-xs font-medium text-[#2D2926] dark:text-white outline-none transition-all placeholder:text-slate-400"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            fetchUsers('');
                                        }}
                                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {showUserDropdown && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                                    {isLoadingUsers ? (
                                        <div className="p-3 text-center text-xs text-slate-400 font-bold">
                                            Searching followers...
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-slate-400 font-bold">
                                            {searchQuery ? `No followers found for "${searchQuery}"` : "No followers found"}
                                        </div>
                                    ) : (
                                        searchResults.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => handleSelectUser(u)}
                                                className="w-full flex items-center gap-2.5 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors text-left cursor-pointer"
                                            >
                                                <Avatar
                                                    src={u.profilePictureUrl || undefined}
                                                    name={u.displayName || u.username}
                                                    size="xs"
                                                />
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-[#2D2926] dark:text-white truncate">
                                                        {u.displayName || u.username}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold truncate">
                                                        @{u.username}
                                                    </span>
                                                </div>
                                                <span className="material-symbols-outlined text-amber-500 text-sm">
                                                    add_circle
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-[#ffb700] hover:brightness-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#ffb700]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-base">
                            {isSubmitting ? 'hourglass_empty' : 'bookmark_add'}
                        </span>
                        <span>{isSubmitting ? 'Adding...' : selectedUser ? 'Add with Suggestion' : 'Add to Watchlist'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
