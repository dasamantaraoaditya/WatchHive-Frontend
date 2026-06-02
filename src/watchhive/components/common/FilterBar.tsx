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
        <div className={`flex flex-row items-center ${onSearchChange ? 'justify-between' : 'justify-end'} gap-2 sm:gap-4 py-1.5 w-full`}>
            {onSearchChange && (
                <div className="flex-1 relative group max-w-2xl">
                    <span className="material-symbols-outlined absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-[#2D2926]/40 group-focus-within:text-[#ffb700] transition-colors text-[16px] sm:text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-7.5 sm:pl-12 pr-7.5 sm:pr-12 py-1.5 sm:py-2.5 bg-slate-50 border border-[#ffb700]/10 rounded-lg sm:rounded-2xl text-[11px] sm:text-[14px] font-medium text-[#2D2926] placeholder-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/10 focus:border-[#ffb700]/30 transition-all shadow-sm group-hover:bg-white"
                        style={{ paddingLeft: '2rem' }}
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-4 text-slate-400 hover:text-[#ffb700] transition-colors"
                            title="Clear Search"
                        >
                            <span className="material-symbols-outlined text-sm sm:text-lg">close</span>
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
                
                <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl border border-[#ffb700]/10 shadow-sm hover:border-[#ffb700]/30 transition-all group cursor-pointer">
                    <span className="material-symbols-outlined text-[14px] sm:text-[18px] text-[#ffb700] font-bold">sort</span>
                    <select 
                        className="bg-transparent border-none text-[8px] sm:text-[10px] font-black text-[#2D2926]/70 focus:ring-0 cursor-pointer p-0 pr-4 sm:pr-8 uppercase tracking-widest outline-none"
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        {sortOptions.map(option => {
                            // Map lengthy labels to super clean, intuitive, and short terms for mobile layout
                            let shortLabel = option.label;
                            if (window.innerWidth < 640 || (window.matchMedia && window.matchMedia('(max-width: 640px)').matches)) {
                                const lower = option.label.toLowerCase();
                                if (lower.includes('recently watched') || lower.includes('recent')) {
                                    shortLabel = 'Recent';
                                } else if (lower.includes('oldest watched') || lower.includes('oldest')) {
                                    shortLabel = 'Oldest';
                                } else if (lower.includes('highest rated') || lower.includes('highest')) {
                                    shortLabel = 'Highest';
                                } else if (lower.includes('lowest rated') || lower.includes('lowest')) {
                                    shortLabel = 'Lowest';
                                } else if (lower.includes('recently added') || lower.includes('recent add')) {
                                    shortLabel = 'Added';
                                } else if (lower.includes('a-z')) {
                                    shortLabel = 'A - Z';
                                } else if (lower.includes('z-a')) {
                                    shortLabel = 'Z - A';
                                }
                            }
                            
                            return (
                                <option key={option.value} value={option.value}>
                                    {shortLabel}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        </div>
    );
};
