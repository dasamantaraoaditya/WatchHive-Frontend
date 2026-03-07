import React, { useEffect, useRef, useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Extend window for Google Identity Services
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                    revoke: (email: string, callback: () => void) => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    onSuccess: (idToken: string) => void;
    onError: (error: string) => void;
    text?: 'signin_with' | 'signup_with' | 'continue_with';
    disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onSuccess,
    onError,
    text = 'continue_with',
    disabled = false,
}) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const callbackRef = useRef(onSuccess);
    const errorRef = useRef(onError);

    // Keep refs current to avoid stale closures in Google's callback
    callbackRef.current = onSuccess;
    errorRef.current = onError;

    // Stable callback for Google's credential response
    const handleCredentialResponse = useCallback((response: any) => {
        if (response.credential) {
            callbackRef.current(response.credential);
        } else {
            errorRef.current('Google Sign-In failed');
        }
    }, []);

    // Load the Google Identity Services script
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
            return;
        }

        // Check if already loaded
        if (window.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        const existingScript = document.getElementById('google-identity-script');
        if (existingScript) {
            // Script tag exists but hasn't loaded yet, listen for it
            existingScript.addEventListener('load', () => setScriptLoaded(true));
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-identity-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => errorRef.current('Failed to load Google Sign-In');
        document.head.appendChild(script);
    }, []);

    // Initialize and render the Google button once script is loaded and DOM is ready
    useEffect(() => {
        if (!scriptLoaded || !window.google?.accounts?.id || !buttonRef.current) {
            return;
        }
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
            return;
        }

        try {
            // Initialize Google Sign-In
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            // Clear any previous content and render a fresh button
            const container = buttonRef.current;
            container.innerHTML = '';

            window.google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text,
                shape: 'rectangular',
                width: Math.max(container.offsetWidth, 300),
                logo_alignment: 'left',
            });
        } catch (err) {
            console.error('Google Sign-In render error:', err);
            errorRef.current('Failed to initialize Google Sign-In');
        }
    }, [scriptLoaded, text, handleCredentialResponse]);

    // If Google Client ID is not configured, show a fallback button
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
        return (
            <button
                type="button"
                className="auth-social-btn"
                disabled
                style={{ opacity: 0.5 }}
                title="Google OAuth not configured — set VITE_GOOGLE_CLIENT_ID"
            >
                <svg className="auth-social-btn-icon" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Continue with Google (Not configured)
            </button>
        );
    }

    return (
        <div
            ref={buttonRef}
            className={`google-signin-container ${disabled ? 'disabled' : ''}`}
            style={{
                width: '100%',
                minHeight: '44px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
            }}
        >
            {/* Loading placeholder — will be replaced by Google's rendered button */}
            <button type="button" className="auth-social-btn" disabled>
                <svg className="auth-social-btn-icon" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Loading Google Sign-In...
            </button>
        </div>
    );
};

export default GoogleSignInButton;
