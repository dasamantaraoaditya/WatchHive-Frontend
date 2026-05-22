import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AlertOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    severity?: 'info' | 'success' | 'warning' | 'error' | 'primary' | 'danger';
}

interface AlertState extends AlertOptions {
    isOpen: boolean;
    message: string;
    type: 'alert' | 'confirm';
    resolve: (value: boolean) => void;
}

interface CustomAlertContextType {
    alert: (message: string, options?: AlertOptions) => Promise<boolean>;
    confirm: (message: string, options?: AlertOptions) => Promise<boolean>;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

export const CustomAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AlertState>({
        isOpen: false,
        message: '',
        type: 'alert',
        resolve: () => {},
    });

    const alert = (message: string, options?: AlertOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({
                isOpen: true,
                message,
                type: 'alert',
                title: options?.title || 'Alert',
                confirmText: options?.confirmText || 'Got it',
                severity: options?.severity || 'primary',
                resolve,
            });
        });
    };

    const confirm = (message: string, options?: AlertOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({
                isOpen: true,
                message,
                type: 'confirm',
                title: options?.title || 'Confirm Action',
                confirmText: options?.confirmText || 'Confirm',
                cancelText: options?.cancelText || 'Cancel',
                severity: options?.severity || 'warning',
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        state.resolve(true);
        setState(prev => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        state.resolve(false);
        setState(prev => ({ ...prev, isOpen: false }));
    };

    // Keyboard support: Enter to confirm, Escape to cancel
    useEffect(() => {
        if (!state.isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.isOpen, state.resolve]);

    // Scroll lock when dialog is open
    useEffect(() => {
        if (state.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [state.isOpen]);

    // Severity specific colors and icons
    const getSeverityStyles = (severity: AlertState['severity']) => {
        switch (severity) {
            case 'success':
                return {
                    icon: 'check_circle',
                    bg: 'bg-emerald-50 border-emerald-500/10',
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                    btnColor: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white',
                };
            case 'error':
            case 'danger':
                return {
                    icon: 'error',
                    bg: 'bg-rose-50 border-rose-500/10',
                    iconBg: 'bg-rose-500/10',
                    iconColor: 'text-rose-500',
                    btnColor: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white',
                };
            case 'warning':
                return {
                    icon: 'warning',
                    bg: 'bg-amber-50 border-amber-500/10',
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                    btnColor: 'bg-[#ffb700] hover:bg-[#e59700] shadow-[#ffb700]/20 text-white',
                };
            case 'info':
                return {
                    icon: 'info',
                    bg: 'bg-blue-50 border-blue-500/10',
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                    btnColor: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 text-white',
                };
            case 'primary':
            default:
                return {
                    icon: 'info',
                    bg: 'bg-[#fffbea] border-[#ffb700]/10',
                    iconBg: 'bg-[#ffb700]/10',
                    iconColor: 'text-[#ffb700]',
                    btnColor: 'bg-[#ffb700] hover:bg-[#e59700] shadow-[#ffb700]/20 text-white',
                };
        }
    };

    const styles = getSeverityStyles(state.severity);

    return (
        <CustomAlertContext.Provider value={{ alert, confirm }}>
            {children}

            <AnimatePresence>
                {state.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                        {/* Backdrop with elegant blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-[#2D2926]/75 backdrop-blur-md"
                        />

                        {/* Dialog Card Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: 'spring',
                                damping: 26,
                                stiffness: 280,
                                mass: 0.8
                            }}
                            className={`
                                relative w-full max-w-md bg-white border border-neutral-100
                                rounded-[32px] sm:rounded-[40px] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center
                            `}
                        >
                            {/* Accent indicator icon */}
                            <div className={`w-16 h-16 rounded-[24px] ${styles.iconBg} flex items-center justify-center mb-5 ${styles.iconColor}`}>
                                <span className="material-symbols-outlined text-[32px] font-bold">
                                    {styles.icon}
                                </span>
                            </div>

                            {/* Title */}
                            {state.title && (
                                <h3 className="text-xl sm:text-2xl font-black text-[#2D2926] tracking-tight mb-2">
                                    {state.title}
                                </h3>
                            )}

                            {/* Message */}
                            <p className="text-sm sm:text-base text-neutral-500 font-medium leading-relaxed mb-8 px-2">
                                {state.message}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 w-full">
                                {state.type === 'confirm' && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 py-3 px-5 text-sm font-semibold rounded-2xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 active:scale-98 transition-all"
                                    >
                                        {state.cancelText}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3 px-5 text-sm font-semibold rounded-2xl shadow-lg active:scale-98 transition-all ${styles.btnColor}`}
                                >
                                    {state.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </CustomAlertContext.Provider>
    );
};

export const useCustomAlert = () => {
    const context = useContext(CustomAlertContext);
    if (context === undefined) {
        throw new Error('useCustomAlert must be used within a CustomAlertProvider');
    }
    return context;
};
