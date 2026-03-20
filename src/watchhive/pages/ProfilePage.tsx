import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import { userService } from '../services';
import { FollowListModal, WatchlistGrid, ProfileStats } from '../components/profile';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ followersCount: number; followingCount: number } | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    
    // UI Tabs State
    const [activeTab, setActiveTab] = useState<'watchlist' | 'stats'>('watchlist');

    useEffect(() => {
        if (user) {
            userService.getFollowStats(user.id).then(setStats).catch(console.error);
        }
    }, [user?.id]);

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(user?.bio || '');

    useEffect(() => {
        if (user) setBioText(user.bio || '');
    }, [user?.bio]);

    if (!user) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleSaveBio = async () => {
        if (bioText.length > 500) {
            setError('Bio must be less than 500 characters');
            return;
        }
        try {
            const updatedUser = await userService.updateUserData({ bio: bioText });
            updateUser(updatedUser);
            setIsEditingBio(false);
            setSuccessMsg('Bio updated successfully!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update bio');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5 MB'); return; }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) { setError('Only JPEG, PNG, WebP, and GIF images are allowed'); return; }

        setError(null);
        setSuccessMsg(null);
        setUploading(true);

        try {
            const updatedUser = await userService.uploadAvatar(file);
            updateUser({ ...user, profilePictureUrl: updatedUser.profilePictureUrl });
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
        setError(null); setSuccessMsg(null); setUploading(true);
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
        <div className="flex h-screen w-full flex-col bg-[#FFF9F0] font-sans text-[#2D2926] overflow-hidden">
            
            {/* Ultra-Compact Top Bar Dashboard */}
            <div className="w-full bg-white border-b border-[#ffb700]/10 px-4 md:px-8 py-4 shrink-0 shadow-sm z-10">
                <main className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    
                    {/* Avatar & Identifiers */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-[#ffb700]/20 shadow-sm group-hover:border-[#ffb700] transition-all">
                                {user.profilePictureUrl ? (
                                    <img className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`} src={user.profilePictureUrl} alt={user.username} />
                                ) : (
                                    <div className="w-full h-full bg-[#ffb700]/5 flex items-center justify-center text-[#ffb700]">
                                        <span className="material-symbols-outlined text-3xl">face</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-white text-xl">upload</span>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black tracking-tight leading-none">{user.displayName || user.username}</h1>
                            <p className="text-[12px] font-bold text-[#ffb700] mt-1">@{user.username}</p>
                            {user.profilePictureUrl && (
                                <button onClick={handleRemoveAvatar} className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 hover:text-rose-700">Delete Photo</button>
                            )}
                        </div>
                    </div>

                    {/* Bio Section - Compact Horizontal */}
                    <div className="flex-1 w-full md:w-auto h-full px-2 md:px-6 md:border-x border-[#ffb700]/5 min-h-[40px] flex items-center">
                        {isEditingBio ? (
                            <div className="flex-1 flex gap-2 items-center w-full">
                                <input
                                    value={bioText}
                                    onChange={(e) => setBioText(e.target.value)}
                                    maxLength={500}
                                    className="flex-1 px-3 py-1.5 bg-[#FFF9F0] border border-[#ffb700]/30 rounded-lg text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#ffb700]/20"
                                    autoFocus
                                />
                                <button onClick={handleSaveBio} className="px-3 py-1.5 bg-[#ffb700] text-white text-[10px] font-black rounded-lg uppercase">Save</button>
                                <button onClick={() => setIsEditingBio(false)} className="px-3 py-1.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase">X</button>
                            </div>
                        ) : (
                            <p 
                                className="text-[13px] font-medium text-[#2D2926]/60 leading-tight italic line-clamp-2 md:line-clamp-1 cursor-pointer hover:text-[#2D2926] transition-colors"
                                onClick={() => setIsEditingBio(true)}
                            >
                                {user.bio || "No bio yet. Tell the Hive about your vision..."}
                            </p>
                        )}
                    </div>

                    {/* Dynamic Stats Row */}
                    <div className="flex items-center gap-4 md:gap-8 shrink-0">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-[#ffb700]">{user._count?.entries || 0}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40">Watches</span>
                        </div>
                        <div 
                            className="flex flex-col items-center cursor-pointer group/stat"
                            onClick={() => stats && setModalConfig({ isOpen: true, type: 'followers' })}
                        >
                            <span className="text-lg font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors">{stats?.followersCount || 0}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40 group-hover:text-[#2D2926]">Followers</span>
                        </div>
                        <div 
                            className="flex flex-col items-center cursor-pointer group/stat"
                            onClick={() => stats && setModalConfig({ isOpen: true, type: 'following' })}
                        >
                            <span className="text-lg font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors">{stats?.followingCount || 0}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40 group-hover:text-[#2D2926]">Following</span>
                        </div>
                    </div>
                </main>
            </div>

            {/* Content Controller */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 h-full flex flex-col">
                    
                    {/* Alerts (Toast-like) */}
                    {(error || successMsg) && (
                        <div className={`mb-6 p-3 rounded-xl text-[11px] font-black text-center border animate-[slide-down_0.3s_ease-out] ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {error || successMsg}
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex bg-white/50 p-1 rounded-2xl border border-[#ffb700]/10">
                            <button 
                                onClick={() => setActiveTab('watchlist')} 
                                className={`px-5 py-1.5 rounded-xl text-[12px] font-black transition-all ${activeTab === 'watchlist' ? 'bg-white shadow-sm text-[#ffb700]' : 'text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                            >
                                Watchlist
                            </button>
                            <button 
                                onClick={() => setActiveTab('stats')} 
                                className={`px-5 py-1.5 rounded-xl text-[12px] font-black transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-[#ffb700]' : 'text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                            >
                                Hive Analytics
                            </button>
                        </div>
                    </div>

                    <div className="flex-1">
                        {activeTab === 'watchlist' ? (
                            <section className="animate-[fade-in_0.3s_ease-out]">
                                <WatchlistGrid />
                            </section>
                        ) : (
                                <section className="animate-[fade-in_0.4s_ease-out] w-full mt-4">
                                    <ProfileStats />
                                </section>
                        )}
                    </div>
                </div>
            </main>

            <FollowListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                userId={user.id}
                type={modalConfig.type}
            />

            <style>{`
                @keyframes slide-down { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ProfilePage;
