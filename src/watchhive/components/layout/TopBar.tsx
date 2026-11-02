import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../../contexts';
import { HeaderActions } from '../common/HeaderActions';
import whLogo from '../../assets/images/watchhive-logo.png';
import './TopBar.css';

export const TopBar: React.FC = () => {
    const { pageTitle, pageIcon } = useUI();
    const location = useLocation();
    const isFeed = location.pathname === '/watch-hive/feed' || location.pathname === '/feed';

    return (
        <header className="wh-topbar glass-header">
            <div className="wh-topbar__content">
                {/* Mobile Brand / Title */}
                <div className="wh-topbar__mobile-left md:hidden flex items-center gap-2.5 min-w-0">
                    <Link to="/watch-hive/feed" className="flex items-center gap-2 shrink-0 group no-underline">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ffb700] to-[#ffd000] p-0.5 shadow-sm shadow-[#ffb700]/30 group-active:scale-95 transition-transform flex items-center justify-center">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain rounded-lg" />
                        </div>
                        {isFeed ? (
                            <span className="font-black text-lg tracking-tight text-[#2D2926]">
                                Watchers<span className="text-[#ffb700]">Hive</span>
                            </span>
                        ) : (
                            <span className="font-extrabold text-sm tracking-tight text-[#2D2926] truncate max-w-[150px]">
                                {pageTitle}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Desktop Left: Page Icon + Title */}
                <div className="wh-topbar__left hidden md:flex items-center gap-3 min-w-0">
                    {pageIcon && (
                        <span className="material-symbols-outlined wh-topbar__icon">
                            {pageIcon}
                        </span>
                    )}
                    <h2 className="wh-topbar__title">{pageTitle}</h2>
                </div>

                {/* Header Actions */}
                <div className="wh-topbar__right">
                    <HeaderActions />
                </div>
            </div>
        </header>
    );
};

export default TopBar;
