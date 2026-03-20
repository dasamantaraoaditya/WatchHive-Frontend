import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = 'max-w-2xl' 
}) => {
    // Scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#2D2926]/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 25, 
                            stiffness: 300 
                        }}
                        className={`relative w-full ${maxWidth} bg-white rounded-[40px] shadow-2xl shadow-black/20 flex flex-col max-h-[90vh] overflow-hidden border border-[#ffb700]/10`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 bg-[#FFF9F0]/80 backdrop-blur-sm border-b border-[#ffb700]/10">
                            {title && (
                                <h3 className="text-2xl font-black text-[#2D2926] tracking-tight">
                                    {title}
                                </h3>
                            )}
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#ffb700]/10 text-[#ffb700] hover:bg-[#ffb700] hover:text-white transition-all transform hover:rotate-90 active:scale-95 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
