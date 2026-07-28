import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface MovieDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tmdbId: number | null;
    mediaType: 'movie' | 'tv' | null;
    initialView?: 'details' | 'log' | 'suggest';
    onLogSuccess?: () => void;
    existingEntry?: any;
    onAddToStack?: () => void;
    isInStack?: boolean;
}

/**
 * MovieDetailsModal legacy bridge:
 * Automatically navigates to the dedicated full-screen details route (/watch-hive/details/:mediaType/:tmdbId)
 * to ensure consistent page navigation and browser back-button behavior across the app.
 */
export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
    isOpen,
    onClose,
    tmdbId,
    mediaType,
    initialView = 'details',
}) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && tmdbId) {
            onClose();
            const mType = mediaType || 'movie';
            const actionQuery = initialView && initialView !== 'details' ? `?action=${initialView}` : '';
            navigate(`/watch-hive/details/${mType}/${tmdbId}${actionQuery}`, { replace: true });
        }
    }, [isOpen, tmdbId, mediaType, initialView, navigate, onClose]);

    return null;
};
