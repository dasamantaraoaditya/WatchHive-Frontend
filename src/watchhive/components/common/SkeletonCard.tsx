import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

export const SkeletonCard: React.FC = () => {
    return (
        <div className="watchlist-card group relative flex flex-col h-full bg-white rounded-3xl border border-[#ffb700]/10 overflow-hidden shadow-sm animate-pulse">
            {/* Poster Skeleton */}
            <div className="watchlist-card__poster-wrapper aspect-[2/3] relative overflow-hidden bg-slate-200" />
            
            {/* Info Section Skeleton */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                
                <div className="mt-auto pt-4 border-t border-[#ffb700]/10 flex flex-col gap-2">
                    <div className="h-2 bg-slate-50 rounded w-1/3" />
                    <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-7 w-7 rounded-full bg-slate-100 ring-2 ring-white" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SkeletonGrid: React.FC<SkeletonCardProps> = ({ count = 8 }) => {
    return (
        <div className="watchlist-grid w-full">
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};
