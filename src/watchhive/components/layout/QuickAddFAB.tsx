import React from 'react';
import { motion } from 'framer-motion';

interface QuickAddFABProps {
    onClick: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({ onClick }) => {
    return (
        <motion.div 
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9, rotate: -5 }}
            className="fixed bottom-8 right-8 z-[1500]"
        >
            {/* Subtle Pulse Rings */}
            <div className="absolute inset-0 rounded-full bg-[#ffb700]/20 animate-ping" />
            
            <button
                onClick={onClick}
                className="relative w-16 h-16 bg-[#ffb700] text-white rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(255,183,0,0.4)] border-4 border-white transition-all overflow-hidden group"
                title="Quick Add Watch"
            >
                {/* Honey Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
            </button>
        </motion.div>
    );
};
