import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts';
import { GoogleSignInButton } from '../components/auth';
import { BeeLoader, SigningInOverlay } from '../components/common';
import whLogo from '../assets/images/watchhive-logo.png';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { googleLogin, requestEmailOtp, verifyEmailOtp } = useAuth();

    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [isNewUser, setIsNewUser] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Resend countdown timer
    const [resendCountdown, setResendCountdown] = useState(0);

    const emailInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let timer: any;
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    useEffect(() => {
        if (step === 'code' && codeInputRef.current) {
            codeInputRef.current.focus();
        } else if (step === 'email' && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [step]);

    const handleSendCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setInfoMessage(null);

        try {
            const res = await requestEmailOtp(trimmedEmail);
            setIsNewUser(Boolean(res.isNewUser));
            setStep('code');
            setResendCountdown(30);
            setInfoMessage(res.message || `A 6-digit sign-in code has been sent to ${trimmedEmail}.`);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to dispatch sign-in code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanCode = code.trim().replace(/\D/g, '');
        if (cleanCode.length !== 6) {
            setError('Please enter the full 6-digit code received in your email.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await verifyEmailOtp(email.trim().toLowerCase(), cleanCode);
            navigate('/watch-hive/feed');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Incorrect or expired sign-in code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            await googleLogin(idToken);
            navigate('/watch-hive/feed');
        } catch (error: any) {
            setError(error.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleError = (errorMsg: string) => {
        setError(errorMsg);
    };

    const handleGoogleFallback = () => {
        setError('Google Sign-In is unavailable in this browser. Please use your email code below.');
    };

    return (
        <div className="min-h-screen bg-[#FFF9F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#ffb700]/30 selection:text-[#2D2926]">
            {isGoogleLoading && <SigningInOverlay message="Signing you into your hive..." />}

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <Link to="/" className="inline-flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
                        <img src={whLogo} alt="WatchersHive" className="w-12 h-12 object-contain" />
                        <span className="text-2xl font-black text-[#2D2926] tracking-tight">
                            Watchers<span className="text-[#ffb700]">Hive</span>
                        </span>
                    </Link>
                </div>

                <div className="bg-white py-10 px-6 sm:px-10 rounded-[32px] border border-[#ffb700]/15 shadow-xl shadow-[#ffb700]/5 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-[#2D2926] tracking-tight">
                            {step === 'email' ? 'Welcome to the Hive' : 'Enter Sign-In Code'}
                        </h2>
                        <p className="text-[13px] font-bold text-[#2D2926]/40 mt-1.5">
                            {step === 'email'
                                ? 'Passwordless sign-in for film & TV cinephiles'
                                : `We sent a 6-digit code to ${email}`}
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-[14px] font-bold animate-[fade-in_0.2s_ease-out]">
                            <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Info message */}
                    {infoMessage && step === 'code' && (
                        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-[13px] font-bold animate-[fade-in_0.2s_ease-out]">
                            <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">mark_email_read</span>
                            <span>{infoMessage}</span>
                        </div>
                    )}

                    {step === 'email' ? (
                        <>
                            {/* Primary 1-Click: Google Sign-In */}
                            <div className="w-full mb-6">
                                <GoogleSignInButton
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    onFallback={handleGoogleFallback}
                                    text="continue_with"
                                    disabled={isLoading || isGoogleLoading}
                                />
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#2D2926]/30">or continue with email</span>
                                <div className="flex-1 h-px bg-[#ffb700]/10"></div>
                            </div>

                            <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="email" className="text-[13px] font-black text-[#2D2926]/70 ml-1">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        ref={emailInputRef}
                                        type="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        className="w-full bg-[#FFF9F0]/50 border border-[#ffb700]/20 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[#2D2926] placeholder:text-[#2D2926]/20 transition-all focus:outline-none focus:bg-white focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-2xl bg-[#ffb700] hover:bg-[#e6a500] text-[#2D2926] text-[15px] font-black tracking-wide transition-all shadow-lg shadow-[#ffb700]/25 hover:shadow-xl hover:shadow-[#ffb700]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
                                >
                                    {isLoading ? (
                                        <BeeLoader size="small" message="Sending Code..." />
                                    ) : (
                                        <>
                                            <span>Continue with Email Code</span>
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Step 2: 6-Digit OTP Code Entry */
                        <form onSubmit={handleVerifyCode} className="flex flex-col gap-5 animate-[fade-in_0.3s_ease-out]">
                            <div className="flex flex-col items-center gap-3">
                                <input
                                    id="otp-code"
                                    ref={codeInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="• • • • • •"
                                    value={code}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setCode(clean);
                                        setError(null);
                                        if (clean.length === 6) {
                                            // Automatically submit once 6 digits are typed
                                            setTimeout(() => {
                                                verifyEmailOtp(email.trim().toLowerCase(), clean)
                                                    .then(() => navigate('/watch-hive/feed'))
                                                    .catch((err) => setError(err.response?.data?.error || err.message || 'Incorrect code.'));
                                            }, 50);
                                        }
                                    }}
                                    className="w-full tracking-[0.5em] text-center font-mono text-3xl font-black bg-[#FFF9F0]/60 border-2 border-[#ffb700]/30 rounded-2xl py-4 text-[#2D2926] placeholder:text-[#2D2926]/15 focus:outline-none focus:bg-white focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/15 transition-all"
                                    autoComplete="one-time-code"
                                    required
                                />
                                <span className="text-[12px] font-medium text-[#2D2926]/40">
                                    {isNewUser ? 'New user detected! Verifying will create your account.' : 'Enter the single-use 6-digit passcode'}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || code.trim().length !== 6}
                                className="w-full py-4 rounded-2xl bg-[#ffb700] hover:bg-[#e6a500] text-[#2D2926] text-[15px] font-black tracking-wide transition-all shadow-lg shadow-[#ffb700]/25 hover:shadow-xl hover:shadow-[#ffb700]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? (
                                    <BeeLoader size="small" message="Verifying..." />
                                ) : (
                                    <>
                                        <span>Verify & Sign In</span>
                                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-between pt-3 text-[13px] font-bold text-[#2D2926]/60">
                                <button
                                    type="button"
                                    disabled={resendCountdown > 0 || isLoading}
                                    onClick={() => handleSendCode()}
                                    className="hover:text-[#2D2926] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('email');
                                        setCode('');
                                        setError(null);
                                    }}
                                    className="hover:text-[#2D2926] transition-colors underline underline-offset-2"
                                >
                                    Change email
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-[#ffb700]/10 text-center">
                        <p className="text-[12px] font-medium text-[#2D2926]/50">
                            By continuing, you agree to WatchersHive's{' '}
                            <Link to="/watch-hive/terms" className="font-bold text-[#2D2926]/80 hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/watch-hive/privacy" className="font-bold text-[#2D2926]/80 hover:underline">
                                Privacy Policy
                            </Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
