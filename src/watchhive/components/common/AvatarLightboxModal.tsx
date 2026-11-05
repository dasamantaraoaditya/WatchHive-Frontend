import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface AvatarLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    src?: string | null;
    name: string;
    username?: string;
}

export const AvatarLightboxModal: React.FC<AvatarLightboxModalProps> = ({
    isOpen,
    onClose,
    src,
    name,
    username,
}) => {
    // Escape key listener & body scroll lock
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        document.body.setAttribute('data-modal-open', 'true');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    role="dialog"
                    aria-modal="true"
                    data-modal-open="true"
                    className="fixed inset-0 z-[3500] flex items-center justify-center p-4 overflow-hidden select-none"
                >
                    {/* Dark Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#2D2926]/85 backdrop-blur-md cursor-pointer"
                    />

                    {/* Lightbox Dialog Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-black/10 shadow-2xl flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Header: User info + Close button */}
                        <div className="w-full flex items-center justify-between pb-4 border-b border-black/5 mb-5">
                            <div className="flex flex-col text-left min-w-0 pr-2">
                                <h3 className="text-lg font-black text-[#2D2926] truncate">
                                    {name}
                                </h3>
                                {username && (
                                    <span className="text-xs font-bold text-[#ffb700] uppercase tracking-wider">
                                        @{username}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#2D2926] flex items-center justify-center transition-colors shrink-0"
                                title="Close"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Magnified Avatar Image with Glowing Honey Rim */}
                        <div className="relative p-1.5 bg-gradient-to-br from-[#ffb700] via-[#ffaa00] to-transparent rounded-full shadow-lg">
                            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden bg-white border-2 border-white shadow-inner flex items-center justify-center">
                                {src ? (
                                    <img
                                        src={src}
                                        alt={name}
                                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700]">
                                        <span className="material-symbols-outlined text-6xl">face</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Subtitle */}
                        <p className="mt-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                            Profile Picture
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
