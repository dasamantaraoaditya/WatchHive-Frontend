import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import followsService from '../services/follows.service';
import EntryList from '../components/entries/EntryList';
import { FollowListModal } from '../components/profile/FollowListModal';
import { useAuth, useUI } from '../contexts';
import { SuggestMovieModal } from '../components/suggestions/SuggestMovieModal';
import { ProfileSkeleton } from '../components/common/Skeleton';
import { listsApi, ListItem, List } from '../services/lists.service';
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
    const [activeTab, setActiveTab] = useState<'entries' | 'watching' | 'watchlist' | 'rankings'>('entries');
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [isHoveredRequested, setIsHoveredRequested] = useState(false);

    // Dynamic data for tabs
    const [watchlistItems, setWatchlistItems] = useState<ListItem[] | null>(null);
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

    const [userRankings, setUserRankings] = useState<List[] | null>(null);
    const [isRankingsLoading, setIsRankingsLoading] = useState(false);

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

    // Select first enabled tab automatically
    useEffect(() => {
        if (profileUser) {
            const availableTabs = [
                { id: 'entries', show: profileUser.showWatchEntries },
                { id: 'watching', show: profileUser.showCurrentlyWatching },
                { id: 'watchlist', show: profileUser.showWatchlist },
                { id: 'rankings', show: profileUser.showRankings !== false }
            ].filter(t => t.show || (currentUser && currentUser.id === profileUser.id));

            if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeTab)) {
                setActiveTab(availableTabs[0].id as any);
            }
        }
    }, [profileUser, currentUser]);

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

    // Fetch user rankings if active
    useEffect(() => {
        if (activeTab === 'rankings' && id && userRankings === null) {
            const fetchRankings = async () => {
                setIsRankingsLoading(true);
                try {
                    const data = await listsApi.getUserRankings(id);
                    setUserRankings(data || []);
                } catch (err) {
                    console.error('Failed to fetch user rankings', err);
                } finally {
                    setIsRankingsLoading(false);
                }
            };
            fetchRankings();
        }
    }, [activeTab, id, userRankings]);

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
            nextRequested = true;
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

    const handleAcceptRequest = async () => {
        if (!profileUser || !profileUser.incomingRequestId) return;
        try {
            await followsService.acceptRequest(profileUser.incomingRequestId);
            const updatedData = await userService.getUser(profileUser.id);
            setProfileUser(updatedData);
        } catch (err) {
            console.error('Failed to accept request', err);
        }
    };

    const handleRejectRequest = async () => {
        if (!profileUser || !profileUser.incomingRequestId) return;
        try {
            await followsService.rejectRequest(profileUser.incomingRequestId);
            const updatedData = await userService.getUser(profileUser.id);
            setProfileUser(updatedData);
        } catch (err) {
            console.error('Failed to reject request', err);
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
    const isRequested = profileUser.isRequested;
    
    let canViewEntries = false;
    if (isOwner) {
        canViewEntries = true;
    } else if (isRequested) {
        canViewEntries = false;
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
                        
                        <div className="flex flex-col gap-2.5 w-full md:w-64">
                            {profileUser.isIncomingRequest ? (
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="text-[9px] font-black text-center uppercase tracking-[0.15em] text-[#ffb700] bg-[#ffb700]/5 border border-[#ffb700]/15 py-2 rounded-xl">
                                        Wants to Follow You
                                    </p>
                                    <div className="flex flex-row gap-2 w-full">
                                        <button 
                                            onClick={handleAcceptRequest} 
                                            className="flex-1 font-black py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] uppercase tracking-[0.12em] shadow-md shadow-emerald-500/10 active:scale-95 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                            Accept
                                        </button>
                                        <button 
                                            onClick={handleRejectRequest} 
                                            className="flex-1 font-black py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-[9px] uppercase tracking-[0.12em] active:scale-95 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                            Decline
                                        </button>
                                        <button 
                                            onClick={() => setIsSuggestModalOpen(true)}
                                            className="flex-1 font-black py-2.5 px-3 rounded-xl bg-white border border-black/5 text-[#2D2926] hover:bg-[#ffb700]/5 hover:border-[#ffb700]/30 hover:text-[#ffb700] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-[9px] uppercase tracking-[0.12em] shadow-md shadow-black/5 flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            Suggest
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-row gap-2 w-full">
                                    <button 
                                        onClick={handleFollowToggle} 
                                        onMouseEnter={() => setIsHoveredRequested(true)}
                                        onMouseLeave={() => setIsHoveredRequested(false)}
                                        className={`flex-1 font-black py-2.5 px-4 rounded-xl transition-all duration-200 text-[9px] uppercase tracking-[0.12em] shadow-md shadow-black/5 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                            profileUser.isFollowing 
                                            ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 border border-transparent' 
                                            : profileUser.isRequested
                                            ? 'bg-amber-50 text-amber-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 border border-amber-200 shadow-amber-100/50'
                                            : 'bg-[#ffb700] text-white hover:brightness-105 shadow-[#ffb700]/15'
                                        }`}
                                    >
                                        {profileUser.isFollowing ? (
                                            <>
                                                <span className="material-symbols-outlined text-[14px]">person_remove</span>
                                                Unfollow
                                            </>
                                        ) : profileUser.isRequested ? (
                                            isHoveredRequested ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                    Cancel
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                                    Requested
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[14px]">person_add</span>
                                                Follow
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setIsSuggestModalOpen(true)}
                                        className="flex-1 font-black py-2.5 px-4 rounded-xl bg-white border border-black/5 text-[#2D2926] hover:bg-[#ffb700]/5 hover:border-[#ffb700]/30 hover:text-[#ffb700] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-[9px] uppercase tracking-[0.12em] shadow-md shadow-black/5 flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                        Suggest
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                {canViewEntries && (
                    <div className="flex border-b border-black/5 gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'entries', label: 'Entries', show: profileUser.showWatchEntries },
                            { id: 'watching', label: 'Watching', show: profileUser.showCurrentlyWatching },
                            { id: 'watchlist', label: 'Watchlist', show: profileUser.showWatchlist },
                            { id: 'rankings', label: 'Rankings Stacks', show: profileUser.showRankings !== false }
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
                            {activeTab === 'rankings' && (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#ffb700]">
                                                <span className="material-symbols-outlined text-lg">format_list_numbered</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Cinematic Stacks & Rankings</h3>
                                                <p className="text-xs text-slate-400 font-bold">Publicly ranked collections by @{profileUser.username}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {isRankingsLoading ? (
                                        <div className="py-12 flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffb700]"></div>
                                        </div>
                                    ) : !userRankings || userRankings.length === 0 ? (
                                        <div className="bg-white border border-black/5 rounded-3xl p-12 text-center text-slate-400 font-bold">
                                            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">format_list_numbered</span>
                                            <p>No public ranking stacks yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {userRankings.map(stack => (
                                                <div key={stack.id} className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-lg font-black text-[#2D2926]">{stack.name}</h4>
                                                        <span className="px-3 py-1 bg-[#ffb700]/10 text-[#ffb700] rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            {stack.items?.length || 0} Items
                                                        </span>
                                                    </div>
                                                    {stack.description && (
                                                        <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">{stack.description}</p>
                                                    )}
                                                    <div className="space-y-2.5 mt-4">
                                                        {(stack.items || []).map((item, idx) => {
                                                            const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w185${item.posterPath}` : null;
                                                            const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;

                                                            return (
                                                                <div 
                                                                    key={item.id || idx}
                                                                    onClick={() => {
                                                                        const type = item.mediaType === 'tv' ? 'tv' : 'movie';
                                                                        navigate(`/watch-hive/details/${type}/${item.tmdbId}`, { state: { from: window.location.pathname + window.location.search } });
                                                                    }}
                                                                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-[#ffb700]/10 rounded-2xl cursor-pointer transition-all border border-black/5 hover:border-[#ffb700]/30 shadow-2xs group"
                                                                >
                                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                                        <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 shadow-xs ${
                                                                            idx === 0 
                                                                                ? 'bg-[#ffb700] text-white ring-2 ring-[#ffb700]/30' 
                                                                                : idx === 1 
                                                                                ? 'bg-slate-300 text-slate-800' 
                                                                                : idx === 2 
                                                                                ? 'bg-amber-700 text-white' 
                                                                                : 'bg-slate-200 text-slate-600'
                                                                        }`}>
                                                                            #{idx + 1}
                                                                        </span>

                                                                        {posterUrl ? (
                                                                            <img 
                                                                                src={posterUrl} 
                                                                                alt={item.title || 'Movie'} 
                                                                                className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0 border border-black/5 group-hover:scale-105 transition-transform" 
                                                                            />
                                                                        ) : (
                                                                            <div className="w-10 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                                                <span className="material-symbols-outlined text-lg">movie</span>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-sm font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate">
                                                                                {item.title || `Movie #${item.tmdbId}`}
                                                                            </span>
                                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                                                {year && <span>{year}</span>}
                                                                                {year && item.voteAverage && <span>•</span>}
                                                                                {item.voteAverage && (
                                                                                    <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                                                                                        <span className="material-symbols-outlined text-[13px]">star</span>
                                                                                        {Number(item.voteAverage).toFixed(1)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] group-hover:bg-[#ffb700]/10 transition-all shrink-0 ml-2">
                                                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
