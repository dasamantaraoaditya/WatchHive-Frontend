import React, { useState } from 'react';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { Button } from './Button';
import './WatchlistButton.css';

interface WatchlistButtonProps {
    tmdbId: number;
    mediaType?: 'movie' | 'tv';
    suggestedByUserId?: string | null;
    className?: string;
    variant?: 'icon' | 'button';
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
    tmdbId,
    mediaType = 'movie',
    suggestedByUserId,
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
                await addToList(tmdbId, mediaType, suggestedByUserId);
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
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        bookmark_added
                    </span>
                ) : (
                    <span className="material-symbols-outlined text-[18px]">
                        bookmark_add
                    </span>
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
                <span className="flex items-center justify-center whitespace-nowrap gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    In Watchlist
                </span>
            ) : (
                <span className="flex items-center justify-center whitespace-nowrap gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                    Watchlist
                </span>
            )}
        </Button>
    );
};
