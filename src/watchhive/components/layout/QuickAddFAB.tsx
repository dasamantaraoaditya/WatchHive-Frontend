import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAddFABProps {
    onLogWatch: () => void;
    onCurrentlyWatching: () => void;
    onSuggest: () => void;
    onWatchlist: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({ 
    onLogWatch, 
    onCurrentlyWatching, 
    onSuggest, 
    onWatchlist 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Detect scrolling on page to collapse/hide temporarily
    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) return; // Keep visible if speed dial is open

            setIsScrolling(true);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
            }, 200);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [isOpen]);

    // 2. Hide when any modal, sheet, or dialog is open
    useEffect(() => {
        const checkModalState = () => {
            const hasDialog =
                document.querySelector('[role="dialog"]') !== null ||
                document.querySelector('[data-modal-open="true"]') !== null ||
                document.body.getAttribute('data-modal-open') === 'true' ||
                document.body.style.overflow === 'hidden';
            setIsModalOpen(hasDialog);
            if (hasDialog) setIsOpen(false);
        };

        checkModalState();

        const observer = new MutationObserver(checkModalState);
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'data-modal-open', 'class'],
        });

        window.addEventListener('resize', checkModalState);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', checkModalState);
        };
    }, []);

    // 3. Hide when user focuses an input/textarea (virtual keyboard open on mobile)
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                setIsKeyboardOpen(true);
                setIsOpen(false);
            }
        };

        const handleBlur = () => {
            setTimeout(() => {
                const active = document.activeElement as HTMLElement | null;
                if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable)) {
                    setIsKeyboardOpen(false);
                }
            }, 100);
        };

        window.addEventListener('focusin', handleFocus);
        window.addEventListener('focusout', handleBlur);
        return () => {
            window.removeEventListener('focusin', handleFocus);
            window.removeEventListener('focusout', handleBlur);
        };
    }, []);

    const actions = [
        {
            label: 'Log an Entry',
            icon: 'edit_note',
            color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-[#ffb700] hover:text-[#2D2926]',
            badgeColor: 'bg-[#ffb700] text-[#2D2926]',
            onClick: () => {
                setIsOpen(false);
                onLogWatch();
            },
        },
        {
            label: 'Currently Watching',
            icon: 'play_circle',
            color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-500 hover:text-white',
            badgeColor: 'bg-emerald-500 text-white',
            onClick: () => {
                setIsOpen(false);
                onCurrentlyWatching();
            },
        },
        {
            label: 'Add to Watchlist',
            icon: 'bookmark_add',
            color: 'text-amber-800 bg-amber-50/80 border-amber-200 hover:bg-amber-400 hover:text-black',
            badgeColor: 'bg-amber-400 text-black',
            onClick: () => {
                setIsOpen(false);
                onWatchlist();
            },
        },
        {
            label: 'Suggest to Friend',
            icon: 'send',
            color: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-600 hover:text-white',
            badgeColor: 'bg-purple-600 text-white',
            onClick: () => {
                setIsOpen(false);
                onSuggest();
            },
        },
    ];

    const isVisible = (!isScrolling || isOpen) && !isModalOpen && !isKeyboardOpen;

    return (
        <>
            {/* Speed Dial Backdrop overlay when open */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-[1090] bg-[#2D2926]/30 backdrop-blur-[2px] transition-opacity"
                    aria-hidden="true"
                />
            )}

            <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-8 right-4 md:right-8 z-[1100] flex flex-col items-end pointer-events-none">
                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{
                        y: isVisible ? 0 : 20,
                        opacity: isVisible ? 1 : 0,
                        scale: isVisible ? 1 : 0.95,
                    }}
                    transition={{
                        duration: 0.22,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`flex flex-col items-end gap-2.5 ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                    {/* Expanding Speed-Dial Action Items */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                transition={{ duration: 0.18, staggerChildren: 0.04 }}
                                className="flex flex-col items-end gap-2.5 mb-1.5"
                            >
                                {actions.map((act, index) => (
                                    <motion.button
                                        key={act.label}
                                        initial={{ opacity: 0, scale: 0.85, x: 10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.85, x: 10 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={act.onClick}
                                        className="flex items-center gap-2.5 py-2 px-3.5 bg-white/95 backdrop-blur-xl border border-black/10 rounded-full shadow-lg shadow-black/10 group cursor-pointer active:scale-95 transition-all"
                                    >
                                        <span className="text-xs font-black text-[#2D2926] tracking-wide whitespace-nowrap pl-1">
                                            {act.label}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs transition-colors ${act.color}`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {act.icon}
                                            </span>
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Floating Action Button (Speed-Dial Trigger) */}
                    <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setIsOpen(prev => !prev)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                            isOpen
                                ? 'bg-white text-[#2D2926] border-2 border-[#ffb700] shadow-black/15'
                                : 'bg-gradient-to-tr from-[#ffb700] to-[#ffd000] text-[#2D2926] border-2 border-white shadow-[#ffb700]/40'
                        }`}
                        title={isOpen ? 'Close' : 'Quick Actions'}
                        aria-label="Quick Actions"
                    >
                        <span className={`material-symbols-outlined text-2xl font-black transition-transform duration-250 ${isOpen ? 'rotate-45 text-[#2D2926]' : 'rotate-0 text-[#2D2926]'}`}>
                            add
                        </span>
                    </motion.button>
                </motion.div>
            </div>
        </>
    );
};

export default QuickAddFAB;
