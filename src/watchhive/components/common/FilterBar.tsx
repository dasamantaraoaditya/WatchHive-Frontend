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
        <div className={`flex flex-row items-center ${onSearchChange ? 'justify-between' : 'justify-end'} gap-2 sm:gap-4 py-2 w-full`}>
            {onSearchChange && (
                <div className="flex-1 relative group max-w-2xl">
                    <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#2D2926]/40 group-focus-within:text-[#ffb700] transition-colors text-[18px] sm:text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 bg-slate-50 border border-[#ffb700]/10 rounded-xl sm:rounded-2xl text-[13px] sm:text-[14px] font-medium text-[#2D2926] placeholder-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/10 focus:border-[#ffb700]/30 transition-all shadow-sm group-hover:bg-white"
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-slate-400 hover:text-[#ffb700] transition-colors"
                            title="Clear Search"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {count !== undefined && (
                    <div className="hidden lg:flex items-center">
                        <span className="text-[10px] font-black bg-[#ffb700]/5 text-[#ffb700]/60 px-4 py-2 rounded-xl uppercase tracking-widest border border-[#ffb700]/10">
                            {count} {countLabel}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-[#ffb700]/10 shadow-sm hover:border-[#ffb700]/30 transition-all group cursor-pointer">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#ffb700] font-bold">sort</span>
                    <select 
                        className="bg-transparent border-none text-[9px] sm:text-[10px] font-black text-[#2D2926]/70 focus:ring-0 cursor-pointer p-0 pr-5 sm:pr-8 uppercase tracking-widest outline-none"
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
