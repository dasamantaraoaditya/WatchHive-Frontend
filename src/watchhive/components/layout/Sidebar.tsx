import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Avatar } from '../common';
import whLogo from '../../assets/images/watchhive-logo.png';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return null;

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="wh-sidebar">
            <div className="wh-sidebar__content">
                <div className="wh-sidebar__top">
                    <div className="wh-sidebar__brand">
                        <div className="wh-sidebar__logo">
                            <img src={whLogo} alt="WatchHive Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h1 className="wh-sidebar__title">WatchHive</h1>
                    </div>
                    
                    <nav className="wh-sidebar__nav">
                        <Link to="/watch-hive/feed" className={`wh-sidebar__link ${isActive('/watch-hive/feed') ? 'wh-sidebar__link--active' : ''}`}>
                            <span className="material-symbols-outlined fill-1">home</span>
                            <span className="font-semibold">Home</span>
                        </Link>
                        <Link to="/watch-hive/mindlens" className={`wh-sidebar__link ${isActive('/watch-hive/mindlens') ? 'wh-sidebar__link--active' : ''}`}>
                            <span className="material-symbols-outlined">psychology</span>
                            <span className="font-semibold">MindLens</span>
                        </Link>
                        <Link to="/watch-hive/profile" className={`wh-sidebar__link ${isActive('/watch-hive/profile') ? 'wh-sidebar__link--active' : ''}`}>
                            <span className="material-symbols-outlined">person</span>
                            <span className="font-semibold">Profile</span>
                        </Link>
                        <Link to="/watch-hive/search" className={`wh-sidebar__link ${isActive('/watch-hive/search') ? 'wh-sidebar__link--active' : ''}`}>
                            <span className="material-symbols-outlined">search</span>
                            <span className="font-semibold">Search</span>
                        </Link>
                        <Link to="/watch-hive/entries" className={`wh-sidebar__link ${isActive('/watch-hive/entries') ? 'wh-sidebar__link--active' : ''}`}>
                            <span className="material-symbols-outlined">add_reaction</span>
                            <span className="font-semibold">Entries</span>
                        </Link>
                    </nav>
                </div>
                
                <div className="wh-sidebar__bottom">
                    <div className="wh-sidebar__honey-level">
                        <p className="wh-sidebar__honey-title">Honey level</p>
                        <div className="wh-sidebar__progress-bar">
                            <div className="wh-sidebar__progress-fill" style={{ width: '72%' }}></div>
                        </div>
                        <p className="wh-sidebar__honey-text">720 XP until next swarm</p>
                    </div>
                    
                    <div className="wh-sidebar__user">
                        <Avatar
                            src={user?.profilePictureUrl}
                            name={user?.displayName || user?.username || '?'}
                            size="sm"
                        />
                        <div className="wh-sidebar__user-info">
                            <p className="wh-sidebar__user-name">{user?.displayName || user?.username}</p>
                            <p className="wh-sidebar__user-role">Explorer</p>
                        </div>
                        <button className="wh-sidebar__settings-btn" onClick={logout} title="Sign Out">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
