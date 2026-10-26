import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    const [isScrolling, setIsScrolling] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Detect scrolling on page
    useEffect(() => {
        const handleScroll = () => {
            if (isHovered) return;

            setIsScrolling(true);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
            }, 220);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [isHovered]);

    // 2. Hide when any modal, sheet, or dialog is open
    useEffect(() => {
        const checkModalState = () => {
            const hasDialog =
                document.querySelector('[role="dialog"]') !== null ||
                document.querySelector('[data-modal-open="true"]') !== null ||
                document.body.getAttribute('data-modal-open') === 'true' ||
                document.body.style.overflow === 'hidden';
            setIsModalOpen(hasDialog);
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

    const secondaryActions = [
        {
            icon: 'visibility',
            label: 'Add Currently Watching',
            onClick: onCurrentlyWatching,
            hoverClass: 'hover:bg-emerald-50 hover:text-emerald-600',
        },
        {
            icon: 'bookmark_add',
            label: 'Add to Watchlist',
            onClick: onWatchlist,
            hoverClass: 'hover:bg-amber-50 hover:text-[#ffb700]',
        },
        {
            icon: 'send',
            label: 'Suggest',
            onClick: onSuggest,
            hoverClass: 'hover:bg-purple-50 hover:text-purple-600',
        },
    ];

    const isVisible = (!isScrolling || isHovered) && !isModalOpen && !isKeyboardOpen;

    return (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-8 left-0 right-0 z-[1100] flex justify-center pointer-events-none px-3 sm:px-4">
            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{
                    y: isVisible ? 0 : 20,
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.95,
                }}
                transition={{
                    duration: 0.24,
                    ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`max-w-full ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
                <div className="bg-white/95 backdrop-blur-xl border border-[#ffb700]/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-1 sm:p-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all">
                    {/* Primary Action Button: Log an Entry / Log Watch */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onLogWatch}
                        className="relative group bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] font-black text-[11px] sm:text-xs uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-md shadow-[#ffb700]/30 transition-all overflow-hidden whitespace-nowrap shrink-0"
                        title="Log an Entry"
                    >
                        <span className="material-symbols-outlined text-base sm:text-lg font-bold">edit_note</span>
                        <span>Log an Entry</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    </motion.button>

                    {/* Subtle Divider */}
                    <div className="h-4 sm:h-5 w-px bg-slate-200 mx-0.5 shrink-0" />

                    {/* Quick Secondary Actions */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        {secondaryActions.map((action) => (
                            <div key={action.label} className="relative group">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={action.onClick}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 transition-colors ${action.hoverClass}`}
                                    aria-label={action.label}
                                >
                                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                                        {action.icon}
                                    </span>
                                </motion.button>

                                {/* Floating Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0 bg-[#2D2926] text-white text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg">
                                    {action.label}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2D2926]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuickAddFAB;
