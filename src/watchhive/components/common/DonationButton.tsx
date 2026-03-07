import React from 'react';
import './DonationButton.css';

export const DonationButton: React.FC = () => {
    return (
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
    );
};
