import React from 'react';
import './BeeLoader.css';

interface BeeLoaderProps {
    message?: string;
    size?: 'mini' | 'small' | 'medium' | 'large';
    className?: string;
    showHoneycomb?: boolean;
}

export const BeeLoader: React.FC<BeeLoaderProps> = ({ 
    message = '', 
    size = 'medium', 
    className = '',
    showHoneycomb = true 
}) => {
    if (size === 'mini') {
        return (
            <span className={`bee-loader-mini inline-flex items-center gap-1.5 ${className}`}>
                <span className="bee-animation-wrapper-mini">
                    <span className="bee-emoji select-none text-base leading-none">🐝</span>
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
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <span 
                            className="material-symbols-outlined text-[#ffb700] animate-pulse" 
                            style={{ 
                                fontVariationSettings: "'FILL' 1", 
                                fontSize: size === 'small' ? '2.5rem' : size === 'large' ? '8rem' : '5rem' 
                            }}
                        >
                            hexagon
                        </span>
                    </div>
                )}
                <span className="bee-emoji select-none">🐝</span>
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
    return (
        <span className={`inline-flex items-center justify-center gap-1.5 ${className}`}>
            <span className={`bee-animation-wrapper-mini ${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-sm'}`}>
                <span className="bee-emoji select-none">🐝</span>
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

