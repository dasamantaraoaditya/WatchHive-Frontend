import React, { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import userService from '../../services/userService';
import { Avatar, BeeLoader } from '../common';
import { suggestionsApi } from '../../services/suggestions.service';

interface SuggestUserSelectorProps {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    onBack?: () => void;
    onSuccess?: () => void;
}

export const SuggestUserSelector: React.FC<SuggestUserSelectorProps> = ({
    tmdbId,
    mediaType,
    title,
    onBack,
    onSuccess
}) => {
    const [friends, setFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            try {
                const me = await userService.getMe();
                const [following, followers] = await Promise.all([
                    userService.getFollowing(me.id).catch(() => []),
                    userService.getFollowers(me.id).catch(() => [])
                ]);

                // Combine & deduplicate friends
                const friendMap = new Map<string, User>();
                [...following, ...followers].forEach(u => {
                    if (u.id !== me.id) {
                        friendMap.set(u.id, u);
                    }
                });

                setFriends(Array.from(friendMap.values()));
            } catch (err) {
                console.error('Failed to fetch friends for suggestions:', err);
                setError('Failed to load your friends list.');
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, []);

    const filteredUsers = friends.filter(u => 
        (u.displayName || u.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedUserIds.size >= filteredUsers.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
        }
    };

    const handleSend = async () => {
        const targetIds = Array.from(selectedUserIds);
        if (targetIds.length === 0) {
            setError('Please select at least one friend.');
            return;
        }

        setIsSending(true);
        setError(null);
        try {
            await suggestionsApi.sendSuggestion({
                toUserIds: targetIds,
                tmdbId,
                title,
                mediaType,
                message: message.trim() || undefined
            });
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send suggestion');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[520px] font-display">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926] hover:bg-[#2D2926]/10 transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-[#2D2926]">Suggest "{title}"</h3>
                        <p className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-widest">
                            Select friends from your hive
                        </p>
                    </div>
                </div>

                {friends.length > 0 && (
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs font-black text-[#ffb700] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                        {selectedUserIds.size >= filteredUsers.length ? 'Clear All' : 'Select All'}
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Search Bar */}
                <div className="relative shrink-0">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb700] text-xl">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full pl-11 pr-4 py-3 bg-[#FFF9F0]/60 border-2 border-[#ffb700]/15 rounded-2xl outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all font-bold text-xs sm:text-sm text-[#2D2926]"
                    />
                </div>

                {/* Friends Selection List */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <BeeLoader size="small" message="Loading friends..." />
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="py-12 text-center bg-[#FFF9F0]/50 rounded-2xl border border-[#ffb700]/10 p-6">
                            <p className="text-[#2D2926]/60 font-bold italic text-sm">You aren't connected with anyone yet!</p>
                            <p className="text-[10px] uppercase font-black text-[#ffb700] mt-2 tracking-widest">
                                Follow friends to suggest titles
                            </p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-[#2D2926]/40 font-bold text-xs">
                            No friends found matching "{searchQuery}"
                        </div>
                    ) : (
                        filteredUsers.map(user => {
                            const isSelected = selectedUserIds.has(user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-[#FFF9F0] border-[#ffb700]/40 shadow-2xs' 
                                            : 'bg-white border-[#ffb700]/10 hover:border-[#ffb700]/30 hover:bg-[#ffb700]/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar src={user.profilePictureUrl} name={user.displayName || user.username} size="sm" />
                                        <div className="min-w-0">
                                            <p className="font-black text-[#2D2926] text-xs sm:text-sm truncate">
                                                {user.displayName || user.username}
                                            </p>
                                            <p className="text-[10px] font-bold text-[#2D2926]/40 truncate">
                                                @{user.username}
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
                        })
                    )}
                </div>

                {/* Optional Message Field */}
                <div className="flex flex-col gap-1.5 shrink-0">
                    <label className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-[0.15em] px-1">
                        Optional Note
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell them why they should watch this..."
                        className="w-full p-3 bg-white border-2 border-[#ffb700]/10 rounded-2xl outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all min-h-[65px] text-xs font-medium text-[#2D2926] placeholder:text-[#2D2926]/20"
                    />
                </div>

                {error && (
                    <p className="text-rose-600 text-xs font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100 shrink-0">
                        {error}
                    </p>
                )}

                {/* Action Button */}
                <button
                    onClick={handleSend}
                    disabled={isSending || selectedUserIds.size === 0}
                    className="w-full py-3.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-[#ffb700]/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale cursor-pointer shrink-0"
                >
                    {isSending ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Transmitting Suggestions...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-base">send</span>
                            <span>
                                {selectedUserIds.size > 1
                                    ? `Send Suggestion to ${selectedUserIds.size} Friends`
                                    : selectedUserIds.size === 1
                                    ? 'Send Suggestion'
                                    : 'Select Friends to Send'}
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SuggestUserSelector;
