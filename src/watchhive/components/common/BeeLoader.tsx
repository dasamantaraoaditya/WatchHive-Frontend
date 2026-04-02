import React from 'react';
import './BeeLoader.css';

interface BeeLoaderProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const BeeLoader: React.FC<BeeLoaderProps> = ({ message = 'Loading...', size = 'medium', className = '' }) => {
    return (
        <div className={`bee-loader-container bee-loader-${size} ${className}`}>
            <div className="bee-animation-wrapper">
                {/* Optional Honeycomb background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <span className="material-symbols-outlined text-[#ffb700] animate-pulse" style={{ fontVariationSettings: "'FILL' 1", fontSize: size === 'small' ? '2.5rem' : size === 'large' ? '8rem' : '5rem' }}>hexagon</span>
                </div>
                <span className="bee-emoji">🐝</span>
            </div>
            {message && <p className="bee-message">{message}</p>}
        </div>
    );
};
