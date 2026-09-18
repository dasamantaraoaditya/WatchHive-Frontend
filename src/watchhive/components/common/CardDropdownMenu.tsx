import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CardDropdownMenuItem {
    label: string;
    icon?: string;
    iconColor?: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    danger?: boolean;
    className?: string;
}

export interface CardDropdownMenuProps {
    items: CardDropdownMenuItem[];
    buttonClassName?: string;
    iconClassName?: string;
    iconName?: string;
    title?: string;
}

export const CardDropdownMenu: React.FC<CardDropdownMenuProps> = ({
    items,
    buttonClassName,
    iconClassName,
    iconName = 'more_vert',
    title = 'Options',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number }>({ right: 12 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuEstimatedHeight = items.length * 44 + 20;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const showAbove = spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow;

        const top = showAbove ? undefined : rect.bottom + 6;
        const bottom = showAbove ? window.innerHeight - rect.top + 6 : undefined;
        const right = Math.max(12, window.innerWidth - rect.right);

        setCoords({ top, bottom, right });
    }, [items.length]);

    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = () => {
            setIsOpen(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (items.length === 0) return null;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                className={
                    buttonClassName ||
                    'w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90'
                }
                title={title}
                aria-label={title}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className={iconClassName || 'material-symbols-outlined text-[18px]'}>
                    {iconName}
                </span>
            </button>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <>
                        {/* Backdrop overlay to capture outside clicks and taps */}
                        <div
                            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        />

                        {/* Dropdown Menu Portaled to document.body */}
                        <div
                            ref={menuRef}
                            role="menu"
                            aria-label={title}
                            className="fixed z-[9999] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 min-w-[175px] max-w-[260px] flex flex-col animate-fade-in overflow-hidden"
                            style={{
                                top: coords.top !== undefined ? `${coords.top}px` : undefined,
                                bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
                                right: `${coords.right}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    role="menuitem"
                                    disabled={item.disabled}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        item.onClick(e);
                                    }}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition-colors text-left w-full disabled:opacity-50 disabled:pointer-events-none ${
                                        item.danger
                                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-stone-200 dark:hover:bg-stone-800'
                                    } ${item.className || ''}`}
                                >
                                    {item.icon && (
                                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${item.iconColor || ''}`}>
                                            {item.icon}
                                        </span>
                                    )}
                                    <span className="truncate">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
};

export default CardDropdownMenu;
