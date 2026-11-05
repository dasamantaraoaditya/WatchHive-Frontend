import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HiveDatePickerProps {
    value?: string | null; // Format: YYYY-MM-DDTHH:mm
    onChange: (newValue: string) => void;
    label?: string;
}

export const HiveDatePicker: React.FC<HiveDatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse value to a local Date object, defaulting to current date-time
    const parseValue = (val?: string | null): Date => {
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

    const [tempDate, setTempDate] = useState<Date>(() => parseValue(value));
    const [viewDate, setViewDate] = useState<Date>(() => {
        const d = parseValue(value);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    // Keep tempDate in sync if value prop changes from outside
    useEffect(() => {
        const parsed = parseValue(value);
        setTempDate(parsed);
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }, [value]);

    // Format display string for the button, e.g., "Tue, Nov 3, 2026 • 12:19 AM"
    const formatDisplay = (val?: string | null) => {
        if (!val) return 'No specific date (Watched in past)';
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
            return 'No specific date (Watched in past)';
        }
    };

    const displayText = formatDisplay(value);

    // Helpers
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const isFutureDay = (d: Date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d.getTime() > today.getTime();
    };

    // Calendar generation
    const getCalendarDays = (vDate: Date) => {
        const year = vDate.getFullYear();
        const month = vDate.getMonth();
        const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean }> = [];

        const firstDay = new Date(year, month, 1);
        const startDayOfWeek = firstDay.getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthDays = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

        // Fill previous month padding
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(prevMonthYear, prevMonth, prevMonthDays - i);
            days.push({
                date: d,
                isCurrentMonth: false,
                isToday: isSameDay(d, new Date()),
                isFuture: isFutureDay(d),
            });
        }

        // Fill current month days
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(year, month, i);
            days.push({
                date: d,
                isCurrentMonth: true,
                isToday: isSameDay(d, new Date()),
                isFuture: isFutureDay(d),
            });
        }

        // Fill next month padding to reach exactly 42 cells (stable height)
        const remaining = 42 - days.length;
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(nextMonthYear, nextMonth, i);
            days.push({
                date: d,
                isCurrentMonth: false,
                isToday: isSameDay(d, new Date()),
                isFuture: isFutureDay(d),
            });
        }

        return days;
    };

    // Calendar navigation
    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (selectedDate: Date) => {
        if (isFutureDay(selectedDate)) return;

        const now = new Date();
        const newDate = new Date(tempDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());

        // If selected date is today, ensure time does not exceed current time
        const clampedDate = newDate.getTime() > now.getTime() ? now : newDate;
        setTempDate(clampedDate);
        onChange(formatValue(clampedDate));
    };

    // Time info & handlers
    const rawHours = tempDate.getHours();
    const currentAMPM = rawHours >= 12 ? 'PM' : 'AM';
    let currentHour12 = rawHours % 12;
    if (currentHour12 === 0) currentHour12 = 12;
    const currentMinutes = tempDate.getMinutes();

    const commitTime = (hours: number, minutes: number) => {
        const now = new Date();
        const candidate = new Date(tempDate);
        candidate.setHours(hours);
        candidate.setMinutes(minutes);

        const clamped = candidate.getTime() > now.getTime() ? now : candidate;
        setTempDate(clamped);
        onChange(formatValue(clamped));
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const h12 = Number(e.target.value);
        let updatedHours = h12;
        if (currentAMPM === 'PM' && h12 < 12) {
            updatedHours = h12 + 12;
        } else if (currentAMPM === 'AM' && h12 === 12) {
            updatedHours = 0;
        }
        commitTime(updatedHours, currentMinutes);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const m = Number(e.target.value);
        commitTime(rawHours, m);
    };

    const handleAMPMChange = (ampm: 'AM' | 'PM') => {
        if (ampm === currentAMPM) return;
        let updatedHours = currentHour12;
        if (ampm === 'PM' && currentHour12 < 12) {
            updatedHours = currentHour12 + 12;
        } else if (ampm === 'AM' && currentHour12 === 12) {
            updatedHours = 0;
        }
        commitTime(updatedHours, currentMinutes);
    };

    const setQuickTime = (hours24: number, minutes: number) => {
        commitTime(hours24, minutes);
    };

    // Quick presets
    const selectNow = () => {
        const now = new Date();
        setTempDate(now);
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        onChange(formatValue(now));
    };

    const selectOneHourAgo = () => {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        setTempDate(oneHourAgo);
        setViewDate(new Date(oneHourAgo.getFullYear(), oneHourAgo.getMonth(), 1));
        onChange(formatValue(oneHourAgo));
    };

    const selectToday = () => {
        const now = new Date();
        const newDate = new Date(tempDate);
        newDate.setFullYear(now.getFullYear());
        newDate.setMonth(now.getMonth());
        newDate.setDate(now.getDate());
        const clamped = newDate.getTime() > now.getTime() ? now : newDate;
        setTempDate(clamped);
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        onChange(formatValue(clamped));
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
        onChange(formatValue(newDate));
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const calendarDays = getCalendarDays(viewDate);

    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/70 dark:text-white/70">
                    {label}
                </label>
            )}

            <div className="w-full flex flex-col">
                {/* Trigger Button (In-Flow Accordion Toggle) */}
                <button
                    type="button"
                    onClick={() => {
                        const parsed = parseValue(value);
                        setTempDate(parsed);
                        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
                        setIsOpen(!isOpen);
                    }}
                    className={`w-full flex items-center justify-between pl-4 pr-3.5 py-3 bg-[#FFF9F0]/60 dark:bg-[#1f1911]/60 border-2 ${
                        isOpen
                            ? 'border-[#ffb700] bg-white dark:bg-[#221c13] ring-4 ring-[#ffb700]/10 shadow-sm'
                            : 'border-[#ffb700]/25 hover:border-[#ffb700] hover:bg-[#FFF9F0] dark:hover:bg-[#241d14]'
                    } rounded-2xl transition-all duration-200 select-none cursor-pointer outline-none text-left`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#ffb700]/15 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[#ffb700] text-[19px]">
                                calendar_month
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]/50 dark:text-white/50">
                                {isOpen ? 'Editing Screening Date & Time' : 'Watch Date & Time'}
                            </span>
                            <span className="text-sm font-black text-[#2D2926] dark:text-white truncate">
                                {displayText}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl transition-colors ${
                            isOpen
                                ? 'bg-[#ffb700] text-[#2D2926]'
                                : 'bg-[#ffb700]/10 text-[#ffb700]'
                        }`}>
                            {isOpen ? 'Done' : 'Change'}
                        </span>
                        <span className={`material-symbols-outlined text-[#2D2926]/60 dark:text-white/60 text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </div>
                </button>

                {/* Inline Expandable Calendar & Time Picker Container */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden w-full pt-2.5"
                        >
                            <div className="bg-[#FFFDF9] dark:bg-[#1A1612] text-[#2D2926] dark:text-[#EAE6DF] border-2 border-[#ffb700]/25 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
                                {/* Quick Presets Bar */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]/60 dark:text-white/60 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[13px] font-bold text-[#ffb700]">bolt</span>
                                        Quick Select
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={selectNow}
                                            className="px-3 py-1.5 bg-[#FFF9F0] dark:bg-[#251E17] text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] dark:hover:bg-[#ffb700] dark:hover:text-[#2D2926] border border-[#ffb700]/30 rounded-xl text-xs font-black transition-all active:scale-[0.94] shadow-xs cursor-pointer"
                                        >
                                            Now
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectOneHourAgo}
                                            className="px-3 py-1.5 bg-[#FFF9F0] dark:bg-[#251E17] text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] dark:hover:bg-[#ffb700] dark:hover:text-[#2D2926] border border-[#ffb700]/30 rounded-xl text-xs font-black transition-all active:scale-[0.94] shadow-xs cursor-pointer"
                                        >
                                            1h Ago
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectToday}
                                            className="px-3 py-1.5 bg-[#FFF9F0] dark:bg-[#251E17] text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] dark:hover:bg-[#ffb700] dark:hover:text-[#2D2926] border border-[#ffb700]/30 rounded-xl text-xs font-black transition-all active:scale-[0.94] shadow-xs cursor-pointer"
                                        >
                                            Today
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectYesterday}
                                            className="px-3 py-1.5 bg-[#FFF9F0] dark:bg-[#251E17] text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] dark:hover:bg-[#ffb700] dark:hover:text-[#2D2926] border border-[#ffb700]/30 rounded-xl text-xs font-black transition-all active:scale-[0.94] shadow-xs cursor-pointer"
                                        >
                                            Yesterday
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange('');
                                                setIsOpen(false);
                                            }}
                                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black transition-all active:scale-[0.94] shadow-xs cursor-pointer flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[13px]">history_toggle_off</span>
                                            Don't know when
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-t border-[#ffb700]/20" />

                                {/* Calendar Month Navigation */}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevMonth}
                                        aria-label="Previous month"
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF9F0] dark:bg-[#251E17] border border-[#ffb700]/25 text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">chevron_left</span>
                                    </button>

                                    <span className="text-sm font-black text-[#2D2926] dark:text-white">
                                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={nextMonth}
                                        aria-label="Next month"
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF9F0] dark:bg-[#251E17] border border-[#ffb700]/25 text-[#2D2926] dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">chevron_right</span>
                                    </button>
                                </div>

                                {/* Calendar Days Grid */}
                                <div className="flex flex-col gap-1">
                                    {/* Weekdays */}
                                    <div className="grid grid-cols-7 text-center">
                                        {weekDays.map((day) => (
                                            <span key={day} className="text-[10px] font-black uppercase text-[#2D2926]/50 dark:text-white/50 py-1">
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
                                                    disabled={cell.isFuture}
                                                    onClick={() => handleDateSelect(cell.date)}
                                                    className={`
                                                        aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative
                                                        ${cell.isFuture ? 'text-[#2D2926]/20 dark:text-white/20 cursor-not-allowed opacity-40' : 'cursor-pointer'}
                                                        ${!cell.isCurrentMonth && !cell.isFuture ? 'text-[#2D2926]/35 dark:text-white/35' : ''}
                                                        ${cell.isCurrentMonth && !cell.isFuture ? 'text-[#2D2926] dark:text-[#EAE6DF]' : ''}
                                                        ${isSelected
                                                            ? 'bg-[#ffb700] text-[#2D2926] font-black shadow-md shadow-[#ffb700]/30 scale-105 z-10 border border-[#2D2926]/10'
                                                            : cell.isToday
                                                                ? 'bg-[#FFF9F0] dark:bg-[#282119] text-[#2D2926] dark:text-[#ffb700] border-2 border-[#ffb700] font-black'
                                                                : !cell.isFuture ? 'hover:bg-[#ffb700]/20 hover:text-[#2D2926]' : ''
                                                        }
                                                    `}
                                                >
                                                    {cell.date.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <hr className="border-t border-[#ffb700]/20" />

                                {/* Time Selection */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#2D2926]/60 dark:text-white/60 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] font-bold text-[#ffb700]">schedule</span>
                                        Time Selection
                                    </div>

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        {/* Hours & Minutes Pickers */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-[#2D2926]/40 dark:text-white/40">Hour</label>
                                                <select
                                                    value={currentHour12}
                                                    onChange={handleHourChange}
                                                    style={{ colorScheme: 'light', color: '#2D2926', backgroundColor: '#FFFFFF' }}
                                                    className="bg-white border-2 border-[#ffb700]/35 rounded-xl px-3 py-1.5 text-sm font-black text-[#2D2926] focus:border-[#ffb700] outline-none cursor-pointer transition-all shadow-xs"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                                        <option key={h} value={h} className="bg-white text-[#2D2926] font-black">
                                                            {String(h).padStart(2, '0')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <span className="text-base font-black text-[#2D2926] dark:text-white mt-4">:</span>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-[#2D2926]/40 dark:text-white/40">Minute</label>
                                                <select
                                                    value={currentMinutes}
                                                    onChange={handleMinuteChange}
                                                    style={{ colorScheme: 'light', color: '#2D2926', backgroundColor: '#FFFFFF' }}
                                                    className="bg-white border-2 border-[#ffb700]/35 rounded-xl px-3 py-1.5 text-sm font-black text-[#2D2926] focus:border-[#ffb700] outline-none cursor-pointer transition-all shadow-xs"
                                                >
                                                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                                                        <option key={m} value={m} className="bg-white text-[#2D2926] font-black">
                                                            {String(m).padStart(2, '0')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* AM / PM Segmented Control */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-[#2D2926]/40 dark:text-white/40">Period</label>
                                            <div className="flex bg-[#FFF9F0] dark:bg-[#251E17] border-2 border-[#ffb700]/25 rounded-xl p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAMPMChange('AM')}
                                                    className={`px-3 py-1 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
                                                        currentAMPM === 'AM'
                                                            ? 'bg-[#ffb700] text-[#2D2926] shadow-xs font-black'
                                                            : 'text-[#2D2926]/60 dark:text-white/60 hover:text-[#2D2926]'
                                                    }`}
                                                >
                                                    AM
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAMPMChange('PM')}
                                                    className={`px-3 py-1 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
                                                        currentAMPM === 'PM'
                                                            ? 'bg-[#ffb700] text-[#2D2926] shadow-xs font-black'
                                                            : 'text-[#2D2926]/60 dark:text-white/60 hover:text-[#2D2926]'
                                                    }`}
                                                >
                                                    PM
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Popular Watch Times */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span className="text-[9px] font-black uppercase text-[#2D2926]/40 dark:text-white/40 mr-1">Jump to:</span>
                                        {[
                                            { label: '2:00 PM', h: 14, m: 0 },
                                            { label: '6:30 PM', h: 18, m: 30 },
                                            { label: '9:00 PM', h: 21, m: 0 },
                                            { label: '10:30 PM', h: 22, m: 30 },
                                        ].map((t) => (
                                            <button
                                                key={t.label}
                                                type="button"
                                                onClick={() => setQuickTime(t.h, t.m)}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#FFF9F0] dark:bg-[#251E17] border border-[#ffb700]/25 text-[#2D2926]/80 dark:text-[#EAE6DF] hover:bg-[#ffb700] hover:text-[#2D2926] transition-colors cursor-pointer"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#ffb700]/20">
                                    <button
                                        type="button"
                                        onClick={selectNow}
                                        className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#2D2926] dark:text-[#EAE6DF] font-black rounded-xl text-xs transition-colors active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">history</span>
                                        Reset to Current
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="py-2.5 px-6 bg-[#ffb700] hover:bg-[#ffc222] text-[#2D2926] font-black rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-[#ffb700]/25 cursor-pointer flex items-center gap-1.5 ml-auto"
                                    >
                                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                        Done
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default HiveDatePicker;
