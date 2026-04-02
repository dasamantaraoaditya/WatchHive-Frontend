import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import { userService } from '../services';
import { FollowListModal } from '../components/profile';


export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ followersCount: number; followingCount: number } | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    
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

    const handleInvite = async () => {
        const inviteUrl = `${window.location.origin}/signup?ref=${user.username}`;
        const inviteText = `Join me on WatchHive! Check out my cinematic journey and let's build our movie hive together. 🐝🎥`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'WatchHive Invite',
                    text: inviteText,
                    url: inviteUrl,
                });
            } catch (err) {
                console.log('Share failed or canceled', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${inviteText} ${inviteUrl}`);
                setSuccessMsg('Invite link copied to clipboard!');
                setTimeout(() => setSuccessMsg(null), 3000);
            } catch (err) {
                console.error('Failed to copy link', err);
                setError('Failed to copy link');
            }
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
        <div className="flex h-screen w-full flex-col bg-[#FFF9F0] font-sans text-slate-900 overflow-hidden">
            
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#ffb700]/20 bg-[#FFF9F0]/90 backdrop-blur-md px-4 py-3 md:hidden">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold tracking-tight text-[#2D2926]">Profile</h2>
                    <button onClick={handleInvite} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ffb700]/10 text-[#ffb700] active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
                
                <main className="max-w-5xl mx-auto w-full px-4 py-4 md:py-8 flex flex-col gap-6 md:gap-8 md:px-8">
                    
                    {/* Alerts (Toast-like) */}
                    {(error || successMsg) && (
                        <div className={`p-3 rounded-xl text-[11px] font-black text-center border animate-[slide-down_0.3s_ease-out] ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {error || successMsg}
                        </div>
                    )}

                    {/* Profile Hero Block based on HTML */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                        
                        {/* Status Badge */}
                        <div className="absolute hidden md:flex top-0 right-0 p-4">
                            <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/20">
                                <span className="material-symbols-outlined text-sm">stars</span>
                                <span className="text-xs font-bold uppercase tracking-wider">Soul Persona: The Collector</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 mt-2 md:mt-0">
                            
                            {/* Avatar based on HTML */}
                            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                                <div className="absolute -inset-2 bg-[#ffb700]/20 rounded-full blur-xl opacity-50 pointer-events-none transition-all duration-500 group-hover:bg-[#ffb700]/40"></div>
                                <div className="relative p-1 bg-gradient-to-br from-[#ffb700] via-[#ffaa00] to-transparent rounded-full shadow-lg transition-transform group-hover:scale-105 duration-300">
                                    <div className="bg-white rounded-full p-1 w-32 h-32 md:w-40 md:h-40 overflow-hidden relative">
                                        {user.profilePictureUrl ? (
                                            <img className={`w-full h-full object-cover rounded-full ${uploading ? 'opacity-50' : ''}`} src={user.profilePictureUrl} alt={user.username} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#ffb700]/5 flex items-center justify-center text-[#ffb700]">
                                                <span className="material-symbols-outlined text-[3rem]">face</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center transition-opacity">
                                            <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                        </div>
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                {user.profilePictureUrl && (
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }} className="absolute -top-1 right-0 sm:-right-2 w-8 h-8 bg-white text-rose-500 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:scale-110 transition-transform z-10" title="Delete Photo">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>

                            {/* User Info (Name, Bio, Stats) */}
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{user.displayName || user.username}</h1>
                                    <p className="text-[#ffb700] font-bold text-sm uppercase tracking-widest mt-1">@{user.username}</p>
                                </div>
                                
                                {isEditingBio ? (
                                    <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto md:mx-0 py-2">
                                        <textarea
                                            value={bioText}
                                            onChange={(e) => setBioText(e.target.value)}
                                            maxLength={500}
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none min-h-[60px] focus:ring-2 focus:ring-[#ffb700]/30"
                                            autoFocus
                                            placeholder="Write your cinematic bio..."
                                        />
                                        <div className="flex flex-row sm:flex-col gap-1 shrink-0 justify-center">
                                            <button onClick={handleSaveBio} className="px-4 py-2 bg-[#ffb700] hover:bg-[#ffaa00] text-white text-xs font-black uppercase rounded-lg transition-colors shadow-sm">Save</button>
                                            <button onClick={() => setIsEditingBio(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-black uppercase rounded-lg transition-colors">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 max-w-lg mx-auto md:mx-0 text-sm leading-relaxed cursor-pointer hover:text-slate-900 transition-colors py-2" onClick={() => setIsEditingBio(true)}>
                                        {user.bio ? `"${user.bio}"` : "Add a bio to express your cinematic taste..."}
                                    </p>
                                )}

                                <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2">
                                    <div className="bg-[#ffb700]/5 border border-[#ffb700]/10 px-4 md:px-5 py-2.5 rounded-lg text-center min-w-[90px] md:min-w-[100px] hover:shadow-sm transition-shadow">
                                        <p className="text-xl md:text-2xl font-black text-[#ffb700]">{user._count?.entries || 0}</p>
                                        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-500">Watches</p>
                                    </div>
                                    <div 
                                        className="bg-slate-50 border border-slate-100 px-4 md:px-5 py-2.5 rounded-lg text-center min-w-[90px] md:min-w-[100px] cursor-pointer hover:bg-slate-100 hover:shadow-sm transition-all"
                                        onClick={() => stats && setModalConfig({ isOpen: true, type: 'followers' })}
                                    >
                                        <p className="text-xl md:text-2xl font-black text-slate-700">{stats?.followersCount || 0}</p>
                                        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-500">Followers</p>
                                    </div>
                                    <div 
                                        className="bg-slate-50 border border-slate-100 px-4 md:px-5 py-2.5 rounded-lg text-center min-w-[90px] md:min-w-[100px] cursor-pointer hover:bg-slate-100 hover:shadow-sm transition-all"
                                        onClick={() => stats && setModalConfig({ isOpen: true, type: 'following' })}
                                    >
                                        <p className="text-xl md:text-2xl font-black text-slate-700">{stats?.followingCount || 0}</p>
                                        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-500">Following</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Buttons Container */}
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto h-full justify-center md:pt-4">
                                <button onClick={() => setIsEditingBio(true)} className="flex-1 md:w-40 bg-[#ffb700] hover:bg-[#ffaa00] text-white font-bold py-3 rounded-xl transition-all text-[13px] shadow-md shadow-[#ffb700]/20 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Edit Profile
                                </button>
                                <button onClick={handleInvite} className="flex-1 md:w-40 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-[13px] flex items-center justify-center gap-2 shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                    Invite Friends
                                </button>
                            </div>

                        </div>
                    </div>

                </main>
            </div>

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
