import React from 'react';
import { createPortal } from 'react-dom';
import whLogo from '../../assets/images/watchhive-logo.png';
import './BeeLoader.css';

interface BeeLoaderProps {
    message?: string;
    size?: 'mini' | 'small' | 'medium' | 'large';
    className?: string;
    showHoneycomb?: boolean;
    useEmoji?: boolean;
}

export const BeeLoader: React.FC<BeeLoaderProps> = ({ 
    message = '', 
    size = 'medium', 
    className = '',
    showHoneycomb = true,
    useEmoji = false,
}) => {
    if (size === 'mini') {
        return (
            <span className={`bee-loader-mini inline-flex items-center gap-1.5 ${className}`}>
                <span className="bee-animation-wrapper-mini">
                    {useEmoji ? (
                        <span className="bee-emoji select-none text-base leading-none">🐝</span>
                    ) : (
                        <img 
                            src={whLogo} 
                            alt="WatchersHive" 
                            className="w-4 h-4 object-contain inline-block select-none"
                            onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                        />
                    )}
                </span>
                {message && <span className="text-xs font-bold">{message}</span>}
            </span>
        );
    }

    return (
        <div className={`bee-loader-container bee-loader-${size} ${className}`}>
            <div className="bee-animation-wrapper">
                {/* Optional Honeycomb background */}
                {showHoneycomb && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                        <span 
                            className="material-symbols-outlined text-[#ffb700] animate-pulse" 
                            style={{ 
                                fontVariationSettings: "'FILL' 1", 
                                fontSize: size === 'small' ? '3rem' : size === 'large' ? '8.5rem' : '5.5rem' 
                            }}
                        >
                            hexagon
                        </span>
                    </div>
                )}
                
                {useEmoji ? (
                    <span className="bee-emoji select-none">🐝</span>
                ) : (
                    <div className="bee-logo-container">
                        <img 
                            src={whLogo} 
                            alt="WatchersHive" 
                            className="bee-logo-img" 
                            onError={(e) => {
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = '<span class="text-3xl select-none">🐝</span>';
                                }
                            }}
                        />
                    </div>
                )}
            </div>
            {message && <p className="bee-message">{message}</p>}
        </div>
    );
};

export const BeeSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string; className?: string }> = ({
    size = 'sm',
    message,
    className = ''
}) => {
    const iconDim = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    return (
        <span className={`inline-flex items-center justify-center gap-1.5 ${className}`}>
            <span className={`bee-animation-wrapper-mini`}>
                <img src={whLogo} alt="WatchersHive" className={`${iconDim} object-contain`} />
            </span>
            {message && <span className="font-bold text-xs">{message}</span>}
        </span>
    );
};

export const ModalBeeOverlay: React.FC<{ message?: string }> = ({ message = 'Saving to your Hive...' }) => {
    return (
        <div className="absolute inset-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs flex items-center justify-center z-50 animate-[fade-in_0.2s_ease-out] rounded-3xl p-6">
            <BeeLoader size="medium" message={message} />
        </div>
    );
};

/**
 * Full-screen branded loading screen with animated WatchersHive logo.
 * Used during initial session checking or initial app bootstrap.
 */
export const AppLoadingScreen: React.FC<{
    message?: string;
    submessage?: string;
}> = ({
    message = 'Loading your hive...',
    submessage = 'Connecting to WatchersHive',
}) => {
    return (
        <div className="wh-app-loading-screen" role="status" aria-live="polite">
            <div className="flex flex-col items-center max-w-sm text-center">
                {/* Glowing Logo Card */}
                <div className="relative mb-6">
                    {/* Honeycomb background aura */}
                    <div className="absolute -inset-4 bg-[#ffb700]/20 rounded-full blur-xl pointer-events-none animate-pulse" />
                    
                    <div className="bee-logo-container w-20 h-20 sm:w-24 sm:h-24 p-3.5 sm:p-4 rounded-3xl bg-white shadow-xl shadow-[#ffb700]/25 border-2 border-[#ffb700]/30 animate-[whLogoFloat_2s_ease-in-out_infinite]">
                        <img 
                            src={whLogo} 
                            alt="WatchersHive" 
                            className="w-full h-full object-contain pointer-events-none select-none" 
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="text-2xl font-black text-[#2D2926] tracking-tight mb-2">
                    Watchers<span className="text-[#ffb700]">Hive</span>
                </h1>

                {/* Primary Message */}
                <p className="text-sm font-bold text-[#ffb700] uppercase tracking-wider mb-1 animate-pulse">
                    {message}
                </p>

                {/* Submessage */}
                {submessage && (
                    <p className="text-xs font-semibold text-[#2D2926]/40">
                        {submessage}
                    </p>
                )}
            </div>
        </div>
    );
};

/**
 * Full-screen signing-in overlay that displays immediately when user triggers sign-in
 * (credentials or OAuth), showing the pulsing WatchersHive logo.
 */
export const SigningInOverlay: React.FC<{
    message?: string;
    submessage?: string;
}> = ({
    message = 'Signing you into WatchersHive...',
    submessage = 'Authenticating and loading your feed',
}) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div 
            role="dialog"
            aria-modal="true"
            data-modal-open="true"
            className="wh-signing-in-overlay"
        >
            <div className="flex flex-col items-center max-w-sm text-center">
                {/* Glowing Logo */}
                <div className="relative mb-6">
                    <div className="absolute -inset-5 bg-[#ffb700]/25 rounded-full blur-2xl pointer-events-none animate-pulse" />
                    
                    <div className="w-20 h-20 sm:w-24 sm:h-24 p-3.5 sm:p-4 rounded-3xl bg-white shadow-2xl shadow-[#ffb700]/35 border-2 border-[#ffb700]/40 flex items-center justify-center animate-[whLogoFloat_1.8s_ease-in-out_infinite]">
                        <img 
                            src={whLogo} 
                            alt="WatchersHive" 
                            className="w-full h-full object-contain pointer-events-none select-none" 
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <h2 className="text-2xl font-black text-[#2D2926] tracking-tight mb-2">
                    Watchers<span className="text-[#ffb700]">Hive</span>
                </h2>

                {/* Status Message */}
                <p className="text-sm font-extrabold text-[#2D2926] tracking-wide mb-1">
                    {message}
                </p>

                {submessage && (
                    <p className="text-xs font-medium text-[#2D2926]/50">
                        {submessage}
                    </p>
                )}
            </div>
        </div>,
        document.body
    );
};

