import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';

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
                <span className="wh-button__spinner">
                    <svg className="wh-spinner" viewBox="0 0 24 24">
                        <circle
                            className="wh-spinner__circle"
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            strokeWidth="3"
                        />
                    </svg>
                </span>
            )}
            <span className={isLoading ? 'wh-button__text--loading' : ''}>{children}</span>
        </button>
    );
};

export default Button;
