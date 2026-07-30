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
            setDismissed(true);
            localStorage.setItem('watchhive_push_dismissed', 'true');
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('watchhive_push_dismissed', 'true');
    };

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
