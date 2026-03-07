import React from 'react';
import { Button } from './Button';
import './ErrorState.css';

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No results found",
    message = "We couldn't find what you were looking for.",
    icon = "🔍",
    actionLabel,
    onAction,
    className = ""
}) => {
    return (
        <div className={`empty-state ${className}`}>
            <div className="empty-icon">{icon}</div>
            <h3 className="empty-title">{title}</h3>
            <p className="empty-message">{message}</p>
            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
