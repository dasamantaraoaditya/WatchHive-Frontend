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

    const permission = pushNotificationService.getPermissionState();
    const isSupported = pushNotificationService.isSupported();

    // Only show if supported, not dismissed, and permission state is default (not yet requested)
    if (!isSupported || dismissed || permission !== 'default') {
        return null;
    }

    const handleEnable = async () => {
        setSubscribing(true);
        const success = await pushNotificationService.subscribe();
        setSubscribing(false);
        if (success) {
            onSubscribed?.();
        } else {
            // If user dismissed browser prompt, remember dismissal
            setDismissed(true);
            localStorage.setItem('watchhive_push_dismissed', 'true');
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('watchhive_push_dismissed', 'true');
    };

    return (
        <div className="bg-[#FFF9F0] p-4 rounded-2xl border border-[#ffb700]/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#ffb700]/20 flex items-center justify-center text-[#ffb700] text-xl shrink-0">
                    🔔
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-black text-[#2D2926]">Enable Push Notifications</h4>
                    <p className="text-xs font-bold text-slate-500 truncate">
                        Get instant alerts on likes, comments, and recommendations even when WatchHive is closed.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                    Later
                </button>
                <button
                    onClick={handleEnable}
                    disabled={subscribing}
                    className="px-4 py-1.5 rounded-xl bg-[#ffb700] hover:brightness-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
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
