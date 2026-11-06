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
                <div className="skeleton-avatar-wrapper">
                    <Skeleton variant="circle" width={48} height={48} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="70%" height={16} />
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <Skeleton variant="circle" width={16} height={16} />
                                <Skeleton variant="text" width={110} height={11} />
                            </div>
                            <Skeleton variant="text" width="40%" height={12} />
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1 border-l border-black/5 pl-3">
                            <Skeleton variant="text" width={40} height={10} />
                            <Skeleton variant="text" width={60} height={12} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="skeleton-feed-poster relative">
                <Skeleton variant="rect" width="100%" height="100%" />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Skeleton variant="rect" width={52} height={26} className="rounded-full" />
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                    <Skeleton variant="rect" width={48} height={20} className="rounded-lg" />
                    <Skeleton variant="rect" width={56} height={20} className="rounded-lg" />
                </div>
            </div>

            <div className="skeleton-feed-insight">
                <Skeleton variant="circle" width={24} height={24} className="mt-1 opacity-50" />
                <div className="flex-1">
                    <Skeleton variant="text" width="30%" height={10} className="mb-2 opacity-50" />
                    <Skeleton variant="text" width="95%" height={14} className="mb-1.5" />
                    <Skeleton variant="text" width="70%" height={14} />
                </div>
            </div>

            <div className="skeleton-feed-timestamp">
                <Skeleton variant="text" width={80} height={10} />
            </div>

            <div className="skeleton-feed-actions mt-6">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" width={20} height={20} />
                        <Skeleton variant="text" width={24} height={14} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" width={20} height={20} />
                        <Skeleton variant="text" width={24} height={14} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" width={24} height={24} className="opacity-40" />
                    <Skeleton variant="circle" width={32} height={32} className="opacity-40" />
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

export const MindLensHighlightsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Tab Nav Skeleton */}
            <div className="flex bg-[#F5E6D3]/50 p-1 rounded-2xl w-full max-w-sm mx-auto">
                <div className="flex-1 h-10 bg-white/50 rounded-xl" />
                <div className="flex-1 h-10 bg-transparent rounded-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Persona Card Skeleton */}
                <div className="lg:col-span-1 bg-white border border-[#F5E6D3] rounded-3xl p-8 flex flex-col items-center">
                    <Skeleton variant="circle" width={128} height={128} className="mb-6" />
                    <Skeleton variant="text" width="40%" height={12} className="mb-2" />
                    <Skeleton variant="text" width="70%" height={24} className="mb-4" />
                    <Skeleton variant="text" width="90%" height={14} />
                    <Skeleton variant="text" width="80%" height={14} />
                </div>

                {/* Vibe Chart Skeleton */}
                <div className="lg:col-span-2 bg-white border border-[#F5E6D3] rounded-3xl p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <Skeleton variant="text" width={120} height={20} className="mb-2" />
                            <Skeleton variant="text" width={180} height={12} />
                        </div>
                        <div className="text-right">
                            <Skeleton variant="text" width={100} height={32} className="mb-2" />
                            <Skeleton variant="text" width={80} height={14} />
                        </div>
                    </div>
                    <div className="h-[150px] w-full flex items-end gap-1 px-4">
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-[#ffb700]/10 rounded-t-sm" 
                                style={{ height: `${20 + Math.random() * 60}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Themes Skeleton */}
                <div className="lg:col-span-2 bg-white border border-[#F5E6D3] rounded-3xl p-8">
                    <Skeleton variant="text" width={150} height={20} className="mb-6" />
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-2">
                                    <Skeleton variant="text" width="30%" height={14} />
                                    <Skeleton variant="text" width="10%" height={14} />
                                </div>
                                <Skeleton variant="rect" width="100%" height={8} className="rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Temporal Peak Skeleton */}
                <div className="bg-white border border-[#F5E6D3] rounded-3xl p-8 flex flex-col items-center justify-center">
                    <Skeleton variant="text" width="50%" height={10} className="mb-6" />
                    <Skeleton variant="circle" width={100} height={100} className="border-8 border-[#F5E6D3]" />
                </div>

                {/* Insights Skeleton */}
                <div className="bg-white border border-[#F5E6D3] rounded-3xl p-6">
                    <Skeleton variant="text" width="60%" height={18} className="mb-4" />
                    <Skeleton variant="text" width="90%" height={14} />
                    <Skeleton variant="text" width="85%" height={14} />
                    <Skeleton variant="text" width="95%" height={14} />
                </div>
            </div>
            
            {/* Aesthetics Profile Skeleton */}
            <div className="bg-white border border-[#F5E6D3] rounded-3xl p-8">
                <Skeleton variant="text" width={150} height={20} className="mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} variant="rect" width="100%" className="aspect-square rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ProfileSkeleton: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto w-full px-4 py-8 md:px-8 space-y-8 animate-pulse">
            {/* Profile Hero Skeleton */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center gap-8">
                {/* Avatar Skeleton */}
                <div className="relative shrink-0">
                    <Skeleton variant="circle" width={160} height={160} className="md:w-40 md:h-40 w-32 h-32" />
                </div>

                {/* Info Skeleton */}
                <div className="flex-1 text-center md:text-left space-y-4 w-full">
                    <div className="space-y-2">
                        <Skeleton variant="text" width="40%" height={32} className="mx-auto md:mx-0" />
                        <Skeleton variant="text" width="20%" height={16} className="mx-auto md:mx-0" />
                    </div>
                    
                    <div className="space-y-2 py-2">
                        <Skeleton variant="text" width="80%" height={14} className="mx-auto md:mx-0" />
                        <Skeleton variant="text" width="60%" height={14} className="mx-auto md:mx-0" />
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-lg min-w-[100px] flex flex-col items-center gap-1">
                                <Skeleton variant="text" width={40} height={24} />
                                <Skeleton variant="text" width={60} height={10} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions Skeleton */}
                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                    <Skeleton variant="rect" width="100%" height={44} className="md:w-40 rounded-xl" />
                    <Skeleton variant="rect" width="100%" height={44} className="md:w-40 rounded-xl" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex justify-center md:justify-start gap-8 border-b border-slate-200 px-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="pb-4">
                        <Skeleton variant="text" width={80} height={20} />
                    </div>
                ))}
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

export const MovieDetailsSkeleton: React.FC = () => {
    return (
        <div className="w-full flex flex-col -mt-[56px] md:-mt-[64px] animate-pulse">
            {/* Hero Backdrop Skeleton */}
            <div className="relative w-full h-[60vh] md:h-[70vh] bg-[#F5E6D3]/40 overflow-hidden">
                <Skeleton variant="rect" width="100%" height="100%" className="rounded-none opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
                <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-5xl mx-auto">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <Skeleton variant="rect" width={60} height={22} className="rounded-md" />
                            <Skeleton variant="rect" width={80} height={22} className="rounded-md" />
                        </div>
                        <Skeleton variant="text" width="65%" height={36} className="rounded-lg" />
                        <Skeleton variant="text" width="40%" height={20} className="rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton variant="rect" width={110} height={42} className="rounded-2xl" />
                        <Skeleton variant="rect" width={120} height={42} className="rounded-2xl" />
                    </div>
                </div>
            </div>

            {/* Content Details Body Skeleton */}
            <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 space-y-8">
                {/* Synopsis Section */}
                <div className="bg-white/70 border border-black/5 rounded-3xl p-6 md:p-8 space-y-4">
                    <Skeleton variant="text" width={100} height={18} />
                    <Skeleton variant="text" width="100%" height={14} />
                    <Skeleton variant="text" width="95%" height={14} />
                    <Skeleton variant="text" width="75%" height={14} />
                </div>

                {/* Cast Avatars Row */}
                <div className="space-y-4">
                    <Skeleton variant="text" width={120} height={18} />
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-20">
                                <Skeleton variant="circle" width={60} height={60} />
                                <Skeleton variant="text" width={50} height={10} />
                                <Skeleton variant="text" width={40} height={8} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const EpisodeListSkeleton: React.FC = () => {
    return (
        <div className="w-full space-y-4 animate-pulse">
            {/* Season tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rect" width={84} height={32} className="rounded-xl shrink-0" />
                ))}
            </div>
            {/* Season Progress Bar Skeleton */}
            <div className="p-4 bg-white/60 border border-black/5 rounded-2xl space-y-2">
                <div className="flex justify-between">
                    <Skeleton variant="text" width={120} height={12} />
                    <Skeleton variant="text" width={40} height={12} />
                </div>
                <Skeleton variant="rect" width="100%" height={8} className="rounded-full" />
            </div>
            {/* Episodes List Skeleton */}
            <div className="space-y-2.5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/80 border border-black/5 rounded-2xl">
                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                            <Skeleton variant="circle" width={26} height={26} className="shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton variant="text" width="60%" height={14} />
                                <Skeleton variant="text" width="30%" height={10} />
                            </div>
                        </div>
                        <Skeleton variant="rect" width={70} height={28} className="rounded-xl shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const NotificationsSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
    return (
        <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-black/5 rounded-3xl">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-4">
                        <Skeleton variant="circle" width={44} height={44} className="shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="70%" height={14} />
                            <Skeleton variant="text" width="40%" height={10} />
                        </div>
                    </div>
                    <Skeleton variant="rect" width={24} height={24} className="rounded-lg shrink-0 opacity-40" />
                </div>
            ))}
        </div>
    );
};

export const UserListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <div className="flex flex-col gap-2.5 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-black/5">
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <Skeleton variant="circle" width={42} height={42} className="shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton variant="text" width="55%" height={14} />
                            <Skeleton variant="text" width="35%" height={11} />
                        </div>
                    </div>
                    <Skeleton variant="rect" width={72} height={32} className="rounded-xl shrink-0" />
                </div>
            ))}
        </div>
    );
};

export const CommentsListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton variant="circle" width={38} height={38} className="shrink-0 mt-1" />
                    <div className="flex-1 bg-white/80 border border-black/5 rounded-2xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                            <Skeleton variant="text" width={100} height={13} />
                            <Skeleton variant="text" width={50} height={10} />
                        </div>
                        <Skeleton variant="text" width="90%" height={13} />
                        <Skeleton variant="text" width="60%" height={13} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ContinueWatchingSkeleton: React.FC = () => {
    return (
        <div className="w-full flex flex-col gap-3 py-2 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton variant="circle" width={22} height={22} />
                    <Skeleton variant="text" width={140} height={16} />
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[240px] sm:min-w-[280px] bg-white border border-black/5 rounded-2xl p-3 flex flex-col gap-2 shrink-0">
                        <Skeleton variant="rect" width="100%" height={130} className="rounded-xl" />
                        <Skeleton variant="text" width="70%" height={14} />
                        <div className="flex justify-between items-center pt-1">
                            <Skeleton variant="text" width="40%" height={10} />
                            <Skeleton variant="rect" width={50} height={18} className="rounded-md" />
                        </div>
                        <Skeleton variant="rect" width="100%" height={5} className="rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CompareSkeleton: React.FC = () => {
    return (
        <div className="w-full space-y-8 animate-pulse">
            {/* Header / Two User Hero */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="flex flex-col items-center gap-2">
                    <Skeleton variant="circle" width={80} height={80} />
                    <Skeleton variant="text" width={90} height={16} />
                    <Skeleton variant="text" width={60} height={12} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton variant="circle" width={64} height={64} />
                    <Skeleton variant="text" width={110} height={12} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton variant="circle" width={80} height={80} />
                    <Skeleton variant="text" width={90} height={16} />
                    <Skeleton variant="text" width={60} height={12} />
                </div>
            </div>
            {/* Shared Grid */}
            <div className="space-y-4">
                <Skeleton variant="text" width={160} height={20} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <Skeleton variant="rect" width="100%" height={220} className="rounded-2xl" />
                            <Skeleton variant="text" width="75%" height={14} />
                            <Skeleton variant="text" width="45%" height={10} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const RankingsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white border border-black/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="text" width="50%" height={20} />
                        <Skeleton variant="rect" width={60} height={22} className="rounded-full" />
                    </div>
                    <Skeleton variant="text" width="80%" height={12} />
                    <div className="flex gap-3 pt-2">
                        {[...Array(4)].map((_, j) => (
                            <Skeleton key={j} variant="rect" width={56} height={84} className="rounded-xl shrink-0" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
