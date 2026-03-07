import React, { HTMLAttributes } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient';
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    hoverable = false,
    padding = 'md',
    className = '',
    ...props
}) => {
    const classes = [
        'wh-card',
        `wh-card--${variant}`,
        `wh-card--padding-${padding}`,
        hoverable && 'wh-card--hoverable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

export default Card;
