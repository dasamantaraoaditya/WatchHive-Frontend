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
    isLoading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    search = "",
    onSearchChange,
    sortBy,
    onSortChange,
    sortOptions,
    placeholder = "Search items...",
    count,
    countLabel = "items",
    isLoading = false
}) => {
    return (
        <div className={`flex flex-row items-center ${onSearchChange ? 'justify-between' : 'justify-end'} gap-1.5 sm:gap-4 py-1 w-full`}>
            {onSearchChange && (
                <div className="flex-1 relative group max-w-2xl">
                    {isLoading ? (
                        <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            <svg className="animate-spin h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#ffb700]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <span className="material-symbols-outlined absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-[#2D2926]/40 group-focus-within:text-[#ffb700] transition-colors text-[14px] sm:text-[20px]">
                            search
                        </span>
                    )}
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-6.5 sm:pl-12 pr-6.5 sm:pr-12 py-1 sm:py-2.5 bg-slate-50 border border-[#ffb700]/10 rounded-md sm:rounded-2xl text-[10px] sm:text-[14px] font-medium text-[#2D2926] placeholder-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/10 focus:border-[#ffb700]/30 transition-all shadow-sm group-hover:bg-white"
                        style={{ paddingLeft: '1.65rem' }}
                    />
                    {search && !isLoading && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4 text-slate-400 hover:text-[#ffb700] transition-colors"
                            title="Clear Search"
                        >
                            <span className="material-symbols-outlined text-[12px] sm:text-[18px]">close</span>
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {count !== undefined && (
                    <div className="hidden lg:flex items-center">
                        <span className="text-[10px] font-black bg-[#ffb700]/5 text-[#ffb700]/60 px-4 py-2 rounded-xl uppercase tracking-widest border border-[#ffb700]/10">
                            {count} {countLabel}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-0.5 sm:gap-2 bg-[#ffb700]/5 hover:bg-[#ffb700]/10 px-1.5 py-1 sm:px-4 sm:py-2.5 rounded-md sm:rounded-2xl border border-[#ffb700]/20 shadow-sm transition-all group cursor-pointer relative">
                    <span className="material-symbols-outlined text-[11px] sm:text-[16px] text-[#b07d00] font-bold shrink-0">sort</span>
                    <select 
                        className="bg-transparent border-none text-[7.5px] sm:text-[10px] font-black text-[#b07d00] focus:ring-0 cursor-pointer p-0 pr-3 sm:pr-6 uppercase tracking-widest outline-none appearance-none -webkit-appearance-none -moz-appearance-none"
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        style={{
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            paddingRight: '0.75rem',
                            backgroundImage: 'none'
                        }}
                    >
                        {sortOptions.map(option => {
                            // Map lengthy labels to super clean, intuitive, and short terms for mobile layout
                            let shortLabel = option.label;
                            const lower = option.label.toLowerCase();
                            
                            if (window.innerWidth < 640 || (window.matchMedia && window.matchMedia('(max-width: 640px)').matches)) {
                                if (lower.includes('recently watched') || lower.includes('recent watch')) {
                                    shortLabel = 'Recent';
                                } else if (lower.includes('oldest')) {
                                    shortLabel = 'Oldest';
                                } else if (lower.includes('highest rated') || lower.includes('highest rating') || lower.includes('top rated')) {
                                    shortLabel = 'Top Rated';
                                } else if (lower.includes('lowest rated') || lower.includes('lowest rating')) {
                                    shortLabel = 'Lowest';
                                } else if (lower.includes('recently suggested') || lower.includes('recent suggest')) {
                                    shortLabel = 'Suggested';
                                } else if (lower.includes('recently added') || lower.includes('recent add')) {
                                    shortLabel = 'Newest';
                                } else if (lower.includes('title: a-z') || lower.includes('movie: a-z') || lower.includes('a-z')) {
                                    shortLabel = 'A to Z';
                                } else if (lower.includes('title: z-a') || lower.includes('movie: z-a') || lower.includes('z-a')) {
                                    shortLabel = 'Z to A';
                                }
                            } else {
                                // Clean up desktop labels as well to keep them intuitive
                                if (lower.includes('recently watched')) shortLabel = 'Recently Watched';
                                if (lower.includes('oldest watched')) shortLabel = 'Oldest Watched';
                                if (lower.includes('highest rated')) shortLabel = 'Highest Rated';
                                if (lower.includes('lowest rated')) shortLabel = 'Lowest Rated';
                                if (lower.includes('recently added')) shortLabel = 'Recently Added';
                                if (lower.includes('recently suggested')) shortLabel = 'Recently Suggested';
                            }
                            
                            return (
                                <option key={option.value} value={option.value} className="bg-white text-slate-700 font-bold uppercase tracking-wider text-[11px] py-2">
                                    {shortLabel}
                                </option>
                            );
                        })}
                    </select>
                    {/* Floating mini arrow to prevent browser overlap issues */}
                    <span className="material-symbols-outlined text-[10px] text-[#b07d00] pointer-events-none absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 select-none">
                        keyboard_arrow_down
                    </span>
                </div>
            </div>
        </div>
    );
};
