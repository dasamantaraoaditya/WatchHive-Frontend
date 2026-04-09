import React from 'react';

interface SortOption {
    value: string;
    label: string;
}

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
    sortOptions: SortOption[];
    placeholder?: string;
    count?: number;
    countLabel?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    search,
    onSearchChange,
    sortBy,
    onSortChange,
    sortOptions,
    placeholder = "Search items...",
    count,
    countLabel = "items"
}) => {
    return (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
            <div className="flex-1 relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2926]/40 group-focus-within:text-[#ffb700] transition-colors">
                    search
                </span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#ffb700]/10 rounded-2xl text-[14px] font-medium text-[#2D2926] placeholder-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/20 focus:border-[#ffb700]/40 transition-all shadow-sm"
                />
            </div>

            <div className="flex items-center gap-4">
                {count !== undefined && (
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#2D2926]/5 text-[#2D2926]/40 px-3 py-2 rounded-full uppercase tracking-widest border border-[#2D2926]/5">
                            {count} {countLabel}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-[#ffb700]/10 shadow-sm hover:border-[#ffb700]/40 transition-colors group">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb700] font-bold">swap_vert</span>
                    <select 
                        className="bg-transparent border-none text-[11px] font-black text-[#2D2926] focus:ring-0 cursor-pointer p-0 pr-8 uppercase tracking-wider outline-none"
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
