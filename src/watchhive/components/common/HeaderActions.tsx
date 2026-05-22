import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Avatar } from './Avatar';
import { useNotifications } from '../../contexts/NotificationContext';
import { followsService } from '../../services/follows.service';
import { PendingRequestsModal } from '../profile/PendingRequestsModal';

export const HeaderActions: React.FC = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingModalOpen, setPendingModalOpen] = useState(false);

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
