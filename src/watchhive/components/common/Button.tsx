import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';
import { BeeLoader } from './BeeLoader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    disabled,
    className = '',
    ...props
}) => {
    const classes = [
        'wh-button',
        `wh-button--${variant}`,
        `wh-button--${size}`,
        fullWidth && 'wh-button--full',
        isLoading && 'wh-button--loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button className={classes} disabled={disabled || isLoading} {...props}>
            {isLoading && (
                <span className="wh-button__spinner mr-1">
                    <BeeLoader size="mini" />
                </span>
            )}
            <span className={isLoading ? 'wh-button__text--loading' : ''}>{children}</span>
        </button>
    );
};

export default Button;
