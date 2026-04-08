import React from 'react';

export const UserSearchSkeleton: React.FC = () => {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-[#ffb700]/10 rounded-3xl animate-pulse opacity-60 pointer-events-none">
            <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-[#2D2926]/5 shadow-sm" />
                
                {/* Details Placeholder */}
                <div className="space-y-2">
                    <div className="w-28 h-4.5 bg-[#2D2926]/10 rounded-md" />
                    <div className="w-20 h-3 bg-[#2D2926]/5 rounded-sm" />
                </div>
            </div>
            
            {/* Follow Button Placeholder */}
            <div className="w-24 h-9 rounded-xl bg-[#2D2926]/5" />
        </div>
    );
};
