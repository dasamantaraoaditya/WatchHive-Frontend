import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [following, setFollowing] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFollowing = async () => {
            setLoading(true);
            try {
                const me = await userService.getMe();
                // We use getFollowing to find people the current user follows
                const users = await userService.getFollowing(me.id);
                setFollowing(users);
            } catch (err) {
                console.error('Failed to fetch following users:', err);
                setError('Failed to load your friends list.');
            } finally {
                setLoading(false);
            }
        };
        fetchFollowing();
    }, []);

    const filteredUsers = following.filter(u => 
        (u.displayName || u.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSend = async () => {
        if (!selectedUser) return;
        setIsSending(true);
        setError(null);
        try {
            await suggestionsApi.sendSuggestion({
                toUserId: selectedUser.id,
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
        <div className="flex flex-col h-[500px]">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={onBack}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926] hover:bg-[#2D2926]/10 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h3 className="text-xl font-black text-[#2D2926]">Suggest this Title</h3>
                    <p className="text-xs font-bold text-[#2D2926]/40 uppercase tracking-widest">To someone you follow</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedUser ? (
                    <motion.div 
                        key="selector"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex-1 flex flex-col gap-4 overflow-hidden"
                    >
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb700]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search friends..."
                                className="w-full pl-12 pr-4 py-4 bg-[#FFF9F0]/50 border-2 border-[#ffb700]/10 rounded-2xl outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all font-bold text-[#2D2926]"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar flex flex-col gap-2">
                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <BeeLoader size="small" message="" />
                                </div>
                            ) : following.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-[#2D2926]/40 font-bold italic">You aren't following anyone yet!</p>
                                    <p className="text-[10px] uppercase font-black text-[#ffb700] mt-2 tracking-widest">Suggestions are for friends</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="py-12 text-center text-[#2D2926]/40 font-bold">No friends found matching "{searchQuery}"</div>
                            ) : (
                                filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center justify-between p-3 bg-white border border-[#ffb700]/5 rounded-2xl hover:border-[#ffb700]/30 hover:bg-[#ffb700]/5 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.profilePictureUrl} name={user.displayName || user.username} size="sm" />
                                            <div>
                                                <p className="font-black text-[#2D2926] text-sm">{user.displayName || user.username}</p>
                                                <p className="text-[10px] font-bold text-[#2D2926]/40 bg-slate-50 px-1.5 rounded w-max">@{user.username}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[#ffb700] opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="message"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col gap-6"
                    >
                        <div className="flex items-center gap-4 p-4 bg-[#ffb700]/5 border border-[#ffb700]/20 rounded-2xl">
                            <Avatar src={selectedUser.profilePictureUrl} name={selectedUser.displayName || selectedUser.username} size="md" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-[#ffb700] uppercase tracking-widest">Sending to</p>
                                <p className="text-lg font-black text-[#2D2926]">{selectedUser.displayName || selectedUser.username}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="text-[10px] font-black uppercase text-[#2D2926]/40 hover:text-[#2D2926] transition-colors"
                            > Change </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-[0.2em] px-1">Add a Hive Message (Optional)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell them why they need to watch this..."
                                className="w-full p-5 bg-white border-2 border-[#ffb700]/10 rounded-[24px] outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all min-h-[140px] text-sm font-medium text-[#2D2926] placeholder:text-[#2D2926]/20"
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="mt-auto w-full py-4.5 bg-[#ffb700] text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-[#ffb700]/20 hover:brightness-105 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                        >
                            {isSending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Transmitting...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                    Send Suggestion
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
