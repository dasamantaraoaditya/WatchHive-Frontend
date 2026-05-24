import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

export interface TourStep {
    target: string;
    title: string;
    content: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '[title="Quick Actions"]',
        title: 'Quick Actions FAB ⚡',
        content: 'Your primary hive switch. Click here to log a watch, start currently watching a show, bookmark to your watchlist, or suggest a title to a friend instantly!',
        placement: 'left'
    },
    {
        target: '.wh-sidebar__link[href*="mindlens"], .wh-bottom-nav__link[href*="mindlens"]',
        title: 'MindLens Intelligence 🧠',
        content: 'Discover high-fidelity data intelligence, deep genre clusters, and predictive analytics calculated directly from your viewing logs!',
        placement: 'right'
    },
    {
        target: '.wh-sidebar__honey-level, [title="Notifications"]',
        title: 'Honey Level & Notifications 🐝',
        content: 'Earn XP for logging entries and building stack lists. Keep an eye on the notification bell for recommendations from your swarm!',
        placement: 'right'
    }
];

interface TourContextType {
    isActive: boolean;
    currentStepIndex: number;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) throw new Error('useTour must be used within a TourProvider');
    return context;
};

// Select the first visible DOM node matching a selector query to prevent highlighting hidden media queries
const queryVisibleElement = (selector: string): HTMLElement | null => {
    try {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const rect = el.getBoundingClientRect();
            // Ensure element is visible in the viewport and not display:none (width > 0, height > 0)
            if (rect.width > 0 && rect.height > 0) {
                return el;
            }
        }
        return (elements[0] as HTMLElement) || null;
    } catch {
        return null;
    }
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showWelcome, setShowWelcome] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Check if tour is completed for this user
    useEffect(() => {
        if (isAuthenticated) {
            const completed = localStorage.getItem('wh_tour_completed');
            if (!completed) {
                // Delay showing welcome card for smooth page mount
                const timer = setTimeout(() => {
                    setShowWelcome(true);
                }, 1500);
                return () => clearTimeout(timer);
            }
        } else {
            setIsActive(false);
            setShowWelcome(false);
        }
    }, [isAuthenticated]);

    // Handle spotlight target rect updates dynamically and instantaneously
    useEffect(() => {
        if (!isActive) {
            setTargetRect(null);
            return;
        }

        const updateRect = () => {
            const step = TOUR_STEPS[currentStepIndex];
            if (!step) return;
            const element = queryVisibleElement(step.target);
            if (element) {
                // Scroll instantly to avoid measurements during smooth-scrolling animations
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
                setTargetRect(element.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        // Initial measurement
        updateRect();

        const handleLayoutUpdate = () => {
            const step = TOUR_STEPS[currentStepIndex];
            if (!step) return;
            const element = queryVisibleElement(step.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            }
        };

        // Listeners for layout adjustments
        window.addEventListener('resize', handleLayoutUpdate);
        window.addEventListener('scroll', handleLayoutUpdate);
        
        return () => {
            window.removeEventListener('resize', handleLayoutUpdate);
            window.removeEventListener('scroll', handleLayoutUpdate);
        };
    }, [isActive, currentStepIndex]);

    const startTour = () => {
        setShowWelcome(false);
        setCurrentStepIndex(0);
        setIsActive(true);
    };

    const nextStep = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const skipTour = () => {
        setIsActive(false);
        setShowWelcome(false);
        localStorage.setItem('wh_tour_completed', 'true');
    };

    const completeTour = () => {
        setIsActive(false);
        localStorage.setItem('wh_tour_completed', 'true');
    };

    const activeStep = TOUR_STEPS[currentStepIndex];

    // Compute absolute tooltip placement relative to the viewport coordinates
    const getTooltipPlacement = () => {
        if (!targetRect) return {};
        
        // Safety Fallback for mobile and small tablets (Centered Bottom Drawer)
        if (window.innerWidth < 768) {
            return {
                position: 'fixed' as const,
                left: '16px',
                right: '16px',
                bottom: '24px',
                width: 'calc(100% - 32px)',
                zIndex: 2000
            };
        }

        const gap = 14;
        
        switch (activeStep.placement) {
            case 'left':
                return {
                    position: 'fixed' as const,
                    left: `${targetRect.left - gap}px`,
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    transform: 'translate(-100%, -50%)',
                    zIndex: 2000
                };
            case 'right':
                return {
                    position: 'fixed' as const,
                    left: `${targetRect.left + targetRect.width + gap}px`,
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    transform: 'translate(0, -50%)',
                    zIndex: 2000
                };
            case 'top':
                return {
                    position: 'fixed' as const,
                    left: `${targetRect.left + targetRect.width / 2}px`,
                    top: `${targetRect.top - gap}px`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 2000
                };
            case 'bottom':
            default:
                return {
                    position: 'fixed' as const,
                    left: `${targetRect.left + targetRect.width / 2}px`,
                    top: `${targetRect.top + targetRect.height + gap}px`,
                    transform: 'translate(-50%, 0)',
                    zIndex: 2000
                };
        }
    };

    return (
        <TourContext.Provider value={{ isActive, currentStepIndex, startTour, nextStep, prevStep, skipTour }}>
            {children}

            {/* Welcome Banner Dialog (Non-Intrusive) */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 left-6 max-w-sm bg-white border border-[#ffb700]/25 rounded-[24px] shadow-[0_15px_40px_rgba(255,183,0,0.15)] p-5 z-[2100] flex flex-col gap-4 font-sans border-l-4 border-l-[#ffb700]"
                    >
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-[#ffb700] text-3xl font-bold">auto_awesome</span>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <h4 className="text-sm font-black text-[#2D2926]">Welcome to WatchHive! 🐝</h4>
                                <p className="text-[11px] font-bold text-[#2D2926]/60 leading-relaxed mt-1">
                                    Unlock your new cinematic workspace with a short, 30-second guided tour.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-[#ffb700]/10">
                            <button
                                onClick={skipTour}
                                className="px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Skip
                            </button>
                            <button
                                onClick={startTour}
                                className="px-4 py-2 bg-[#ffb700] text-white hover:brightness-105 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffb700]/15 cursor-pointer"
                            >
                                Start Tour
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Guided Tour Backdrop & Spotlight */}
            <AnimatePresence>
                {isActive && targetRect && (
                    <>
                        {/* Masked Spotlight SVG */}
                        <svg className="fixed inset-0 pointer-events-none z-[1900] w-full h-full">
                            <defs>
                                <mask id="tour-spotlight-mask">
                                    {/* White matches outside (darken) */}
                                    <rect width="100%" height="100%" fill="white" />
                                    {/* Black cuts out (spotlight clear space) */}
                                    <rect
                                        x={targetRect.left - 6}
                                        y={targetRect.top - 6}
                                        width={targetRect.width + 12}
                                        height={targetRect.height + 12}
                                        rx={Math.abs(targetRect.width - targetRect.height) < 4 ? "9999" : "16"}
                                        fill="black"
                                    />
                                </mask>
                            </defs>
                            {/* Spotlight Background Overlay */}
                            <rect
                                width="100%"
                                height="100%"
                                fill="rgba(45, 41, 38, 0.4)"
                                mask="url(#tour-spotlight-mask)"
                                className="pointer-events-auto cursor-default"
                            />
                        </svg>

                        {/* Interactive Tooltip Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            style={getTooltipPlacement()}
                            className="w-[320px] md:w-[340px] bg-white border border-[#ffb700]/20 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5.5 flex flex-col gap-4 font-sans select-none border-t-4 border-t-[#ffb700]"
                        >
                            {/* Step Count & Skip */}
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 bg-[#ffb700]/10 text-[#ffb700] rounded-md text-[9px] font-black uppercase tracking-wider">
                                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                                </span>
                                <button
                                    onClick={skipTour}
                                    className="text-[9px] font-black text-neutral-400 hover:text-[#ffb700] uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Skip Tour
                                </button>
                            </div>

                            {/* Title & Description */}
                            <div className="flex flex-col gap-1">
                                <h4 className="text-[14px] font-black text-[#2D2926] tracking-tight flex items-center gap-1.5">
                                    {activeStep.title}
                                </h4>
                                <p className="text-[11px] leading-relaxed text-[#2D2926]/75 font-bold mt-1">
                                    {activeStep.content}
                                </p>
                            </div>

                            {/* Tooltip Navigation */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#ffb700]/10 mt-1">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStepIndex === 0}
                                    className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none text-neutral-500 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-4 py-1.5 bg-[#ffb700] text-white hover:brightness-105 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#ffb700]/15 flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                                    <span className="material-symbols-outlined text-[10px] font-bold">arrow_forward</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </TourContext.Provider>
    );
};
