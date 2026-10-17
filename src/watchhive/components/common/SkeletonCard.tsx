import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

export const SkeletonCard: React.FC = () => {
    return (
        <div className="watchlist-card group relative flex flex-col h-full bg-white rounded-3xl border border-[#ffb700]/10 overflow-hidden shadow-sm animate-pulse">
            {/* Poster Skeleton */}
            <div className="watchlist-card__poster-wrapper aspect-[2/3] relative overflow-hidden bg-slate-200">
                <div className="absolute top-2 left-2 w-12 h-4 bg-slate-300 rounded" />
                <div className="absolute top-2 right-2 w-6 h-6 bg-slate-300 rounded-full" />
            </div>
            
            {/* Info Section Skeleton */}
            <div className="p-4 flex flex-col flex-1 gap-2.5">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-amber-50/80 rounded-lg w-2/3 flex items-center gap-1.5 px-2 py-0.5">
                    <div className="w-3.5 h-3.5 bg-slate-200 rounded-full shrink-0" />
                    <div className="h-2.5 bg-slate-200 rounded w-16" />
                </div>
                
                <div className="mt-auto pt-2 flex items-center justify-between w-full">
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-amber-100 rounded w-1/5" />
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
