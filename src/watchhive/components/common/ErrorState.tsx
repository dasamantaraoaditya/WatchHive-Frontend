import React from 'react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    isDismissable?: boolean;
    onDismiss?: () => void;
    illustration?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = "The Hive is Currently Unreachable",
    message = "We're unable to connect to WatchHive servers right now. Please check your internet connection or try again in a few moments.",
    onRetry,
    className = "",
    isDismissable,
    onDismiss,
    illustration
}) => {
    return (
        <div 
            className={`flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-amber-500/5 via-white to-white rounded-[32px] border border-amber-500/20 shadow-sm my-6 max-w-xl mx-auto ${className}`}
            role="alert"
        >
            {illustration || (
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-200/60 shadow-inner relative">
                    <span className="absolute -inset-2 bg-amber-500/10 rounded-full blur-xl animate-pulse"></span>
                    <span className="material-symbols-outlined text-4xl text-amber-500 relative z-10">
                        wifi_off
                    </span>
                </div>
            )}
            
            <h3 className="text-2xl font-black text-[#2D2926] tracking-tight mb-2">
                {title}
            </h3>
            
            <p className="text-sm font-bold text-slate-500 max-w-md leading-relaxed mb-8">
                {message}
            </p>
            
            <div className="flex items-center gap-3">
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="bg-[#ffb700] hover:bg-[#ffc83b] text-white font-black py-3.5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#ffb700]/25 active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base font-bold">refresh</span>
                        Retry Connection
                    </button>
                )}
                {isDismissable && onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="bg-slate-100 hover:bg-slate-200 text-[#2D2926] font-extrabold py-3.5 px-6 rounded-2xl text-[10px] uppercase tracking-wider transition-colors active:scale-95"
                    >
                        Dismiss
                    </button>
                )}
            </div>
        </div>
    );
};
