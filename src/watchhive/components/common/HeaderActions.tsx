import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useTour } from '../../contexts';
import { Avatar } from './Avatar';
import { useNotifications } from '../../contexts/NotificationContext';
import { followsService } from '../../services/follows.service';
import { PendingRequestsModal } from '../profile/PendingRequestsModal';
import { showInstallPrompt, isInstallPromptReady } from '../../../serviceWorkerRegistration';

export const HeaderActions: React.FC = () => {
    const { user, logout } = useAuth();
    const { startTour } = useTour();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingModalOpen, setPendingModalOpen] = useState(false);

    // PWA install states
    const [isInstallReady, setIsInstallReady] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstallHint, setShowInstallHint] = useState(false);

    const fetchPendingCount = async () => {
        if (!user) return;
        try {
            const data = await followsService.getPendingRequests();
            setPendingCount(data.length);
        } catch (error) {
            console.error('Failed to fetch pending requests count', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 15000);
            return () => clearInterval(interval);
        } else {
            setPendingCount(0);
        }
    }, [user]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handleBeforeInstall = () => setIsInstallReady(true);
        const handleAppInstalled = () => { setIsInstalled(true); setIsInstallReady(false); };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if already running standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
        }

        // Initialize state based on current deferredPrompt readiness
        setIsInstallReady(isInstallPromptReady());

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        // Query the actual service worker registration deferredPrompt status
        if (isInstallPromptReady() || isInstallReady) {
            setProfileOpen(false);
            await showInstallPrompt();
        } else {
            // Show manual install hint
            setShowInstallHint(h => !h);
        }
    };

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
        navigate('/watch-hive/login');
    };

    return (
        <div className="flex items-center gap-3">
            <Link to="/watch-hive/notifications" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-black/5 text-[#2D2926] hover:bg-[#ffb700]/10 transition-all" title="Notifications">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#ffb700] border-2 border-white text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-black animate-pulse shadow-sm z-10">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Link>
            
            <div className="relative" ref={profileRef}>
                <button
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#ffb700] transition-colors focus:outline-none focus:ring-4 focus:ring-[#ffb700]/10 flex items-center justify-center bg-black/5"
                    onClick={() => setProfileOpen(p => !p)}
                    title="My Account"
                    aria-label="Open profile menu"
                >
                    <Avatar src={user?.profilePictureUrl} name={user?.displayName || user?.username || 'User'} size="sm" />
                </button>
                {profileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                        <div className="p-5 bg-gradient-to-br from-[#ffb700]/10 to-transparent flex flex-col items-center border-b border-black/5">
                            <Avatar src={user?.profilePictureUrl} name={user?.displayName || user?.username || 'User'} size="md" className="mb-3 shadow-lg shadow-[#ffb700]/10" />
                            <strong className="text-sm font-black text-[#2D2926] truncate w-full text-center">{user?.displayName || user?.username}</strong>
                            <span className="text-[10px] uppercase font-bold text-[#2D2926]/40 tracking-widest truncate w-full text-center mt-1">@{user?.username}</span>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            <Link to="/watch-hive/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-[#2D2926] hover:bg-[#ffb700]/10 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-[#ffb700]">person</span>
                                Profile
                            </Link>
                            <Link to="/watch-hive/search" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-[#2D2926] hover:bg-[#ffb700]/10 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-[#ffb700]">explore</span>
                                Explore
                            </Link>
                            <button
                                onClick={() => {
                                    setProfileOpen(false);
                                    startTour();
                                }}
                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#2D2926] hover:bg-[#ffb700]/10 rounded-xl transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px] text-[#ffb700]">auto_awesome</span>
                                Guided Tour
                            </button>
                            <button 
                                onClick={() => {
                                    setProfileOpen(false);
                                    setPendingModalOpen(true);
                                }}
                                className="flex items-center justify-between w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-[#2D2926] hover:bg-[#ffb700]/10 rounded-xl transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px] text-[#ffb700]">lock_person</span>
                                    Pending Requests
                                </div>
                                {pendingCount > 0 && (
                                    <span className="bg-[#ffb700] text-white px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>

                            <div className="h-px bg-black/5 my-1 mx-2" />

                            {/* PWA Install — always visible inside account dropdown */}
                            {isInstalled ? (
                                <div className="flex items-start gap-3 px-4 py-3 text-xs text-[#16a34a] bg-[#16a34a]/5 rounded-xl cursor-default pointer-events-none" id="header-dropdown-installed">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-black uppercase tracking-widest">App Installed</span>
                                        <span className="text-[10px] text-[#16a34a]/85 font-medium">You're on the native experience 🎉</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className="flex items-start justify-between w-full px-4 py-3 text-xs text-[#b07d00] hover:bg-[#ffb700]/10 rounded-xl transition-all text-left"
                                        onClick={handleInstall}
                                        id="header-dropdown-install"
                                        aria-expanded={showInstallHint}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-[20px] text-[#ffb700]">download</span>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-black uppercase tracking-widest">Install App</span>
                                                <span className="text-[9px] text-[#b07d00]/75 font-bold tracking-tight">⚡ Fast &nbsp;·&nbsp; 📶 Offline &nbsp;·&nbsp; 🔔 Alerts</span>
                                            </div>
                                        </div>
                                        {isInstallReady ? (
                                            <span className="bg-[#ffb700]/20 border border-[#ffb700]/40 text-[#92660a] px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase self-center">Install</span>
                                        ) : (
                                            <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 self-center ${showInstallHint ? 'rotate-180' : ''}`}>
                                                keyboard_arrow_down
                                            </span>
                                        )}
                                    </button>

                                    {showInstallHint && !isInstallReady && (
                                        <div className="mx-2 mb-2 p-3 bg-[#ffb700]/5 border border-[#ffb700]/20 rounded-xl animate-slide-up flex flex-col gap-2.5">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#b07d00] m-0">Why install?</p>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/15 rounded px-1.5 py-0.5">⚡ Opens instantly</span>
                                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/15 rounded px-1.5 py-0.5">📶 Works offline</span>
                                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/15 rounded px-1.5 py-0.5">🔔 Push alerts</span>
                                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/15 rounded px-1.5 py-0.5">🖥️ No browser bars</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#b07d00] m-0">How to install:</p>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#b07d00] w-[70px] shrink-0">Chrome/Edge</span>
                                                        <span className="text-[10px] text-[#6b7280] leading-snug">Click <strong className="text-[#374151] font-bold">⊕</strong> in address bar</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#b07d00] w-[70px] shrink-0">Safari iOS</span>
                                                        <span className="text-[10px] text-[#6b7280] leading-snug">Tap <strong className="text-[#374151] font-bold">Share</strong> → Add to Home Screen</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#b07d00] w-[70px] shrink-0">Android</span>
                                                        <span className="text-[10px] text-[#6b7280] leading-snug">Tap <strong className="text-[#374151] font-bold">⋮</strong> → Add to Home screen</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="h-px bg-black/5 my-1 mx-2" />
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <PendingRequestsModal 
                isOpen={pendingModalOpen} 
                onClose={() => setPendingModalOpen(false)} 
                onRequestsUpdated={fetchPendingCount} 
            />
        </div>
    );
};
