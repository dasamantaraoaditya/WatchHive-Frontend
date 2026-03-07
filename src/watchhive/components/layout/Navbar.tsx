import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Avatar } from '../common';
import whLogo from '../../assets/images/watchhive-logo.png';
import NotificationBell from '../notifications/NotificationBell';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
        navigate('/watch-hive/login');
    };

    // Close profile dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="wh-nav" id="main-navigation">
            <div className="wh-nav__inner">
                {/* ── Left: Logo ── */}
                <Link to={isAuthenticated ? "/watch-hive/feed" : "/watch-hive"} className="wh-nav__brand" id="nav-brand">
                    <img src={whLogo} alt="WatchHive" className="wh-nav__logo-img" />
                    <span className="wh-nav__brand-text">WatchHive</span>
                </Link>

                {/* ── Center: Nav links (desktop) ── */}
                {isAuthenticated && (
                    <div className="wh-nav__links" id="nav-links">
                        <Link
                            to="/watch-hive/feed"
                            className={`wh-nav__link ${isActive('/watch-hive/feed') ? 'wh-nav__link--active' : ''}`}
                            id="nav-link-feed"
                        >
                            <svg className="wh-nav__link-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            Feed
                        </Link>
                        <Link
                            to="/watch-hive/mindlens"
                            className={`wh-nav__link ${isActive('/watch-hive/mindlens') ? 'wh-nav__link--active' : ''}`}
                            id="nav-link-mindlens"
                        >
                            <svg className="wh-nav__link-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
                            </svg>
                            MindLens
                        </Link>
                        <Link
                            to="/watch-hive/search"
                            className={`wh-nav__link ${isActive('/watch-hive/search') ? 'wh-nav__link--active' : ''}`}
                            id="nav-link-search"
                        >
                            <svg className="wh-nav__link-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            Search
                        </Link>
                        <Link
                            to="/watch-hive/entries"
                            className={`wh-nav__link ${isActive('/watch-hive/entries') ? 'wh-nav__link--active' : ''}`}
                            id="nav-link-entries"
                        >
                            <svg className="wh-nav__link-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            Entries
                        </Link>
                        <Link
                            to="/watch-hive/profile"
                            className={`wh-nav__link ${isActive('/watch-hive/profile') ? 'wh-nav__link--active' : ''}`}
                            id="nav-link-profile"
                        >
                            <svg className="wh-nav__link-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Profile
                        </Link>
                    </div>
                )}

                {/* ── Right: Profile / Auth ── */}
                <div className="wh-nav__right">
                    {isAuthenticated && <NotificationBell />}
                    {isAuthenticated ? (
                        <div className="wh-nav__profile" ref={profileRef} id="nav-profile">
                            <button
                                className="wh-nav__profile-trigger"
                                onClick={() => setProfileOpen((p) => !p)}
                                aria-expanded={profileOpen}
                                aria-haspopup="true"
                                id="nav-profile-trigger"
                            >
                                <Avatar
                                    src={user?.profilePictureUrl}
                                    name={user?.displayName || user?.username || '?'}
                                    size="sm"
                                />
                                <span className="wh-nav__profile-name">
                                    {user?.displayName || user?.username}
                                </span>
                                <svg
                                    className={`wh-nav__chevron ${profileOpen ? 'wh-nav__chevron--open' : ''}`}
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                >
                                    <path d="M4.427 6.427a.75.75 0 011.06-.073L8 8.467l2.513-2.113a.75.75 0 11.964 1.15l-3 2.52a.75.75 0 01-.964 0l-3-2.52a.75.75 0 01-.086-1.077z" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {profileOpen && (
                                <div className="wh-nav__dropdown" id="nav-dropdown">
                                    <div className="wh-nav__dropdown-header">
                                        <span className="wh-nav__dropdown-name">
                                            {user?.displayName || user?.username}
                                        </span>
                                        <span className="wh-nav__dropdown-email">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <div className="wh-nav__dropdown-divider" />
                                    <Link
                                        to="/watch-hive/profile"
                                        className="wh-nav__dropdown-item"
                                        onClick={() => setProfileOpen(false)}
                                        id="nav-dropdown-profile"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="wh-nav__dropdown-icon">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/watch-hive/entries"
                                        className="wh-nav__dropdown-item"
                                        onClick={() => setProfileOpen(false)}
                                        id="nav-dropdown-entries"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="wh-nav__dropdown-icon">
                                            <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        My Entries
                                    </Link>
                                    <div className="wh-nav__dropdown-divider" />
                                    <button
                                        className="wh-nav__dropdown-item wh-nav__dropdown-item--danger"
                                        onClick={handleLogout}
                                        id="nav-dropdown-logout"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="wh-nav__dropdown-icon">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h5a1 1 0 100-2H4V5h4a1 1 0 100-2H3zm11.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L15.586 11H8a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="wh-nav__auth" id="nav-auth">
                            <Link to="/watch-hive/login" className="wh-nav__auth-link" id="nav-login">
                                Sign In
                            </Link>
                            <Link to="/watch-hive/signup" className="wh-nav__auth-cta" id="nav-signup">
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* ── Mobile hamburger ── */}
                    {isAuthenticated && (
                        <button
                            className={`wh-nav__burger ${mobileOpen ? 'wh-nav__burger--open' : ''}`}
                            onClick={() => setMobileOpen((o) => !o)}
                            aria-label="Toggle navigation menu"
                            id="nav-burger"
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Mobile menu ── */}
            {isAuthenticated && mobileOpen && (
                <div className="wh-nav__mobile" id="nav-mobile-menu">
                    <Link
                        to="/watch-hive/feed"
                        className={`wh-nav__mobile-link ${isActive('/watch-hive/feed') ? 'wh-nav__mobile-link--active' : ''}`}
                    >
                        Feed
                    </Link>
                    <Link
                        to="/watch-hive/mindlens"
                        className={`wh-nav__mobile-link ${isActive('/watch-hive/mindlens') ? 'wh-nav__mobile-link--active' : ''}`}
                    >
                        MindLens
                    </Link>
                    <Link
                        to="/watch-hive/search"
                        className={`wh-nav__mobile-link ${isActive('/watch-hive/search') ? 'wh-nav__mobile-link--active' : ''}`}
                    >
                        Search
                    </Link>
                    <Link
                        to="/watch-hive/entries"
                        className={`wh-nav__mobile-link ${isActive('/watch-hive/entries') ? 'wh-nav__mobile-link--active' : ''}`}
                    >
                        Entries
                    </Link>
                    <Link
                        to="/watch-hive/profile"
                        className={`wh-nav__mobile-link ${isActive('/watch-hive/profile') ? 'wh-nav__mobile-link--active' : ''}`}
                    >
                        Profile
                    </Link>
                    <div className="wh-nav__mobile-divider" />
                    <button className="wh-nav__mobile-link wh-nav__mobile-link--danger" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
