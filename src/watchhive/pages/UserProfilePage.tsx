import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import EntryList from '../components/entries/EntryList';
import { FollowListModal } from '../components/profile/FollowListModal';
import { useAuth, useUI } from '../contexts';
import { SuggestMovieModal } from '../components/suggestions/SuggestMovieModal';
import { ProfileSkeleton } from '../components/common/Skeleton';
import { listsApi, ListItem } from '../services/lists.service';
import { WatchlistGrid } from '../components/profile/WatchlistGrid';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout';

export const UserProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const { setPageTitle, setPageIcon } = useUI();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    const [activeTab, setActiveTab] = useState<'entries' | 'watching' | 'watchlist'>('entries');
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

    // Dynamic data for tabs
    const [watchlistItems, setWatchlistItems] = useState<ListItem[] | null>(null);
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);


    useEffect(() => {
        if (!id) return;
        if (currentUser && id === currentUser.id) {
            navigate('/watch-hive/profile');
            return;
        }

        const fetchUser = async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const data = await userService.getUser(id);
                setProfileUser(data);
                setPageTitle(data.displayName || data.username);
                setPageIcon('person');
            } catch (err) {
                console.error(err);
                setError('User not found');
            } finally {
                if (showLoading) setLoading(false);
            }
        };

        fetchUser();
    }, [id, currentUser, navigate, setPageTitle, setPageIcon]);

    // Fetch watchlist if active
    useEffect(() => {
        if (activeTab === 'watchlist' && id && watchlistItems === null) {
            const fetchWatchlist = async () => {
                setIsWatchlistLoading(true);
                try {
                    const data = await listsApi.getUserWatchlist(id);
                    setWatchlistItems(data.items || []);
                } catch (err) {
                    console.error('Failed to fetch user watchlist', err);
                } finally {
                    setIsWatchlistLoading(false);
                }
            };
            fetchWatchlist();
        }
    }, [activeTab, id, watchlistItems]);

    const handleFollowToggle = async () => {
        if (!profileUser) return;

        const originalFollowing = profileUser.isFollowing;
        const originalRequested = profileUser.isRequested;

        let nextFollowing = originalFollowing;
        let nextRequested = originalRequested;

        if (originalFollowing) {
            nextFollowing = false;
            nextRequested = false;
        } else if (originalRequested) {
            nextFollowing = false;
            nextRequested = false;
        } else {
            if (profileUser.isPrivate) {
                nextRequested = true;
            } else {
                nextFollowing = true;
            }
        }

        setProfileUser(prev => prev ? ({ ...prev, isFollowing: nextFollowing, isRequested: nextRequested }) : null);

        try {
            if (originalFollowing || originalRequested) {
                await userService.unfollowUser(profileUser.id);
            } else {
                await userService.followUser(profileUser.id);
            }
            // Re-fetch full user data to update stats and tabs immediately
            const updatedData = await userService.getUser(profileUser.id);
            setProfileUser(updatedData);
        } catch (err) {
            // Revert on error
            setProfileUser(prev => prev ? ({ ...prev, isFollowing: originalFollowing, isRequested: originalRequested }) : null);
            console.error('Failed to toggle follow');
        }
    };

    if (loading) return <PageLayout><ProfileSkeleton /></PageLayout>;

    if (error || !profileUser) return (
        <PageLayout>
            <div className="flex-1 flex flex-col items-center justify-center py-20 font-display">
                <div className="bg-white border border-[#2D2926]/10 shadow-sm rounded-3xl p-8 max-w-md text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-[#2D2926] mb-2">Something went wrong</h3>
                    <p className="text-[#2D2926]/60 mb-6">{error || 'User not found.'}</p>
                    <button onClick={() => navigate('/watch-hive/feed')} className="px-6 py-2 bg-[#ffb700] text-[#2D2926] font-bold rounded-xl">Go Back to Feed</button>
                </div>
            </div>
        </PageLayout>
    );

    const privacyLevel = profileUser.privacyLevel || (profileUser.isPrivate ? 'FOLLOWERS_ONLY' : 'PUBLIC');
    const isOwner = currentUser?.id === profileUser.id;
    const isFollower = profileUser.isFollowing;
    
    let canViewEntries = false;
    if (isOwner) {
        canViewEntries = true;
    } else if (privacyLevel === 'PUBLIC') {
        canViewEntries = true;
    } else if (privacyLevel === 'FOLLOWERS_ONLY' && isFollower) {
        canViewEntries = true;
    }

    return (
        <PageLayout maxWidth="5xl">
            <div className="flex flex-col gap-8 pb-12">
                {/* Profile Hero */}
                <div className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-sm p-6 md:p-10 animate-slide-up">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/30 hidden sm:flex">
                            <span className="material-symbols-outlined text-sm font-black text-[#ffb700]">stars</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Soul Persona</span>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-[#ffb700]/20 rounded-full blur-xl opacity-30"></div>
                            <div className="relative p-1 bg-gradient-to-br from-[#ffb700] to-transparent rounded-full">
                                <div className="bg-white rounded-full p-1 relative overflow-hidden">
                                    {profileUser.profilePictureUrl ? (
                                        <img className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" src={profileUser.profilePictureUrl} alt="User profile" />
                                    ) : (
                                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <span className="material-symbols-outlined text-5xl">person</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-black text-[#2D2926] tracking-tighter leading-none mb-1">
                                    {profileUser.displayName || profileUser.username}
                                </h1>
                                <p className="text-[#ffb700] font-black text-sm uppercase tracking-widest">@{profileUser.username}</p>
                            </div>
                            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
                                {profileUser.bio || "Building a hive of visual experiences. Passionate about storytelling and cinema."}
                            </p>
                            
                            {canViewEntries && profileUser._count && (
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                    {[
                                        { label: 'Watches', count: profileUser._count.entries || 0, icon: 'movie' },
                                        { label: 'Followers', count: profileUser._count.followers, icon: 'group', onClick: () => setModalConfig({ isOpen: true, type: 'followers' }) },
                                        { label: 'Following', count: profileUser._count.following, icon: 'person_add', onClick: () => setModalConfig({ isOpen: true, type: 'following' }) }
                                    ].map((stat, i) => (
                                        <div 
                                            key={i} 
                                            className={`bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-center min-w-[100px] transition-all ${stat.onClick ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                            onClick={stat.onClick}
                                        >
                                            <p className="text-2xl font-black text-[#2D2926] leading-none mb-1">{stat.count}</p>
                                            <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex md:flex-col gap-3 w-full md:w-48">
                            <button 
                                onClick={handleFollowToggle} 
                                className={`flex-1 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-black/5 ${
                                    profileUser.isFollowing 
                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                    : profileUser.isRequested
                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-200 shadow-amber-100/50'
                                    : 'bg-[#ffb700] text-white hover:brightness-105 shadow-[#ffb700]/20'
                                }`}
                            >
                                {profileUser.isFollowing ? 'Unfollow' : profileUser.isRequested ? 'Requested 🔒' : 'Follow User'}
                            </button>
                            
                            <button 
                                onClick={() => setIsSuggestModalOpen(true)}
                                className="flex-1 font-black py-4 rounded-2xl bg-white border border-black/5 text-[#2D2926] hover:bg-slate-50 transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-black/5"
                            >
                                Suggest Media
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                {canViewEntries && (
                    <div className="flex border-b border-black/5 gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'entries', label: 'Entries', show: profileUser.showWatchEntries },
                            { id: 'watching', label: 'Watching', show: profileUser.showCurrentlyWatching },
                            { id: 'watchlist', label: 'Watchlist', show: profileUser.showWatchlist }
                        ].filter(t => t.show || (currentUser && currentUser.id === profileUser.id)).map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 px-2 font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap relative transition-all ${
                                    activeTab === tab.id ? 'text-[#ffb700]' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffb700] rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                )}


                {/* Tab Container */}
                <section className="flex flex-col gap-6">
                    {canViewEntries ? (
                        <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
                            {activeTab === 'entries' && (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700]">
                                            <span className="material-symbols-outlined text-lg">history</span>
                                        </div>
                                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Recent Activity</h3>
                                    </div>
                                    <EntryList filters={{ userId: profileUser.id }} readOnly />
                                </>
                            )}
                            {activeTab === 'watching' && (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <span className="material-symbols-outlined text-lg">play_circle</span>
                                        </div>
                                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Watching Now</h3>
                                    </div>
                                    <EntryList filters={{ userId: profileUser.id, isWatching: true }} readOnly />
                                </>
                            )}
                            {activeTab === 'watchlist' && (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                            <span className="material-symbols-outlined text-lg">bookmark</span>
                                        </div>
                                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Saved for Later</h3>
                                    </div>
                                    <WatchlistGrid items={watchlistItems || []} isLoading={isWatchlistLoading} readOnly />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-black/5 shadow-sm rounded-[40px] p-16 text-center animate-slide-up">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-8">
                                    <span className="text-5xl">
                                        {privacyLevel === 'PRIVATE' ? '🔏' : '🔒'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-[#2D2926] mb-2">
                                    {privacyLevel === 'PRIVATE' ? "Strictly Private" : "Connect to View Profile"}
                                </h3>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
                                    {privacyLevel === 'PRIVATE' 
                                        ? "Activity on this profile is hidden from everyone. Respecting the privacy hive." 
                                        : "Follow this user to see their entries and cinematic activity."}
                                </p>
                            </div>
                        </div>
                    )}
                </section>
                
                {profileUser && (
                    <FollowListModal
                        isOpen={modalConfig.isOpen}
                        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                        userId={profileUser.id}
                        type={modalConfig.type}
                    />
                )}
                {profileUser && isSuggestModalOpen && (
                    <SuggestMovieModal
                        toUserId={profileUser.id}
                        toUserName={profileUser.displayName || profileUser.username}
                        onClose={() => setIsSuggestModalOpen(false)}
                        onSuccess={() => {
                            console.log('Suggestion sent successfully!');
                        }}
                    />
                )}
            </div>
        </PageLayout>
    );
};

export default UserProfilePage;
