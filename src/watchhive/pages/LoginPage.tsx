import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { GoogleSignInButton } from '../components/auth';
import whLogo from '../assets/images/watchhive-logo.png';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    // When true, the user has a Google-only account and should use Google Sign-In
    const [isGoogleOnlyAccount, setIsGoogleOnlyAccount] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        // Clear the google-only state when user types a different email
        if (name === 'email') setIsGoogleOnlyAccount(false);
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
        setIsGoogleOnlyAccount(false);
        try {
            await login(formData);
            navigate('/watch-hive/feed');
        } catch (error: any) {
            const data = error.response?.data;
            if (data?.code === 'google_only_account') {
                // Structured error: the account exists but has no password (Google-only)
                setIsGoogleOnlyAccount(true);
                setErrors({});
            } else {
                setErrors({
                    general: data?.error || 'Login failed. Please check your credentials.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setIsGoogleLoading(true);
        setErrors({});
        setIsGoogleOnlyAccount(false);
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

    /** Called when Google Sign-In is blocked — scroll to / focus the email input */
    const handleGoogleFallback = () => {
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailInputRef.current?.focus();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9F0] p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-[440px] flex flex-col items-center">
                {/* Logo & Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link to="/watch-hive" className="block mb-6 group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#ffb700]/10 flex items-center justify-center p-3 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-[15px] font-medium text-[#2D2926]/50 max-w-[280px]">
                        Sign in to continue tracking your favorite movies and shows
                    </p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-6 sm:p-8 relative overflow-hidden">
                    {/* Top Accent Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-50"></div>

                    {/* General error banner */}
                    {errors.general && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-[14px] font-bold">
                            <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                            <span>{errors.general}</span>
                        </div>
                    )}

                    {/* Google-only account recovery banner */}
                    {isGoogleOnlyAccount && (
                        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-500 text-[20px] shrink-0 mt-0.5">info</span>
                                <div>
                                    <p className="text-[14px] font-bold text-blue-700">This account uses Google Sign-In</p>
                                    <p className="text-[12px] font-medium text-blue-600/80 mt-0.5">
                                        Sign in with Google below, or use "Forgot password?" to set a password as backup.
                                    </p>
                                </div>
                            </div>
                            <Link
                                to={`/watch-hive/forgot-password?email=${encodeURIComponent(formData.email)}`}
                                className="text-[12px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors ml-8"
                            >
                                Set a password for this account →
                            </Link>
                        </div>
                    )}

                    {/* Google OAuth */}
                    <div className="w-full mb-6">
                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            onFallback={handleGoogleFallback}
                            text="signin_with"
                            disabled={isLoading || isGoogleLoading}
                        />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#2D2926]/30">or</span>
                        <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="email"
                                ref={emailInputRef}
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full bg-[#FFF9F0]/50 border rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                autoComplete="email"
                                required
                            />
                            {errors.email && (
                                <span className="text-[12px] font-bold text-rose-500 ml-1 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">info</span> {errors.email}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full bg-[#FFF9F0]/50 border rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.password ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                autoComplete="current-password"
                                required
                            />
                            {errors.password && (
                                <span className="text-[12px] font-bold text-rose-500 ml-1 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">info</span> {errors.password}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-1 mt-1 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center w-5 h-5">
                                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-[#ffb700]/30 rounded-md checked:bg-[#ffb700] checked:border-[#ffb700] transition-colors cursor-pointer" />
                                    <span className="material-symbols-outlined text-white text-[14px] absolute pointer-events-none opacity-0 peer-checked:opacity-100" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                                </div>
                                <span className="text-[13px] font-bold text-[#2D2926]/60 group-hover:text-[#2D2926] transition-colors">Remember me</span>
                            </label>
                            <Link to="/watch-hive/forgot-password" className="text-[13px] font-bold text-[#ffb700] hover:text-[#ffb700]/80 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className={`w-full h-14 bg-[#ffb700] text-white font-black text-[16px] rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center flex flex-col gap-4">
                    <p className="text-[14px] font-semibold text-[#2D2926]/50">
                        Don't have an account?{' '}
                        <Link to="/watch-hive/signup" className="text-[#ffb700] hover:underline hover:text-[#ffb700]/80 font-bold transition-colors">
                            Sign up
                        </Link>
                    </p>
                    <p className="text-[13px] font-medium text-[#2D2926]/30">
                        <Link to="/watch-hive/privacy" className="hover:text-[#2D2926]/60 transition-colors">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
