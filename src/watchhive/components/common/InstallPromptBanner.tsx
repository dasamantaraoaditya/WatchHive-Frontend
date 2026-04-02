import React, { useState, useEffect } from 'react';
import { showInstallPrompt, isInstallPromptReady } from '../../../serviceWorkerRegistration';

export const InstallPromptBanner: React.FC = () => {
    const [isInstallReady, setIsInstallReady] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if install prompt is ready
        const checkPromptReady = () => {
            setIsInstallReady(isInstallPromptReady());
        };

        // Check initial state
        checkPromptReady();

        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setIsInstallReady(true);
        };

        // Listen for beforeinstallprompt event changes
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsInstallReady(false);
        });

        // Check local storage setting if they dismissed it before
        const dismissed = localStorage.getItem('watchhive-install-dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', () => {});
        };
    }, []);

    // Check if running locally or in developer mode
    const isRunningAsApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isInstalled || isRunningAsApp || !isInstallReady || isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('watchhive-install-dismissed', 'true');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--card-bg, #1a1a1a)',
            border: '1px solid var(--border-color, #333)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            color: 'var(--text-primary, #fff)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--brand-color, #f5c518)' }}>
                        Install WatchHive App
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #ccc)' }}>
                        Install our app for a faster, app-like experience and offline access!
                    </p>
                </div>
                <button 
                    onClick={handleDismiss}
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-secondary, #ccc)', 
                        cursor: 'pointer',
                        padding: '4px' 
                    }}
                    title="Dismiss"
                >
                    ✕
                </button>
            </div>
            <button
                onClick={showInstallPrompt}
                style={{
                    backgroundColor: 'var(--brand-color, #f5c518)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                Install Now
            </button>
        </div>
    );
};
