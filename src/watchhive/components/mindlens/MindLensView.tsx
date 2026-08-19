import React, { useEffect, useState } from 'react';
import { mindLensApi, MindLensData } from '../../services/mindlens.service';
import { MindLensHighlightsSkeleton } from '../common/Skeleton';
import { Link } from 'react-router-dom';
import { ProfileStats } from '../profile';
import { DailyLogInspectorModal } from './DailyLogInspectorModal';

export const MindLensView: React.FC = () => {
    const [data, setData] = useState<MindLensData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'highlights' | 'analytics'>('highlights');

    // Frequency chart & image fallback controls
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
    const [selectedDayForModal, setSelectedDayForModal] = useState<number | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await mindLensApi.getInsights();
                setData(response);
            } catch (err) {
                console.error(err);
                setError('Failed to load MindLens insights.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const formatInsight = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <p className="text-sm text-[#2D2926]/70 leading-relaxed font-medium mb-3">
                {parts.map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i} className="text-[#2D2926] font-black">{part.slice(2, -2)}</strong>
                    ) : (
                        part
                    )
                )}
            </p>
        );
    };

    const AESTHETICS_MAP: Record<string, { bg: string; textClass: string }> = {
        'Noir': { bg: 'bg-[#2D2926]', textClass: 'text-[#FFF9F0]' },
        'Amber': { bg: 'bg-gradient-to-br from-[#ffb700] to-[#f59e0b]', textClass: 'text-[#2D2926]' },
        'Concrete': { bg: 'bg-slate-200', textClass: 'text-slate-700' },
        'Forest': { bg: 'bg-emerald-800', textClass: 'text-emerald-50' },
        'Grit': { bg: 'bg-stone-900', textClass: 'text-amber-200' },
        'Void': { bg: 'bg-slate-950', textClass: 'text-slate-400' },
        'Neon': { bg: 'bg-gradient-to-tr from-purple-600 to-pink-500', textClass: 'text-white' },
        'Pastel': { bg: 'bg-[#FFF9F0] border border-[#ffb700]/20', textClass: 'text-[#2D2926]' },
    };

    if (isLoading) {
        return <MindLensHighlightsSkeleton />;
    }

    if (error || !data) {
        return (
            <div className="bg-white border border-[#ffb700]/10 shadow-sm rounded-[32px] p-12 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-black text-[#2D2926] mb-2">Something went wrong</h3>
                <p className="text-[#2D2926]/60 font-medium mb-6">{error || 'Could not retrieve data at this time.'}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#ffb700] text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-md">
                    Try Again
                </button>
            </div>
        );
    }

    if (!data.hasEnoughData) {
        return (
            <div className="bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-12 md:p-16 text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-[#ffb700]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl border border-[#ffb700]/20">
                    🌱
                </div>
                <h3 className="text-2xl font-black text-[#2D2926] tracking-tight mb-3">MindLens Profile Unlocking...</h3>
                <p className="text-[#2D2926]/70 text-base font-medium leading-relaxed mb-6">{data.message}</p>
                <p className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest mb-8">
                    Log at least 3 titles to generate your mood prediction and psychological traits
                </p>
                <Link to="/watch-hive/feed" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#ffb700] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#ffb700]/25 hover:-translate-y-0.5 transition-all">
                    <span className="material-symbols-outlined text-lg">movie</span>
                    Log Watches Now
                </Link>
            </div>
        );
    }

    // Chart calculations for Daily Time Series
    const timeSeries = data.dailyTimeSeries || [];
    const maxCount = Math.max(...timeSeries.map(d => d.count), 1);
    const chartHeight = 180;
    const chartWidth = 800;
    const padding = 30;

    const getX = (index: number) => {
        if (timeSeries.length <= 1) return padding;
        return (index / (timeSeries.length - 1)) * (chartWidth - padding * 2) + padding;
    };
    const getY = (count: number) => chartHeight - ((count / maxCount) * (chartHeight - padding * 2) + padding);

    const linePath = timeSeries.length > 0
        ? timeSeries.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.count)}`).join(' ')
        : '';
    const areaPath = timeSeries.length > 0
        ? `${linePath} L ${getX(timeSeries.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`
        : '';

    return (
        <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
            {/* WatchHive Standard Sub-tab Navigation */}
            <div className="flex bg-[#FFF9F0] border border-[#ffb700]/15 p-1.5 rounded-2xl w-full max-w-xs mx-auto shadow-xs">
                <button
                    onClick={() => setActiveSubTab('highlights')}
                    className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeSubTab === 'highlights'
                            ? 'bg-[#ffb700] text-white shadow-sm'
                            : 'text-[#2D2926]/40 hover:text-[#2D2926]'
                    }`}
                >
                    Psych Highlights
                </button>
                <button
                    onClick={() => setActiveSubTab('analytics')}
                    className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeSubTab === 'analytics'
                            ? 'bg-[#ffb700] text-white shadow-sm'
                            : 'text-[#2D2926]/40 hover:text-[#2D2926]'
                    }`}
                >
                    Detailed Analytics
                </button>
            </div>

            {activeSubTab === 'analytics' ? (
                <div className="animate-[fade-in_0.3s_ease-out]">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-[#2D2926] mb-6">
                        <span className="material-symbols-outlined text-[#ffb700]">analytics</span>
                        Deep Hive Analytics
                    </h3>
                    <ProfileStats />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Hero Grid: Mood Predictor & Soul Persona */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Mental State & Mood Prediction Card */}
                        {data.moodPrediction && (
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-6 md:p-8 border border-[#ffb700]/15 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute top-0 right-0 w-72 h-72 bg-[#ffb700]/10 rounded-full blur-[80px] pointer-events-none"></div>

                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9F0] border border-[#ffb700]/20">
                                            <span className="text-lg">{data.moodPrediction.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb700]">
                                                Predicted Mood State
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>{data.moodPrediction.confidence}% Confidence</span>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-[#2D2926]">
                                        {data.moodPrediction.mood}
                                    </h2>
                                    <p className="text-[11px] font-black text-[#ffb700] uppercase tracking-widest mb-4">
                                        Status: {data.moodPrediction.status}
                                    </p>

                                    <p className="text-sm font-medium text-[#2D2926]/70 leading-relaxed max-w-xl mb-6">
                                        {data.moodPrediction.description}
                                    </p>
                                </div>

                                {data.moodPrediction.recentTitles.length > 0 && (
                                    <div className="pt-4 border-t border-[#ffb700]/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/40 mb-2">
                                            Recent Triggers (Last Logged)
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {data.moodPrediction.recentTitles.map((title, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 rounded-xl bg-[#FFF9F0] border border-[#ffb700]/15 text-xs font-bold text-[#2D2926] truncate max-w-[200px]"
                                                >
                                                    {title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Soul Persona Card */}
                        {data.persona && (
                            <div className="bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col items-center text-center justify-between">
                                <div
                                    className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15"
                                    style={{ backgroundColor: data.persona.color }}
                                ></div>

                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-24 h-24 rounded-full p-1 mb-4 shadow-md"
                                        style={{
                                            background: `linear-gradient(135deg, ${data.persona.color}, #ffb700)`,
                                        }}
                                    >
                                        <div className="w-full h-full rounded-full bg-[#FFF9F0] flex items-center justify-center overflow-hidden border-2 border-white">
                                            {data.persona.imageUrl && !imageError ? (
                                                <img
                                                    src={data.persona.imageUrl}
                                                    alt={data.persona.name}
                                                    className="w-full h-full object-cover"
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <span className="text-4xl">{data.persona.icon}</span>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                                        style={{ color: data.persona.color }}
                                    >
                                        Soul Persona
                                    </span>
                                    <h3 className="text-xl font-black text-[#2D2926] mb-2">{data.persona.name}</h3>
                                    <p className="text-xs font-medium text-[#2D2926]/60 leading-relaxed mb-4">
                                        {data.persona.description}
                                    </p>
                                </div>

                                <div className="w-full pt-3 border-t border-[#ffb700]/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#2D2926]/40">
                                    <span>Dominant Vibe</span>
                                    <span className="font-black text-[#ffb700]">
                                        {data.userProfile?.primaryMood || 'Balanced'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Watch Frequency Chart */}
                    {timeSeries.length > 0 && (
                        <div className="bg-white rounded-[32px] border border-[#ffb700]/15 shadow-sm p-6 md:p-8 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-[#2D2926] tracking-tight flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#ffb700]">show_chart</span>
                                        Watch Frequency Stream
                                    </h3>
                                    <p className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest mt-0.5">
                                        Daily activity trends over the last 30 days
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex bg-[#FFF9F0] border border-[#ffb700]/15 rounded-xl p-1">
                                        <button
                                            onClick={() => setChartType('line')}
                                            className={`p-1.5 rounded-lg transition-all ${
                                                chartType === 'line'
                                                    ? 'bg-[#ffb700] text-white shadow-xs'
                                                    : 'text-[#2D2926]/30 hover:text-[#2D2926]'
                                            }`}
                                            title="Curve view"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">show_chart</span>
                                        </button>
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`p-1.5 rounded-lg transition-all ${
                                                chartType === 'bar'
                                                    ? 'bg-[#ffb700] text-white shadow-xs'
                                                    : 'text-[#2D2926]/30 hover:text-[#2D2926]'
                                            }`}
                                            title="Bar view"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Chart */}
                            <div className="relative w-full overflow-visible min-h-[190px]">
                                <svg
                                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                    className="w-full h-auto overflow-visible cursor-crosshair"
                                >
                                    <defs>
                                        <linearGradient id="mindLensGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#ffb700', stopOpacity: 0.2 }} />
                                            <stop offset="100%" style={{ stopColor: '#ffb700', stopOpacity: 0 }} />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    <line
                                        x1={padding}
                                        y1={chartHeight - padding}
                                        x2={chartWidth - padding}
                                        y2={chartHeight - padding}
                                        stroke="#ffb700"
                                        strokeOpacity="0.15"
                                        strokeWidth="1.5"
                                    />
                                    {[0, 0.5, 1].map(v => (
                                        <line
                                            key={v}
                                            x1={padding}
                                            y1={chartHeight - (v * (chartHeight - padding * 2) + padding)}
                                            x2={chartWidth - padding}
                                            y2={chartHeight - (v * (chartHeight - padding * 2) + padding)}
                                            stroke="#ffb700"
                                            strokeOpacity="0.05"
                                            strokeDasharray="3 3"
                                        />
                                    ))}

                                    {chartType === 'line' ? (
                                        <>
                                            <path d={areaPath} fill="url(#mindLensGradient)" className="transition-all duration-500" />
                                            <path
                                                d={linePath}
                                                fill="none"
                                                stroke="#ffb700"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="transition-all duration-500"
                                            />
                                            {timeSeries.map((d, i) => (
                                                <circle
                                                    key={i}
                                                    cx={getX(i)}
                                                    cy={getY(d.count)}
                                                    r={hoveredDayIndex === i ? '7' : d.count > 0 ? '4' : '2'}
                                                    fill={hoveredDayIndex === i ? '#ffb700' : d.count > 0 ? '#ffb700' : '#d1d5db'}
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    className="transition-all cursor-pointer"
                                                    onMouseEnter={() => setHoveredDayIndex(i)}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        timeSeries.map((d, i) => {
                                            const barWidth = Math.max((chartWidth / timeSeries.length) * 0.6, 6);
                                            const h = (d.count / maxCount) * (chartHeight - padding * 2);
                                            return (
                                                <rect
                                                    key={i}
                                                    x={getX(i) - barWidth / 2}
                                                    y={chartHeight - padding - h}
                                                    width={barWidth}
                                                    height={Math.max(h, 4)}
                                                    fill={hoveredDayIndex === i ? '#ffb700' : '#ffb700cc'}
                                                    rx="4"
                                                    className="transition-all cursor-pointer"
                                                    onMouseEnter={() => setHoveredDayIndex(i)}
                                                />
                                            );
                                        })
                                    )}

                                    {/* Invisible Overlay for Mouse Hover & Click */}
                                    {timeSeries.map((_, i) => (
                                        <rect
                                            key={i}
                                            x={getX(i) - (chartWidth / timeSeries.length) / 2}
                                            y={0}
                                            width={chartWidth / timeSeries.length}
                                            height={chartHeight}
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={() => setHoveredDayIndex(i)}
                                            onClick={() => {
                                                if (timeSeries[i] && timeSeries[i].count > 0) {
                                                    setSelectedDayForModal(i);
                                                }
                                            }}
                                        />
                                    ))}
                                </svg>

                                {/* WatchHive Standard Dark Tooltip */}
                                {hoveredDayIndex !== null && timeSeries[hoveredDayIndex] && (
                                    <div
                                        className="absolute z-30 pointer-events-none transition-all animate-[fade-in_0.15s_ease-out]"
                                        style={{
                                            left: `${(getX(hoveredDayIndex) / chartWidth) * 100}%`,
                                            top: `${(getY(timeSeries[hoveredDayIndex].count) / chartHeight) * 100}%`,
                                            transform: 'translate(-50%, -115%)',
                                        }}
                                    >
                                        <div className="bg-[#2D2926] text-white p-3.5 rounded-2xl shadow-xl border border-white/10 min-w-[180px] max-w-[250px] text-center">
                                            <p className="text-[10px] font-black text-[#ffb700] uppercase tracking-widest mb-1">
                                                {new Date(timeSeries[hoveredDayIndex].date).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-xs font-black text-white mb-1.5">
                                                {timeSeries[hoveredDayIndex].count} {timeSeries[hoveredDayIndex].count === 1 ? 'watch' : 'watches'}
                                            </p>

                                            {timeSeries[hoveredDayIndex].items && timeSeries[hoveredDayIndex].items!.length > 0 && (
                                                <div className="space-y-1 text-left max-h-[140px] overflow-y-auto no-scrollbar pt-1.5 border-t border-white/10">
                                                    {timeSeries[hoveredDayIndex].items!.slice(0, 3).map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                                                            <span className="text-white/90 font-bold truncate max-w-[150px]">{item.title}</span>
                                                            {item.rating && <span className="text-[#ffb700] font-black text-[10px]">★{item.rating}</span>}
                                                        </div>
                                                    ))}
                                                    {timeSeries[hoveredDayIndex].items!.length > 3 && (
                                                        <p className="text-[10px] font-black text-[#ffb700] pt-1 text-center">
                                                            + {timeSeries[hoveredDayIndex].items!.length - 3} more • Click date to inspect
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-center text-[10px] font-black text-[#2D2926]/30 uppercase tracking-widest mt-4">
                                Click any date point on the chart to inspect full daily logs
                            </p>
                        </div>
                    )}

                    {/* Modal for detailed Inspection */}
                    {selectedDayForModal !== null && timeSeries[selectedDayForModal] && (
                        <DailyLogInspectorModal
                            isOpen={selectedDayForModal !== null}
                            onClose={() => setSelectedDayForModal(null)}
                            dateStr={timeSeries[selectedDayForModal].date}
                            count={timeSeries[selectedDayForModal].count}
                            items={timeSeries[selectedDayForModal].items || []}
                        />
                    )}

                    {/* Behavioral Trails Section */}
                    {data.behavioralTrails && data.behavioralTrails.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-[#ffb700]">psychology</span>
                                <h3 className="text-xl font-black text-[#2D2926] tracking-tight">Behavioral Trails</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {data.behavioralTrails.map((trail, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white border border-[#ffb700]/15 shadow-sm rounded-[28px] p-5 flex flex-col justify-between hover:border-[#ffb700]/40 transition-all group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div
                                                    className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${trail.color}15`, color: trail.color }}
                                                >
                                                    <span className="material-symbols-outlined text-lg">{trail.icon}</span>
                                                </div>
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                                                    style={{ backgroundColor: `${trail.color}10`, color: trail.color }}
                                                >
                                                    {trail.subtitle}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-[#2D2926] mb-1">{trail.title}</h4>
                                            <p className="text-2xl font-black tracking-tight mb-2" style={{ color: trail.color }}>
                                                {trail.value}
                                            </p>
                                            <p className="text-xs font-medium text-[#2D2926]/60 leading-relaxed">
                                                {trail.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aesthetic Profile & Insights Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Behavioral Verbal Insights */}
                        {data.insights && data.insights.length > 0 && (
                            <div className="lg:col-span-2 bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-6 md:p-8">
                                <h3 className="text-lg font-black text-[#2D2926] mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">lightbulb</span>
                                    Psychological Insights
                                </h3>
                                {data.insights.map((insight: string, i: number) => (
                                    <div key={i}>{formatInsight(insight)}</div>
                                ))}
                            </div>
                        )}

                        {/* Aesthetic Profile Chips */}
                        {data.aesthetics && data.aesthetics.length > 0 && (
                            <div className="bg-white border border-[#ffb700]/15 shadow-sm rounded-[32px] p-6 md:p-8">
                                <h3 className="text-lg font-black text-[#2D2926] mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">palette</span>
                                    Aesthetic Palette
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {data.aesthetics.map((aes: string, i: number) => {
                                        const style = AESTHETICS_MAP[aes] || AESTHETICS_MAP['Void'];
                                        return (
                                            <div
                                                key={i}
                                                className={`aspect-video rounded-2xl p-3 flex flex-col justify-end shadow-xs ${style.bg}`}
                                            >
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${style.textClass}`}>
                                                    {aes}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MindLensView;
