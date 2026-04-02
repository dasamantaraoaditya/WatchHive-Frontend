import React, { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import userService from '../../services/userService';
import { Avatar, BeeLoader } from '../common';
import { Link } from 'react-router-dom';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, type }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = type === 'followers'
                ? await userService.getFollowers(userId)
                : await userService.getFollowing(userId);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]" onClick={onClose}>
            <div 
                className="bg-[#FFF9F0] w-full max-w-md max-h-[85vh] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-[#ffb700]/10 animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#ffb700]/10 bg-white">
                    <h3 className="text-xl font-black text-[#2D2926] tracking-tight">
                        {type === 'followers' ? 'Followers' : 'Following'}
                    </h3>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ffb700]/10 text-[#ffb700] hover:bg-[#ffb700]/20 hover:text-[#2D2926] transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                    </button>
                </div>
                
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-2 bg-[#FFF9F0]/50 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <BeeLoader size="small" message="Loading users..." />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] mb-2">
                                <span className="material-symbols-outlined text-3xl">
                                    {type === 'followers' ? 'person_off' : 'group_remove'}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-[#2D2926]">
                                {type === 'followers' ? 'No followers yet' : 'Not following anyone'}
                            </h4>
                            <p className="text-sm font-medium text-[#2D2926]/50">
                                {type === 'followers' ? 'Share your profile to build your hive.' : 'Find users to see their cinematic journey.'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-2">
                            {users.map(user => (
                                <Link
                                    key={user.id}
                                    to={`/watch-hive/profile/${user.id}`}
                                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-white border border-transparent hover:border-[#ffb700]/10 transition-all group"
                                    onClick={onClose}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="ring-2 ring-transparent group-hover:ring-[#ffb700]/30 rounded-full transition-all">
                                            <Avatar
                                                src={user.profilePictureUrl}
                                                name={user.displayName || user.username}
                                                size="md"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-bold text-[#2D2926] group-hover:text-[#ffb700] transition-colors line-clamp-1">
                                                {user.displayName || user.username}
                                            </span>
                                            <span className="text-[13px] font-bold text-[#2D2926]/40">@{user.username}</span>
                                        </div>
                                    </div>
                                    {/* Light Mode "View" Button Outline */}
                                    <div className="px-4 py-1.5 rounded-full border border-[#ffb700]/30 text-[#ffb700] text-[12px] font-bold bg-[#ffb700]/5 group-hover:bg-[#ffb700] group-hover:text-white transition-colors">
                                        View
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Inline CSS for simple animations since Tailwind JIT might not catch custom keys */}
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};
