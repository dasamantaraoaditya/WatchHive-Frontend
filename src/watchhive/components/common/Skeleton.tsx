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
                <Skeleton variant="circle" width={40} height={40} />
                <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={16} className="mb-2" />
                    <Skeleton variant="text" width="20%" height={12} />
                </div>
            </div>
            <Skeleton variant="rect" width="100%" height={200} className="mb-4 rounded-lg" />
            <Skeleton variant="text" width="90%" height={14} />
            <Skeleton variant="text" width="80%" height={14} />
            <div className="flex gap-4 mt-4">
                <Skeleton variant="rect" width={60} height={24} className="rounded-full" />
                <Skeleton variant="rect" width={60} height={24} className="rounded-full" />
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

export default Skeleton;
