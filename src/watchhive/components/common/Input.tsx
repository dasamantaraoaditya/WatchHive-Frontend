import React, { InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
        const inputClasses = [
            'wh-input',
            leftIcon && 'wh-input--with-left-icon',
            rightIcon && 'wh-input--with-right-icon',
            error && 'wh-input--error',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className="wh-input-wrapper">
                {label && (
                    <label className="wh-input-label" htmlFor={props.id}>
                        {label}
                        {props.required && <span className="wh-input-required">*</span>}
                    </label>
                )}

                <div className="wh-input-container">
                    {leftIcon && <span className="wh-input-icon wh-input-icon--left">{leftIcon}</span>}

                    <input ref={ref} className={inputClasses} {...props} />

                    {rightIcon && <span className="wh-input-icon wh-input-icon--right">{rightIcon}</span>}
                </div>

                {error && <span className="wh-input-error-text">{error}</span>}
                {helperText && !error && <span className="wh-input-helper-text">{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
