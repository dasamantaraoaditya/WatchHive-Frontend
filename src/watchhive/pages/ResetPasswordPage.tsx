import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts';
import whLogo from '../assets/images/watchhive-logo.png';

export const ResetPasswordPage: React.FC = () => {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Invalid link (missing token or email params)
    if (!token || !email) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9F0] p-4 font-sans">
                <div className="w-full max-w-[400px] bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-8 flex flex-col items-center gap-5 text-center">
                    <span className="material-symbols-outlined text-rose-500 text-[48px]">link_off</span>
                    <h1 className="text-[22px] font-black text-[#2D2926]">Invalid Reset Link</h1>
                    <p className="text-[14px] font-medium text-[#2D2926]/50">
                        This reset link is missing required information. Please request a new one.
                    </p>
                    <Link
                        to="/watch-hive/forgot-password"
                        className="w-full h-12 bg-[#ffb700] text-white font-black text-[15px] rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain uppercase, lowercase, and a number';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            await resetPassword(token, email, newPassword);
            setSuccess(true);
        } catch (err: any) {
            setErrors({
                general: err.response?.data?.error || 'Invalid or expired reset link. Please request a new one.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9F0] p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-[420px] flex flex-col items-center">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link to="/watch-hive" className="block mb-6 group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#ffb700]/10 flex items-center justify-center p-3 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight mb-2">
                        {success ? 'Password Reset!' : 'Set New Password'}
                    </h1>
                    {!success && (
                        <p className="text-[15px] font-medium text-[#2D2926]/50 max-w-[280px]">
                            Create a new password for <span className="font-bold text-[#2D2926]/70">{email}</span>
                        </p>
                    )}
                </div>

                <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-50"></div>

                    {!success ? (
                        <>
                            {errors.general && (
                                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col gap-2">
                                    <div className="flex items-start gap-3 text-rose-600 text-[14px] font-bold">
                                        <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                                        <span>{errors.general}</span>
                                    </div>
                                    <Link
                                        to="/watch-hive/forgot-password"
                                        className="text-[12px] font-bold text-rose-500 hover:text-rose-700 underline ml-8"
                                    >
                                        Request a new reset link →
                                    </Link>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="new-password" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                        New Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="new-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }));
                                            }}
                                            className={`w-full bg-[#FFF9F0]/50 border rounded-2xl px-4 py-3.5 pr-12 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.newPassword ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((p) => !p)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2D2926]/30 hover:text-[#2D2926]/60 transition-colors"
                                            tabIndex={-1}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <span className="text-[11.5px] font-bold text-[#2D2926]/30 ml-1 px-1">
                                        8+ chars · 1 Uppercase · 1 Number
                                    </span>
                                    {errors.newPassword && (
                                        <span className="text-[12px] font-bold text-rose-500 ml-1 flex items-start gap-1">
                                            <span className="material-symbols-outlined text-[14px]">info</span> {errors.newPassword}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="confirm-password" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                        Confirm Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
                                        }}
                                        className={`w-full bg-[#FFF9F0]/50 border rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.confirmPassword ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                        autoComplete="new-password"
                                    />
                                    {errors.confirmPassword && (
                                        <span className="text-[12px] font-bold text-rose-500 ml-1 flex items-start gap-1">
                                            <span className="material-symbols-outlined text-[14px]">info</span> {errors.confirmPassword}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-14 bg-[#ffb700] text-white font-black text-[16px] rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            <span>Resetting...</span>
                                        </>
                                    ) : (
                                        <span>Reset Password</span>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success state */
                        <div className="flex flex-col items-center gap-5 py-2">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500 text-[32px]">lock_reset</span>
                            </div>
                            <div className="text-center">
                                <p className="text-[15px] font-medium text-[#2D2926]/50 leading-relaxed">
                                    Your password has been reset. You can now sign in with your new password.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/watch-hive/login')}
                                className="w-full h-14 bg-[#ffb700] text-white font-black text-[16px] rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all"
                            >
                                Go to Sign In
                            </button>
                        </div>
                    )}
                </div>

                {!success && (
                    <div className="mt-8">
                        <Link
                            to="/watch-hive/login"
                            className="text-[14px] font-bold text-[#2D2926]/50 hover:text-[#2D2926] transition-colors flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Back to Sign In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
