import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HiveDatePickerProps {
    value?: string; // Format: YYYY-MM-DDTHH:mm
    onChange: (newValue: string) => void;
    label?: string;
}

export const HiveDatePicker: React.FC<HiveDatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Parse value to a local Date object, defaulting to current date-time
    const parseValue = (val?: string): Date => {
        if (!val) return new Date();
        try {
            const [datePart, timePart] = val.split('T');
            if (!datePart || !timePart) return new Date();
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            
            const parsed = new Date(year, month - 1, day, hours, minutes);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
        } catch {
            return new Date();
        }
    };

    // Format local Date object to YYYY-MM-DDTHH:mm
    const formatValue = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [tempDate, setTempDate] = useState<Date>(parseValue(value));
    const [viewDate, setViewDate] = useState<Date>(new Date(tempDate.getFullYear(), tempDate.getMonth(), 1));

    // Keep tempDate in sync if value prop changes from outside
    useEffect(() => {
        const parsed = parseValue(value);
        setTempDate(parsed);
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }, [value]);

    // Handle window resize for mobile check
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format display string for the button, e.g., "Sat, May 23, 2026 • 02:09 AM"
    const formatDisplay = (val?: string) => {
        if (!val) return 'Select Date and Time';
        try {
            const date = parseValue(val);
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

    const displayText = formatDisplay(value);

    // Calendar generation
    const getCalendarDays = (viewDate: Date) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
        
        const firstDay = new Date(year, month, 1);
        const startDayOfWeek = firstDay.getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthDays = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
        
        // Fill previous month padding
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(prevMonthYear, prevMonth, prevMonthDays - i);
            days.push({ date: d, isCurrentMonth: false, isToday: isSameDay(d, new Date()) });
        }
        
        // Fill current month days
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(year, month, i);
            days.push({ date: d, isCurrentMonth: true, isToday: isSameDay(d, new Date()) });
        }
        
        // Fill next month padding to reach exactly 42 cells (stable height)
        const remaining = 42 - days.length;
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(nextMonthYear, nextMonth, i);
            days.push({ date: d, isCurrentMonth: false, isToday: isSameDay(d, new Date()) });
        }
        
        return days;
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    // Calendar navigation
    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (selectedDate: Date) => {
        const newDate = new Date(tempDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setTempDate(newDate);
    };

    // Time info & handlers
    const rawHours = tempDate.getHours();
    const currentAMPM = rawHours >= 12 ? 'PM' : 'AM';
    let currentHour12 = rawHours % 12;
    if (currentHour12 === 0) currentHour12 = 12;
    const currentMinutes = tempDate.getMinutes();

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const h12 = Number(e.target.value);
        let updatedHours = h12;
        if (currentAMPM === 'PM' && h12 < 12) {
            updatedHours = h12 + 12;
        } else if (currentAMPM === 'AM' && h12 === 12) {
            updatedHours = 0;
        }
        const newDate = new Date(tempDate);
        newDate.setHours(updatedHours);
        setTempDate(newDate);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const m = Number(e.target.value);
        const newDate = new Date(tempDate);
        newDate.setMinutes(m);
        setTempDate(newDate);
    };

    const handleAMPMChange = (ampm: 'AM' | 'PM') => {
        if (ampm === currentAMPM) return;
        let updatedHours = currentHour12;
        if (ampm === 'PM' && currentHour12 < 12) {
            updatedHours = currentHour12 + 12;
        } else if (ampm === 'AM' && currentHour12 === 12) {
            updatedHours = 0;
        }
        const newDate = new Date(tempDate);
        newDate.setHours(updatedHours);
        setTempDate(newDate);
    };

    // Quick presets
    const selectNow = () => {
        const now = new Date();
        setTempDate(now);
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    const selectOneHourAgo = () => {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        setTempDate(oneHourAgo);
        setViewDate(new Date(oneHourAgo.getFullYear(), oneHourAgo.getMonth(), 1));
    };

    const selectToday = () => {
        const today = new Date();
        const newDate = new Date(tempDate);
        newDate.setFullYear(today.getFullYear());
        newDate.setMonth(today.getMonth());
        newDate.setDate(today.getDate());
        setTempDate(newDate);
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const selectYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newDate = new Date(tempDate);
        newDate.setFullYear(yesterday.getFullYear());
        newDate.setMonth(yesterday.getMonth());
        newDate.setDate(yesterday.getDate());
        setTempDate(newDate);
        setViewDate(new Date(yesterday.getFullYear(), yesterday.getMonth(), 1));
    };

    const handleApply = () => {
        onChange(formatValue(tempDate));
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempDate(parseValue(value));
        setIsOpen(false);
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const calendarDays = getCalendarDays(viewDate);

    return (
        <div className="relative flex flex-col gap-2 w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/50">
                    {label}
                </label>
            )}
            
            <div className="relative w-full">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => {
                        setTempDate(parseValue(value));
                        setIsOpen(true);
                    }}
                    className={`w-full flex items-center justify-between pl-4.5 pr-4 py-3 bg-[#FFF9F0]/40 border-2 ${
                        isOpen ? 'border-[#ffb700] bg-white ring-4 ring-[#ffb700]/10' : 'border-[#ffb700]/20 hover:border-[#ffb700] hover:bg-[#FFF9F0]/70'
                    } rounded-2xl transition-all duration-300 relative z-10 select-none cursor-pointer outline-none text-left`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-[#ffb700] text-[20px] flex-shrink-0">
                            calendar_month
                        </span>
                        <span className="text-sm font-black text-[#2D2926] truncate">
                            {displayText}
                        </span>
                    </div>
                    <span className={`material-symbols-outlined text-[#ffb700]/50 text-[18px] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>

                {/* Popover / Modal */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Click Away Backdrop */}
                            <div 
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={handleCancel}
                            />

                            {/* Dropdown Container */}
                            <motion.div
                                initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                                className={`
                                    z-50 bg-white border-2 border-[#ffb700]/15 rounded-[32px] shadow-2xl p-5 flex flex-col gap-4.5 outline-none
                                    ${isMobile 
                                        ? 'fixed bottom-4 left-4 right-4 max-h-[85vh] overflow-y-auto border border-[#ffb700]/20 shadow-2xl' 
                                        : 'absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[340px] sm:w-[360px] max-w-[92vw]'
                                    }
                                `}
                            >
                                {/* Mobile Close Handle */}
                                {isMobile && (
                                    <div className="flex justify-center -mt-1.5 -mb-1">
                                        <div className="w-10 h-1.5 bg-[#2D2926]/10 rounded-full" />
                                    </div>
                                )}

                                {/* Presets Bar */}
                                <div className="flex flex-col gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]/40 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[12px] font-bold">bolt</span>
                                        Quick Select
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={selectNow}
                                            className="px-3 py-1.5 bg-[#FFF9F0] text-[#ffb700] hover:bg-[#ffb700] hover:text-white border border-[#ffb700]/10 rounded-xl text-xs font-black transition-all active:scale-[0.93]"
                                        >
                                            Now
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectOneHourAgo}
                                            className="px-3 py-1.5 bg-[#FFF9F0] text-[#ffb700] hover:bg-[#ffb700] hover:text-white border border-[#ffb700]/10 rounded-xl text-xs font-black transition-all active:scale-[0.93]"
                                        >
                                            1h Ago
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectToday}
                                            className="px-3 py-1.5 bg-[#FFF9F0] text-[#ffb700] hover:bg-[#ffb700] hover:text-white border border-[#ffb700]/10 rounded-xl text-xs font-black transition-all active:scale-[0.93]"
                                        >
                                            Today
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectYesterday}
                                            className="px-3 py-1.5 bg-[#FFF9F0] text-[#ffb700] hover:bg-[#ffb700] hover:text-white border border-[#ffb700]/10 rounded-xl text-xs font-black transition-all active:scale-[0.93]"
                                        >
                                            Yesterday
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-t border-[#ffb700]/10" />

                                {/* Calendar Navigation */}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevMonth}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF9F0] border border-[#ffb700]/15 text-[#ffb700] hover:bg-[#ffb700] hover:text-white transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">chevron_left</span>
                                    </button>
                                    
                                    <span className="text-sm font-black text-[#2D2926]">
                                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={nextMonth}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF9F0] border border-[#ffb700]/15 text-[#ffb700] hover:bg-[#ffb700] hover:text-white transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">chevron_right</span>
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="flex flex-col gap-1">
                                    {/* Weekdays */}
                                    <div className="grid grid-cols-7 text-center">
                                        {weekDays.map((day) => (
                                            <span key={day} className="text-[10px] font-black uppercase text-[#2D2926]/40 py-1">
                                                {day}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((cell, idx) => {
                                            const isSelected = isSameDay(cell.date, tempDate);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleDateSelect(cell.date)}
                                                    className={`
                                                        aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative cursor-pointer
                                                        ${!cell.isCurrentMonth ? 'text-[#2D2926]/20' : 'text-[#2D2926]'}
                                                        ${isSelected 
                                                            ? 'bg-[#ffb700] text-white font-black shadow-md shadow-[#ffb700]/25 scale-105 z-10' 
                                                            : cell.isToday 
                                                                ? 'bg-[#FFF9F0] text-[#ffb700] border border-[#ffb700]/30 font-black' 
                                                                : 'hover:bg-[#ffb700]/10 hover:text-[#ffb700]'
                                                        }
                                                    `}
                                                >
                                                    {cell.date.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <hr className="border-t border-[#ffb700]/10" />

                                {/* Time Selection */}
                                <div className="flex flex-col gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]/40 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[12px] font-bold">schedule</span>
                                        Time Selection
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {/* Hour Select */}
                                            <select
                                                value={currentHour12}
                                                onChange={handleHourChange}
                                                className="bg-white border-2 border-[#ffb700]/20 rounded-xl px-2.5 py-1.5 text-sm font-black text-[#2D2926] focus:border-[#ffb700] outline-none cursor-pointer transition-all"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                                    <option key={h} value={h}>
                                                        {String(h).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>

                                            <span className="text-sm font-black text-[#2D2926]/50">:</span>

                                            {/* Minute Select */}
                                            <select
                                                value={currentMinutes}
                                                onChange={handleMinuteChange}
                                                className="bg-white border-2 border-[#ffb700]/20 rounded-xl px-2.5 py-1.5 text-sm font-black text-[#2D2926] focus:border-[#ffb700] outline-none cursor-pointer transition-all"
                                            >
                                                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                                                    <option key={m} value={m}>
                                                        {String(m).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* AM / PM Segmented Control */}
                                        <div className="flex bg-[#FFF9F0] border-2 border-[#ffb700]/15 rounded-xl p-0.5 relative">
                                            <button
                                                type="button"
                                                onClick={() => handleAMPMChange('AM')}
                                                className={`px-3 py-1 rounded-[10px] text-xs font-black transition-all ${
                                                    currentAMPM === 'AM' 
                                                        ? 'bg-[#ffb700] text-white shadow-sm' 
                                                        : 'text-[#ffb700]/70 hover:text-[#ffb700]'
                                                }`}
                                            >
                                                AM
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAMPMChange('PM')}
                                                className={`px-3 py-1 rounded-[10px] text-xs font-black transition-all ${
                                                    currentAMPM === 'PM' 
                                                        ? 'bg-[#ffb700] text-white shadow-sm' 
                                                        : 'text-[#ffb700]/70 hover:text-[#ffb700]'
                                                }`}
                                            >
                                                PM
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="flex gap-2.5 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-2xl text-xs transition-colors active:scale-[0.98] cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        className="flex-1 py-2.5 bg-[#ffb700] hover:bg-[#ffb700]/90 text-white font-black rounded-2xl text-xs transition-all active:scale-[0.98] shadow-md shadow-[#ffb700]/15 cursor-pointer"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
