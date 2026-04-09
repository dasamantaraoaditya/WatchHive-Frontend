import React from 'react';

export const SearchItemSkeleton: React.FC = () => {
    return (
        <div className="p-3 rounded-2xl bg-[#ffb700]/5 border border-[#ffb700]/10 flex items-center gap-4 animate-pulse opacity-60 pointer-events-none">
            {/* Image Placeholder */}
            <div className="w-14 h-20 bg-[#2D2926]/5 rounded-xl flex-shrink-0 shadow-sm" />
            
            {/* Content Placeholder */}
            <div className="flex-grow min-w-0 space-y-2.5">
                <div className="w-[80%] h-4 bg-[#2D2926]/10 rounded" />
                <div className="flex gap-2">
                    <div className="w-12 h-3.5 bg-white border border-[#ffb700]/10 rounded px-1.5" />
                    <div className="w-10 h-3.5 bg-[#2D2926]/5 rounded" />
                </div>
            </div>
            
            {/* Add Button Placeholder */}
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex-shrink-0" />
        </div>
    );
};
