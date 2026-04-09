import React from 'react';

interface SortOption {
    value: string;
    label: string;
}

interface FilterBarProps {
    search?: string;
    onSearchChange?: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
    sortOptions: SortOption[];
    placeholder?: string;
    count?: number;
    countLabel?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    search = "",
    onSearchChange,
    sortBy,
    onSortChange,
    sortOptions,
    placeholder = "Search items...",
    count,
    countLabel = "items"
}) => {
    return (
        <div className={`flex flex-col md:flex-row items-stretch md:items-center ${onSearchChange ? 'justify-between' : 'justify-end'} gap-4 py-2`}>
            {onSearchChange && (
                <div className="flex-1 relative group max-w-2xl">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2926]/40 group-focus-within:text-[#ffb700] transition-colors text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-[#ffb700]/10 rounded-2xl text-[14px] font-medium text-[#2D2926] placeholder-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/10 focus:border-[#ffb700]/30 transition-all shadow-sm group-hover:bg-white"
                    />
                </div>
            )}

            <div className="flex items-center gap-3 self-end md:self-auto">
                {count !== undefined && (
                    <div className="hidden lg:flex items-center">
                        <span className="text-[10px] font-black bg-[#ffb700]/5 text-[#ffb700]/60 px-4 py-2 rounded-xl uppercase tracking-widest border border-[#ffb700]/10">
                            {count} {countLabel}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-[#ffb700]/10 shadow-sm hover:border-[#ffb700]/30 transition-all group cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb700] font-bold">sort</span>
                    <select 
                        className="bg-transparent border-none text-[10px] font-black text-[#2D2926]/70 focus:ring-0 cursor-pointer p-0 pr-8 uppercase tracking-widest outline-none"
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
