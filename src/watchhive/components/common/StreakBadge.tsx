import React from 'react';
import './StreakBadge.css';

interface StreakBadgeProps {
    streak?: number;
    compact?: boolean;
    onClick?: () => void;
    className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
    streak = 0,
    compact = false,
    onClick,
    className = ''
}) => {
    if (!streak || streak <= 0) return null;

    const label = compact ? 'd' : (streak === 1 ? 'day streak' : 'days streak');

    return (
        <button
            type="button"
            className={`wh-streak-badge ${className}`}
            onClick={onClick}
            title={`${streak} day watch streak! Log daily watches to keep the flame alive.`}
        >
            <span className="wh-streak-badge__icon" aria-hidden="true">🔥</span>
            <span className="wh-streak-badge__count">{streak}</span>
            <span className="wh-streak-badge__label">{label}</span>
        </button>
    );
};
