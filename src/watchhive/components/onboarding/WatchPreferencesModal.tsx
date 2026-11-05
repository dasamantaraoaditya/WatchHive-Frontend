import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { BeeLoader } from '../common/BeeLoader';

export interface WatchPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing?: boolean;
    onSaved?: () => void;
}

export const PREF_LANGUAGES = [
    { id: 'te', label: 'Telugu', emoji: '🎬' },
    { id: 'hi', label: 'Hindi', emoji: '🇮🇳' },
    { id: 'en', label: 'English', emoji: '🌐' },
    { id: 'ta', label: 'Tamil', emoji: '🌟' },
    { id: 'ml', label: 'Malayalam', emoji: '🌴' },
    { id: 'kn', label: 'Kannada', emoji: '🌾' },
    { id: 'ko', label: 'Korean', emoji: '🇰🇷' },
    { id: 'ja', label: 'Japanese / Anime', emoji: '⛩️' },
    { id: 'es', label: 'Spanish', emoji: '🇪🇸' },
    { id: 'fr', label: 'French', emoji: '🇫🇷' },
];

export const PREF_GENRES = [
    { id: 'Action', label: 'Action', emoji: '💥', tmdbId: 28 },
    { id: 'Sci-Fi', label: 'Sci-Fi', emoji: '🚀', tmdbId: 878 },
    { id: 'Thriller', label: 'Thriller', emoji: '⚡', tmdbId: 53 },
    { id: 'Drama', label: 'Drama', emoji: '🎭', tmdbId: 18 },
    { id: 'Comedy', label: 'Comedy', emoji: '😂', tmdbId: 35 },
    { id: 'Romance', label: 'Romance', emoji: '❤️', tmdbId: 10749 },
    { id: 'Crime', label: 'Crime', emoji: '🕵️', tmdbId: 80 },
    { id: 'Horror', label: 'Horror', emoji: '👻', tmdbId: 27 },
    { id: 'Animation', label: 'Animation & Anime', emoji: '🎨', tmdbId: 16 },
    { id: 'Mystery', label: 'Mystery', emoji: '🔍', tmdbId: 9648 },
    { id: 'Fantasy', label: 'Fantasy', emoji: '🧙', tmdbId: 14 },
    { id: 'Documentary', label: 'Documentary', emoji: '📽️', tmdbId: 99 },
];

export const PREF_PLATFORMS = [
    { id: 'Netflix', label: 'Netflix', emoji: '🔴' },
    { id: 'Prime Video', label: 'Prime Video', emoji: '📦' },
    { id: 'Disney+ Hotstar', label: 'Disney+ Hotstar', emoji: '⭐' },
    { id: 'Apple TV+', label: 'Apple TV+', emoji: '🍎' },
    { id: 'JioCinema', label: 'JioCinema', emoji: '📺' },
    { id: 'Theatres', label: 'Theatres / Cinema', emoji: '🍿' },
    { id: 'SonyLIV / ZEE5', label: 'SonyLIV / ZEE5', emoji: '📡' },
    { id: 'Crunchyroll', label: 'Crunchyroll', emoji: '🍥' },
];

export const WatchPreferencesModal: React.FC<WatchPreferencesModalProps> = ({
    isOpen,
    onClose,
    isEditing = false,
    onSaved,
}) => {
    const { user, updateUser } = useAuth();
    const { alert } = useCustomAlert();

    const [currentStep, setCurrentStep] = useState(0); // 0: Lang, 1: Genres, 2: Platforms
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize preferences from user
    useEffect(() => {
        if (isOpen && user) {
            const prefs = user.preferences || {};
            setSelectedLanguages(prefs.languages && prefs.languages.length > 0 ? prefs.languages : ['en']);
            setSelectedGenres(prefs.genres || []);
            setSelectedPlatforms(prefs.streamingPlatforms || []);
            setCurrentStep(0);
        }
    }, [isOpen, user]);

    // Prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
        } else {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleLanguage = (id: string) => {
        setSelectedLanguages(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleGenre = (id: string) => {
        setSelectedGenres(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSave = async (skip = false) => {
        setIsSaving(true);
        try {
            const genreIds = selectedGenres
                .map(g => PREF_GENRES.find(item => item.id === g)?.tmdbId)
                .filter((id): id is number => typeof id === 'number');

            const newPreferences = skip
                ? (user?.preferences || {})
                : {
                      languages: selectedLanguages,
                      genres: selectedGenres,
                      genreIds,
                      streamingPlatforms: selectedPlatforms,
                  };

            const updatedUser = await userService.updatePreferences(newPreferences, true);
            if (updateUser) {
                updateUser(updatedUser);
            }

            window.dispatchEvent(new CustomEvent('watchhive:preferences-updated', { detail: newPreferences }));

            if (!skip) {
                alert(
                    isEditing
                        ? 'Your watch preferences have been updated!'
                        : 'Your watch preferences have been saved and your feed is personalized!',
                    { title: 'Preferences Saved', severity: 'success' }
                );
            }

            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error('Failed to update watch preferences', error);
            alert('Failed to save watch preferences. Please try again.', {
                title: 'Error',
                severity: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const stepTitles = [
        'What languages do you watch in?',
        'What genres inspire your watchlist?',
        'Where do you stream or catch releases?',
    ];

    const stepSubtitles = [
        'Select all the languages you enjoy watching movies & shows in.',
        'Pick the genres that best define your cinematic taste.',
        'Choose your primary streaming services & viewing spots.',
    ];

    return (
        <div className="fixed inset-0 z-[3600] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (isEditing) onClose();
                }}
                className="absolute inset-0 bg-[#2D2926]/65 backdrop-blur-md"
            />

            {/* Modal Card / Bottom Sheet */}
            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[36px] shadow-2xl border border-[#ffb700]/20 flex flex-col max-h-[90vh] overflow-hidden z-10"
            >
                {/* Mobile Drag Indicator */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 bg-[#2D2926]/15 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-[#ffb700]/10 bg-[#FFF9F0]/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#ffb700]/15 flex items-center justify-center text-xl shadow-xs">
                            🎬
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#2D2926] leading-snug">
                                Watch Preferences
                            </h3>
                            <p className="text-[11px] font-black text-[#ffb700] uppercase tracking-wider">
                                Personalize Your Feed • Question {currentStep + 1} of 3
                            </p>
                        </div>
                    </div>
                    {isEditing && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2D2926] hover:bg-black/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#ffb700]/10 h-1.5">
                    <div
                        className="bg-[#ffb700] h-full transition-all duration-300 rounded-r-full"
                        style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                    <div>
                        <h4 className="text-xl font-black text-[#2D2926] tracking-tight">
                            {stepTitles[currentStep]}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            {stepSubtitles[currentStep]}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="step-languages"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-2"
                            >
                                {PREF_LANGUAGES.map(lang => {
                                    const isSelected = selectedLanguages.includes(lang.id);
                                    return (
                                        <button
                                            key={lang.id}
                                            type="button"
                                            onClick={() => toggleLanguage(lang.id)}
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#ffb700]/15 border-[#ffb700] text-[#2D2926] shadow-sm'
                                                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xl">{lang.emoji}</span>
                                            <span className="text-xs font-black truncate">{lang.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-sm font-black text-[#ffb700] ml-auto">
                                                    check
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step-genres"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-2"
                            >
                                {PREF_GENRES.map(genre => {
                                    const isSelected = selectedGenres.includes(genre.id);
                                    return (
                                        <button
                                            key={genre.id}
                                            type="button"
                                            onClick={() => toggleGenre(genre.id)}
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#ffb700]/15 border-[#ffb700] text-[#2D2926] shadow-sm'
                                                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xl">{genre.emoji}</span>
                                            <span className="text-xs font-black truncate">{genre.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-sm font-black text-[#ffb700] ml-auto">
                                                    check
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step-platforms"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-2"
                            >
                                {PREF_PLATFORMS.map(plat => {
                                    const isSelected = selectedPlatforms.includes(plat.id);
                                    return (
                                        <button
                                            key={plat.id}
                                            type="button"
                                            onClick={() => togglePlatform(plat.id)}
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#ffb700]/15 border-[#ffb700] text-[#2D2926] shadow-sm'
                                                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xl">{plat.emoji}</span>
                                            <span className="text-xs font-black truncate">{plat.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-sm font-black text-[#ffb700] ml-auto">
                                                    check
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {currentStep > 0 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 font-black text-xs text-slate-600 hover:bg-white active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back
                        </button>
                    ) : !isEditing ? (
                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            className="px-4 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                        >
                            Skip for now
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 2 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="px-6 py-2.5 rounded-xl bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] font-black text-xs uppercase tracking-wider shadow-md shadow-[#ffb700]/25 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <span>Next</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="px-7 py-2.5 rounded-xl bg-[#ffb700] hover:bg-[#ffa700] text-[#2D2926] font-black text-xs uppercase tracking-wider shadow-md shadow-[#ffb700]/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <BeeLoader size="mini" message="" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    <span>Save & Personalize</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default WatchPreferencesModal;
