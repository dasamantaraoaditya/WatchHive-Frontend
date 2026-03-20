import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import { userService } from '../services';
import { FollowListModal, WatchlistGrid } from '../components/profile';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ followersCount: number; followingCount: number } | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    
    // UI Tabs State
    const [activeTab, setActiveTab] = useState<'entries' | 'watchlist' | 'stats'>('entries');

    useEffect(() => {
        if (user) {
            userService.getFollowStats(user.id).then(setStats).catch(console.error);
        }
    }, [user?.id]);

    if (!user) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPEG, PNG, WebP, and GIF images are allowed');
            return;
        }

        setError(null);
        setSuccessMsg(null);
        setUploading(true);

        try {
            const updatedUser = await userService.uploadAvatar(file);
            updateUser({
                ...user,
                profilePictureUrl: updatedUser.profilePictureUrl,
            });
            setSuccessMsg('Profile picture updated!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        setError(null);
        setSuccessMsg(null);
        setUploading(true);

        try {
            await userService.deleteAvatar();
            updateUser({ ...user, profilePictureUrl: null });
            setSuccessMsg('Profile picture removed');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to remove picture');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#FFF9F0] font-display text-[#2D2926]">
            
            {/* Embedded Header for Mobile mostly, Desktop uses Sidebar natively but we can keep standard profile title */}
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
                
                {/* Status Alerts */}
                {(error || successMsg) && (
                    <div className={`p-4 rounded-xl text-center font-bold ${error ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {error || successMsg}
                    </div>
                )}

                {/* Profile Hero */}
                <div className="relative overflow-hidden rounded-xl border border-[#ffb700]/20 bg-white shadow-sm p-6 md:p-10">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/30 hidden sm:flex">
                            <span className="material-symbols-outlined text-sm">stars</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Soul Persona: The Collector</span>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            {/* Honeycomb border motif */}
                            <div className="absolute -inset-2 bg-[#ffb700]/20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div className="relative p-1 bg-gradient-to-br from-[#ffb700] via-[#ffb700]/40 to-transparent rounded-full shadow-lg">
                                <div className="bg-white rounded-full p-1 relative overflow-hidden">
                                    {user.profilePictureUrl ? (
                                        <img className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`} src={user.profilePictureUrl} alt="User profile" />
                                    ) : (
                                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}>
                                            <span className="material-symbols-outlined text-5xl">person</span>
                                        </div>
                                    )}
                                    
                                    {/* Upload Overlay */}
                                    <div className="absolute inset-0 bg-[#2D2926]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full m-1">
                                        <span className="text-white font-bold text-sm">{uploading ? 'Wait...' : 'Change'}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-[#2D2926]">{user.displayName || user.username}</h1>
                                <p className="text-[#ffb700] font-semibold">@{user.username}</p>
                            </div>
                            <p className="text-[#2D2926]/70 max-w-lg">
                                Curating the finest cinematic gems. Passionate about storytelling, visual aesthetics, and 90s indie cinema. Building a hive of visual experiences.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px]">
                                    <p className="text-2xl font-black text-[#ffb700]">1,284</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Watches</p>
                                </div>
                                <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px] cursor-pointer hover:bg-[#ffb700]/10 transition-colors" onClick={() => stats && setModalConfig({ isOpen: true, type: 'followers' })}>
                                    <p className="text-2xl font-black text-[#2D2926]">{stats?.followersCount || 0}</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Followers</p>
                                </div>
                                <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-5 py-2 rounded-lg text-center min-w-[100px] cursor-pointer hover:bg-[#ffb700]/10 transition-colors" onClick={() => stats && setModalConfig({ isOpen: true, type: 'following' })}>
                                    <p className="text-2xl font-black text-[#2D2926]">{stats?.followingCount || 0}</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D2926]/50">Following</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            <button onClick={handleAvatarClick} disabled={uploading} className="flex-1 md:w-32 bg-[#ffb700] text-white font-bold py-2.5 rounded-lg hover:brightness-105 transition-all text-sm shadow-sm">
                                {uploading ? 'Uploading...' : 'Update Photo'}
                            </button>
                            <Link to="/watch-hive/mindlens" className="flex-1 md:w-32 bg-[#ffb700]/10 border border-[#ffb700]/20 text-[#ffb700] font-bold py-2.5 rounded-lg hover:bg-[#ffb700]/20 transition-all text-sm text-center">
                                Insights
                            </Link>
                            {user.profilePictureUrl && (
                                <button onClick={handleRemoveAvatar} disabled={uploading} className="flex-1 md:w-32 bg-red-100 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-200 transition-all text-sm">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-[#ffb700]/10 gap-8 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('entries')} className={`pb-4 px-2 font-bold whitespace-nowrap relative ${activeTab === 'entries' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-[#2D2926]/50 hover:text-[#2D2926] transition-colors'}`}>
                        Entries
                        {activeTab === 'entries' && <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-[#ffb700]"></span>}
                    </button>
                    <button onClick={() => setActiveTab('watchlist')} className={`pb-4 px-2 font-bold whitespace-nowrap relative ${activeTab === 'watchlist' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-[#2D2926]/50 hover:text-[#2D2926] transition-colors'}`}>
                        Watchlist
                        {activeTab === 'watchlist' && <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-[#ffb700]"></span>}
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`pb-4 px-2 font-bold whitespace-nowrap relative ${activeTab === 'stats' ? 'text-[#ffb700] border-b-2 border-[#ffb700]' : 'text-[#2D2926]/50 hover:text-[#2D2926] transition-colors'}`}>
                        Stats
                        {activeTab === 'stats' && <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-[#ffb700]"></span>}
                    </button>
                </div>

                {/* Tab Containers */}
                {activeTab === 'watchlist' && (
                    <section className="flex flex-col gap-6 py-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-[#2D2926]">
                                <span className="material-symbols-outlined text-[#ffb700]">bookmark</span>
                                Watchlist: Saved for Later
                            </h3>
                        </div>
                        <WatchlistGrid />
                    </section>
                )}

                {activeTab === 'entries' && (
                    <section className="flex flex-col gap-6">
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

                        {/* Dummy Entries List (from Mockup) */}
                        <div className="group flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-[#ffb700]/10 bg-white hover:shadow-md transition-all">
                            <div className="w-full md:w-32 aspect-[2/3] overflow-hidden rounded-lg border border-[#ffb700]/5">
                                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Neon Horizons" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQOxkKkAMXqYcWczJ5KjqL1oaTWRYZPKhlBQueevalPDvjth4Qqi0ix7amKkDe2KkwoM9gEkFZ1YOOdoun4UayyE7x8bD0nDD3c_ovzMkmYvXkMX9Hhn-aQIBJBOjyvkKGLTvW6WQUi890gT9BO8WpWlHQf6qOaaJxjquYCD9Ry57hqr4dIMGQe6R-bnHYEmn0LzexTOeQ5Xk3sC8eaTkoPXW8ED8A2wBqDwD7X1EJNuQlW1RrtpYUtW5sPUSAyhyyfx1ni1QJ-NQ"/>
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xl font-bold group-hover:text-[#ffb700] transition-colors text-[#2D2926]">Neon Horizons</h4>
                                            <p className="text-sm text-[#2D2926]/50">Directed by Elena Vance • 2023</p>
                                        </div>
                                        <div className="flex text-[#ffb700]">
                                            <span className="material-symbols-outlined fill-1">star</span><span className="material-symbols-outlined fill-1">star</span><span className="material-symbols-outlined fill-1">star</span><span className="material-symbols-outlined fill-1">star</span><span className="material-symbols-outlined">star</span>
                                        </div>
                                    </div>
                                    <p className="text-[#2D2926]/70 text-sm italic">"A visual masterpiece that redefines the sci-fi genre. The cinematography is breathtaking."</p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <span className="text-[10px] px-2 py-0.5 rounded border border-[#ffb700]/20 bg-[#ffb700]/5 text-[#ffb700] uppercase font-bold tracking-tighter">Sci-Fi</span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 pt-4 border-t border-[#ffb700]/5 flex items-center gap-4 text-xs text-[#2D2926]/50">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> Oct 12, 2023</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">chat_bubble</span> 12 comments</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'stats' && (
                    <section className="flex flex-col items-center justify-center py-20 opacity-50">
                        <span className="material-symbols-outlined text-6xl mb-4 text-[#ffb700]">analytics</span>
                        <h2 className="text-xl font-bold text-[#2D2926]">Deep Stats Coming Soon</h2>
                        <p className="text-[#2D2926]/60 text-sm max-w-sm text-center mt-2">Log a few more titles and return here to analyze your runtime analytics across genres and actors!</p>
                    </section>
                )}
            </main>

            <FollowListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                userId={user.id}
                type={modalConfig.type}
            />
        </div>
    );
};

export default ProfilePage;
