import React from 'react';
import { Button } from './Button';
import './ErrorState.css';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
    isDismissable?: boolean;
    onDismiss?: () => void;
    illustration?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    message = "Something went wrong. Please try again.",
    onRetry,
    className = "",
    isDismissable,
    onDismiss,
    illustration
}) => {
    return (
        <div className={`error-state ${className}`} role="alert">
            {illustration || (
                <div className="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
            )}
            <h3 className="error-title">Oops!</h3>
            <p className="error-message">{message}</p>
            <div className="error-actions">
                {onRetry && (
                    <Button variant="primary" size="sm" onClick={onRetry}>
                        Retry
                    </Button>
                )}
                {isDismissable && onDismiss && (
                    <Button variant="secondary" size="sm" onClick={onDismiss}>
                        Close
                    </Button>
                )}
            </div>
        </div>
    );
};
