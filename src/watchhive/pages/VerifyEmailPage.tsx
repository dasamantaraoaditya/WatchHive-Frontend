import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts';
import { BeeLoader, SigningInOverlay } from '../components/common';
import whLogo from '../assets/images/watchhive-logo.png';

export const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { verifyEmail, resendVerification } = useAuth();

    // Grab email from search params or navigation state
    const emailParam = searchParams.get('email') || (location.state as any)?.email || '';
    const tokenParam = searchParams.get('token') || '';

    const [email, setEmail] = useState(emailParam);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If a full token is passed in query params (from verification link), verify automatically
    useEffect(() => {
        if (tokenParam) {
            handleAutoVerifyToken(tokenParam, email);
        }
    }, [tokenParam]);

    // Resend countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleAutoVerifyToken = async (token: string, emailToVerify: string) => {
        setIsVerifying(true);
        setError('');
        try {
            await verifyEmail(token, emailToVerify || undefined);
            setSuccessMessage('Email verified successfully! Taking you into your hive...');
            setTimeout(() => {
                navigate('/watch-hive/feed', { replace: true });
            }, 1200);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification link is invalid or has expired. Please enter the 6-digit code or request a new one.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        // Only allow numbers
        const cleaned = value.replace(/[^0-9]/g, '');
        if (!cleaned && value !== '') return;

        const newCode = [...code];

        // Handle paste of full 6-digit code
        if (cleaned.length > 1) {
            const pasted = cleaned.slice(0, 6).split('');
            for (let i = 0; i < 6; i++) {
                newCode[i] = pasted[i] || '';
            }
            setCode(newCode);
            const nextIdx = Math.min(pasted.length, 5);
            inputRefs.current[nextIdx]?.focus();
            if (pasted.length === 6) {
                submitVerification(newCode.join(''));
            }
            return;
        }

        newCode[index] = cleaned;
        setCode(newCode);

        // Move to next input if filled
        if (cleaned && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are typed
        if (cleaned && index === 5) {
            const fullCode = newCode.join('');
            if (fullCode.length === 6) {
                submitVerification(fullCode);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const submitVerification = async (otpCode: string) => {
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit verification code.');
            return;
        }
        setIsVerifying(true);
        setError('');
        try {
            await verifyEmail(otpCode, email.trim() || undefined);
            setSuccessMessage('Account verified! Welcome to WatchersHive.');
            setTimeout(() => {
                navigate('/watch-hive/feed', { replace: true });
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid or expired verification code. Please check and try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitVerification(code.join(''));
    };

    const handleResend = async () => {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
            setError('Please provide a valid email address to resend the code.');
            return;
        }
        setIsResending(true);
        setError('');
        setSuccessMessage('');
        try {
            const res = await resendVerification(email.trim());
            setSuccessMessage(res.message || 'A new 6-digit verification code has been sent to your email.');
            setCountdown(60);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend verification code. Please try again in a moment.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9F0] p-4 sm:p-6 lg:p-8 font-sans">
            {isVerifying && (
                <SigningInOverlay
                    message="Verifying your account..."
                    submessage="Setting up your personal hive..."
                />
            )}
            <div className="w-full max-w-[460px] flex flex-col items-center">
                {/* Logo & Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link to="/watch-hive" className="block mb-6 group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#ffb700]/10 flex items-center justify-center p-3 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <div className="w-12 h-12 rounded-2xl bg-[#ffb700]/10 border border-[#ffb700]/20 flex items-center justify-center text-[#ffb700] mb-3">
                        <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-[14px] font-medium text-[#2D2926]/60 max-w-[340px]">
                        {email ? (
                            <>
                                We've sent a 6-digit verification code to{' '}
                                <span className="font-bold text-[#2D2926]">{email}</span>.
                            </>
                        ) : (
                            'Enter the 6-digit code sent to your inbox to activate your account.'
                        )}
                    </p>
                </div>

                {/* Card */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#ffb700]/10 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent opacity-50"></div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-[14px] font-bold">
                            <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-700 text-[14px] font-bold">
                            <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* If email wasn't provided, allow entering it */}
                        {!emailParam && (
                            <div>
                                <label className="block text-[13px] font-bold text-[#2D2926]/70 uppercase tracking-wider mb-2">
                                    Your Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 bg-[#FFF9F0]/50 border border-[#ffb700]/20 rounded-xl text-[#2D2926] placeholder-[#2D2926]/30 font-medium focus:outline-none focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 transition-all text-[15px]"
                                    required
                                />
                            </div>
                        )}

                        {/* 6-digit OTP Inputs */}
                        <div>
                            <label className="block text-[13px] font-bold text-[#2D2926]/70 uppercase tracking-wider mb-3 text-center">
                                6-Digit Verification Code
                            </label>
                            <div className="flex justify-between gap-2 sm:gap-3">
                                {code.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black text-[#2D2926] bg-[#FFF9F0]/60 border-2 border-[#ffb700]/30 rounded-2xl focus:outline-none focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/20 transition-all shadow-inner"
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isVerifying || code.join('').length !== 6}
                            className="w-full py-4 bg-[#ffb700] hover:bg-[#e6a500] active:scale-[0.99] text-[#2D2926] font-black text-[16px] rounded-2xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isVerifying ? (
                                <>
                                    <BeeLoader size="small" />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify & Enter Hive</span>
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend Section */}
                    <div className="mt-6 pt-6 border-t border-[#ffb700]/10 flex flex-col items-center gap-3">
                        <div className="text-[13px] font-medium text-[#2D2926]/60">
                            Didn't receive the email? Check spam or request a new one:
                        </div>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isResending || countdown > 0 || !email}
                            className="text-[14px] font-bold text-[#d99b00] hover:text-[#b07d00] transition-colors disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer"
                        >
                            {isResending ? (
                                <span>Sending code...</span>
                            ) : countdown > 0 ? (
                                <span>Resend code in {countdown}s</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                                    <span>Resend Verification Code</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="mt-6 pt-4 border-t border-dashed border-[#ffb700]/15 flex items-center justify-between text-[13px] font-medium text-[#2D2926]/60">
                        <Link
                            to="/watch-hive/signup"
                            className="hover:text-[#2D2926] transition-colors"
                        >
                            Use different email
                        </Link>
                        <Link
                            to="/watch-hive/login"
                            className="text-[#d99b00] hover:text-[#b07d00] font-bold transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
