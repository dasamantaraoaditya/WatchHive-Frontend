import React, { useState } from 'react';
import { useAuth } from '../../contexts';

/**
 * SetPasswordSection
 * 
 * Renders a settings card for Google-only accounts to add a backup password.
 * Only visible when user.hasGoogleLinked is true AND user.hasPassword is false.
 */
export const SetPasswordSection: React.FC = () => {
    const { user, setPassword } = useAuth();

    const [isExpanded, setIsExpanded] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Only render for Google-only accounts
    if (!user?.hasGoogleLinked || user?.hasPassword) return null;

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!newPassword) {
            newErrors.newPassword = 'Password is required';
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
        setErrorMsg('');
        setIsLoading(true);
        try {
            const result = await setPassword(newPassword);
            setSuccessMsg(result.message);
            setIsExpanded(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to set password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (successMsg) {
        return (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0 mt-0.5">check_circle</span>
                <div>
                    <p className="text-[14px] font-bold text-emerald-700">Password set successfully</p>
                    <p className="text-[12px] font-medium text-emerald-600/80 mt-0.5">
                        You can now sign in with either Google or your email and password.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-[#ffb700]/20 rounded-2xl overflow-hidden">
            {/* Collapsed header */}
            <button
                type="button"
                onClick={() => setIsExpanded((p) => !p)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#FFF9F0] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#ffb700]/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#ffb700] text-[18px]">lock_add</span>
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[#2D2926]">Add a backup password</p>
                        <p className="text-[12px] font-medium text-[#2D2926]/50">
                            Sign in with email if Google is unavailable
                        </p>
                    </div>
                </div>
                <span className={`material-symbols-outlined text-[#2D2926]/30 text-[20px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Expanded form */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#ffb700]/10">
                    <p className="text-[12px] font-medium text-[#2D2926]/50 py-3 leading-relaxed">
                        Your account currently uses Google Sign-In only. Adding a password lets you sign in even when Google is unavailable.
                    </p>

                    {errorMsg && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-600 text-[13px] font-bold">
                            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#2D2926]/70 ml-1">
                                New Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a strong password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }));
                                    }}
                                    className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-3.5 py-3 pr-11 text-[14px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.newPassword ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2926]/30 hover:text-[#2D2926]/60 transition-colors"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <span className="text-[11px] font-bold text-[#2D2926]/30 ml-1">
                                8+ chars · 1 Uppercase · 1 Number
                            </span>
                            {errors.newPassword && (
                                <span className="text-[12px] font-bold text-rose-500 ml-1 flex items-start gap-1">
                                    <span className="material-symbols-outlined text-[13px]">info</span> {errors.newPassword}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#2D2926]/70 ml-1">
                                Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
                                }}
                                className={`w-full bg-[#FFF9F0]/50 border rounded-xl px-3.5 py-3 text-[14px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:ring-4 ${errors.confirmPassword ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10' : 'border-[#ffb700]/20 focus:border-[#ffb700] focus:ring-[#ffb700]/10'}`}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && (
                                <span className="text-[12px] font-bold text-rose-500 ml-1 flex items-start gap-1">
                                    <span className="material-symbols-outlined text-[13px]">info</span> {errors.confirmPassword}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3 mt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setErrors({});
                                    setErrorMsg('');
                                }}
                                className="flex-1 h-11 border border-[#ffb700]/30 text-[#2D2926]/60 font-bold text-[14px] rounded-xl hover:bg-[#FFF9F0] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 h-11 bg-[#ffb700] text-white font-bold text-[14px] rounded-xl shadow-[0_4px_14px_rgba(255,183,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Set Password</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SetPasswordSection;
