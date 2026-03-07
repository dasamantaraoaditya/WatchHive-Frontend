import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { GoogleSignInButton } from '../components/auth';
import whLogo from '../assets/images/watchhive-logo.png';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
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

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
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
            await login(formData);
            navigate('/watch-hive/feed');
        } catch (error: any) {
            setErrors({
                general: error.response?.data?.error || 'Login failed. Please check your credentials.',
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
                general: error.response?.data?.error || 'Google sign-in failed. Please try again.',
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
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">
                        Sign in to continue tracking your favorite movies and shows
                    </p>
                </div>

                {/* Login Card */}
                <div className="auth-card">
                    {errors.general && (
                        <div className="auth-message auth-message-error">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{errors.general}</span>
                        </div>
                    )}

                    {/* Google Sign-In */}
                    <div className="auth-social-buttons">
                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signin_with"
                            disabled={isLoading || isGoogleLoading}
                        />
                    </div>

                    <div className="auth-divider">or</div>

                    <form onSubmit={handleSubmit} className="auth-form">
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
                            <label htmlFor="password" className="auth-form-label required">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`auth-form-input ${errors.password ? 'error' : ''}`}
                                autoComplete="current-password"
                                required
                            />
                            {errors.password && (
                                <span className="input-helper input-error">{errors.password}</span>
                            )}
                        </div>

                        <div className="auth-links">
                            <label className="checkbox-wrapper">
                                <input type="checkbox" className="checkbox" />
                                <span className="checkbox-label">Remember me</span>
                            </label>
                            <Link to="/watch-hive/forgot-password" className="auth-link">
                                Forgot password?
                            </Link>
                        </div>

                        <div className="auth-actions">
                            <button
                                type="submit"
                                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || isGoogleLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Don't have an account?{' '}
                        <Link to="/watch-hive/signup" className="auth-footer-link">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
