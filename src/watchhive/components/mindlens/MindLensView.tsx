import React, { useEffect, useState } from 'react';
import { mindLensApi, MindLensData } from '../../services/mindlens.service';
import { BeeLoader } from '../common';
import { Link } from 'react-router-dom';
import { ProfileStats } from '../profile';

export const MindLensView: React.FC = () => {
    const [data, setData] = useState<MindLensData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'highlights' | 'analytics'>('highlights');

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

    const AESTHETICS_MAP: Record<string, { bg: string, textClass: string, extra?: React.ReactNode }> = {
        'Noir': { bg: 'bg-[#2D241E]', textClass: 'text-[#F5E6D3]' },
        'Amber': { bg: 'bg-gradient-to-br from-[#ffb700] to-[#ffb700]/60 shadow-sm', textClass: 'text-[#2D241E]' },
        'Concrete': { bg: 'bg-[#D2CBC2]', textClass: 'text-[#2D241E]/60' },
        'Forest': { bg: 'bg-[#8da08d]', textClass: 'text-white' },
        'Grit': { bg: 'bg-white relative overflow-hidden', textClass: 'text-[#2D241E] relative', extra: <div className="absolute inset-0 bg-[#ffb700]/10 blur-xl"></div> },
        'Void': { bg: 'bg-[#121212]', textClass: 'text-[#F5E6D3]/50' },
        'Neon': { bg: 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-md', textClass: 'text-white' },
        'Pastel': { bg: 'bg-[#FDF2F8]', textClass: 'text-[#2D241E]/80' }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-[#F5E6D3]">
                <BeeLoader size="medium" message="Analyzing your viewing psyche..." />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white border border-[#2D241E]/10 shadow-sm rounded-3xl p-12 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-[#2D241E] mb-2">Something went wrong</h3>
                <p className="text-[#2D241E]/60 mb-6">{error || 'Could not retrieve data at this time.'}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#ffb700] text-[#2D241E] font-bold rounded-xl">Try Again</button>
            </div>
        );
    }

    if (!data.hasEnoughData) {
        return (
            <div className="bg-white border border-[#2D241E]/10 shadow-sm rounded-3xl p-16 text-center">
                <div className="text-5xl mb-6">🌱</div>
                <h3 className="text-2xl font-bold text-[#2D241E] mb-4">Insights Growing...</h3>
                <p className="text-[#2D241E]/80 text-lg mb-6">{data.message}</p>
                <p className="text-sm text-[#2D241E]/50 mb-8">Start watching and logging more content to unlock your deep psychological profile.</p>
                <Link to="/watch-hive/feed" className="inline-block px-8 py-3 bg-[#ffb700] text-[#2D241E] font-bold rounded-xl hover:shadow-[0_8px_20px_-4px_rgba(255,183,0,0.5)] transition-all">
                    Explore Content
                </Link>
            </div>
        );
    }

    const maxScore = data.themes && data.themes.length > 0 ? Math.max(...data.themes.map(t => t.score)) : 10;
    const totalEntries = data.userProfile?.totalEntries || 1;
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
        <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
            {/* Sub-tab Navigation */}
            <div className="flex bg-[#F5E6D3]/50 p-1 rounded-2xl w-full max-w-sm mx-auto">
                <button 
                    onClick={() => setActiveSubTab('highlights')}
                    className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'highlights' ? 'bg-[#ffb700] text-[#2D241E] shadow-sm' : 'text-[#2D241E]/40 hover:text-[#2D241E]'}`}
                >
                    Highlights
                </button>
                <button 
                    onClick={() => setActiveSubTab('analytics')}
                    className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'analytics' ? 'bg-[#ffb700] text-[#2D241E] shadow-sm' : 'text-[#2D241E]/40 hover:text-[#2D241E]'}`}
                >
                    Analytics
                </button>
            </div>

            {activeSubTab === 'analytics' ? (
                <div className="animate-[fade-in_0.3s_ease-out]">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-[#2D241E] mb-6">
                        <span className="material-symbols-outlined text-[#ffb700]">analytics</span>
                        Hive Analytics
                    </h3>
                    <ProfileStats />
                </div>
            ) : (
                <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {data.persona && (
                            <div className="lg:col-span-1 bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-all" style={{ backgroundColor: `${data.persona.color}15` }}></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-32 h-32 rounded-full p-1 mb-6" style={{ background: `linear-gradient(to bottom, ${data.persona.color}60, transparent)` }}>
                                        <div className="w-full h-full rounded-full bg-[#F5E6D3] flex items-center justify-center overflow-hidden border-2 border-white">
                                            {data.persona.imageUrl ? (
                                                <img src={data.persona.imageUrl} alt={data.persona.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-6xl">{data.persona.icon}</span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: data.persona.color }}>Soul Persona</h3>
                                    <h2 className="text-2xl font-extrabold text-[#2D241E] mb-4">{data.persona.name}</h2>
                                    <p className="text-[#2D241E]/60 text-sm leading-relaxed mb-6">{data.persona.description}</p>
                                </div>
                            </div>
                        )}

                        <div className="lg:col-span-2 bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-[#2D241E]">Dominant Vibe</h3>
                                    <p className="text-[#2D241E]/40 text-sm font-medium">Last 14 days of resonance</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-extrabold text-[#ffb700]">{data.userProfile?.primaryMood || 'Balanced'}</span>
                                    <div className={`flex items-center justify-end gap-1 ${moodTheme.color} text-sm font-bold mt-1`}>
                                        <span className="material-symbols-outlined text-sm">{moodTheme.icon}</span>
                                        <span>{moodTheme.label}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[150px] relative">
                                <svg className="w-full h-full block" preserveAspectRatio="none" viewBox="0 0 800 200">
                                    <path d="M0,100 C150,150 250,50 400,100 C550,150 650,20 800,80 L800,200 L0,200 Z" fill="rgba(255, 183, 0, 0.05)"></path>
                                    <path d="M0,100 C150,150 250,50 400,100 C550,150 650,20 800,80" fill="none" stroke="#ffb700" strokeWidth="3"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.themes && data.themes.length > 0 && (
                            <div className="lg:col-span-2 bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-8">
                                <h3 className="text-lg font-bold text-[#2D241E] mb-6">Thematic Breakdown</h3>
                                <div className="space-y-6">
                                    {data.themes.map((theme: any, index: number) => {
                                        const percentage = Math.round((theme.score / maxScore) * 100);
                                        return (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-[#2D241E]/60">{theme.name}</span>
                                                    <span className="text-[#ffb700]">{Math.round((theme.score / totalEntries) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-[#F5E6D3] h-2 rounded-full overflow-hidden">
                                                    <div className="bg-[#ffb700] h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {data.timeDistribution && (
                            <div className="bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-8 flex flex-col items-center">
                                <h3 className="text-[10px] font-bold text-[#2D241E]/40 uppercase tracking-widest mb-6 w-full text-center">Temporal Peak</h3>
                                <div className="relative w-32 h-32 flex items-center justify-center border-8 border-[#F5E6D3] rounded-full">
                                    <span className="text-xl font-extrabold text-[#2D241E]">{peakTime}</span>
                                </div>
                            </div>
                        )}

                        {data.insights && data.insights.length > 0 && (
                            <div className="bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-6 flex flex-col h-full">
                                <h3 className="text-[#2D241E] font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">lightbulb</span>
                                    Behavioral Insight
                                </h3>
                                {data.insights.map((insight: string, i: number) => (
                                    <div key={i}>{formatInsight(insight)}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-8">
                        <h3 className="text-lg font-bold text-[#2D241E] mb-8">Aesthetic Profile</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {data.aesthetics?.map((aes: string, i: number) => {
                                const style = AESTHETICS_MAP[aes] || AESTHETICS_MAP['Void'];
                                return (
                                    <div key={i} className={`aspect-square rounded-2xl p-4 flex flex-col justify-end ${style.bg}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${style.textClass}`}>{aes}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MindLensView;
