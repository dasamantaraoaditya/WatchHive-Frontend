import React, { useState } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { Button } from './Button';
import './WatchlistButton.css';

interface WatchlistButtonProps {
    tmdbId: number;
    mediaType?: 'movie' | 'tv';
    className?: string;
    variant?: 'icon' | 'button';
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
    tmdbId,
    mediaType = 'movie',
    className = '',
    variant = 'button'
}) => {
    const { addToList, removeFromList, isInWatchlist, isLoading } = useWatchlist();
    const inList = isInWatchlist(tmdbId);
    const [localLoading, setLocalLoading] = useState(false);

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (localLoading) return;
        setLocalLoading(true);

        try {
            if (inList) {
                await removeFromList(tmdbId);
            } else {
                await addToList(tmdbId, mediaType);
            }
        } finally {
            setLocalLoading(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                className={`watchlist-btn-icon ${inList ? 'active' : ''} ${className}`}
                onClick={toggle}
                disabled={localLoading || isLoading}
                title={inList ? "Remove from Watchlist" : "Add to Watchlist"}
                aria-label={inList ? "Remove from Watchlist" : "Add to Watchlist"}
            >
                {inList ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
                        <path d="M7 18l5-2.18L17 18V5H7v13z" fillRule="evenodd" opacity="0.3" />
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
                        <path d="M12 8v6M9 11h6" />
                    </svg>
                )}
            </button>
        );
    }

    return (
        <Button
            variant={inList ? "secondary" : "primary"}
            size="sm"
            onClick={toggle}
            disabled={localLoading || isLoading}
            className={`watchlist-btn ${className}`}
        >
            {localLoading ? (
                <span className="wh-spinner-sm" />
            ) : inList ? (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    In Watchlist
                </>
            ) : (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                        <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                    Watchlist
                </>
            )}
        </Button>
    );
};
