import React from 'react';

export const MovieSearchSkeleton: React.FC = () => {
    return (
        <div className="group flex items-center gap-4 p-4 bg-white border border-[#ffb700]/10 rounded-3xl animate-pulse opacity-60 pointer-events-none">
            {/* Image Placeholder */}
            <div className="w-16 h-24 bg-[#2D2926]/5 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm" />
            
            {/* Content Placeholder */}
            <div className="flex-grow min-w-0 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-12 h-4 bg-[#ffb700]/10 rounded-md" />
                    <div className="w-10 h-3.5 bg-[#2D2926]/5 rounded" />
                </div>
                <div className="w-[90%] h-5 bg-[#2D2926]/10 rounded-lg" />
                <div className="w-20 h-3.5 bg-[#ffb700]/10 rounded-md mt-1" />
            </div>
            
            {/* Action Placeholder */}
            <div className="w-8 h-8 rounded-full bg-[#ffb700]/5 flex-shrink-0" />
        </div>
    );
};
