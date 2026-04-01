import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return null;

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/watch-hive/feed', icon: 'home', label: 'Home', fill: true },
        { path: '/watch-hive/mindlens', icon: 'psychology', label: 'MindLens' },
        { path: '/watch-hive/entries', icon: 'add_reaction', label: 'Entries' },
        { path: '/watch-hive/rankings', icon: 'format_list_numbered', label: 'Rankings' },
        { path: '/watch-hive/search', icon: 'search', label: 'Search' },
    ];

    return (
        <nav className="wh-bottom-nav">
            <div className="wh-bottom-nav__content">
                {navItems.map((item) => (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`wh-bottom-nav__link ${isActive(item.path) ? 'wh-bottom-nav__link--active' : ''}`}
                    >
                        <span className={`material-symbols-outlined ${item.fill && isActive(item.path) ? 'fill-1' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="wh-bottom-nav__label">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
