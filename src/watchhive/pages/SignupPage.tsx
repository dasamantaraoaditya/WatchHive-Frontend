import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { GoogleSignInButton } from '../components/auth';
import whLogo from '../assets/images/watchhive-logo.png';
import './AuthPages.css';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, googleLogin } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        displayName: '',
        password: '',
    });

    const [errors, setErrors] = useState<{
        username?: string;
        email?: string;
        displayName?: string;
        password?: string;
        general?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        setErrors({});

        try {
            await register(formData);
            navigate('/watch-hive/feed');
        } catch (error: any) {
            setErrors({
                general: error.response?.data?.error || 'Registration failed. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setIsGoogleLoading(true);
        setErrors({});

        try {
            await googleLogin(idToken);
            navigate('/watch-hive/feed');
        } catch (error: any) {
            setErrors({
                general: error.response?.data?.error || 'Google sign-up failed. Please try again.',
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleError = (error: string) => {
        setErrors({ general: error });
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src={whLogo} alt="WatchHive" className="auth-logo-img" />
                    </div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">
                        Join WatchHive to track and share your movie journey
                    </p>
                </div>

                {/* Signup Card */}
                <div className="auth-card">
                    {errors.general && (
                        <div className="auth-message auth-message-error">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{errors.general}</span>
                        </div>
                    )}

                    {/* Google Sign-Up */}
                    <div className="auth-social-buttons">
                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signup_with"
                            disabled={isLoading || isGoogleLoading}
                        />
                    </div>

                    <div className="auth-divider">or sign up with email</div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label htmlFor="username" className="auth-form-label required">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                className={`auth-form-input ${errors.username ? 'error' : ''}`}
                                autoComplete="username"
                                required
                            />
                            {errors.username && (
                                <span className="input-helper input-error">{errors.username}</span>
                            )}
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="email" className="auth-form-label required">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`auth-form-input ${errors.email ? 'error' : ''}`}
                                autoComplete="email"
                                required
                            />
                            {errors.email && (
                                <span className="input-helper input-error">{errors.email}</span>
                            )}
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="displayName" className="auth-form-label">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                name="displayName"
                                placeholder="John Doe"
                                value={formData.displayName}
                                onChange={handleChange}
                                className={`auth-form-input ${errors.displayName ? 'error' : ''}`}
                                autoComplete="name"
                            />
                            <span className="input-helper">This is how others will see you</span>
                            {errors.displayName && (
                                <span className="input-helper input-error">{errors.displayName}</span>
                            )}
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="password" className="auth-form-label required">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`auth-form-input ${errors.password ? 'error' : ''}`}
                                autoComplete="new-password"
                                required
                            />
                            <span className="input-helper">At least 8 characters with uppercase, lowercase, and number</span>
                            {errors.password && (
                                <span className="input-helper input-error">{errors.password}</span>
                            )}
                        </div>

                        <div className="auth-actions">
                            <button
                                type="submit"
                                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || isGoogleLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/watch-hive/login" className="auth-footer-link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
