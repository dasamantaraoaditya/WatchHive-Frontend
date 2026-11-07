import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'wh_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem(STORAGE_KEY);
            if (!consent) {
                // Slight delay so it doesn't pop abruptly on first paint
                const timer = setTimeout(() => setIsVisible(true), 800);
                return () => clearTimeout(timer);
            }
        } catch {
            // Ignore storage access errors
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem(STORAGE_KEY, 'accepted');
        } catch {
            // Ignore
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <aside
            aria-label="Privacy and Cookie Notice"
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] animate-slide-up"
        >
            <div className="bg-white/95 backdrop-blur-md border border-[#ffb700]/30 shadow-2xl rounded-3xl p-4 md:p-5 text-[#2D2926] font-sans">
                <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 select-none">🍪</span>
                    <div className="flex-1">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                            Essential Storage & Privacy Notice
                        </h4>
                        <p className="text-[12px] font-medium text-slate-600 leading-snug mb-3">
                            WatchersHive uses essential browser storage (cookies &amp; local storage) strictly to keep you securely signed in and enable offline movie tracking. We do <strong>not</strong> use advertising or tracking cookies.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAccept}
                                className="px-4 py-1.5 rounded-xl bg-[#ffb700] hover:bg-[#e5a500] text-[#2D2926] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Got it
                            </button>
                            <Link
                                to="/watch-hive/privacy"
                                className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                to="/watch-hive/terms"
                                className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors"
                            >
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default CookieConsentBanner;
