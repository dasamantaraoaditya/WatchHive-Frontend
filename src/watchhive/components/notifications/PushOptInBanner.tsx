import React, { useState } from 'react';
import { pushNotificationService } from '../../services/pushNotification.service';

interface PushOptInBannerProps {
    onSubscribed?: () => void;
}

export const PushOptInBanner: React.FC<PushOptInBannerProps> = ({ onSubscribed }) => {
    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem('watchhive_push_dismissed') === 'true';
    });
    const [subscribing, setSubscribing] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testSent, setTestSent] = useState(false);

    const permission = pushNotificationService.getPermissionState();
    const isSupported = pushNotificationService.isSupported();

    if (!isSupported) {
        return null;
    }

    const handleEnable = async () => {
        setSubscribing(true);
        const success = await pushNotificationService.subscribe();
        setSubscribing(false);
        if (success) {
            onSubscribed?.();
        } else {
            setDismissed(true);
            localStorage.setItem('watchhive_push_dismissed', 'true');
        }
    };

    const handleTestPush = async () => {
        setTesting(true);
        await pushNotificationService.sendTestNotification();
        setTesting(false);
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('watchhive_push_dismissed', 'true');
    };

    // Granted State Banner
    if (permission === 'granted') {
        return (
            <div className="bg-emerald-500/10 p-3 sm:p-3.5 rounded-2xl border border-emerald-500/20 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-base shrink-0">
                        ✓
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black text-emerald-950 leading-snug">
                            Push Notifications Active
                        </h4>
                        <p className="text-[11px] font-bold text-emerald-700 leading-normal truncate">
                            You will receive instant native notifications when friends interact with your hive.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleTestPush}
                    disabled={testing}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 self-end sm:self-center"
                >
                    {testing ? (
                        <span>Sending...</span>
                    ) : testSent ? (
                        <span>Sent! Check OS Tray</span>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-xs">send</span>
                            <span>Test Push</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    if (dismissed || permission !== 'default') {
        return null;
    }

    return (
        <div className="bg-[#FFF9F0] p-3.5 sm:p-4 rounded-2xl border border-[#ffb700]/30 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ffb700]/20 border border-[#ffb700]/30 flex items-center justify-center text-[#ffb700] text-lg sm:text-xl shrink-0 mt-0.5 sm:mt-0">
                    🔔
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-[#2D2926] leading-snug">
                        Enable Push Notifications
                    </h4>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-500 leading-normal mt-0.5 line-clamp-2 sm:line-clamp-1">
                        Get instant alerts when friends like your entries or leave comments.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ffb700]/15">
                <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-[#2D2926] transition-colors cursor-pointer"
                >
                    Later
                </button>
                <button
                    onClick={handleEnable}
                    disabled={subscribing}
                    className="px-3.5 py-1.5 rounded-xl bg-[#ffb700] hover:brightness-105 active:scale-95 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                    {subscribing ? (
                        <span>Enabling...</span>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-sm">notifications_active</span>
                            <span>Enable</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PushOptInBanner;
