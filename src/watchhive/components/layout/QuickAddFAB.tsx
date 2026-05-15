import React, { useState } from 'react';
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

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    const actionButtons = [
        { icon: 'edit_note', label: 'Log Watch', onClick: () => handleAction(onLogWatch), color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: 'visibility', label: 'Currently Watching', onClick: () => handleAction(onCurrentlyWatching), color: 'text-green-500', bg: 'bg-green-50' },
        { icon: 'send', label: 'Suggest', onClick: () => handleAction(onSuggest), color: 'text-purple-500', bg: 'bg-purple-50' },
        { icon: 'bookmark_add', label: 'Add to Watchlist', onClick: () => handleAction(onWatchlist), color: 'text-[#ffb700]', bg: 'bg-[#ffb700]/10' },
    ];

    return (
        <>
            {/* Overlay to catch outside clicks and add backdrop blur */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1400] bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="fixed bottom-24 md:bottom-8 right-8 z-[1500] flex flex-col items-end gap-4"
            >
                {/* Secondary Action Buttons */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col items-end gap-3 mb-2"
                        >
                            {actionButtons.map((btn, i) => (
                                <motion.button
                                    key={btn.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={btn.onClick}
                                    className="flex items-center gap-3 group"
                                >
                                    <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-bold text-[#2D2926] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {btn.label}
                                    </span>
                                    <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border border-black/5 ${btn.color}`}>
                                        <span className="material-symbols-outlined text-xl">{btn.icon}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Primary FAB */}
                <div className="relative">
                    {!isOpen && <div className="absolute inset-0 rounded-full bg-[#ffb700]/20 animate-ping" />}
                    
                    <motion.button
                        onClick={toggleOpen}
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(255,183,0,0.4)] border-4 transition-colors z-10 ${isOpen ? 'bg-white border-[#ffb700] text-[#ffb700]' : 'bg-[#ffb700] border-white text-white'}`}
                        title="Quick Actions"
                    >
                        {!isOpen && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />}
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};
