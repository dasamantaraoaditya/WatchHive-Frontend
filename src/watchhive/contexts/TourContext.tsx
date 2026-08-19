import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export interface TourStep {
    target: string;
    title: string;
    content: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '.wh-sidebar__link[href*="feed"], .wh-bottom-nav__link[href*="feed"], #nav-link-feed',
        title: 'Step 1: Home & Social Feed 🏠',
        content: 'Home is your central hub! Here you can explore your main activity feed, discover trending recommendations, and read real reviews from people in your swarm.',
        placement: 'right'
    },
    {
        target: '.wh-sidebar__link[href*="entries"], .wh-bottom-nav__link[href*="entries"], #nav-link-entries',
        title: 'Step 2: Activity Tabs 🎬',
        content: 'Your activity is organized in four clear tabs: Currently Watching (active sessions), Watch History (completed entries & ratings), Suggestions (titles recommended by friends), and Watchlist (saved backlog).',
        placement: 'right'
    },
    {
        target: '.wh-sidebar__link[href*="search"], .wh-bottom-nav__link[href*="search"], #nav-link-search',
        title: 'Step 3: Search & Follow People 👥',
        content: 'Want to build your swarm? Open Search and switch to the Users tab to find people by username or display name, view their activity, and send follow requests!',
        placement: 'right'
    },
    {
        target: '[title="Quick Actions"]',
        title: 'Step 4: Quick Add — Hive Switch ⚡',
        content: 'Tap the golden ⊕ button anytime to quickly: Log a completed watch entry, Log a currently watching title, Suggest a movie to a friend, or Bookmark to your Watchlist.',
        placement: 'left'
    },
    {
        target: '#nav-profile-trigger, .wh-sidebar__user',
        title: 'Step 5: Profile & Privacy Controls ⚙️',
        content: 'Click your avatar to open your Profile! Customize your bio and avatar, and control account visibility — choose Public, Followers Only, or Private with manual follow request approvals.',
        placement: 'bottom'
    },
    {
        target: '.wh-sidebar__link[href*="mindlens"], .wh-bottom-nav__link[href*="mindlens"], #nav-link-mindlens',
        title: 'Step 6: MindLens & Personal Rankings 🧠🏆',
        content: 'Explore MindLens for AI-powered viewing taste analysis and genre insights. Head to Rankings to curate and share top-tier lists ("Top 10 Thrillers", "Fav Comfort Shows").',
        placement: 'right'
    },
    {
        target: '.wh-sidebar__link[href*="search"], .wh-bottom-nav__link[href*="search"], #nav-link-search',
        title: 'Step 7: Search Movies & TV Details 🔍',
        content: 'Search any movie or TV show to inspect rich detail pages — view cast & crew, streaming platform availability (Where to Watch), ratings, seasons, and episode guides!',
        placement: 'right'
    }
];

const STEP_ROUTES: (string | null)[] = [
    '/watch-hive/feed',
    '/watch-hive/entries?tab=watching',
    '/watch-hive/search?tab=users',
    null,
    '/watch-hive/profile',
    '/watch-hive/mindlens',
    '/watch-hive/search?tab=media',
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
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showWelcome, setShowWelcome] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

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

    // Auto-navigate to relevant route when step changes
    useEffect(() => {
        if (!isActive) return;
        const targetRoute = STEP_ROUTES[currentStepIndex];
        if (targetRoute) {
            navigate(targetRoute);
        }
    }, [isActive, currentStepIndex, navigate]);

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
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
                setTargetRect(element.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        // Delay measurement slightly after route navigation for DOM stability
        const timer = setTimeout(updateRect, 150);

        const handleLayoutUpdate = () => {
            const step = TOUR_STEPS[currentStepIndex];
            if (!step) return;
            const element = queryVisibleElement(step.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            }
        };

        window.addEventListener('resize', handleLayoutUpdate);
        window.addEventListener('scroll', handleLayoutUpdate);
        
        return () => {
            clearTimeout(timer);
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
    const isMovieDetailsPage = typeof window !== 'undefined' && window.location.pathname.includes('/details/');

    // Compute boundary-safe tooltip position — mobile-optimized top/bottom positioning
    const getTooltipStyle = (): React.CSSProperties => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Mobile optimization: position tooltip away from target so target is 100% visible
        if (vw < 768) {
            const targetY = targetRect ? (targetRect.top + targetRect.height / 2) : (vh / 2);
            // If target is in lower half of screen (e.g. bottom nav or FAB), place tooltip at TOP
            if (targetY > vh / 2) {
                return {
                    position: 'fixed',
                    left: '12px',
                    right: '12px',
                    top: '72px',
                    width: 'calc(100vw - 24px)',
                    maxWidth: 'none',
                    zIndex: 3000
                };
            } else {
                // Target is in upper half of screen (e.g. header avatar), place tooltip at BOTTOM
                return {
                    position: 'fixed',
                    left: '12px',
                    right: '12px',
                    bottom: '84px',
                    width: 'calc(100vw - 24px)',
                    maxWidth: 'none',
                    zIndex: 3000
                };
            }
        }

        if (!targetRect) {
            return {
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3000
            };
        }

        const gap = 14;
        const PAD = 16;
        const TW = tooltipRef.current?.offsetWidth ?? 340;
        const TH = tooltipRef.current?.offsetHeight ?? 220;

        let left: number;
        let top: number;

        switch (activeStep?.placement) {
            case 'left':
                left = targetRect.left - gap - TW;
                top  = targetRect.top + targetRect.height / 2 - TH / 2;
                break;
            case 'right':
                left = targetRect.right + gap;
                top  = targetRect.top + targetRect.height / 2 - TH / 2;
                break;
            case 'top':
                left = targetRect.left + targetRect.width / 2 - TW / 2;
                top  = targetRect.top - gap - TH;
                break;
            case 'bottom':
            default:
                left = targetRect.left + targetRect.width / 2 - TW / 2;
                top  = targetRect.bottom + gap;
                break;
        }

        left = Math.max(PAD, Math.min(left, vw - TW - PAD));
        top  = Math.max(PAD, Math.min(top,  vh - TH - PAD));

        return { position: 'fixed', left: `${left}px`, top: `${top}px`, zIndex: 3000 };
    };

    return (
        <TourContext.Provider value={{ isActive, currentStepIndex, startTour, nextStep, prevStep, skipTour }}>
            {children}

            {/* Welcome Banner Dialog (Non-Intrusive, Mobile-Friendly) */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-4 left-3 right-3 md:left-6 md:right-auto md:max-w-sm bg-white/95 backdrop-blur-xl border border-[#ffb700]/30 rounded-[28px] shadow-[0_20px_50px_rgba(255,183,0,0.2)] p-5 z-[3000] flex flex-col gap-4 font-sans border-l-4 border-l-[#ffb700]"
                    >
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-[#ffb700] text-3xl font-bold flex-shrink-0">auto_awesome</span>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <h4 className="text-sm font-black text-[#2D2926]">Welcome to WatchHive! 🐝</h4>
                                <p className="text-[11px] font-bold text-[#2D2926]/60 leading-relaxed mt-1">
                                    Take a quick 7-step guided tour to learn how to navigate your feed, activity logs, finding friends, Quick Add, profile privacy, MindLens AI analytics, and movie details!
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
                {isActive && (
                    <>
                        {/* Masked Spotlight SVG with Golden Glow Ring */}
                        {!isMovieDetailsPage && targetRect && targetRect.width > 10 && targetRect.height > 10 ? (
                            <svg className="fixed inset-0 pointer-events-none z-[2400] w-full h-full">
                                <defs>
                                    <mask id="tour-spotlight-mask">
                                        <rect width="100%" height="100%" fill="white" />
                                        <rect
                                            x={targetRect.left - 8}
                                            y={targetRect.top - 8}
                                            width={targetRect.width + 16}
                                            height={targetRect.height + 16}
                                            rx={Math.abs(targetRect.width - targetRect.height) < 8 ? "9999" : "18"}
                                            fill="black"
                                        />
                                    </mask>
                                </defs>
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="rgba(30, 27, 25, 0.65)"
                                    mask="url(#tour-spotlight-mask)"
                                    className="pointer-events-auto cursor-default"
                                />
                                {/* Pulsing Golden Ring Framing Highlighted Target */}
                                <rect
                                    x={targetRect.left - 8}
                                    y={targetRect.top - 8}
                                    width={targetRect.width + 16}
                                    height={targetRect.height + 16}
                                    rx={Math.abs(targetRect.width - targetRect.height) < 8 ? "9999" : "18"}
                                    fill="none"
                                    stroke="#ffb700"
                                    strokeWidth="3"
                                    className="animate-pulse pointer-events-none"
                                    style={{ filter: 'drop-shadow(0 0 10px rgba(255, 183, 0, 0.9))' }}
                                />
                            </svg>
                        ) : (
                            /* Translucent subtle overlay when in movie view or no target */
                            <div 
                                className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[2400] pointer-events-auto cursor-default transition-all"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}

                        {/* Interactive Mobile-Friendly Tooltip Card */}
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            style={getTooltipStyle()}
                            className="w-[calc(100vw-24px)] md:w-[340px] max-w-[360px] bg-white/95 backdrop-blur-xl border border-[#ffb700]/30 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 md:p-5 flex flex-col gap-3 font-sans select-none border-t-4 border-t-[#ffb700] z-[3000]"
                        >
                            {/* Step Indicator & Progress Bar */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 bg-[#ffb700]/10 text-[#ffb700] rounded-md text-[9px] font-black uppercase tracking-wider">
                                        Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                                    </span>
                                    <button
                                        onClick={skipTour}
                                        className="text-[9px] font-black text-neutral-400 hover:text-[#ffb700] uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Skip Tour
                                    </button>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-[#ffb700] h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="flex flex-col gap-1">
                                <h4 className="text-[13px] md:text-[14px] font-black text-[#2D2926] tracking-tight flex items-center gap-1.5">
                                    {activeStep.title}
                                </h4>
                                <p className="text-[11px] leading-relaxed text-[#2D2926]/75 font-bold">
                                    {activeStep.content}
                                </p>
                            </div>

                            {/* Tooltip Navigation */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#ffb700]/10 mt-0.5">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStepIndex === 0}
                                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none text-neutral-600 text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-4 py-1.5 bg-[#ffb700] text-white hover:brightness-105 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffb700]/15 flex items-center gap-1 cursor-pointer active:scale-95"
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
