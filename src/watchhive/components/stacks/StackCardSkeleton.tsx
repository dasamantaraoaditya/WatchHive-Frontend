import React from 'react';

export const StackCardSkeleton: React.FC = () => {
    return (
        <div className="stack-card animate-pulse opacity-60 pointer-events-none flex flex-col justify-between">
            <div className="w-[70%] h-4 bg-[#2D2926]/10 rounded truncate mb-2" />
            <div className="flex items-center justify-between mt-auto">
                <div className="w-8 h-3 bg-[#2D2926]/5 rounded" />
                <div className="w-4 h-4 bg-[#2D2926]/5 rounded-full" />
            </div>
        </div>
    );
};
