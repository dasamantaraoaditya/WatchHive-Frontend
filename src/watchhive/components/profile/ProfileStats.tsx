import React, { useEffect, useState } from 'react';
import { userService } from '../../services';

interface StatsData {
    summary: {
        totalCount: number;
        averageRating: number;
        daysAnalyzed: number;
    };
    timeSeries: { date: string; count: number }[];
    genreBreakdown: { name: string; count: number }[];
    typeBreakdown: { name: string; count: number }[];
}

export const ProfileStats: React.FC = () => {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [type, setType] = useState<string>('');
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await userService.getDetailedStats(days, type || undefined);
                setData(res);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [days, type]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-[#ffb700]/20 border-t-[#ffb700] animate-spin mb-4"></div>
                <p className="text-[12px] font-black text-[#ffb700] uppercase tracking-widest">Parsing Hive History...</p>
            </div>
        );
    }

    if (!data || data.summary.totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 rounded-[28px] bg-[#ffb700]/5 flex items-center justify-center mb-6 border border-[#ffb700]/10">
                    <span className="material-symbols-outlined text-4xl text-[#ffb700]/30">analytics</span>
                </div>
                <h3 className="text-xl font-black text-[#2D2926] tracking-tight mb-2">Not Enough Data</h3>
                <p className="text-[#2D2926]/40 font-bold max-w-[300px] text-sm leading-relaxed">
                    Watch more content and log your entries to see your personalized cinematic analytics!
                </p>
            </div>
        );
    }

    // --- CHART CALCULATIONS ---
    const maxCount = Math.max(...data.timeSeries.map(d => d.count), 1);
    const chartHeight = 200;
    const chartWidth = 800;
    const padding = 20;

    const getX = (index: number) => (index / (data.timeSeries.length - 1)) * (chartWidth - padding * 2) + padding;
    const getY = (count: number) => chartHeight - ((count / maxCount) * (chartHeight - padding * 2) + padding);

    const linePath = data.timeSeries.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.count)}`).join(' ');
    const areaPath = `${linePath} L ${getX(data.timeSeries.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;

    const genreMax = Math.max(...data.genreBreakdown.map(g => g.count), 1);

    return (
        <div className="flex flex-col gap-8 animate-[fade-in_0.5s_ease-out]">
            
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 p-4 rounded-[24px] border border-[#ffb700]/10">
                <div className="flex items-center gap-2">
                    {[7, 30, 90].map(d => (
                        <button 
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${days === d ? 'bg-[#ffb700] text-white shadow-md shadow-[#ffb700]/20' : 'bg-white text-[#2D2926]/40 hover:text-[#2D2926] border border-[#ffb700]/10'}`}
                        >
                            {d} Days
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="bg-white border border-[#ffb700]/10 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#2D2926] focus:outline-none focus:border-[#ffb700]"
                    >
                        <option value="">All Types</option>
                        <option value="MOVIE">Movies</option>
                        <option value="TV_SHOW">TV Shows</option>
                    </select>

                    <div className="flex bg-white border border-[#ffb700]/10 rounded-xl p-1">
                        <button 
                            onClick={() => setChartType('line')}
                            className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-[#ffb700]/10 text-[#ffb700]' : 'text-[#2D2926]/30 hover:text-[#2D2926]'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">show_chart</span>
                        </button>
                        <button 
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-[#ffb700]/10 text-[#ffb700]' : 'text-[#2D2926]/30 hover:text-[#2D2926]'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* High Impact Trend Card */}
            <div className="bg-white rounded-[32px] border border-[#ffb700]/10 shadow-sm p-8 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Viewing Progress</h3>
                        <p className="text-[11px] font-bold text-[#2D2926]/30 uppercase tracking-[0.2em] mt-1">Activity over designated period</p>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-black text-[#ffb700]">{data.summary.totalCount}</span>
                        <p className="text-[9px] font-black text-[#2D2926]/40 uppercase tracking-widest">Total Logs</p>
                    </div>
                </div>

                <div className="w-full overflow-hidden">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#ffb700', stopOpacity: 0.2 }} />
                                <stop offset="100%" style={{ stopColor: '#ffb700', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ffb700" strokeOpacity="0.1" />
                        <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#ffb700" strokeOpacity="0.05" />

                        {chartType === 'line' ? (
                            <>
                                <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-700 ease-out" />
                                <path d={linePath} fill="none" stroke="#ffb700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
                                {data.timeSeries.filter((_, i) => i % (Math.ceil(days / 10)) === 0).map((d, i) => (
                                    <circle key={i} cx={getX(data.timeSeries.indexOf(d))} cy={getY(d.count)} r="6" fill="white" stroke="#ffb700" strokeWidth="3" />
                                ))}
                            </>
                        ) : (
                            data.timeSeries.map((d, i) => {
                                const barWidth = (chartWidth / data.timeSeries.length) * 0.8;
                                const h = (d.count / maxCount) * (chartHeight - padding * 2);
                                return (
                                    <rect 
                                        key={i}
                                        x={getX(i) - barWidth / 2}
                                        y={chartHeight - h}
                                        width={barWidth}
                                        height={h}
                                        fill="#ffb700"
                                        rx="4"
                                        className="transition-all duration-500 ease-out opacity-80 hover:opacity-100"
                                    />
                                );
                            })
                        )}
                    </svg>
                </div>
            </div>

            {/* Grid for Distribution Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Genre Dominance */}
                <div className="bg-white rounded-[32px] border border-[#ffb700]/10 shadow-sm p-8">
                    <h3 className="text-lg font-black text-[#2D2926] tracking-tight mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffb700]">category</span>
                        Genre Dominance
                    </h3>
                    <div className="space-y-5">
                        {data.genreBreakdown.map((g, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[13px] font-black text-[#2D2926]/70 tracking-tight">{g.name}</span>
                                    <span className="text-[11px] font-black text-[#ffb700]">{g.count} logs</span>
                                </div>
                                <div className="h-3 w-full bg-[#FFF9F0] rounded-full overflow-hidden border border-[#ffb700]/5">
                                    <div 
                                        className="h-full bg-[#ffb700] rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${(g.count / genreMax) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mixed Stats Grid */}
                <div className="flex flex-col gap-8">
                    {/* Tiny Summary Card */}
                    <div className="bg-gradient-to-br from-[#ffb700] to-orange-400 rounded-[32px] p-8 text-white shadow-lg shadow-[#ffb700]/20">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Average Rating</p>
                                <h4 className="text-4xl font-black mt-1">{data.summary.averageRating}<span className="text-xl opacity-60">/10</span></h4>
                             </div>
                             <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <span className="material-symbols-outlined">star_rate</span>
                             </div>
                        </div>
                    </div>

                    {/* Type Breakdown */}
                    <div className="bg-white rounded-[32px] border border-[#ffb700]/10 shadow-sm p-8 flex-1">
                        <h3 className="text-[12px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-6">Content DNA</h3>
                        <div className="flex flex-wrap gap-4">
                            {data.typeBreakdown.map((t, i) => (
                                <div key={i} className="flex-1 min-w-[120px] p-4 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/10 flex flex-col items-center">
                                    <span className="text-2xl font-black text-[#2D2926]">{t.count}</span>
                                    <span className="text-[9px] font-black text-[#ffb700] uppercase tracking-widest mt-1">{t.name === 'MOVIE' ? 'Movies' : 'TV Shows'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
