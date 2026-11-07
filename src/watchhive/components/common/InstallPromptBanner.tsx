import React, { useState, useEffect } from 'react';
import { showInstallPrompt, isInstallPromptReady } from '../../../serviceWorkerRegistration';
import whLogo from '../../assets/images/watchhive-logo.png';
import './InstallPromptBanner.css';

const DISMISS_KEY = 'watchhive-pwa-dismissed-at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const InstallPromptBanner: React.FC = () => {
    const [, setIsInstallReady] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Platform detection
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;

    // Check if running in standalone mode (already installed PWA or native webview)
    const isRunningAsApp = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    useEffect(() => {
        // Check cooldown dismissal
        try {
            if (localStorage.getItem('watchhive-install-dismissed') === 'true') {
                setIsDismissed(true);
            }
            const dismissedAtStr = localStorage.getItem(DISMISS_KEY);
            if (dismissedAtStr) {
                const dismissedAt = parseInt(dismissedAtStr, 10);
                if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
                    setIsDismissed(true);
                }
            }
        } catch (_) {}

        // Check if browser already has beforeinstallprompt captured
        setIsInstallReady(isInstallPromptReady());

        const handlePromptReady = () => setIsInstallReady(true);
        const handlePromptConsumed = () => setIsInstallReady(false);
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallReady(false);
        };

        window.addEventListener('watchhive:install-prompt-ready', handlePromptReady);
        window.addEventListener('watchhive:install-prompt-consumed', handlePromptConsumed);
        window.addEventListener('watchhive:app-installed', handleAppInstalled);
        window.addEventListener('beforeinstallprompt', handlePromptReady);

        return () => {
            window.removeEventListener('watchhive:install-prompt-ready', handlePromptReady);
            window.removeEventListener('watchhive:install-prompt-consumed', handlePromptConsumed);
            window.removeEventListener('watchhive:app-installed', handleAppInstalled);
            window.removeEventListener('beforeinstallprompt', handlePromptReady);
        };
    }, []);

    // Never render inside standalone app or if installed or dismissed
    if (isRunningAsApp || isInstalled || isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        try {
            localStorage.setItem('watchhive-install-dismissed', 'true');
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch (_) {}
    };

    const handleOpenNativeApp = () => {
        const fullPath = window.location.pathname + window.location.search + window.location.hash;
        const cleanPath = fullPath.replace(/^\/+/, '');

        if (isAndroid) {
            const intentUrl = `intent://watchershive.com/${cleanPath}#Intent;scheme=https;package=com.watchhive.watchhive_mobile;end`;
            window.location.href = intentUrl;
            setTimeout(() => {
                window.location.href = `watchershive://${cleanPath}`;
            }, 800);
        } else {
            window.location.href = `watchershive://${cleanPath}`;
        }
    };

    const handleInstallClick = async () => {
        // If native beforeinstallprompt is ready (Chrome, Edge, Android)
        if (isInstallPromptReady()) {
            const outcome = await showInstallPrompt();
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            return;
        }

        // On iOS Safari or browsers without beforeinstallprompt, show the instructional alert popup
        setShowInstructions(true);
    };

    return (
        <>
            {/* Top Smart Install Banner — Letterboxd Style */}
            <aside
                className="wh-top-install-banner"
                role="region"
                aria-label="Install WatchersHive App"
            >
                <div className="wh-top-install-content">
                    <button
                        type="button"
                        className="wh-top-install-dismiss"
                        onClick={handleDismiss}
                        aria-label="Dismiss install banner"
                        title="Dismiss"
                    >
                        ✕
                    </button>
                    <img
                        src={whLogo}
                        alt="WatchersHive Logo"
                        className="wh-top-install-logo"
                    />
                    <div className="wh-top-install-text">
                        <span className="wh-top-install-title">WatchersHive</span>
                        <span className="wh-top-install-subtitle">
                            {isMobile ? 'Free • Fast & Offline Ready' : 'Install web app for faster tracking'}
                        </span>
                    </div>
                </div>

                <div className="wh-top-install-actions">
                    <button
                        type="button"
                        className="wh-top-install-btn"
                        onClick={handleInstallClick}
                    >
                        <svg
                            className="w-3.5 h-3.5 mr-0.5 inline-block"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Install
                    </button>
                </div>
            </aside>

            {/* Instruction Alert Popup (iOS Safari & Unsupported Browsers) */}
            {showInstructions && (
                <div
                    className="wh-install-popup-backdrop"
                    onClick={() => setShowInstructions(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wh-install-popup-title"
                >
                    <div
                        className="wh-install-popup-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="wh-install-popup-header">
                            <div className="wh-install-popup-header-info">
                                <img
                                    src={whLogo}
                                    alt="WatchersHive Logo"
                                    className="wh-install-popup-header-logo"
                                />
                                <div>
                                    <h3
                                        id="wh-install-popup-title"
                                        className="wh-install-popup-header-title"
                                    >
                                        Install WatchersHive
                                    </h3>
                                    <p className="wh-install-popup-header-subtitle">
                                        Add to your Home Screen for the full app experience
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="wh-install-popup-close"
                                onClick={() => setShowInstructions(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="wh-install-popup-body">
                            {isIOS ? (
                                <>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">1</div>
                                        <div className="wh-install-step-text">
                                            Tap the <strong>Share</strong> button
                                            <span className="wh-install-step-icon">
                                                <svg
                                                    className="w-4 h-4 inline"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                                    />
                                                </svg>
                                            </span>
                                            in Safari's bottom toolbar.
                                        </div>
                                    </div>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">2</div>
                                        <div className="wh-install-step-text">
                                            Scroll down and select <strong>'Add to Home Screen'</strong> with the
                                            <span className="wh-install-step-icon">⊞</span> plus icon.
                                        </div>
                                    </div>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">3</div>
                                        <div className="wh-install-step-text">
                                            Tap <strong>'Add'</strong> in the top-right corner. WatchersHive will launch in full screen with offline support!
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">1</div>
                                        <div className="wh-install-step-text">
                                            Click the <strong>Install</strong> icon
                                            <span className="wh-install-step-icon">⊕</span>
                                            in your browser address bar.
                                        </div>
                                    </div>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">2</div>
                                        <div className="wh-install-step-text">
                                            Or open your browser menu <strong>(⋮)</strong> and click <strong>'Install WatchersHive...'</strong>
                                        </div>
                                    </div>
                                    <div className="wh-install-step">
                                        <div className="wh-install-step-num">3</div>
                                        <div className="wh-install-step-text">
                                            Launch the app anytime directly from your desktop or app drawer with instant offline access.
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="wh-install-popup-footer">
                            <button
                                type="button"
                                className="wh-install-popup-confirm-btn"
                                onClick={() => setShowInstructions(false)}
                            >
                                Got it
                            </button>
                            {isMobile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInstructions(false);
                                        handleOpenNativeApp();
                                    }}
                                    style={{
                                        marginTop: '10px',
                                        width: '100%',
                                        background: 'transparent',
                                        border: '1px solid rgba(0,0,0,0.12)',
                                        color: '#525252',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Already have the mobile app? Open here
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
