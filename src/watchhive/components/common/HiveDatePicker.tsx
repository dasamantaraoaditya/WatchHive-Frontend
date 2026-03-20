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
                            className="absolute top-full left-0 right-0 mt-3 z-50 bg-white border border-[#ffb700]/20 rounded-[32px] shadow-2xl overflow-hidden p-6"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Date Section */}
                                <div className="flex-1 min-w-[280px]">
                                    {renderHeader()}
                                    {renderDays()}
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px bg-[#ffb700]/5" />

                                {/* Time Section */}
                                <div className="flex flex-col gap-6 w-full md:w-32">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2926]/30 text-center">Set Time</h4>
                                    
                                    <div className="flex flex-row md:flex-col items-center justify-center gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-[#ffb700] uppercase">Hour</span>
                                            <input 
                                                type="number" 
                                                min="0" max="23" 
                                                value={hours}
                                                onChange={(e) => handleTimeChange('h', parseInt(e.target.value) || 0)}
                                                className="w-14 h-14 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10 flex items-center justify-center text-center text-xl font-black text-[#2D2926] focus:border-[#ffb700] outline-none"
                                            />
                                        </div>
                                        <div className="text-2xl font-black text-[#ffb700]/20">:</div>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-[#ffb700] uppercase">Min</span>
                                            <input 
                                                type="number" 
                                                min="0" max="59" 
                                                value={minutes}
                                                onChange={(e) => handleTimeChange('m', parseInt(e.target.value) || 0)}
                                                className="w-14 h-14 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10 flex items-center justify-center text-center text-xl font-black text-[#2D2926] focus:border-[#ffb700] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-auto hidden md:block">
                                         <button 
                                            type="button"
                                            onClick={handleConfirm}
                                            className="w-full py-3 bg-[#ffb700] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#ffb700]/20"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Footer */}
                            <div className="mt-6 md:hidden">
                                <button 
                                    type="button"
                                    onClick={handleConfirm}
                                    className="w-full py-4 bg-[#ffb700] text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                                >
                                    Confirm Date & Time
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
