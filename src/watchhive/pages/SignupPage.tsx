import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { GoogleSignInButton } from '../components/auth';
import whLogo from '../assets/images/watchhive-logo.png';

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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9F0] p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-[480px] flex flex-col items-center">
                {/* Logo & Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link to="/watch-hive" className="block mb-6 group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#ffb700]/10 flex items-center justify-center p-3 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight mb-2">Create Account</h1>
                    <p className="text-[15px] font-medium text-[#2D2926]/50 max-w-[300px]">
                        Join WatchHive to track and share your movie journey
                    </p>
                </div>

                {/* Signup Card */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-6 sm:p-8 relative overflow-hidden">
                    {/* Top Accent Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-50"></div>

                    {errors.general && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-[14px] font-bold">
                            <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                            <span>{errors.general}</span>
                        </div>
                    )}

                    {/* Google OAuth */}
                    <div className="w-full mb-6">
                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signup_with"
                            disabled={isLoading || isGoogleLoading}
                        />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#2D2926]/30 px-2 whitespace-nowrap">or sign up with email</span>
                        <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="username" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                    Username <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.username ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                    autoComplete="username"
                                    required
                                />
                                {errors.username && (
                                    <span className="text-[12px] font-bold text-rose-500 ml-1 mt-1 flex items-start gap-1 leading-tight">
                                        <span className="material-symbols-outlined text-[14px]">info</span> {errors.username}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="displayName" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                    Display Name
                                </label>
                                <input
                                    id="displayName"
                                    type="text"
                                    name="displayName"
                                    placeholder="John Doe"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.displayName ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                    autoComplete="name"
                                />
                                {errors.displayName && (
                                    <span className="text-[12px] font-bold text-rose-500 ml-1 mt-1 flex items-start gap-1 leading-tight">
                                        <span className="material-symbols-outlined text-[14px]">info</span> {errors.displayName}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
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
                            <label htmlFor="password" className="text-[13px] font-bold text-[#2D2926]/80 ml-1 flex justify-between">
                                <span>Password <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.password ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                autoComplete="new-password"
                                required
                            />
                            <span className="text-[11.5px] font-bold text-[#2D2926]/30 ml-1 px-1 mt-0.5">8+ chars · 1 Uppercase · 1 Number</span>
                            {errors.password && (
                                <span className="text-[12px] font-bold text-rose-500 ml-1 mt-0.5 flex items-start gap-1 leading-tight">
                                    <span className="material-symbols-outlined text-[14px]">info</span> {errors.password}
                                </span>
                            )}
                        </div>

                        <div className="mt-2">
                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className={`w-full h-14 bg-[#ffb700] text-white font-black text-[16px] rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <span>Sign Up</span>
                                )}
                            </button>
                        </div>
                        
                        <p className="text-[12px] font-bold text-[#2D2926]/40 text-center px-4 mt-2 leading-relaxed">
                            By signing up, you agree to our{' '}
                            <Link to="/watch-hive/privacy" className="text-[#ffb700] hover:underline hover:text-[#ffb700]/80 transition-colors">
                                Privacy Policy
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center flex flex-col gap-4">
                    <p className="text-[14px] font-semibold text-[#2D2926]/50">
                        Already have an account?{' '}
                        <Link to="/watch-hive/login" className="text-[#ffb700] hover:underline hover:text-[#ffb700]/80 font-bold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
