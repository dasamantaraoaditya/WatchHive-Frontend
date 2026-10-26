import React, { useState, useEffect } from 'react';
import whLogo from '../../assets/images/watchhive-logo.png';
import './OpenInAppBanner.css';

export const OpenInAppBanner: React.FC = () => {
    const [isDismissed, setIsDismissed] = useState(false);

    // Detect mobile device
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;

    // Check if already running in standalone mode (PWA / installed webview)
    const isRunningAsApp = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    useEffect(() => {
        if (sessionStorage.getItem('watchhive-open-in-app-dismissed') === 'true') {
            setIsDismissed(true);
        }
    }, []);

    const handleOpenApp = () => {
        const fullPath = window.location.pathname + window.location.search + window.location.hash;
        const cleanPath = fullPath.replace(/^\/+/, '');

        if (isAndroid) {
            // Android Chrome Intent syntax directly launches com.watchhive.watchhive_mobile
            const intentUrl = `intent://watchershive.com/${cleanPath}#Intent;scheme=https;package=com.watchhive.watchhive_mobile;end`;
            window.location.href = intentUrl;

            // Secondary fallback to custom scheme
            setTimeout(() => {
                window.location.href = `watchershive://${cleanPath}`;
            }, 800);
        } else if (isIOS) {
            // On iOS Safari, custom scheme launches WatchersHive directly
            window.location.href = `watchershive://${cleanPath}`;
        } else {
            window.location.href = `watchershive://${cleanPath}`;
        }
    };

    // Auto-attempt opening the app if scanned via camera / QR code
    useEffect(() => {
        if (!isMobile || isRunningAsApp) return;

        const params = new URLSearchParams(window.location.search);
        const isFromScan =
            params.get('source') === 'qr' ||
            params.get('src') === 'qr' ||
            params.get('scan') === '1' ||
            params.get('open_app') === '1';

        if (isFromScan && !sessionStorage.getItem('watchhive-open-in-app-auto-opened')) {
            sessionStorage.setItem('watchhive-open-in-app-auto-opened', 'true');
            const timer = setTimeout(() => {
                handleOpenApp();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isMobile, isRunningAsApp]);

    if (!isMobile || isRunningAsApp || isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('watchhive-open-in-app-dismissed', 'true');
    };

    return (
        <aside className="open-in-app-banner" aria-label="Open in WatchersHive App">
            <div className="open-in-app-content">
                <img src={whLogo} alt="WatchersHive Logo" className="open-in-app-logo" />
                <div className="open-in-app-text">
                    <span className="open-in-app-title">WatchersHive App</span>
                    <span className="open-in-app-subtitle">Open in app for the full experience</span>
                </div>
            </div>
            <div className="open-in-app-actions">
                <button
                    type="button"
                    className="open-in-app-btn"
                    onClick={handleOpenApp}
                >
                    Open App
                </button>
                <button
                    type="button"
                    className="open-in-app-dismiss"
                    onClick={handleDismiss}
                    aria-label="Dismiss banner"
                    title="Dismiss"
                >
                    ✕
                </button>
            </div>
        </aside>
    );
};
