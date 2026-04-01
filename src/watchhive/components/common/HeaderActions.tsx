import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Avatar } from './Avatar';

export const HeaderActions: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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
            <Link to="/watch-hive/notifications" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 text-[#2D2926] hover:bg-white/40 transition-colors" title="Notifications">
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">notifications</span>
            </Link>
            
            <div className="relative" ref={profileRef}>
                <button
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-[#ffb700] transition-colors focus:outline-none focus:ring-4 focus:ring-[#ffb700]/10 flex items-center justify-center bg-white/20"
                    onClick={() => setProfileOpen(p => !p)}
                    title="My Account"
                    aria-label="Open profile menu"
                >
                    <Avatar src={user?.profilePictureUrl} name={user?.displayName || user?.username || 'User'} size="sm" />
                </button>
                {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden z-50">
                        <div className="p-4 bg-[#ffb700]/5 flex flex-col items-center border-b border-[#2D2926]/5">
                            <strong className="text-sm font-black text-[#2D2926] truncate w-full text-center">{user?.displayName || user?.username}</strong>
                            <span className="text-[10px] uppercase font-bold text-[#2D2926]/40 tracking-widest truncate w-full text-center">@{user?.username}</span>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            <Link to={`/watch-hive/users/${user?.id}`} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-[#2D2926] hover:bg-[#ffb700]/10 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[18px] text-[#ffb700]">person</span>
                                View My Profile
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
