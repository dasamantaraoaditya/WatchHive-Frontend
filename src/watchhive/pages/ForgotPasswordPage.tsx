import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts';
import whLogo from '../assets/images/watchhive-logo.png';

export const ForgotPasswordPage: React.FC = () => {
    const { forgotPassword } = useAuth();
    const [searchParams] = useSearchParams();

    // Pre-fill email if redirected from the Google-only account recovery banner
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const result = await forgotPassword(email);
            setSubmitted(true);
            // In dev mode, the backend returns the raw token for easy testing
            if (result.devToken) setDevToken(result.devToken);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
                        Reset Password
                    </h1>
                    <p className="text-[15px] font-medium text-[#2D2926]/50 max-w-[280px]">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-50"></div>

                    {!submitted ? (
                        <>
                            {error && (
                                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-[14px] font-bold">
                                    <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="forgot-email" className="text-[13px] font-bold text-[#2D2926]/80 ml-1">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full bg-[#FFF9F0]/50 border border-[#ffb700]/20 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-14 bg-[#ffb700] text-white font-black text-[16px] rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <span>Send Reset Link</span>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success state */
                        <div className="flex flex-col items-center gap-5 py-2">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500 text-[32px]">mark_email_read</span>
                            </div>
                            <div className="text-center">
                                <p className="text-[16px] font-black text-[#2D2926] mb-1">Check your inbox!</p>
                                <p className="text-[13px] font-medium text-[#2D2926]/50 leading-relaxed">
                                    If <span className="font-bold text-[#2D2926]/70">{email}</span> is registered, you'll receive a reset link shortly.
                                </p>
                            </div>

                            {/* Dev-mode token display */}
                            {devToken && (
                                <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                                        🛠 Dev Mode — Reset Token
                                    </p>
                                    <Link
                                        to={`/watch-hive/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                                        className="text-[13px] font-bold text-amber-700 hover:text-amber-800 underline break-all"
                                    >
                                        Click to open reset page →
                                    </Link>
                                </div>
                            )}

                            <p className="text-[12px] font-medium text-[#2D2926]/40 text-center">
                                Didn't receive it? Check your spam folder, or{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubmitted(false);
                                        setDevToken(null);
                                    }}
                                    className="text-[#ffb700] font-bold hover:underline"
                                >
                                    try again
                                </button>
                                .
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        to="/watch-hive/login"
                        className="text-[14px] font-bold text-[#2D2926]/50 hover:text-[#2D2926] transition-colors flex items-center gap-1.5 justify-center"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
