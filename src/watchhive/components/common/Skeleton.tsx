import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'rect'
}) => {
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`skeleton skeleton-${variant} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

/* ── Specific Convenience Loaders ── */

export const FeedCardSkeleton: React.FC = () => {
    return (
        <div className="skeleton-feed-card">
            <div className="skeleton-feed-header">
                <Skeleton variant="circle" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton variant="text" width="60%" height={16} className="mb-2" />
                    <Skeleton variant="text" width="35%" height={12} />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Skeleton variant="text" width={40} height={10} />
                    <Skeleton variant="text" width={60} height={12} />
                </div>
            </div>

            <div className="skeleton-feed-poster">
                <Skeleton variant="rect" width="100%" height="100%" />
            </div>

            <div className="skeleton-feed-insight">
                <Skeleton variant="circle" width={24} height={24} className="mt-1" />
                <div className="flex-1">
                    <Skeleton variant="text" width="20%" height={12} className="mb-2" />
                    <Skeleton variant="text" width="90%" height={14} />
                    <Skeleton variant="text" width="70%" height={14} />
                </div>
            </div>

            <div className="skeleton-feed-actions">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" width={20} height={20} />
                        <Skeleton variant="text" width={20} height={14} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" width={20} height={20} />
                        <Skeleton variant="text" width={20} height={14} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" width={24} height={24} />
                    <Skeleton variant="circle" width={24} height={24} />
                </div>
            </div>
        </div>
    );
};

export const MovieCardSkeleton: React.FC = () => {
    return (
        <div className="skeleton-movie-card flex flex-col gap-2">
            <Skeleton variant="rect" width="100%" height={300} className="rounded-xl" />
            <Skeleton variant="text" width="80%" height={20} className="mt-2" />
            <Skeleton variant="text" width="40%" height={16} />
        </div>
    );
};

export const TrendingWidgetSkeleton: React.FC = () => {
    return (
        <div className="trending-item animate-pulse opacity-60 pointer-events-none py-2">
            <div className="w-16 h-2 bg-[#2D2926]/10 rounded mb-1.5" />
            <div className="w-[85%] h-3.5 bg-[#2D2926]/10 rounded mb-1.5" />
            <div className="w-20 h-2 bg-[#2D2926]/5 rounded" />
        </div>
    );
};

export const SuggestionWidgetSkeleton: React.FC = () => {
    return (
        <div className="suggestion-item animate-pulse opacity-60 pointer-events-none py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#2D2926]/10 flex-shrink-0" />
            <div className="flex-grow min-w-0 mx-3 space-y-1.5">
                <div className="w-24 h-3 bg-[#2D2926]/10 rounded" />
                <div className="w-16 h-2 bg-[#2D2926]/5 rounded" />
            </div>
            <div className="w-14 h-7 bg-[#2D2926]/10 rounded-lg flex-shrink-0" />
        </div>
    );
};

export default Skeleton;
