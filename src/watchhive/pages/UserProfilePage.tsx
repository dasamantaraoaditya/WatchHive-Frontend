import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import EntryList from '../components/entries/EntryList';
import { FollowListModal } from '../components/profile/FollowListModal';
import { useAuth } from '../contexts';
import { BeeLoader } from '../components/common';

export const UserProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });

    useEffect(() => {
        if (!id) return;
        if (currentUser && id === currentUser.id) {
            navigate('/watch-hive/profile');
            return;
        }

        const fetchUser = async () => {
            setLoading(true);
            try {
                const data = await userService.getUser(id);
                setProfileUser(data);
            } catch (err) {
                console.error(err);
                setError('User not found');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, currentUser, navigate]);

    const handleFollowToggle = async () => {
        if (!profileUser) return;

        // Optimistic update
        const originalStatus = profileUser.isFollowing;
        setProfileUser(prev => prev ? ({ ...prev, isFollowing: !prev.isFollowing }) : null);

        try {
            if (originalStatus) {
                await userService.unfollowUser(profileUser.id);
            } else {
                await userService.followUser(profileUser.id);
            }
        } catch (err) {
            // Revert on error
            setProfileUser(prev => prev ? ({ ...prev, isFollowing: originalStatus }) : null);
            console.error('Failed to toggle follow');
        }
    };

    if (loading) return (
         <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FFF9F0]">
            <BeeLoader size="medium" message="Loading User Profile..." />
        </div>
    );

    if (error || !profileUser) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FFF9F0] p-8 font-display">
            <div className="bg-white border border-[#2D2926]/10 shadow-sm rounded-3xl p-8 max-w-md text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-[#2D2926] mb-2">Something went wrong</h3>
                <p className="text-[#2D2926]/60 mb-6">{error || 'User not found.'}</p>
                <button onClick={() => navigate('/watch-hive/feed')} className="px-6 py-2 bg-[#ffb700] text-[#2D2926] font-bold rounded-xl">Go Back to Feed</button>
            </div>
        </div>
    );

    const isPrivate = profileUser.isPrivate;
    const canViewEntries = !isPrivate || profileUser.isFollowing || (currentUser?.id === profileUser.id);

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">
            
            {/* Embedded Header for Mobile mostly, Desktop uses Sidebar natively */}
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-6 lg:px-20 py-3 md:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[#ffb700]">
                            <span className="material-symbols-outlined text-3xl">hive</span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#2D2926]">WatchHive</h2>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
                
                {/* Profile Hero */}
                <div className="relative overflow-hidden rounded-xl border border-[#ffb700]/20 bg-white shadow-sm p-6 md:p-10">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/30 hidden sm:flex">
                            <span className="material-symbols-outlined text-sm">stars</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Soul Persona: Fellow Curator</span>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            {/* Honeycomb border motif */}
                            <div className="absolute -inset-2 bg-[#ffb700]/20 rounded-full blur-xl opacity-50"></div>
                            <div className="relative p-1 bg-gradient-to-br from-[#ffb700] via-[#ffb700]/40 to-transparent rounded-full shadow-lg">
                                <div className="bg-white rounded-full p-1 relative overflow-hidden">
                                    {profileUser.profilePictureUrl ? (
                                        <img className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" src={profileUser.profilePictureUrl} alt="User profile" />
                                    ) : (
                                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700]">
                                            <span className="material-symbols-outlined text-5xl">person</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-[#2D2926]">{profileUser.displayName || profileUser.username}</h1>
                                <p className="text-[#ffb700] font-semibold">@{profileUser.username}</p>
                            </div>
                            <p className="text-[#2D2926]/70 max-w-lg">
                                {profileUser.bio || "Building a hive of visual experiences. Passionate about storytelling and cinema."}
                            </p>
                            
                            {profileUser._count && (
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                    <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px]">
                                        <p className="text-2xl font-black text-[#ffb700]">{profileUser._count.entries || 0}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Watches</p>
                                    </div>
                                    <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px] cursor-pointer hover:bg-[#ffb700]/10 transition-colors" onClick={() => setModalConfig({ isOpen: true, type: 'followers' })}>
                                        <p className="text-2xl font-black text-[#2D2926]">{profileUser._count.followers}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Followers</p>
                                    </div>
                                    <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px] cursor-pointer hover:bg-[#ffb700]/10 transition-colors" onClick={() => setModalConfig({ isOpen: true, type: 'following' })}>
                                        <p className="text-2xl font-black text-[#2D2926]">{profileUser._count.following}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Following</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            <button 
                                onClick={handleFollowToggle} 
                                className={`flex-1 md:w-32 font-bold py-2.5 rounded-lg transition-all text-sm shadow-sm ${
                                    profileUser.isFollowing 
                                    ? 'bg-[#2D2926]/10 text-[#2D2926] hover:bg-[#2D2926]/20' 
                                    : 'bg-[#ffb700] text-white hover:brightness-105'
                                }`}
                            >
                                <span className="flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">{profileUser.isFollowing ? 'person_remove' : 'person_add'}</span>
                                    {profileUser.isFollowing ? 'Unfollow' : 'Follow'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-[#ffb700]/10 gap-8">
                    <button className="pb-4 px-2 font-bold whitespace-nowrap relative text-[#ffb700] border-b-2 border-[#ffb700]">
                        Entries
                        <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-[#ffb700]"></span>
                    </button>
                </div>

                {/* Tab Container */}
                <section className="flex flex-col gap-6">
                    {canViewEntries ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-[#2D2926]">
                                    <span className="material-symbols-outlined text-[#ffb700]">history</span>
                                    Recent Activity
                                </h3>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-white border border-[#ffb700]/10 rounded-lg text-[#2D2926]/40 hover:text-[#ffb700] transition-colors">
                                        <span className="material-symbols-outlined text-xl">filter_list</span>
                                    </button>
                                </div>
                            </div>
                            {/* Reusing existing real Feed! */}
                            <EntryList filters={{ userId: profileUser.id }} readOnly />
                        </>
                    ) : (
                        <div className="bg-white border border-[#ffb700]/10 shadow-sm rounded-3xl p-12 text-center text-[#2D2926]">
                            <div className="flex flex-col items-center">
                                <span className="text-5xl mb-6 text-[#ffb700]">🔒</span>
                                <h3 className="text-2xl font-bold mb-2">This Account is Private</h3>
                                <p className="text-[#2D2926]/60 mt-2 text-lg">Follow this user to see their entries and cinematic activity.</p>
                            </div>
                        </div>
                    )}
                </section>
                
            </main>

            {profileUser && (
                <FollowListModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    userId={profileUser.id}
                    type={modalConfig.type}
                />
            )}
        </div>
    );
};

export default UserProfilePage;
