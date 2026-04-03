import React from 'react';
import { useUI } from '../../contexts';
import { HeaderActions } from '../common/HeaderActions';
import './TopBar.css';

export const TopBar: React.FC = () => {
    const { pageTitle, pageIcon } = useUI();

    return (
        <header className="wh-topbar glass-header">
            <div className="wh-topbar__content">
                <div className="wh-topbar__left">
                    {pageIcon && (
                        <span className="material-symbols-outlined wh-topbar__icon">
                            {pageIcon}
                        </span>
                    )}
                    <h2 className="wh-topbar__title">{pageTitle}</h2>
                </div>
                <div className="wh-topbar__right">
                    <HeaderActions />
                </div>
            </div>
        </header>
    );
};

export default TopBar;
