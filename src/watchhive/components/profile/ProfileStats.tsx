import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../../services';
import { BeeLoader, ErrorState } from '../common';
import { DailyLogInspectorModal } from '../mindlens/DailyLogInspectorModal';
import { TOP_GENRES } from '../../constants/genres';

interface StatsData {
    summary: {
        totalCount: number;
        averageRating: number;
        daysAnalyzed: number;
    };
    timeSeries: { 
        date: string; 
        count: number; 
        items?: { id: string; title: string; type: string; rating?: string; watchedAt?: string }[] 
    }[];
    availableGenres: string[];
    typeBreakdown: { name: string; count: number }[];
    viewingRhythm: { hour: number; label: string; count: number }[];
}

export const ProfileStats: React.FC = () => {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);
    const [type, setType] = useState<string>('');
    const [genre, setGenre] = useState<string>('');
    const [minRating, setMinRating] = useState<number>(0);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    const [hoveredDay, setHoveredDay] = useState<number | null>(null);
    const [selectedDayForModal, setSelectedDayForModal] = useState<number | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await userService.getDetailedStats(days, type || undefined, genre || undefined, minRating || undefined);
            setData(res);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
            setError('Unable to connect to WatchersHive servers right now. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [days, type, genre, minRating]);

    const timeframes = [
        { label: '7d', value: 7 },
        { label: '30d', value: 30 },
        { label: '90d', value: 90 },
        { label: '1y', value: 365 },
        { label: 'All Time', value: 0 },
    ];

    // Canonical top genres list, prioritized by user frequency if available
    const genreOptions = useMemo(() => {
        if (data?.availableGenres && data.availableGenres.length > 0) {
            const matched = data.availableGenres.filter(g => (TOP_GENRES as readonly string[]).includes(g));
            const remaining = TOP_GENRES.filter(g => !matched.includes(g));
            return [...matched, ...remaining];
        }
        return [...TOP_GENRES];
    }, [data?.availableGenres]);

    if (error) {
        return (
            <ErrorState 
                title="The Hive is Currently Down"
                message="Unable to load detailed analytics right now. Please check your connection or try again later."
                onRetry={fetchStats}
            />
        );
    }

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <BeeLoader size="small" message="Parsing Hive History..." />
            </div>
        );
    }

    // Chart calculations
    const timeSeries = data?.timeSeries || [];
    const maxCount = Math.max(...timeSeries.map(d => d.count), 1);
    const chartHeight = 250;
    const chartWidth = 900;
    const padding = 40;

    const getX = (index: number) => {
        if (timeSeries.length <= 1) return padding;
        return (index / (timeSeries.length - 1)) * (chartWidth - padding * 2) + padding;
    };
    const getY = (count: number) => chartHeight - ((count / maxCount) * (chartHeight - padding * 2) + padding);

    const linePath = timeSeries.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.count)}`).join(' ');
    const areaPath = timeSeries.length > 0 
        ? `${linePath} L ${getX(timeSeries.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`
        : '';

    const viewingRhythm = data?.viewingRhythm || [];
    const rhythmMax = Math.max(...viewingRhythm.map(r => r.count), 1);

    const isEmpty = !data || data.summary.totalCount === 0;

    return (
        <div className="flex flex-col gap-6 animate-[fade-in_0.4s_ease-out]">
            {/* Unified Filter Toolbar adhering strictly to Warm Honey & Cream design tokens */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#ffb700]/15 p-3.5 sm:p-4 rounded-3xl shadow-xs">
                {/* Timeframe segmented pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {timeframes.map(tf => {
                        const isActive = days === tf.value;
                        return (
                            <button 
                                key={tf.value}
                                onClick={() => setDays(tf.value)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    isActive 
                                        ? 'bg-[#ffb700] text-[#2D2926] shadow-xs' 
                                        : 'bg-[#FFF9F0] text-[#2D2926]/50 hover:text-[#2D2926] hover:bg-[#FFF3E0]'
                                }`}
                            >
                                {tf.label}
                            </button>
                        );
                    })}
                </div>

                {/* Compact Styled Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Media Type Dropdown */}
                    <div className="relative inline-flex items-center bg-[#FFF9F0] hover:bg-[#FFF3E0] border border-[#ffb700]/25 rounded-xl px-2.5 h-9 transition-colors group cursor-pointer">
                        <span className="material-symbols-outlined text-[15px] text-[#ffb700] mr-1.5 shrink-0 pointer-events-none select-none">
                            movie
                        </span>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                            className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-wider text-[#2D2926] pr-5 cursor-pointer outline-none focus:outline-none border-none py-0 select-none leading-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            aria-label="Filter by media type"
                        >
                            <option value="">All Types</option>
                            <option value="MOVIE">Movies Only</option>
                            <option value="TV_SHOW">TV Shows</option>
                        </select>
                        <span className="material-symbols-outlined text-[14px] text-[#2D2926]/40 group-hover:text-[#2D2926] pointer-events-none absolute right-2 select-none transition-transform">
                            expand_more
                        </span>
                    </div>

                    {/* Genre Dropdown (Canonical Top Genres) */}
                    <div className="relative inline-flex items-center bg-[#FFF9F0] hover:bg-[#FFF3E0] border border-[#ffb700]/25 rounded-xl px-2.5 h-9 transition-colors group cursor-pointer">
                        <span className="material-symbols-outlined text-[15px] text-[#ffb700] mr-1.5 shrink-0 pointer-events-none select-none">
                            category
                        </span>
                        <select 
                            value={genre} 
                            onChange={(e) => setGenre(e.target.value)}
                            className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-wider text-[#2D2926] pr-5 cursor-pointer outline-none focus:outline-none border-none py-0 max-w-[120px] truncate select-none leading-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            aria-label="Filter by top genre"
                        >
                            <option value="">All Genres</option>
                            {genreOptions.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined text-[14px] text-[#2D2926]/40 group-hover:text-[#2D2926] pointer-events-none absolute right-2 select-none transition-transform">
                            expand_more
                        </span>
                    </div>

                    {/* Minimum Rating Dropdown */}
                    <div className="relative inline-flex items-center bg-[#FFF9F0] hover:bg-[#FFF3E0] border border-[#ffb700]/25 rounded-xl px-2.5 h-9 transition-colors group cursor-pointer">
                        <span className="material-symbols-outlined text-[15px] text-[#ffb700] mr-1.5 shrink-0 pointer-events-none select-none">
                            star
                        </span>
                        <select 
                            value={minRating} 
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-wider text-[#2D2926] pr-5 cursor-pointer outline-none focus:outline-none border-none py-0 select-none leading-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            aria-label="Filter by minimum rating"
                        >
                            <option value="0">Any Rating</option>
                            {[9, 8, 7, 6, 5].map(r => (
                                <option key={r} value={r}>{r}+ Stars</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined text-[14px] text-[#2D2926]/40 group-hover:text-[#2D2926] pointer-events-none absolute right-2 select-none transition-transform">
                            expand_more
                        </span>
                    </div>

                    {/* Chart type switcher */}
                    <div className="flex items-center bg-[#FFF9F0] border border-[#ffb700]/25 rounded-xl p-0.5 ml-auto sm:ml-0 h-9">
                        <button 
                            onClick={() => setChartType('line')}
                            title="Line Chart"
                            aria-label="Line Chart"
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                chartType === 'line' 
                                    ? 'bg-[#ffb700] text-[#2D2926] shadow-xs font-bold' 
                                    : 'text-[#2D2926]/40 hover:text-[#2D2926]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px] block">show_chart</span>
                        </button>
                        <button 
                            onClick={() => setChartType('bar')}
                            title="Bar Chart"
                            aria-label="Bar Chart"
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                chartType === 'bar' 
                                    ? 'bg-[#ffb700] text-[#2D2926] shadow-xs font-bold' 
                                    : 'text-[#2D2926]/40 hover:text-[#2D2926]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px] block">bar_chart</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State Banner (Displayed under the persistent toolbar) */}
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-3xl border border-[#ffb700]/15 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-[#ffb700]/10 flex items-center justify-center mb-4 border border-[#ffb700]/20 text-[#ffb700]">
                        <span className="material-symbols-outlined text-3xl">analytics</span>
                    </div>
                    <h3 className="text-xl font-black text-[#2D2926] tracking-tight mb-2">No Matches for Selected Range</h3>
                    <p className="text-[#2D2926]/60 font-bold max-w-sm text-xs leading-relaxed mb-6">
                        No watch entries found for the selected {days === 0 ? 'All Time' : `${days}-day`} timeframe and filters. Try switching to <strong>All Time</strong> or clearing filters!
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center">
                        {days !== 0 && (
                            <button 
                                onClick={() => setDays(0)}
                                className="px-5 py-2.5 bg-[#ffb700] text-[#2D2926] text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xs hover:bg-[#E59700] transition-colors cursor-pointer"
                            >
                                View All-Time Analytics
                            </button>
                        )}
                        <button 
                            onClick={() => { setType(''); setGenre(''); setMinRating(0); setDays(0); }}
                            className="px-5 py-2.5 bg-[#FFF9F0] border border-[#ffb700]/30 text-[#2D2926] text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#ffb700] transition-colors cursor-pointer"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Interactive Graph Card */}
                    <div className="bg-white rounded-3xl border border-[#ffb700]/15 shadow-sm p-6 sm:p-8 relative overflow-hidden group min-h-[420px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-[#2D2926] tracking-tight">Activity Stream</h3>
                                <p className="text-[11px] font-bold text-[#2D2926]/40 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    {genre ? `${genre} •` : ''} {data.summary.totalCount} LOGS FOUND
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-[#ffb700]">{data.summary.averageRating}</span>
                                    <span className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest">Avg rating</span>
                                </div>
                                <div className="w-px h-8 bg-[#ffb700]/15"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-[#2D2926]">{data.summary.totalCount}</span>
                                    <span className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest">Total watched</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-full overflow-visible">
                            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible cursor-crosshair">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#ffb700', stopOpacity: 0.18 }} />
                                        <stop offset="100%" style={{ stopColor: '#ffb700', stopOpacity: 0 }} />
                                    </linearGradient>
                                </defs>
                                
                                {/* Grid Lines */}
                                <line x1={padding} y1={chartHeight} x2={chartWidth - padding} y2={chartHeight} stroke="#ffb700" strokeOpacity="0.15" strokeWidth="2" />
                                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                                    <line 
                                        key={v} 
                                        x1={padding} 
                                        y1={chartHeight - (v * (chartHeight - padding * 2) + padding)} 
                                        x2={chartWidth - padding} 
                                        y2={chartHeight - (v * (chartHeight - padding * 2) + padding)} 
                                        stroke="#ffb700" 
                                        strokeOpacity="0.05" 
                                        strokeDasharray="4 4" 
                                    />
                                ))}

                                {chartType === 'line' ? (
                                    <>
                                        <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-700 ease-out" />
                                        <path d={linePath} fill="none" stroke="#ffb700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
                                        {timeSeries.filter(d => d.count > 0).map((d, i) => (
                                            <circle 
                                                key={i} 
                                                cx={getX(timeSeries.indexOf(d))} 
                                                cy={getY(d.count)} 
                                                r={hoveredDay === timeSeries.indexOf(d) ? "9" : "5"} 
                                                fill="white" 
                                                stroke="#ffb700" 
                                                strokeWidth="3.5" 
                                                className="transition-all cursor-pointer z-20"
                                                onMouseEnter={() => setHoveredDay(timeSeries.indexOf(d))}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    timeSeries.map((d, i) => {
                                        const barWidth = (chartWidth / Math.max(timeSeries.length, 1)) * 0.7;
                                        const h = (d.count / maxCount) * (chartHeight - padding * 2);
                                        return (
                                            <rect 
                                                key={i}
                                                x={getX(i) - barWidth / 2}
                                                y={chartHeight - h}
                                                width={barWidth}
                                                height={h}
                                                fill={hoveredDay === i ? "#ffb700" : "#ffb700cc"}
                                                rx="5"
                                                className="transition-all cursor-pointer"
                                                onMouseEnter={() => setHoveredDay(i)}
                                            />
                                        );
                                    })
                                )}

                                {/* Hover Detection Overlay */}
                                {timeSeries.map((_, i) => (
                                    <rect 
                                        key={i}
                                        x={getX(i) - (chartWidth / Math.max(timeSeries.length, 1)) / 2}
                                        y={0}
                                        width={chartWidth / Math.max(timeSeries.length, 1)}
                                        height={chartHeight}
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredDay(i)}
                                        onClick={() => {
                                            if (timeSeries[i] && timeSeries[i].count > 0) {
                                                setSelectedDayForModal(i);
                                            }
                                        }}
                                    />
                                ))}
                            </svg>

                            {/* Tooltip Card */}
                            {hoveredDay !== null && timeSeries[hoveredDay] && timeSeries[hoveredDay].count > 0 && (
                                <div 
                                    className="absolute z-50 pointer-events-none transition-all animate-[fade-in_0.2s_ease-out]"
                                    style={{ 
                                        left: `${(getX(hoveredDay) / chartWidth) * 100}%`,
                                        top: `${(getY(timeSeries[hoveredDay].count) / chartHeight) * 100}%`,
                                        transform: 'translate(-50%, -110%)'
                                    }}
                                >
                                    <div className="bg-[#2D2926] text-white p-3.5 rounded-2xl shadow-2xl min-w-[210px] max-w-[280px] border border-white/10">
                                        <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest mb-2 border-b border-white/10 pb-1.5">
                                            {new Date(timeSeries[hoveredDay].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <div className="space-y-1.5 mt-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                            {timeSeries[hoveredDay].items?.map((item, idx) => (
                                                <div key={idx} className="flex flex-col border-b border-white/5 pb-1 last:border-b-0">
                                                    <span className="text-[11px] font-black leading-tight truncate">{item.title}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{item.type === 'MOVIE' ? 'Movie' : 'TV'}</span>
                                                        {item.watchedAt && (
                                                            <>
                                                                <span className="text-[9px] font-black text-white/20">•</span>
                                                                <span className="text-[9px] font-bold text-[#ffb700] uppercase">
                                                                    {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </>
                                                        )}
                                                        {item.rating && (
                                                            <>
                                                                <span className="text-[9px] font-black text-white/20">•</span>
                                                                <span className="text-[9px] font-black text-[#ffb700]">★ {item.rating}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2.5 pt-1.5 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-[#ffb700] uppercase">Click to inspect</span>
                                            <span className="text-[11px] font-black">{timeSeries[hoveredDay].count} {timeSeries[hoveredDay].count === 1 ? 'log' : 'logs'}</span>
                                        </div>
                                    </div>
                                    <div className="w-3 h-3 bg-[#2D2926] rotate-45 absolute -bottom-1.5 left-1/2 -ml-1.5"></div>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[10px] font-black text-[#2D2926]/40 uppercase tracking-[0.2em] mt-8 pb-2">
                            Click any point on the chart to inspect full daily watch logs
                        </p>

                        {selectedDayForModal !== null && timeSeries[selectedDayForModal] && (
                            <DailyLogInspectorModal
                                isOpen={selectedDayForModal !== null}
                                onClose={() => setSelectedDayForModal(null)}
                                dateStr={timeSeries[selectedDayForModal].date}
                                count={timeSeries[selectedDayForModal].count}
                                items={timeSeries[selectedDayForModal].items || []}
                            />
                        )}
                    </div>

                    {/* Viewing Rhythm (Time of Day Distribution) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#ffb700]/15 shadow-sm p-6 sm:p-8">
                            <h3 className="text-lg font-black text-[#2D2926] tracking-tight mb-6 flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#ffb700]">timer</span>
                                Viewing Rhythm
                            </h3>
                            <div className="flex items-end justify-between gap-2 h-36 px-2 sm:px-4">
                                {viewingRhythm.map((r, i) => {
                                    const h = (r.count / rhythmMax) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                                <div 
                                                    className="w-full max-w-[36px] bg-[#FFF9F0] border border-[#ffb700]/15 rounded-xl transition-all duration-700 group-hover:bg-[#ffb700]/25" 
                                                    style={{ height: `${Math.max(h, 6)}%` }}
                                                >
                                                    {r.count > 0 && (
                                                        <div className="absolute top-0 left-0 right-0 -mt-5 text-[10px] font-black text-[#ffb700] text-center">
                                                            {r.count}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest text-center leading-tight h-7">
                                                {r.label}<br/>
                                                {r.hour}:00
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {viewingRhythm.length > 0 && (
                            <div className="bg-gradient-to-br from-[#2D2926] to-black rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-[#2D2926]/10 flex flex-col justify-between">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5">Most Active Slot</p>
                                    <h4 className="text-2xl sm:text-3xl font-black mb-6">
                                        {viewingRhythm.reduce((prev, current) => (prev.count > current.count) ? prev : current).label}
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
                                        <span className="material-symbols-outlined text-[#ffb700]">schedule</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Typical Start</span>
                                            <span className="text-sm font-black">
                                                {viewingRhythm.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour}:30
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-[#ffb700] rounded-full blur-[70px] opacity-20 pointer-events-none"></div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
