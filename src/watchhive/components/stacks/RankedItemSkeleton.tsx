import React from 'react';

export const RankedItemSkeleton: React.FC = () => {
    return (
        <div className="ranked-item-card animate-pulse flex w-full opacity-60 pointer-events-none">
            {/* Rank Indicator */}
            <div className="ranked-item__rank flex items-center justify-center">
                <div className="w-4 h-6 bg-[#2D2926]/10 rounded" />
            </div>

            {/* Poster Wrap Placeholder */}
            <div className="ranked-item__poster-wrap bg-[#2D2926]/5 rounded-xl overflow-hidden" />

            <div className="ranked-item__content py-1 gap-2 flex flex-col flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-3.5 bg-[#2D2926]/5 rounded" />
                    <div className="w-12 h-3 bg-[#2D2926]/5 rounded" />
                </div>
                <div className="w-[85%] h-5 bg-[#2D2926]/10 rounded-lg mt-0.5" />
                <div className="w-[45%] h-3 bg-[#2D2926]/5 rounded mt-auto" />
            </div>

            {/* Actions Panel Placeholder */}
            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto flex-shrink-0 opacity-40">
                <div className="hidden sm:block w-12 h-6 rounded-xl bg-[#2D2926]/5" />
                <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#2D2926]/5" />
                    <div className="w-8 h-8 rounded-full bg-[#2D2926]/5" />
                </div>
            </div>
        </div>
    );
};
