import React, { useState, useEffect } from 'react';
import './DonationButton.css';

export const DonationButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        // Only show if the user has not dismissed it before
        const isDismissed = localStorage.getItem('wh_hide_donation');
        if (!isDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        localStorage.setItem('wh_hide_donation', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="donation-wrapper">
            <a
                href="https://buymeacoffee.com/adityadasamantharao"
                target="_blank"
                rel="noopener noreferrer"
                className="donation-button"
                title="Support WatchHive"
                aria-label="Buy me a coffee"
            >
                <span className="donation-icon">☕</span>
                <span className="donation-text">Buy me a coffee</span>
            </a>
            <button
                type="button"
                className="donation-close-btn"
                onClick={handleClose}
                aria-label="Dismiss donation prompt"
                title="Dismiss"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="donation-close-icon"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};
