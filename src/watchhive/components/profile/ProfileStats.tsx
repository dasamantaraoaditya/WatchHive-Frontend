import React, { useEffect, useState } from 'react';
import { userService } from '../../services';
import { BeeLoader, ErrorState } from '../common';
import { DailyLogInspectorModal } from '../mindlens/DailyLogInspectorModal';

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
            setError('Unable to connect to WatchHive servers right now. Please try again later.');
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

    if (!data || data.summary.totalCount === 0) {
        return (
            <div className="flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
                {/* Unified Filter Toolbar */}
                <div className="flex flex-wrap items-center gap-4 bg-white border border-[#ffb700]/10 p-5 rounded-[28px] shadow-sm">
                    <div className="flex items-center gap-1.5 mr-4 flex-wrap">
                        {timeframes.map(tf => (
                            <button 
                                key={tf.value}
                                onClick={() => setDays(tf.value)}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${days === tf.value ? 'bg-[#ffb700] text-white shadow-md' : 'bg-[#FFF9F0] text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                            className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="MOVIE">Movies Only</option>
                            <option value="TV_SHOW">TV Only</option>
                        </select>

                        <select 
                            value={genre} 
                            onChange={(e) => setGenre(e.target.value)}
                            className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none max-w-[150px]"
                        >
                            <option value="">All Genres</option>
                            {(data?.availableGenres || []).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>

                        <select 
                            value={minRating} 
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none"
                        >
                            <option value="0">Any Rating</option>
                            {[9, 8, 7, 6, 5].map(r => <option key={r} value={r}>{r}+ Stars</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm">
                    <div className="w-16 h-16 rounded-[24px] bg-[#ffb700]/10 flex items-center justify-center mb-4 border border-[#ffb700]/20 text-[#ffb700]">
                        <span className="material-symbols-outlined text-3xl">analytics</span>
                    </div>
                    <h3 className="text-xl font-black text-[#2D2926] tracking-tight mb-2">No Matches for Selected Range</h3>
                    <p className="text-[#2D2926]/50 font-bold max-w-sm text-xs leading-relaxed mb-6">
                        No watch entries found for the selected {days === 0 ? 'All Time' : `${days}-day`} timeframe and filters. Try switching to <strong>All Time</strong> or clearing filters!
                    </p>
                    <div className="flex gap-3">
                        {days !== 0 && (
                            <button 
                                onClick={() => setDays(0)}
                                className="px-5 py-2.5 bg-[#ffb700] text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-[#2D2926] transition-colors"
                            >
                                View All-Time Analytics
                            </button>
                        )}
                        <button 
                            onClick={() => { setType(''); setGenre(''); setMinRating(0); setDays(0); }}
                            className="px-5 py-2.5 bg-[#FFF9F0] border border-[#ffb700]/30 text-[#ffb700] text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#ffb700] hover:text-white transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- CHART CALCULATIONS ---
    const maxCount = Math.max(...data.timeSeries.map(d => d.count), 1);
    const chartHeight = 250;
    const chartWidth = 900;
    const padding = 40;

    const getX = (index: number) => (index / (data.timeSeries.length - 1)) * (chartWidth - padding * 2) + padding;
    const getY = (count: number) => chartHeight - ((count / maxCount) * (chartHeight - padding * 2) + padding);

    const linePath = data.timeSeries.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.count)}`).join(' ');
    const areaPath = `${linePath} L ${getX(data.timeSeries.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;

    const rhythmMax = Math.max(...data.viewingRhythm.map(r => r.count), 1);

    return (
        <div className="flex flex-col gap-8 animate-[fade-in_0.5s_ease-out]">
            
            {/* Unified Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-white border border-[#ffb700]/10 p-5 rounded-[28px] shadow-sm">
                <div className="flex items-center gap-1.5 mr-4 flex-wrap">
                    {timeframes.map(tf => (
                        <button 
                            key={tf.value}
                            onClick={() => setDays(tf.value)}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${days === tf.value ? 'bg-[#ffb700] text-white shadow-md' : 'bg-[#FFF9F0] text-[#2D2926]/40 hover:text-[#2D2926]'}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none"
                    >
                        <option value="">All Types</option>
                        <option value="MOVIE">Movies Only</option>
                        <option value="TV_SHOW">TV Only</option>
                    </select>

                    <select 
                        value={genre} 
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none max-w-[150px]"
                    >
                        <option value="">All Genres</option>
                        {data.availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select 
                        value={minRating} 
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D2926] outline-none"
                    >
                        <option value="0">Any Rating</option>
                        {[9, 8, 7, 6, 5].map(r => <option key={r} value={r}>{r}+ Stars</option>)}
                    </select>
                </div>

                <div className="flex ml-auto bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl p-1">
                    <button 
                        onClick={() => setChartType('line')}
                        className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-[#ffb700]' : 'text-[#2D2926]/20 hover:text-[#2D2926]'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">show_chart</span>
                    </button>
                    <button 
                        onClick={() => setChartType('bar')}
                        className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-[#ffb700]' : 'text-[#2D2926]/20 hover:text-[#2D2926]'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                    </button>
                </div>
            </div>

            {/* Interactive Graph Card */}
            <div className="bg-white rounded-[40px] border border-[#ffb700]/10 shadow-md p-8 relative overflow-hidden group min-h-[450px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-[#2D2926] tracking-tighter">Activity Stream</h3>
                        <p className="text-[11px] font-bold text-[#2D2926]/30 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            {genre ? `${genre} •` : ''} {data.summary.totalCount} LOGS FOUND
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                             <span className="text-2xl font-black text-[#ffb700]">{data.summary.averageRating}</span>
                             <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest">Avg rating</span>
                        </div>
                        <div className="w-px h-8 bg-[#ffb700]/10"></div>
                        <div className="flex flex-col items-end">
                             <span className="text-2xl font-black text-[#2D2926]">{data.summary.totalCount}</span>
                             <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest">Total watched</span>
                        </div>
                    </div>
                </div>

                <div className="relative w-full overflow-visible">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible cursor-crosshair">
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#ffb700', stopOpacity: 0.15 }} />
                                <stop offset="100%" style={{ stopColor: '#ffb700', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        <line x1={padding} y1={chartHeight} x2={chartWidth - padding} y2={chartHeight} stroke="#ffb700" strokeOpacity="0.1" strokeWidth="2" />
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                            <line key={v} x1={padding} y1={chartHeight - (v * (chartHeight - padding * 2) + padding)} x2={chartWidth - padding} y2={chartHeight - (v * (chartHeight - padding * 2) + padding)} stroke="#ffb700" strokeOpacity="0.03" strokeDasharray="4 4" />
                        ))}

                        {chartType === 'line' ? (
                            <>
                                <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-700 ease-out" />
                                <path d={linePath} fill="none" stroke="#ffb700" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
                                {data.timeSeries.filter(d => d.count > 0).map((d, i) => (
                                    <circle 
                                        key={i} 
                                        cx={getX(data.timeSeries.indexOf(d))} 
                                        cy={getY(d.count)} 
                                        r={hoveredDay === data.timeSeries.indexOf(d) ? "10" : "6"} 
                                        fill="white" 
                                        stroke="#ffb700" 
                                        strokeWidth="4" 
                                        className="transition-all cursor-pointer z-20"
                                        onMouseEnter={() => setHoveredDay(data.timeSeries.indexOf(d))}
                                    />
                                ))}
                            </>
                        ) : (
                            data.timeSeries.map((d, i) => {
                                const barWidth = (chartWidth / data.timeSeries.length) * 0.7;
                                const h = (d.count / maxCount) * (chartHeight - padding * 2);
                                return (
                                    <rect 
                                        key={i}
                                        x={getX(i) - barWidth / 2}
                                        y={chartHeight - h}
                                        width={barWidth}
                                        height={h}
                                        fill={hoveredDay === i ? "#ffb700" : "#ffb700cc"}
                                        rx="6"
                                        className="transition-all cursor-pointer"
                                        onMouseEnter={() => setHoveredDay(i)}
                                    />
                                );
                            })
                        )}

                        {/* Hover Detection Overlay */}
                        {data.timeSeries.map((_, i) => (
                             <rect 
                                key={i}
                                x={getX(i) - (chartWidth / data.timeSeries.length) / 2}
                                y={0}
                                width={chartWidth / data.timeSeries.length}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredDay(i)}
                                onClick={() => {
                                    if (data.timeSeries[i] && data.timeSeries[i].count > 0) {
                                        setSelectedDayForModal(i);
                                    }
                                }}
                             />
                        ))}
                    </svg>

                    {/* Tooltip Card */}
                    {hoveredDay !== null && data.timeSeries[hoveredDay] && data.timeSeries[hoveredDay].count > 0 && (
                        <div 
                            className="absolute z-50 pointer-events-none transition-all animate-[fade-in_0.2s_ease-out]"
                            style={{ 
                                left: `${(getX(hoveredDay) / chartWidth) * 100}%`,
                                top: `${(getY(data.timeSeries[hoveredDay].count) / chartHeight) * 100}%`,
                                transform: 'translate(-50%, -110%)'
                            }}
                        >
                            <div className="bg-[#2D2926] text-white p-4 rounded-2xl shadow-2xl min-w-[210px] max-w-[280px] border border-white/10">
                                <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
                                    {new Date(data.timeSeries[hoveredDay].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                    {data.timeSeries[hoveredDay].items?.map((item, idx) => (
                                        <div key={idx} className="flex flex-col border-b border-white/5 pb-1.5 last:border-b-0">
                                            <span className="text-[12px] font-black leading-tight truncate">{item.title}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.type === 'MOVIE' ? 'Movie' : 'TV'}</span>
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
                                <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-[#ffb700] uppercase">Click point to inspect</span>
                                    <span className="text-[12px] font-black">{data.timeSeries[hoveredDay].count} {data.timeSeries[hoveredDay].count === 1 ? 'log' : 'logs'}</span>
                                </div>
                            </div>
                            <div className="w-4 h-4 bg-[#2D2926] rotate-45 absolute -bottom-2 left-1/2 -ml-2"></div>
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] font-black text-[#2D2926]/40 uppercase tracking-[0.2em] mt-12 pb-4">
                    Click any point on the chart to inspect full daily watch logs
                </p>

                {selectedDayForModal !== null && data.timeSeries[selectedDayForModal] && (
                    <DailyLogInspectorModal
                        isOpen={selectedDayForModal !== null}
                        onClose={() => setSelectedDayForModal(null)}
                        dateStr={data.timeSeries[selectedDayForModal].date}
                        count={data.timeSeries[selectedDayForModal].count}
                        items={data.timeSeries[selectedDayForModal].items || []}
                    />
                )}
            </div>

            {/* Viewing Rhythm (Time of Day Distribution) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-white rounded-[40px] border border-[#ffb700]/10 shadow-sm p-8">
                    <h3 className="text-lg font-black text-[#2D2926] tracking-tight mb-8 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#ffb700]">timer</span>
                        Viewing Rhythm
                    </h3>
                    <div className="flex items-end justify-between gap-2 h-40 px-4">
                        {data.viewingRhythm.map((r, i) => {
                            const h = (r.count / rhythmMax) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                                        <div 
                                            className="w-full max-w-[40px] bg-[#FFF9F0] border border-[#ffb700]/10 rounded-xl transition-all duration-1000 group-hover:bg-[#ffb700]/20" 
                                            style={{ height: `${Math.max(h, 4)}%` }}
                                        >
                                            {h > 0 && <div className="absolute top-0 left-0 right-0 -mt-6 text-[10px] font-black text-[#ffb700] text-center">{r.count}</div>}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest text-center leading-tight h-8">
                                        {r.label}<br/>
                                        {r.hour}:00
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#2D2926] to-black rounded-[40px] p-8 text-white relative overflow-hidden shadow-xl shadow-[#2D2926]/20">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Most Active Slot</p>
                        <h4 className="text-3xl font-black mb-6">
                            {data.viewingRhythm.reduce((prev, current) => (prev.count > current.count) ? prev : current).label}
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                                <span className="material-symbols-outlined text-[#ffb700]">schedule</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Typical Start</span>
                                    <span className="text-sm font-black">
                                        {data.viewingRhythm.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour}:30
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ffb700] rounded-full blur-[80px] opacity-20"></div>
                </div>
            </div>
            
        </div>
    );
};
