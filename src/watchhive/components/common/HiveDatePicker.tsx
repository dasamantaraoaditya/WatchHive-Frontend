import React, { useRef } from 'react';

interface HiveDatePickerProps {
    value?: string; // Format: YYYY-MM-DDTHH:mm
    onChange: (newValue: string) => void;
    label?: string;
}

export const HiveDatePicker: React.FC<HiveDatePickerProps> = ({ value, onChange, label }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Format a single unified date-time string
    const formatDisplay = (val?: string) => {
        if (!val) return 'Select Date and Time';
        try {
            const date = new Date(val);
            if (isNaN(date.getTime())) return 'Invalid Date/Time';
            
            // Format like: "Sat, May 23, 2026 • 02:09 AM"
            const dateFormatted = date.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const timeFormatted = date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
            
            return `${dateFormatted} • ${timeFormatted}`;
        } catch {
            return 'Select Date and Time';
        }
    };

    const handleCardClick = () => {
        if (inputRef.current) {
            try {
                // Trigger programmatic picker popup securely from user click gesture
                inputRef.current.showPicker();
            } catch (err) {
                // Fallback click trigger
                inputRef.current.click();
            }
        }
    };

    const displayText = formatDisplay(value);

    return (
        <div className="relative flex flex-col gap-2 w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">
                    {label}
                </label>
            )}
            
            <div className="relative w-full">
                {/* Hidden Native Picker */}
                <input
                    ref={inputRef}
                    type="datetime-local"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
                    aria-label={label || "Date and time picker"}
                />

                {/* Sleek Cohesive Input Button conforming to WatchHive UX Standards */}
                <button
                    type="button"
                    onClick={handleCardClick}
                    className="w-full flex items-center justify-between pl-4.5 pr-4 py-3 bg-[#FFF9F0]/40 border-2 border-[#ffb700]/20 hover:border-[#ffb700] hover:bg-[#FFF9F0]/70 focus:border-[#ffb700] focus:bg-white focus:ring-4 focus:ring-[#ffb700]/10 active:scale-[0.985] rounded-2xl transition-all duration-300 relative z-10 select-none cursor-pointer outline-none text-left"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Icon aligned with WatchHive primary search styles */}
                        <span className="material-symbols-outlined text-[#ffb700] text-[20px] flex-shrink-0">
                            calendar_month
                        </span>
                        
                        {/* Custom Formatted String for clean readability */}
                        <span className="text-sm font-black text-[#2D2926] truncate">
                            {displayText}
                        </span>
                    </div>

                    {/* Chevron Indicator indicating expandable content */}
                    <span className="material-symbols-outlined text-[#ffb700]/50 text-[18px] flex-shrink-0">
                        expand_more
                    </span>
                </button>
            </div>
        </div>
    );
};
