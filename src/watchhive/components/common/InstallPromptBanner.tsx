import React, { useState, useEffect } from 'react';
import { showInstallPrompt, isInstallPromptReady } from '../../../serviceWorkerRegistration';

export const InstallPromptBanner: React.FC = () => {
    const [isInstallReady, setIsInstallReady] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const checkModal = () => {
            const hasDialog =
                document.querySelector('[role="dialog"]') !== null ||
                document.querySelector('[data-modal-open="true"]') !== null ||
                document.body.getAttribute('data-modal-open') === 'true' ||
                document.body.style.overflow === 'hidden';
            setIsModalOpen(hasDialog);
        };
        checkModal();
        const obs = new MutationObserver(checkModal);
        obs.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'data-modal-open'],
        });
        return () => obs.disconnect();
    }, []);

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

    if (isInstalled || isRunningAsApp || !isInstallReady || isDismissed || isModalOpen) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('watchhive-install-dismissed', 'true');
    };

    return (
        <aside
            className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[1200] bg-[#1a160d]/95 backdrop-blur-xl border border-[#ffb700]/30 rounded-2xl p-4 flex flex-col gap-3 w-[92%] max-w-[390px] shadow-2xl text-white animate-slide-up"
            aria-label="Install WatchersHive"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--brand-color, #f5c518)' }}>
                        Install WatchersHive App
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
        </aside>
    );
};
