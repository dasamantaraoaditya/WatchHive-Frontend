import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#FFF9F0]">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-[#ffb700]/30 p-8 shadow-xl text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#ffb700]/20 flex items-center justify-center text-3xl">
                            🐝
                        </div>
                        <h2 className="text-2xl font-black text-[#2D2926]">
                            Something went wrong
                        </h2>
                        <p className="text-sm font-medium text-[#737373] leading-relaxed">
                            A temporary glitch occurred while loading this view. You can retry or head back home.
                        </p>
                        {this.state.error && (
                            <div className="w-full bg-[#FFF9F0] border border-amber-200/60 rounded-xl p-3 text-left">
                                <p className="text-[11px] font-mono text-[#2D2926]/70 truncate">
                                    {this.state.error.message || 'Unknown error'}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-3 w-full pt-2">
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="flex-1 py-3 px-4 rounded-2xl bg-[#ffb700] hover:bg-[#ffc83b] text-[#2D2926] font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#ffb700]/20 cursor-pointer"
                            >
                                Try Again
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = '/';
                                }}
                                className="flex-1 py-3 px-4 rounded-2xl bg-white border border-[#2D2926]/15 hover:bg-slate-50 text-[#2D2926] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
