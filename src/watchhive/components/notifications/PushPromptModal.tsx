import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pushNotificationService } from '../../services/pushNotification.service';
import { useAuth } from '../../contexts/AuthContext';

export const PushPromptModal: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (!pushNotificationService.isSupported()) return;

        const permission = pushNotificationService.getPermissionState();
        const hasBeenAsked = localStorage.getItem('watchhive_push_asked') === 'true';

        // Automatically prompt the user on their first time if permission is still default
        if (permission === 'default' && !hasBeenAsked) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1800); // 1.8s delay after page load for smooth entry
            return () => clearTimeout(timer);
        }
    }, [user]);

    if (!isOpen) return null;

    const handleEnable = async () => {
        setLoading(true);
        localStorage.setItem('watchhive_push_asked', 'true');
        await pushNotificationService.subscribe();
        setLoading(false);
        setIsOpen(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('watchhive_push_asked', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-display">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#ffb700]/30 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
                >
                    {/* Background gold glow accent */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffb700]/15 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Bee Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/30 flex items-center justify-center text-3xl mb-4 shadow-xs">
                        🔔
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-[#2D2926] tracking-tight mb-2">
                        Stay in the Loop!
                    </h3>

                    {/* Description */}
                    <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">
                        Enable push notifications to receive instant updates when friends like your entries, leave comments, or send movie recommendations!
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 w-full">
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-[#ffb700] hover:brightness-105 active:scale-98 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md shadow-[#ffb700]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span>Enabling...</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">notifications_active</span>
                                    <span>Enable Push Notifications</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-[#2D2926] transition-colors cursor-pointer"
                        >
                            Maybe Later
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PushPromptModal;
