import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useUI } from '../contexts';
import { userService, dataService } from '../services';
import { FollowListModal, SetPasswordSection } from '../components/profile';
import { User, UpdateUserData } from '../types';
import { ProfileSkeleton, Skeleton } from '../components/common/Skeleton';
import { PageLayout } from '../components/layout';
import { ExportFormat, ImportResult } from '../services/data.service';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('My Profile');
        setPageIcon('person');
    }, [setPageTitle, setPageIcon]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ followersCount: number; followingCount: number } | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    const [privacyUpdating, setPrivacyUpdating] = useState(false);
    
    // Data export / import state
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
    const [includeEntries, setIncludeEntries] = useState(true);
    const [includeLists, setIncludeLists] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

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

    if (!user) return <ProfileSkeleton />;

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

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };
    const showError   = (msg: string) => { setError(msg);      setTimeout(() => setError(null),      5000); };

    const handleExport = async () => {
        if (!includeEntries && !includeLists) { showError('Select at least one data type to export.'); return; }
        setDataLoading(true);
        try {
            await dataService.exportData({ includeEntries, includeLists, format: exportFormat });
            const what = [includeEntries && 'Entries', includeLists && 'Lists'].filter(Boolean).join(' & ');
            showSuccess(`${what} exported as ${exportFormat.toUpperCase()}!`);
        } catch (err: any) {
            showError(err?.response?.data?.error || err.message || 'Export failed');
        } finally {
            setDataLoading(false);
        }
    };

    const handleImportFile = async (file: File | undefined) => {
        if (!file) return;
        setDataLoading(true);
        setImportResult(null);
        try {
            const result = await dataService.importData(file);
            setImportResult(result);
            showSuccess('Import complete!');
        } catch (err: any) {
            showError(err?.response?.data?.error || err.message || 'Import failed');
        } finally {
            setDataLoading(false);
            if (importFileRef.current) importFileRef.current.value = '';
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

    const handleTogglePrivacy = async (field: keyof UpdateUserData, value: any) => {
        setPrivacyUpdating(true);
        setError(null);
        try {
            const updatedUser = await userService.updateUserData({ [field]: value });
            updateUser(updatedUser);
            setSuccessMsg(`${field === 'privacyLevel' ? 'Visibility' : 'Setting'} updated successfully!`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update privacy settings');
        } finally {
            setPrivacyUpdating(false);
        }
    };

    const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer group">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb700]"></div>
        </label>
    );

    return (
        <PageLayout maxWidth="5xl" className="font-sans text-slate-900">
            {/* Alerts (Toast-like) */}
            {(error || successMsg) && (
                <div className={`p-3 rounded-xl text-[11px] font-black text-center border animate-[slide-down_0.3s_ease-out] ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    {error || successMsg}
                </div>
            )}

            {/* Profile Hero Block */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                
                {/* Status Badge */}
                <div className="absolute hidden md:flex top-0 right-0 p-4">
                    <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/20">
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Soul Persona: The Collector</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 mt-2 md:mt-0">
                    
                    {/* Avatar */}
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

                    {/* User Info */}
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
                                className="bg-slate-50 border border-slate-100 px-4 md:px-5 py-2.5 rounded-lg text-center min-w-[90px] md:min-w-[100px] cursor-pointer hover:bg-slate-100 hover:shadow-sm transition-all flex flex-col items-center gap-1"
                                onClick={() => stats && setModalConfig({ isOpen: true, type: 'followers' })}
                            >
                                {stats ? (
                                    <p className="text-xl md:text-2xl font-black text-slate-700">{stats.followersCount}</p>
                                ) : (
                                    <Skeleton variant="text" width={40} height={24} />
                                )}
                                <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-500">Followers</p>
                            </div>
                            <div 
                                className="bg-slate-50 border border-slate-100 px-4 md:px-5 py-2.5 rounded-lg text-center min-w-[90px] md:min-w-[100px] cursor-pointer hover:bg-slate-100 hover:shadow-sm transition-all flex flex-col items-center gap-1"
                                onClick={() => stats && setModalConfig({ isOpen: true, type: 'following' })}
                            >
                                {stats ? (
                                    <p className="text-xl md:text-2xl font-black text-slate-700">{stats.followingCount}</p>
                                ) : (
                                    <Skeleton variant="text" width={40} height={24} />
                                )}
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

            {/* Privacy Settings Block */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700]">
                        <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Privacy & Visibility</h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Control how others see your hive</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visibility Tier */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 md:p-8 md:col-span-2">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb700]">visibility</span>
                            Profile Visibility
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                            {privacyUpdating && (
                                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center animate-fade-in">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-[#ffb700] border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb700]">Applying changes...</p>
                                    </div>
                                </div>
                            )}
                            {[
                                { 
                                    id: 'PUBLIC', 
                                    label: 'Public', 
                                    icon: 'public', 
                                    desc: 'Everyone can see your profile and activity.',
                                    color: 'bg-emerald-50 text-emerald-600'
                                },
                                { 
                                    id: 'FOLLOWERS_ONLY', 
                                    label: 'Followers Only', 
                                    icon: 'group', 
                                    desc: 'Only approved followers can see your watch history.',
                                    color: 'bg-[#ffb700]/10 text-[#ffb700]'
                                },
                                { 
                                    id: 'PRIVATE', 
                                    label: 'Strictly Private', 
                                    icon: 'lock', 
                                    desc: 'Only you can see your profile details and entries.',
                                    color: 'bg-slate-100 text-slate-600'
                                }
                            ].map((tier) => {
                                const currentPrivacyLevel = user.privacyLevel || (user.isPrivate ? 'FOLLOWERS_ONLY' : 'PUBLIC');
                                const isActive = currentPrivacyLevel === tier.id;

                                return (
                                    <button
                                        key={tier.id}
                                        onClick={() => handleTogglePrivacy('privacyLevel', tier.id)}
                                        className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all group ${
                                            isActive 
                                            ? 'border-[#ffb700] bg-[#ffb700]/5' 
                                            : 'border-slate-100 hover:border-[#ffb700]/30 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${tier.color}`}>
                                            <span className="material-symbols-outlined text-2xl">{tier.icon}</span>
                                        </div>
                                        <div className="font-bold text-slate-900 mb-1">{tier.label}</div>
                                        <div className="text-[11px] leading-relaxed text-slate-400 font-medium">
                                            {tier.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {user.privacyLevel === 'PUBLIC' && (
                            <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">info</span>
                                <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                    Your entries, watchlist, and ratings will be visible to all members of the hive. This helps in discovering new content!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Visibility Details - Conditional */}
                    {(user.privacyLevel || (user.isPrivate ? 'FOLLOWERS_ONLY' : 'PUBLIC')) !== 'PRIVATE' && (
                        <>
                            {[
                                { id: 'showWatchEntries', label: 'Show Watch Entries', icon: 'history', desc: 'Display your movie/show history' },
                                { id: 'showCurrentlyWatching', label: 'Currently Watching', icon: 'visibility', desc: 'Show what you are eyeing right now' },
                                { id: 'showWatchlist', label: 'Show Watchlist', icon: 'list_alt', desc: 'Let others see your future picks' },
                                { id: 'showRankings', label: 'Show Rankings & Stacks', icon: 'format_list_numbered', desc: 'Allow others to view your ranked stacks' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 group transition-all hover:bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#ffb700] group-hover:bg-[#ffb700]/5 transition-all">
                                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                                        </div>
                                    </div>
                                    <Toggle
                                        checked={user[item.id as keyof User] as boolean}
                                        onChange={(val) => handleTogglePrivacy(item.id as keyof UpdateUserData, val)}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Account Security Block — only shown for Google-only accounts */}
            <SetPasswordSection />

            {/* Data Management Block */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                {/* Hidden file input */}
                <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={e => handleImportFile(e.target.files?.[0])} />

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700]">
                        <span className="material-symbols-outlined">sync_alt</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Data Management</h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Export or import your hive data</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Checkboxes — side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { id: 'cb-entries', label: 'Watch Entries', icon: 'history',  desc: 'Ratings & reviews', checked: includeEntries, onChange: setIncludeEntries },
                            { id: 'cb-lists',   label: 'Watch Lists',   icon: 'list_alt', desc: 'Saved collections',  checked: includeLists,  onChange: setIncludeLists  },
                        ].map(item => (
                            <label
                                key={item.id}
                                htmlFor={item.id}
                                className={`relative flex items-center gap-4 p-4 rounded-[28px] border-2 cursor-pointer transition-all duration-300 select-none overflow-hidden group active:scale-[0.98] ${
                                    item.checked
                                        ? 'border-[#ffb700] bg-[#ffb700]/5 shadow-sm'
                                        : 'border-slate-100 bg-white hover:border-[#ffb700]/30 hover:shadow-sm'
                                }`}
                            >
                                <input id={item.id} type="checkbox" checked={item.checked} onChange={e => item.onChange(e.target.checked)} className="sr-only" />
                                
                                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                                    item.checked 
                                        ? 'bg-[#ffb700] text-white' 
                                        : 'bg-slate-50 text-slate-400'
                                }`}>
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </div>

                                <div className="min-w-0 pr-2">
                                    <p className={`text-sm font-black tracking-tight leading-tight ${item.checked ? 'text-slate-800' : 'text-slate-600'}`}>{item.label}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                                </div>
                                {item.checked && (
                                    <div className="ml-auto w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-emerald-500 text-sm font-black">check</span>
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>

                    {/* Format toggle and Actions */}
                    <div className="bg-slate-50 rounded-[32px] p-6 space-y-6 border border-black/5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-black text-slate-700">Export format</p>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                                    {exportFormat === 'json' ? 'JSON' : 'CSV'}
                                </p>
                            </div>
                            <button
                                onClick={() => setExportFormat(f => f === 'json' ? 'csv' : 'json')}
                                className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 sm:p-1.5 transition-all shadow-sm shrink-0"
                            >
                                {(['json', 'csv'] as ExportFormat[]).map(fmt => (
                                    <span
                                        key={fmt}
                                        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                                            exportFormat === fmt ? 'bg-[#ffb700] text-white shadow-md' : 'text-slate-400'
                                        }`}
                                    >
                                        {fmt}
                                    </span>
                                ))}
                            </button>
                        </div>

                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                disabled={dataLoading || (!includeEntries && !includeLists)}
                                className="flex items-center justify-center gap-2 py-5 bg-[#ffb700] hover:bg-[#ffaa00] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#ffb700]/20 disabled:opacity-40 w-full"
                            >
                                {dataLoading ? <Skeleton variant="circle" width={16} height={16} /> : <span className="material-symbols-outlined text-lg">download</span>}
                                Export Data
                            </button>
                            <button
                                onClick={() => importFileRef.current?.click()}
                                disabled={dataLoading}
                                className="flex items-center justify-center gap-2 py-5 bg-white border-2 border-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-40 w-full"
                            >
                                {dataLoading ? <Skeleton variant="circle" width={16} height={16} /> : <span className="material-symbols-outlined text-lg">upload</span>}
                                Import Data
                            </button>
                        </div>

                        {importResult && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 animate-[slide-down_0.2s_ease-out]">
                                <p className="text-xs font-black text-emerald-700 flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    {importResult.message}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest">
                                    {importResult.entriesImported !== undefined && <span className="text-emerald-600">{importResult.entriesImported} entries added</span>}
                                    {(importResult.entriesSkipped ?? 0) > 0 && <span className="text-slate-400">{importResult.entriesSkipped} skipped</span>}
                                    {importResult.listsImported !== undefined && <span className="text-emerald-600">{importResult.listsImported} lists · {importResult.itemsImported} items added</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
        </PageLayout>
    );
};

export default ProfilePage;
