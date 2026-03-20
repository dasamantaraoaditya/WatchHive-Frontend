import React, { useEffect, useState } from 'react';
import { mindLensApi, MindLensData } from '../services/mindlens.service';
import { useAuth } from '../contexts';

// Optional: you can keep importing Button or just use raw tailwind for empty state
import { Link } from 'react-router-dom';

export const MindLensPage: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<MindLensData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await mindLensApi.getInsights();
                setTimeout(() => {
                    setData(response);
                    setIsLoading(false);
                }, 500);
            } catch (err) {
                console.error(err);
                setError('Failed to load MindLens insights.');
                setIsLoading(false);
            }
        };
        fetchInsights();
    }, []);

    // Helper functions
    const getMoodTheme = (mood?: string) => {
        const m = mood?.toLowerCase() || '';
        if (m.includes('melancholy')) return { color: 'text-[#8da08d]', bg: 'bg-[#8da08d]', icon: 'trending_up', label: '12% from last week' };
        if (m.includes('tense')) return { color: 'text-red-500', bg: 'bg-red-500', icon: 'trending_up', label: 'Spiking recent activity' };
        if (m.includes('lighthearted')) return { color: 'text-[#ffb700]', bg: 'bg-[#ffb700]', icon: 'trending_flat', label: 'Stable' };
        return { color: 'text-[#ffb700]', bg: 'bg-[#ffb700]', icon: 'analytics', label: 'Active Baseline' };
    };

    const formatInsight = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <p className="text-sm text-[#2D241E]/60 leading-relaxed italic mb-4">
                {parts.map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i} className="text-[#2D241E] font-extrabold">{part.slice(2, -2)}</strong>
                    ) : (
                        part
                    )
                )}
            </p>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FFF9F0]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffb700] mb-4"></div>
                <p className="text-[#2D241E]/60 font-medium font-display">Analyzing your viewing psyche...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FFF9F0] p-8 font-display">
                <div className="bg-white border border-[#2D241E]/10 shadow-sm rounded-3xl p-8 max-w-md text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-[#2D241E] mb-2">Something went wrong</h3>
                    <p className="text-[#2D241E]/60 mb-6">{error || 'Could not retrieve data at this time.'}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#ffb700] text-[#2D241E] font-bold rounded-xl">Try Again</button>
                </div>
            </div>
        );
    }

    if (!data.hasEnoughData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FFF9F0] p-8 font-display">
                <div className="bg-white border border-[#2D241E]/10 shadow-sm rounded-3xl p-10 max-w-lg text-center">
                    <div className="text-5xl mb-6">🌱</div>
                    <h3 className="text-2xl font-bold text-[#2D241E] mb-4">Insights Growing...</h3>
                    <p className="text-[#2D241E]/80 text-lg mb-6">{data.message}</p>
                    <p className="text-sm text-[#2D241E]/50 mb-8">Start watching and logging more content to unlock your deep psychological profile.</p>
                    <Link to="/watch-hive/feed" className="inline-block px-8 py-3 bg-[#ffb700] text-[#2D241E] font-bold rounded-xl hover:shadow-[0_8px_20px_-4px_rgba(255,183,0,0.5)] transition-all">
                        Explore Content
                    </Link>
                </div>
            </div>
        );
    }

    // Prepare Theme computations
    const maxScore = data.themes && data.themes.length > 0 ? Math.max(...data.themes.map(t => t.score)) : 10;
    const totalEntries = data.userProfile?.totalEntries || 1;
    
    // Prepare time distribution mappings
    let peakTime = "N/A";
    if (data.timeDistribution) {
        const entries = Object.entries(data.timeDistribution);
        if (entries.length > 0) {
            const sorted = entries.sort((a, b) => b[1] - a[1]);
            peakTime = sorted[0][0].toUpperCase();
        }
    }

    const moodTheme = getMoodTheme(data.userProfile?.primaryMood);

    return (
        <div className="flex-1 overflow-y-auto bg-[#FFF9F0] font-display text-[#2D241E] min-h-full">
            <header className="h-16 border-b border-[#F5E6D3] flex items-center justify-between px-8 sticky top-0 bg-[#FFF9F0]/80 backdrop-blur-md z-10 hidden md:flex">
                <h2 className="text-sm font-semibold text-[#2D241E]/50">MindLens Analytics Platform</h2>
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#ffb700] to-orange-300 border border-[#2D241E]/10 overflow-hidden">
                        {user?.profilePictureUrl ? (
                             <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                             <span className="material-symbols-outlined text-white text-sm w-full h-full flex items-center justify-center">person</span>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Hero Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Soul Persona Card */}
                    {data.persona && (
                        <div className="lg:col-span-1 bg-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-all" style={{ backgroundColor: `${data.persona.color}15` }}></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-full p-1 mb-6" style={{ background: `linear-gradient(to bottom, ${data.persona.color}60, transparent)` }}>
                                    <div className="w-full h-full rounded-full bg-[#F5E6D3] flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                                        <span className="text-6xl drop-shadow-md">{data.persona.icon}</span>
                                    </div>
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: data.persona.color }}>Soul Persona</h3>
                                <h2 className="text-2xl font-extrabold text-[#2D241E] mb-4">{data.persona.name}</h2>
                                <p className="text-[#2D241E]/60 text-sm leading-relaxed mb-6">
                                    {data.persona.description}
                                </p>
                                <button className="w-full py-3 bg-[#ffb700] text-[#2D241E] font-bold rounded-xl hover:shadow-[0_8px_20px_-4px_rgba(255,183,0,0.5)] transition-all">
                                    View Full Profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mood Tracking Visualization */}
                    <div className="lg:col-span-2 bg-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-[#2D241E]">Dominant Vibe</h3>
                                <p className="text-[#2D241E]/40 text-sm font-medium">Last 14 days of emotional resonance</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-extrabold text-[#ffb700]">{data.userProfile?.primaryMood || 'Balanced'}</span>
                                <div className={`flex items-center justify-end gap-1 ${moodTheme.color} text-sm font-bold mt-1`}>
                                    <span className="material-symbols-outlined text-sm">{moodTheme.icon}</span>
                                    <span>{moodTheme.label}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[200px] relative mt-4">
                            {/* Custom Wave SVG Chart */}
                            <svg className="w-full h-full block" preserveAspectRatio="none" viewBox="0 0 800 200">
                                <defs>
                                    <linearGradient id="waveGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: 'rgba(255, 183, 0, 0.15)', stopOpacity: 1 }}></stop>
                                        <stop offset="100%" style={{ stopColor: 'rgba(255, 183, 0, 0)', stopOpacity: 0 }}></stop>
                                    </linearGradient>
                                </defs>
                                <path d="M0,100 C150,150 250,50 400,100 C550,150 650,20 800,80 L800,200 L0,200 Z" fill="url(#waveGradient)"></path>
                                <path d="M0,100 C150,150 250,50 400,100 C550,150 650,20 800,80" fill="none" stroke="#ffb700" strokeLinecap="round" strokeWidth="3"></path>
                                {/* Points */}
                                <circle cx="400" cy="100" fill="#ffb700" r="4"></circle>
                                <circle cx="800" cy="80" fill="#ffb700" r="4"></circle>
                            </svg>
                            <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-[#2D241E]/40 font-bold px-1 uppercase tracking-widest pt-4">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Thematic Breakdown */}
                    {data.themes && data.themes.length > 0 && (
                        <div className="lg:col-span-2 bg-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-[#2D241E] mb-6">Thematic Breakdown</h3>
                            <div className="space-y-6">
                                {data.themes.map((theme, index) => {
                                    const percentage = Math.round((theme.score / maxScore) * 100);
                                    const displayPct = Math.round((theme.score / totalEntries) * 100);
                                    
                                    // Assign colors based on index for variety roughly matching stitch
                                    let colorClass = "bg-[#ffb700]";
                                    let textClass = "text-[#ffb700]";
                                    if (index % 3 === 1) { colorClass = "bg-[#8da08d]"; textClass = "text-[#8da08d]"; }
                                    if (index % 3 === 2) { colorClass = "bg-[#2D241E]/40"; textClass = "text-[#2D241E]/80"; }

                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between text-sm font-bold mb-2">
                                                <span className="text-[#2D241E]/60">{theme.name}</span>
                                                <span className={textClass}>{displayPct}%</span>
                                            </div>
                                            <div className="w-full bg-[#F5E6D3] h-2.5 rounded-full overflow-hidden">
                                                <div className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Chronobiology: Radial Chart */}
                    {data.timeDistribution && (
                        <div className="bg-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-8 flex flex-col items-center">
                            <h3 className="text-[10px] font-bold text-[#2D241E]/40 uppercase tracking-widest mb-6 w-full text-center">Temporal Distribution</h3>
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="none" r="42" stroke="#F5E6D3" strokeWidth="8"></circle>
                                    <circle className="rotate-[-90deg] origin-center" cx="50" cy="50" fill="none" r="42" stroke="#ffb700" strokeDasharray="180 264" strokeLinecap="round" strokeWidth="8"></circle>
                                    <circle cx="50" cy="50" fill="none" r="32" stroke="#F5E6D3" strokeWidth="8"></circle>
                                    <circle className="rotate-[30deg] origin-center" cx="50" cy="50" fill="none" r="32" stroke="#8da08d" strokeDasharray="100 201" strokeLinecap="round" strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] text-[#2D241E]/40 font-bold">PEAK</span>
                                    <span className="text-xl font-extrabold text-[#2D241E]">{peakTime}</span>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold">
                                {Object.entries(data.timeDistribution).map(([time], i) => {
                                     // Just show top 2 in the legend
                                     if(i > 1) return null;
                                     const color = i === 0 ? 'bg-[#ffb700]' : 'bg-[#8da08d]';
                                     return (
                                        <div key={time} className="flex items-center gap-1.5 text-[#2D241E]"><span className={`w-2.5 h-2.5 rounded-full ${color}`}></span> <span className="capitalize">{time}</span></div>
                                     );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Behavioral Insights */}
                    {data.insights && data.insights.length > 0 && (
                        <div className="bg-gradient-to-br from-[#ffb700]/[0.03] to-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-6 flex flex-col h-full">
                            <div className="w-10 h-10 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex flex-shrink-0 items-center justify-center mb-4">
                                <span className="material-symbols-outlined">lightbulb</span>
                            </div>
                            <h3 className="text-[#2D241E] font-bold mb-2">Behavioral Insight</h3>
                            <div className="mb-6 relative z-10 flex-1 overflow-y-auto pr-2">
                                {data.insights.map((insight, i) => (
                                    <div key={i}>
                                        {formatInsight(insight)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Section - Aesthetic Profile Placeholder */}
                <div className="bg-white border border-[#F5E6D3] shadow-[0_4px_20px_-2px_rgba(45,36,30,0.05)] rounded-3xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-[#2D241E]">Aesthetic Profile</h3>
                        <button className="px-5 py-2 text-[10px] font-bold border border-[#F5E6D3] rounded-lg hover:bg-[#F5E6D3] transition-colors uppercase tracking-widest text-[#2D241E]">Generate New Map</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Static Mock Mood Squares until backend supports aesthetic arrays */}
                        <div className="aspect-square rounded-2xl bg-[#2D241E] border border-[#F5E6D3] p-4 flex flex-col justify-end">
                            <span className="text-[10px] text-[#F5E6D3] font-bold uppercase tracking-widest">Noir</span>
                        </div>
                        <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#ffb700] to-[#ffb700]/60 border border-[#F5E6D3] p-4 flex flex-col justify-end shadow-sm">
                            <span className="text-[10px] text-[#2D241E] font-bold uppercase tracking-widest">Amber</span>
                        </div>
                        <div className="aspect-square rounded-2xl bg-[#D2CBC2] border border-[#F5E6D3] p-4 flex flex-col justify-end">
                            <span className="text-[10px] text-[#2D241E]/60 font-bold uppercase tracking-widest">Concrete</span>
                        </div>
                        <div className="aspect-square rounded-2xl bg-[#8da08d] border border-[#F5E6D3] p-4 flex flex-col justify-end">
                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">Forest</span>
                        </div>
                        <div className="aspect-square rounded-2xl bg-white border border-[#F5E6D3] p-4 flex flex-col justify-end relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#ffb700]/10 blur-xl"></div>
                            <span className="text-[10px] text-[#2D241E] font-bold uppercase tracking-widest relative">Grit</span>
                        </div>
                        <div className="aspect-square rounded-2xl bg-[#121212] border border-[#F5E6D3] p-4 flex flex-col justify-end">
                            <span className="text-[10px] text-[#F5E6D3]/50 font-bold uppercase tracking-widest">Void</span>
                        </div>
                    </div>
                </div>
                
                {/* Extra padding spacing for Bottom Nav/Donate button */}
                <div className="h-8"></div>
            </div>
        </div>
    );
};
