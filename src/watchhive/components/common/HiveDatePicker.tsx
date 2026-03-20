import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HiveDatePickerProps {
    value?: string; // ISO string or YYYY-MM-DDTHH:mm
    onChange: (newValue: string) => void;
    label?: string;
}

export const HiveDatePicker: React.FC<HiveDatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
    const [selectedDate, setSelectedDate] = useState(new Date(value || new Date()));
    
    // Derived states
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();

    // Calendar logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return (
            <div className="flex items-center justify-between mb-4 px-2">
                <button 
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ffb700]/10 text-[#ffb700] transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <h4 className="text-[14px] font-black uppercase tracking-widest text-[#2D2926]">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h4>
                <button 
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ffb700]/10 text-[#ffb700] transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const grid = [];
        const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

        // Empty slots
        for (let i = 0; i < startDay; i++) {
            grid.push(<div key={`empty-${i}`} className="h-9" />);
        }

        // Days
        for (let d = 1; d <= totalDays; d++) {
            const isSelected = selectedDate.getDate() === d && 
                               selectedDate.getMonth() === viewDate.getMonth() && 
                               selectedDate.getFullYear() === viewDate.getFullYear();
            const isToday = new Date().getDate() === d && 
                            new Date().getMonth() === viewDate.getMonth() && 
                            new Date().getFullYear() === viewDate.getFullYear();

            grid.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(viewDate.getFullYear());
                        newDate.setMonth(viewDate.getMonth());
                        newDate.setDate(d);
                        setSelectedDate(newDate);
                        // Don't close yet, let them pick time
                    }}
                    className={`h-9 w-full rounded-xl text-[12px] font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-[#ffb700] text-white shadow-lg shadow-[#ffb700]/20 scale-105' : 'hover:bg-[#ffb700]/10 text-[#2D2926]'}
                        ${isToday && !isSelected ? 'border border-[#ffb700]/30' : ''}
                    `}
                >
                    {d}
                </button>
            );
        }

        return (
            <div>
                <div className="grid grid-cols-7 mb-2">
                    {days.map(d => (
                        <span key={d} className="text-[9px] font-black uppercase text-[#2D2926]/30 text-center tracking-widest">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {grid}
                </div>
            </div>
        );
    };

    const handleTimeChange = (type: 'h' | 'm', val: number) => {
        const newDate = new Date(selectedDate);
        if (type === 'h') newDate.setHours(val);
        else newDate.setMinutes(val);
        setSelectedDate(newDate);
    };

    const handleConfirm = () => {
        // Format as YYYY-MM-DDTHH:mm since our input uses slice(0, 16)
        const offset = selectedDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(selectedDate.getTime() - offset)).toISOString().slice(0, 16);
        onChange(localISOTime);
        setIsOpen(false);
    };

    return (
        <div className="relative flex flex-col gap-3">
            {label && <label className="text-sm font-bold uppercase tracking-widest text-[#2D2926]/50">{label}</label>}
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#FFF9F0]/50 border-2 border-[#ffb700]/20 hover:border-[#ffb700]/60 transition-all rounded-xl text-[#2D2926] font-bold"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ffb700]">calendar_month</span>
                    <span>
                        {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[#2D2926]/20 mx-1">|</span>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px] text-[#ffb700]">schedule</span>
                        <span>{selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ffb700]' : 'text-[#2D2926]/20'}`}>expand_more</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/5"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-3 z-50 bg-white border border-[#ffb700]/20 rounded-[32px] shadow-2xl overflow-hidden p-8 min-w-[500px]"
                        >
                            <div className="flex items-start gap-10">
                                {/* Date Section */}
                                <div className="flex-1">
                                    {renderHeader()}
                                    {renderDays()}
                                </div>

                                {/* Modern Vertical Divider */}
                                <div className="w-[2px] self-stretch bg-gradient-to-b from-transparent via-[#ffb700]/10 to-transparent" />

                                {/* Time Section - Optimized for clarity and size */}
                                <div className="flex flex-col items-center gap-8 w-48">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ffb700]">Select Time</h4>
                                    
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest">Hour</span>
                                            <input 
                                                type="number" 
                                                min="0" max="23" 
                                                value={hours < 10 ? `0${hours}` : hours}
                                                onChange={(e) => handleTimeChange('h', Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-20 h-24 rounded-3xl bg-[#FFF9F0] border-2 border-[#ffb700]/10 flex items-center justify-center text-center text-3xl font-black text-[#2D2926] focus:border-[#ffb700] focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="text-3xl font-black text-[#ffb700] animate-pulse">:</div>
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest">Min</span>
                                            <input 
                                                type="number" 
                                                min="0" max="59" 
                                                value={minutes < 10 ? `0${minutes}` : minutes}
                                                onChange={(e) => handleTimeChange('m', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-20 h-24 rounded-3xl bg-[#FFF9F0] border-2 border-[#ffb700]/10 flex items-center justify-center text-center text-3xl font-black text-[#2D2926] focus:border-[#ffb700] focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full pt-4">
                                         <button 
                                            type="button"
                                            onClick={handleConfirm}
                                            className="w-full py-4 bg-[#ffb700] text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-[#ffb700]/20 flex items-center justify-center gap-2 group"
                                        >
                                            Confirm
                                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
