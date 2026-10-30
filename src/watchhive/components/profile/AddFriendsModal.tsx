import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types/user.types';
import userService from '../../services/userService';
import followsService from '../../services/follows.service';
import { Avatar, BeeLoader } from '../common';

interface AddFriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

export const AddFriendsModal: React.FC<AddFriendsModalProps> = ({ isOpen, onClose, currentUser }) => {
    const navigate = useNavigate();
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [loadingFollowMap, setLoadingFollowMap] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState(false);

    const inviteUrl = `${window.location.origin}/signup?ref=${currentUser.username}`;
    const inviteText = `Join me on WatchersHive! Check out my cinematic journey and let's build our movie hive together. 🐝🎥`;

    useEffect(() => {
        if (isOpen) {
            fetchSuggestedUsers();
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
        } else {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        };
    }, [isOpen]);

    const fetchSuggestedUsers = async () => {
        setLoadingSuggestions(true);
        try {
            const data = await userService.getSuggestedUsers();
            setSuggestedUsers(data || []);
        } catch (error) {
            console.error('Failed to load suggested cinephiles', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleCopyInvite = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = inviteUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'WatchersHive Invite',
                    text: inviteText,
                    url: inviteUrl,
                });
            } catch (err) {
                console.log('Native share canceled or failed', err);
            }
        } else {
            handleCopyInvite();
        }
    };

    const handleToggleFollow = async (targetUser: User) => {
        const isCurrentlyFollowing = !!followingMap[targetUser.id];
        setLoadingFollowMap(prev => ({ ...prev, [targetUser.id]: true }));

        try {
            if (isCurrentlyFollowing) {
                await followsService.unfollowUser(targetUser.id);
                setFollowingMap(prev => ({ ...prev, [targetUser.id]: false }));
            } else {
                await followsService.followUser(targetUser.id);
                setFollowingMap(prev => ({ ...prev, [targetUser.id]: true }));
            }
        } catch (err) {
            console.error('Failed to toggle follow', err);
        } finally {
            setLoadingFollowMap(prev => ({ ...prev, [targetUser.id]: false }));
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[3500] flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-[#FFF9F0] w-full max-w-lg max-h-[88vh] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden border border-[#ffb700]/15 animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-2xl">group_add</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Add Friends to Your Hive</h2>
                            <p className="text-xs text-slate-500 font-medium">Find friends, share recommendations & compare movie taste</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Content body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Primary Action Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Search Tile */}
                        <div 
                            onClick={() => {
                                onClose();
                                navigate('/watch-hive/search?tab=people');
                            }}
                            className="group p-4 rounded-2xl bg-white border border-amber-500/15 hover:border-amber-500/40 hover:bg-amber-50/30 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-xl">search</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-amber-600 text-lg group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition-colors">Search Friends &amp; People</h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Find friends by username, name, or taste</p>
                            </div>
                        </div>

                        {/* Native Share Tile */}
                        <div 
                            onClick={handleNativeShare}
                            className="group p-4 rounded-2xl bg-white border border-amber-500/15 hover:border-amber-500/40 hover:bg-amber-50/30 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-xl">share</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-amber-600 text-lg group-hover:translate-x-0.5 transition-all">send</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition-colors">Share Invite</h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">Invite via WhatsApp, Messages, or Socials</p>
                            </div>
                        </div>
                    </div>

                    {/* Invite Link Copy Box */}
                    <div className="p-4 rounded-2xl bg-white border border-amber-500/15 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-amber-600">link</span>
                                Your Personal Invite Link
                            </span>
                            {copied && (
                                <span className="text-xs font-bold text-emerald-600 animate-[fade-in_0.2s_ease-out] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Copied!
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={inviteUrl} 
                                className="flex-1 bg-amber-50/30 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 outline-none select-all"
                            />
                            <button
                                onClick={handleCopyInvite}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${
                                    copied 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-[#ffb700] hover:bg-[#ffaa00] text-[#2D2926]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Suggested Friends Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-600 text-lg">stars</span>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Suggested Friends</h3>
                            </div>
                            <button 
                                onClick={fetchSuggestedUsers} 
                                className="text-slate-400 hover:text-amber-700 text-xs font-bold flex items-center gap-1 transition-colors"
                                title="Refresh suggestions"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Refresh
                            </button>
                        </div>

                        {loadingSuggestions ? (
                            <div className="py-8 flex justify-center">
                                <BeeLoader message="Finding friends..." />
                            </div>
                        ) : suggestedUsers.length === 0 ? (
                            <div className="text-center py-6 bg-white rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">No new suggestions at the moment.</p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/watch-hive/search?tab=people');
                                    }}
                                    className="mt-2 text-xs font-bold text-amber-700 hover:underline"
                                >
                                    Browse all members on Explore →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {suggestedUsers.slice(0, 5).map(u => {
                                    const isFollowing = !!followingMap[u.id];
                                    const isLoadingFollow = !!loadingFollowMap[u.id];

                                    return (
                                        <div 
                                            key={u.id}
                                            className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-amber-500/20 transition-all shadow-sm"
                                        >
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 mr-3"
                                                onClick={() => {
                                                    onClose();
                                                    navigate(`/watch-hive/profile/${u.id}`);
                                                }}
                                            >
                                                <Avatar 
                                                    src={u.profilePictureUrl} 
                                                    name={u.displayName || u.username} 
                                                    size="md" 
                                                />
                                                <div className="truncate">
                                                    <h4 className="text-xs font-bold text-slate-800 truncate hover:text-amber-700 transition-colors">
                                                        {u.displayName || u.username}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleToggleFollow(u)}
                                                disabled={isLoadingFollow}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                                    isFollowing
                                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                        : 'bg-[#ffb700] hover:bg-[#ffaa00] text-[#2D2926]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {isFollowing ? 'check' : 'person_add'}
                                                </span>
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    );
                                })}

                                {suggestedUsers.length > 5 && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/watch-hive/search?tab=people');
                                        }}
                                        className="w-full text-center py-2.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition-colors"
                                    >
                                        View more members on Explore →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddFriendsModal;
