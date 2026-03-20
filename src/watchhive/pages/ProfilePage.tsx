import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import { userService } from '../services';
import { FollowListModal, WatchlistGrid } from '../components/profile';

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
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#FFF9F0] font-sans text-[#2D2926]">
            
            {/* Embedded Mobile Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-6 py-3 md:hidden shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-[#ffb700]">
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hive</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-[#2D2926]">Profile</h2>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full no-scrollbar">
                
                {/* Status Alerts */}
                {(error || successMsg) && (
                    <div className={`mb-6 p-4 rounded-2xl text-center font-bold text-sm animate-[slide-down_0.3s_ease-out] border ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {error || successMsg}
                    </div>
                )}

                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT SIDEBAR: PROFILE CARD & STATS */}
                    <aside className="lg:col-span-4 w-full flex flex-col gap-6 sticky lg:top-0">
                        
                        {/* Profile Info Card */}
                        <div className="bg-white rounded-[32px] border border-[#ffb700]/10 shadow-sm p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group">
                            {/* Decorative Accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-30"></div>
                            
                            {/* Avatar Section */}
                            <div className="relative mb-6" onClick={handleAvatarClick}>
                                <div className="absolute -inset-3 bg-[#ffb700]/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative w-32 h-32 md:w-40 md:h-40 p-1.5 bg-gradient-to-br from-[#ffb700] via-[#ffb700]/30 to-transparent rounded-full cursor-pointer shadow-lg group-hover:scale-[1.02] transition-transform">
                                    <div className="bg-white rounded-full h-full w-full p-1 relative overflow-hidden">
                                        {user.profilePictureUrl ? (
                                            <img className={`w-full h-full rounded-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`} src={user.profilePictureUrl} alt={user.username} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#ffb700]/5 flex items-center justify-center text-[#ffb700]">
                                                <span className="material-symbols-outlined text-6xl">person_filled</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 h-10 bg-[#2D2926]/40 backdrop-blur-sm flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Change</span>
                                        </div>
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>

                            <div className="w-full">
                                <h1 className="text-2xl font-black text-[#2D2926] leading-tight mb-1">{user.displayName || user.username}</h1>
                                <p className="text-[14px] font-bold text-[#ffb700] mb-6">@{user.username}</p>
                                
                                {/* Bio Section */}
                                <div className="text-left w-full mb-8">
                                    {isEditingBio ? (
                                        <div className="flex flex-col gap-3">
                                            <textarea
                                                value={bioText}
                                                onChange={(e) => setBioText(e.target.value)}
                                                maxLength={500}
                                                className="w-full p-4 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl text-[14px] font-semibold text-[#2D2926] focus:outline-none focus:ring-4 focus:ring-[#ffb700]/10 focus:border-[#ffb700] min-h-[120px] transition-all no-scrollbar"
                                                placeholder="Tell us about your cinematic vision..."
                                            />
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-bold text-[#2D2926]/30 uppercase tracking-widest">{bioText.length}/500</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setIsEditingBio(false)} className="px-4 py-1.5 rounded-full bg-[#202020]/5 text-[#2D2926]/60 text-[11px] font-black hover:bg-[#202020]/10 transition-all uppercase">Cancel</button>
                                                    <button onClick={handleSaveBio} className="px-4 py-1.5 rounded-full bg-[#ffb700] text-white text-[11px] font-black shadow-md hover:-translate-y-0.5 transition-all uppercase">Save</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className="group/bio p-4 rounded-2xl border border-transparent hover:border-[#ffb700]/10 hover:bg-[#FFF9F0]/50 transition-all cursor-pointer relative"
                                            onClick={() => setIsEditingBio(true)}
                                        >
                                            <p className="text-[14px] font-medium text-[#2D2926]/70 leading-relaxed italic">
                                                {user.bio || "Crafting a unique cinematic profile..."}
                                            </p>
                                            <span className="absolute top-2 right-2 material-symbols-outlined text-[14px] text-[#ffb700] opacity-0 group-hover/bio:opacity-100 transition-opacity">edit_square</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Overview */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10">
                                        <span className="text-xl font-black text-[#ffb700]">{user._count?.entries || 0}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40">Watches</span>
                                    </div>
                                    <div 
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10 cursor-pointer hover:border-[#ffb700] transition-colors group/stat"
                                        onClick={() => stats && setModalConfig({ isOpen: true, type: 'followers' })}
                                    >
                                        <span className="text-xl font-black text-[#2D2926] group-hover:text-[#ffb700]">{stats?.followersCount || 0}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40">Followers</span>
                                    </div>
                                    <div 
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10 cursor-pointer hover:border-[#ffb700] transition-colors group/stat"
                                        onClick={() => stats && setModalConfig({ isOpen: true, type: 'following' })}
                                    >
                                        <span className="text-xl font-black text-[#2D2926] group-hover:text-[#ffb700]">{stats?.followingCount || 0}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2926]/40">Following</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-full mt-10 space-y-3">
                                {user.profilePictureUrl && (
                                    <button 
                                        onClick={handleRemoveAvatar} 
                                        disabled={uploading} 
                                        className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-black tracking-wide hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">no_photography</span>
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Insights Placeholder / Persona */}
                        <div className="bg-white rounded-[32px] border border-[#ffb700]/10 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#ffb700]/10 flex items-center justify-center border border-[#ffb700]/20">
                                    <span className="material-symbols-outlined text-[#ffb700] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology_alt</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-[0.2em] mb-0.5">MindLens Insight</p>
                                    <p className="text-[15px] font-black text-[#2D2926]">The Global Collector</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-semibold text-[#2D2926]/50 mt-4 leading-relaxed">
                                Your watch habits lean toward cinematic world-building and character-driven narratives.
                            </p>
                            <div className="mt-5 pt-5 border-t border-[#ffb700]/5">
                                <a href="/watch-hive/mindlens" className="text-[11px] font-black text-[#ffb700] flex items-center gap-1 hover:gap-2 transition-all">
                                    VIEW FULL MINDMAP <span className="material-symbols-outlined text-[14px] font-bold">arrow_forward</span>
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT MAIN: WATCHLIST & STATS */}
                    <div className="lg:col-span-8 w-full space-y-8">
                        
                        {/* Tab Switcher */}
                        <div className="flex items-center justify-between border-b border-[#ffb700]/10 pb-0.5 px-2">
                            <div className="flex gap-10">
                                <button 
                                    onClick={() => setActiveTab('watchlist')} 
                                    className={`pb-4 px-1 text-[15px] font-black tracking-tight relative transition-all ${activeTab === 'watchlist' ? 'text-[#ffb700]' : 'text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                                >
                                    Watchlist
                                    {activeTab === 'watchlist' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffb700] rounded-t-full shadow-[0_-2px_8px_rgba(255,183,0,0.5)]"></div>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('stats')} 
                                    className={`pb-4 px-1 text-[15px] font-black tracking-tight relative transition-all ${activeTab === 'stats' ? 'text-[#ffb700]' : 'text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                                >
                                    Analytics
                                    {activeTab === 'stats' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffb700] rounded-t-full shadow-[0_-2px_8px_rgba(255,183,0,0.5)]"></div>
                                    )}
                                </button>
                            </div>
                            
                            <div className="hidden sm:flex items-center gap-2 mb-4 bg-white border border-[#ffb700]/10 px-3 py-1.5 rounded-full shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-[#2D2926]/50 uppercase tracking-widest leading-none mt-0.5">Hive Live</span>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[500px]">
                            {activeTab === 'watchlist' ? (
                                <section className="flex flex-col gap-6 animate-[fade-in_0.4s_ease-out]">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Saved for Later</h3>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ffb700]/5 border border-[#ffb700]/10 rounded-xl text-[#ffb700]">
                                            <span className="material-symbols-outlined text-[18px]">bookmark</span>
                                            <span className="text-[11px] font-black uppercase tracking-widest">Public</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 rounded-[40px] p-2">
                                        <WatchlistGrid />
                                    </div>
                                </section>
                            ) : (
                                <section className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[40px] border border-dashed border-[#ffb700]/20 animate-[fade-in_0.4s_ease-out]">
                                    <div className="w-20 h-20 rounded-[28px] bg-[#ffb700]/10 flex items-center justify-center mb-6 border border-[#ffb700]/20 rotate-3">
                                        <span className="material-symbols-outlined text-4xl text-[#ffb700]">bar_chart_4_bars</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-[#2D2926] tracking-tight mb-2">Detailed Hive Stats</h2>
                                    <p className="text-[#2D2926]/50 font-bold text-center max-w-[280px] leading-relaxed">
                                        We are calculating your genre dominance and watch history patterns. Check back soon for your cinematic DNA!
                                    </p>
                                    <button className="mt-8 px-8 py-3 bg-white border border-[#ffb700]/30 rounded-2xl text-[12px] font-black uppercase tracking-widest text-[#2D2926] hover:bg-[#ffb700] hover:text-white transition-all shadow-sm">
                                        Force Re-Sync
                                    </button>
                                </section>
                            )}
                        </div>
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
                @keyframes slide-down { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ProfilePage;
