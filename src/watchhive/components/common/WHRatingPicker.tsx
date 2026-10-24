import React, { useState, useRef, useCallback } from 'react';

export interface WHRatingMoodInfo {
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    text: string;
}

export interface WHRatingPickerProps {
    rating: number | undefined;
    onRatingChanged: (newRating: number | undefined) => void;
    enabled?: boolean;
    className?: string;
}

interface MovieCheckpoint {
    score: number;
    label: string;
    sublabel: string;
    color: string;
}

const CHECKPOINTS: MovieCheckpoint[] = [
    { score: 0.0, label: '0', sublabel: 'Start', color: '#8A8580' },
    { score: 2.0, label: '2 🗑️', sublabel: 'Flop', color: '#EF4444' },
    { score: 4.0, label: '4 👎', sublabel: 'Skip', color: '#F97316' },
    { score: 6.0, label: '6 🍿', sublabel: 'Decent', color: '#84CC16' },
    { score: 8.0, label: '8 🔥', sublabel: 'Hit', color: '#10B981' },
    { score: 10.0, label: '10 🏆', sublabel: 'Epic', color: '#BFA034' },
];

const PRESETS = [
    { score: 2.0, emoji: '🗑️', label: 'Flop', color: '#EF4444' },
    { score: 5.0, emoji: '🍿', label: 'Mid', color: '#EAB308' },
    { score: 7.0, emoji: '👍', label: 'Good', color: '#84CC16' },
    { score: 8.5, emoji: '🔥', label: 'Great', color: '#10B981' },
    { score: 10.0, emoji: '🏆', label: 'Epic', color: '#BFA034' },
];

export function getMoodInfo(rating?: number): WHRatingMoodInfo {
    if (rating === undefined || rating <= 0) {
        return {
            icon: 'movie',
            color: '#8A8580',
            bgColor: 'rgba(138, 133, 128, 0.08)',
            borderColor: 'rgba(138, 133, 128, 0.2)',
            text: 'Slide checkpoints to rate movie',
        };
    }
    if (rating <= 2.0) {
        return {
            icon: 'sentiment_very_dissatisfied',
            color: '#EF4444',
            bgColor: 'rgba(239, 68, 68, 0.09)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            text: 'Disaster / Complete Waste of Time 🗑️',
        };
    }
    if (rating <= 4.0) {
        return {
            icon: 'sentiment_dissatisfied',
            color: '#F97316',
            bgColor: 'rgba(249, 115, 22, 0.09)',
            borderColor: 'rgba(249, 115, 22, 0.3)',
            text: 'Poor / Not Recommended 👎',
        };
    }
    if (rating <= 5.5) {
        return {
            icon: 'sentiment_neutral',
            color: '#EAB308',
            bgColor: 'rgba(234, 179, 8, 0.09)',
            borderColor: 'rgba(234, 179, 8, 0.3)',
            text: 'Mediocre / Average 🍿',
        };
    }
    if (rating <= 7.0) {
        return {
            icon: 'sentiment_satisfied',
            color: '#84CC16',
            bgColor: 'rgba(132, 204, 22, 0.09)',
            borderColor: 'rgba(132, 204, 22, 0.3)',
            text: 'Decent / Enjoyable 👍',
        };
    }
    if (rating <= 8.5) {
        return {
            icon: 'sentiment_very_satisfied',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.09)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            text: 'Excellent / Highly Recommended 🔥',
        };
    }
    if (rating <= 9.5) {
        return {
            icon: 'grade',
            color: '#ffb700',
            bgColor: 'rgba(255, 183, 0, 0.12)',
            borderColor: 'rgba(255, 183, 0, 0.38)',
            text: 'Outstanding / Near Flawless 🌟',
        };
    }
    return {
        icon: 'emoji_events',
        color: '#BFA034',
        bgColor: 'rgba(191, 160, 52, 0.14)',
        borderColor: 'rgba(191, 160, 52, 0.45)',
        text: 'Absolute Masterpiece / Cinematic Perfection 🏆',
    };
}

function getTrackGradient(rating: number): string {
    if (rating <= 2.0) {
        return 'linear-gradient(90deg, #B91C1C 0%, #EF4444 60%, #F87171 100%)';
    }
    if (rating <= 4.0) {
        return 'linear-gradient(90deg, #C2410C 0%, #F97316 60%, #FB923C 100%)';
    }
    if (rating <= 5.5) {
        return 'linear-gradient(90deg, #B45309 0%, #EAB308 60%, #FDE047 100%)';
    }
    if (rating <= 7.0) {
        return 'linear-gradient(90deg, #4D7C0F 0%, #84CC16 60%, #A3E635 100%)';
    }
    if (rating <= 8.5) {
        return 'linear-gradient(90deg, #047857 0%, #10B981 60%, #34D399 100%)';
    }
    if (rating <= 9.5) {
        return 'linear-gradient(90deg, #D97706 0%, #FFB700 60%, #FFDA40 100%)';
    }
    return 'linear-gradient(90deg, #B5A67C 0%, #DCD2AE 20%, #FFFFFF 40%, #F9E8A2 60%, #DEBC52 80%, #BFA034 100%)';
}

export const WHRatingPicker: React.FC<WHRatingPickerProps> = ({
    rating,
    onRatingChanged,
    enabled = true,
    className = '',
}) => {
    const [isInteracting, setIsInteracting] = useState(false);
    const trackContainerRef = useRef<HTMLDivElement>(null);

    const currentScore = rating ?? 0;
    const isRated = rating !== undefined && rating > 0;
    const mood = getMoodInfo(currentScore);

    const calculateScoreFromClientX = useCallback((clientX: number) => {
        if (!trackContainerRef.current) return 0;
        const rect = trackContainerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return 0;

        const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const progress = relativeX / rect.width;
        const rawScore = progress * 10;
        // 0.1 decimal precision snap
        const snapped = Math.round(rawScore * 10) / 10;
        return Math.max(0, Math.min(10, snapped));
    }, []);

    const updateScoreFromPointer = useCallback((clientX: number) => {
        if (!enabled) return;
        const newScore = calculateScoreFromClientX(clientX);
        onRatingChanged(newScore === 0 ? undefined : newScore);
    }, [enabled, calculateScoreFromClientX, onRatingChanged]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!enabled) return;
        e.preventDefault();
        setIsInteracting(true);
        updateScoreFromPointer(e.clientX);

        const handlePointerMove = (moveEvent: PointerEvent) => {
            updateScoreFromPointer(moveEvent.clientX);
        };

        const handlePointerUp = () => {
            setIsInteracting(false);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!enabled) return;
        let delta = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            delta = e.shiftKey ? 0.5 : 0.1;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            delta = e.shiftKey ? -0.5 : -0.1;
        } else if (e.key === 'Home') {
            onRatingChanged(undefined);
            return;
        } else if (e.key === 'End') {
            onRatingChanged(10.0);
            return;
        }

        if (delta !== 0) {
            e.preventDefault();
            const nextScore = Math.max(0, Math.min(10, Math.round(((rating ?? 0) + delta) * 10) / 10));
            onRatingChanged(nextScore === 0 ? undefined : nextScore);
        }
    };

    const handlePresetClick = (target: number) => {
        if (!enabled) return;
        if (rating !== undefined && Math.abs(rating - target) < 0.05) {
            onRatingChanged(undefined);
        } else {
            onRatingChanged(target);
        }
    };

    const progressPercent = Math.max(0, Math.min(100, (currentScore / 10) * 100));

    return (
        <div
            className={`w-full select-none rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden bg-white/95 dark:bg-[#221c13]/95 border ${
                isRated ? 'shadow-lg' : 'shadow-sm'
            } ${className}`}
            style={{
                borderColor: isRated ? `${mood.color}45` : 'rgba(255, 183, 0, 0.2)',
                boxShadow: isRated
                    ? `0 10px 25px -5px ${mood.color}25, 0 4px 10px -3px rgba(0, 0, 0, 0.05)`
                    : '0 4px 14px -2px rgba(45, 41, 38, 0.05)',
            }}
        >
            {/* ── 1. Top Score Header (Icon + Big Score + Reset) ── */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border transform"
                        style={{
                            backgroundColor: isRated ? `${mood.color}18` : 'rgba(45, 41, 38, 0.05)',
                            borderColor: isRated ? `${mood.color}50` : 'rgba(45, 41, 38, 0.1)',
                            transform: isInteracting ? 'scale(1.12)' : 'scale(1.0)',
                            color: isRated ? mood.color : '#8A8580',
                        }}
                    >
                        <span className="material-symbols-outlined text-[22px] transition-colors duration-200">
                            {mood.icon}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span
                            className="font-black text-3xl sm:text-4xl tracking-tight leading-none transition-all duration-200"
                            style={{
                                color: isRated ? mood.color : '#8A8580',
                                transform: isInteracting ? 'scale(1.04)' : 'scale(1.0)',
                            }}
                        >
                            {isRated ? currentScore.toFixed(1) : '—.—'}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#2D2926]/40 dark:text-white/40">
                            / 10
                        </span>
                    </div>
                </div>

                {isRated && enabled && (
                    <button
                        type="button"
                        onClick={() => onRatingChanged(undefined)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition-all duration-200 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[13px]">close</span>
                        <span>Reset</span>
                    </button>
                )}
            </div>

            {/* ── 2. Movie Checkpoint Horizontal Slider Bar ── */}
            <div
                className="w-full pt-1 pb-3 touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#ffb700]/50 rounded-xl"
                tabIndex={enabled ? 0 : -1}
                role="slider"
                aria-label="Movie rating score slider"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={currentScore}
                aria-valuetext={isRated ? `${currentScore.toFixed(1)} out of 10` : 'Unrated'}
                onKeyDown={handleKeyDown}
            >
                {/* Checkpoint Labels Above Track */}
                <div className="relative w-full h-8 mb-1 pointer-events-none">
                    {CHECKPOINTS.map((cp) => {
                        const percent = (cp.score / 10) * 100;
                        const isReached = isRated && currentScore >= cp.score;
                        const isSelectedCp = isRated && Math.abs(currentScore - cp.score) < 0.25;

                        return (
                            <div
                                key={cp.score}
                                className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-200"
                                style={{
                                    left: `${percent}%`,
                                    color: isReached ? cp.color : '#8A8580',
                                    opacity: isReached ? 1 : 0.65,
                                }}
                            >
                                <span
                                    className={`text-[10px] sm:text-[11px] leading-tight font-extrabold whitespace-nowrap transition-transform duration-150 ${
                                        isSelectedCp ? 'scale-110 font-black' : ''
                                    }`}
                                >
                                    {cp.label}
                                </span>
                                <span className="text-[8.5px] font-bold tracking-tight uppercase leading-none opacity-80 whitespace-nowrap">
                                    {cp.sublabel}
                                </span>
                                {/* Connector Stem */}
                                <div
                                    className="w-[1.5px] h-2 mt-0.5 rounded-full transition-colors duration-200"
                                    style={{
                                        backgroundColor: isReached ? `${cp.color}90` : 'rgba(45, 41, 38, 0.15)',
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Interactive Track Area */}
                <div
                    ref={trackContainerRef}
                    onPointerDown={handlePointerDown}
                    className={`relative w-full h-7 flex items-center cursor-pointer ${
                        !enabled ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                >
                    {/* Inactive Track Groove */}
                    <div className="absolute inset-x-0 h-2 rounded-full bg-[#2D2926]/10 dark:bg-white/10 transition-colors" />

                    {/* Active Progress Bar with Dynamic Gradient & Glow */}
                    {isRated && (
                        <div
                            className="absolute left-0 h-2 rounded-full transition-all duration-75 relative"
                            style={{
                                width: `${progressPercent}%`,
                                background: getTrackGradient(currentScore),
                                boxShadow: `0 0 14px ${mood.color}80, 0 0 4px ${mood.color}`,
                            }}
                        />
                    )}

                    {/* Checkpoint Node Dots on Track */}
                    {CHECKPOINTS.map((cp) => {
                        const percent = (cp.score / 10) * 100;
                        const isReached = isRated && currentScore >= cp.score;
                        const isSelectedCp = isRated && Math.abs(currentScore - cp.score) < 0.25;

                        return (
                            <div
                                key={`node-${cp.score}`}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none rounded-full flex items-center justify-center transition-all duration-200"
                                style={{
                                    left: `${percent}%`,
                                    width: isSelectedCp ? 14 : 11,
                                    height: isSelectedCp ? 14 : 11,
                                    backgroundColor: isReached ? cp.color : '#FFFFFF',
                                    border: `2px solid ${isReached ? cp.color : 'rgba(45, 41, 38, 0.25)'}`,
                                    boxShadow: isReached && isSelectedCp ? `0 0 8px ${cp.color}` : 'none',
                                }}
                            >
                                <div
                                    className="w-1 h-1 rounded-full"
                                    style={{
                                        backgroundColor: isReached ? '#FFFFFF' : 'rgba(45, 41, 38, 0.35)',
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Active Thumb Knob */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none rounded-full flex items-center justify-center transition-transform duration-75"
                        style={{
                            left: `${progressPercent}%`,
                            width: isInteracting ? 24 : 20,
                            height: isInteracting ? 24 : 20,
                            backgroundColor: '#FFFFFF',
                            boxShadow: isRated
                                ? `0 0 ${isInteracting ? 18 : 12}px ${mood.color}, 0 2px 6px rgba(0,0,0,0.25)`
                                : '0 2px 6px rgba(0,0,0,0.15)',
                            transform: `translate(-50%, -50%) scale(${isInteracting ? 1.15 : 1.0})`,
                        }}
                    >
                        <div
                            className="rounded-full transition-colors duration-150"
                            style={{
                                width: isInteracting ? 11 : 9,
                                height: isInteracting ? 11 : 9,
                                backgroundColor: isRated ? mood.color : '#8A8580',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── 3. Cinephile Mood Sentiment Banner ── */}
            <div
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 text-center mb-3"
                style={{
                    backgroundColor: mood.bgColor,
                    borderColor: mood.borderColor,
                    color: isRated ? mood.color : '#8A8580',
                }}
            >
                <span className="material-symbols-outlined text-[17px] shrink-0">{mood.icon}</span>
                <span className="text-xs font-black tracking-wide truncate">{mood.text}</span>
            </div>

            {/* ── 4. Quick Snap Presets Header & Action Cue ── */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-[#ffb700]">touch_app</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2D2926]/50 dark:text-white/50">
                        Quick Snap Presets
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] font-bold text-[#2D2926]/40 dark:text-white/40">
                    <span className="material-symbols-outlined text-[11px] text-[#ffb700]">bolt</span>
                    <span>Tap to set instantly</span>
                </div>
            </div>

            {/* ── Contained In-Box Quick Snap Presets ── */}
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#2D2926]/[0.03] dark:bg-white/[0.04] rounded-2xl border border-[#2D2926]/5 dark:border-white/5">
                {PRESETS.map((preset) => {
                    const isSelected = isRated && Math.abs(currentScore - preset.score) < 0.05;

                    return (
                        <button
                            key={preset.score}
                            type="button"
                            disabled={!enabled}
                            onClick={() => handlePresetClick(preset.score)}
                            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 border text-center ${
                                isSelected
                                    ? 'shadow-sm scale-[1.02]'
                                    : 'bg-white dark:bg-[#1a160d] hover:bg-[#FFF9F0] dark:hover:bg-white/10'
                            }`}
                            style={{
                                backgroundColor: isSelected ? `${preset.color}15` : undefined,
                                borderColor: isSelected ? preset.color : 'rgba(45, 41, 38, 0.08)',
                                boxShadow: isSelected ? `0 2px 8px ${preset.color}35` : undefined,
                            }}
                        >
                            <div className="flex items-center gap-0.5 leading-none mb-0.5">
                                {isSelected ? (
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-white"
                                        style={{ backgroundColor: preset.color }}
                                    >
                                        <span className="material-symbols-outlined text-[8px] font-black">check</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px]">{preset.emoji}</span>
                                )}
                                <span
                                    className="text-[10.5px] font-black"
                                    style={{ color: isSelected ? preset.color : undefined }}
                                >
                                    {preset.score.toFixed(1)}
                                </span>
                            </div>
                            <span
                                className="text-[9px] font-extrabold uppercase tracking-tight leading-none"
                                style={{
                                    color: isSelected ? preset.color : 'rgba(45, 41, 38, 0.55)',
                                }}
                            >
                                {preset.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default WHRatingPicker;
