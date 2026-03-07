import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import './OfflineBanner.css';

export const OfflineBanner: React.FC = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="offline-banner" role="alert">
            <span className="offline-icon">📡</span>
            <span>You are currently offline. Changes may not be saved.</span>
        </div>
    );
};
