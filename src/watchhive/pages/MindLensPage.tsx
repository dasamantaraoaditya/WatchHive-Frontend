import React, { useEffect, useState } from 'react';
import { mindLensApi, MindLensData } from '../services/mindlens.service';
import './MindLens.css';
import { Button } from '../components/common';
import { Link } from 'react-router-dom';

export const MindLensPage: React.FC = () => {
    const [data, setData] = useState<MindLensData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await mindLensApi.getInsights();
                // Delay slightly for animation effect
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

    if (isLoading) {
        return (
            <div className="mindlens-page">
                <div className="container ml-loading">
                    <div className="mindlens-spinner"></div>
                    <p className="text-lg font-medium opacity-75">Analyzing your viewing psyche...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="mindlens-page">
                <div className="container ml-loading">
                    <div className="ml-card text-center max-w-md">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="mb-2">Something went wrong</h3>
                        <p className="mb-8 color-text-secondary">{error || 'Could not retrieve data at this time.'}</p>
                        <Button onClick={() => window.location.reload()} variant="primary">Try Again</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data.hasEnoughData) {
        return (
            <div className="mindlens-page">
                <div className="container ml-loading">
                    <div className="ml-card text-center max-w-lg">
                        <div className="text-5xl mb-6">🌱</div>
                        <h3 className="mb-4">Insights Growing...</h3>
                        <p className="mb-6 text-lg">{data.message}</p>
                        <p className="text-sm opacity-75 mb-10">Start watching and logging more content to unlock your deep psychological profile.</p>
                        <Link to="/watch-hive/feed">
                            <Button variant="primary" size="lg">Explore Content</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Determine max score for bar scaling
    const maxScore = data.themes ? Math.max(...data.themes.map(t => t.score)) : 10;

    return (
        <div className="mindlens-page">
            <div className="container">
                <header className="mindlens-header">
                    <h1 className="mindlens-title">MindLens</h1>
                    <p className="mindlens-subtitle">
                        Deep clinical insights into your viewing habits.
                        Your choices reveal hidden patterns in your state of mind.
                    </p>
                </header>

                <div className="mindlens-grid">
                    {/* Soul Persona Section */}
                    {data.persona && (
                        <div className="ml-card ml-persona-section full-width">
                            <div className="persona-content">
                                <div className="persona-badge" style={{ backgroundColor: `${data.persona.color}20`, color: data.persona.color }}>
                                    Your Soul Persona
                                </div>
                                <div className="persona-main">
                                    <div className="persona-icon" style={{ backgroundColor: `${data.persona.color}15` }}>
                                        {data.persona.icon}
                                    </div>
                                    <div className="persona-info">
                                        <h2 className="persona-name">{data.persona.name}</h2>
                                        <p className="persona-description">{data.persona.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="persona-visual-accent" style={{ background: `linear-gradient(135deg, transparent, ${data.persona.color}10)` }}></div>
                        </div>
                    )}

                    {/* Primary Mood Section */}
                    <div className="ml-card ml-mood-section">
                        <h3>Dominant Vibe</h3>
                        <div className="mood-ring-container">
                            <div className="mood-ring" style={{
                                background: `conic-gradient(from 0deg, 
                                    ${getMoodColor(data.userProfile?.primaryMood)}, 
                                    var(--primary-300), 
                                    ${getMoodColor(data.userProfile?.primaryMood)})`
                            }}></div>
                            <div className="mood-text">{data.userProfile?.primaryMood || 'Balanced'}</div>
                        </div>
                        <p className="text-sm font-medium opacity-70 mt-4">Based on your recent cinematic preferences.</p>
                    </div>

                    {/* Psychological Themes */}
                    <div className="ml-card ml-themes-section">
                        <h3>Psychological Themes</h3>
                        <div className="theme-bar-container">
                            {data.themes?.map((theme, index) => (
                                <div key={index} className="theme-item">
                                    <span className="theme-label">{theme.name}</span>
                                    <div className="theme-bar-bg">
                                        <div
                                            className="theme-bar-fill"
                                            style={{ width: `${(theme.score / maxScore) * 100}%`, transitionDelay: `${index * 100}ms` }}
                                        ></div>
                                    </div>
                                    <span className="theme-score">{Math.round((theme.score / (data.userProfile?.totalEntries || 1)) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-right opacity-40 mt-6">*Percentage of analyzed watch history</p>
                    </div>

                    {/* Insights */}
                    <div className="ml-card ml-insights-section">
                        <h3>Behavioral Insights</h3>
                        <div className="insights-list">
                            {data.insights?.map((insight, i) => (
                                <div key={i} className="insight-item">
                                    {formatInsight(insight)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time Analysis (Optional Visualization) */}
                    {data.timeDistribution && (
                        <div className="ml-card ml-time-section">
                            <h3>Chronobiology</h3>
                            <div className="flex justify-around items-end h-32 mt-8 gap-4 px-8">
                                {Object.entries(data.timeDistribution).map(([time, count]) => (
                                    <div key={time} className="flex flex-col items-center flex-1">
                                        <div
                                            className="w-full time-bar transition-all duration-1000 ease-out"
                                            style={{
                                                height: `${(count / (data.userProfile?.totalEntries || 1)) * 100}%`,
                                                minHeight: '8px'
                                            }}
                                        ></div>
                                        <span className="text-xs font-bold uppercase mt-4 opacity-60 tracking-tighter">{time}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-sm font-medium opacity-40 mt-8">Temporal distribution of your entertainment seeking behavior.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// Helper for mood colors
const getMoodColor = (mood?: string) => {
    switch (mood) {
        case 'Excited': return '#ef4444';
        case 'Lighthearted': return '#f59e0b';
        case 'Reflective': return '#3b82f6';
        case 'Tense': return '#8b5cf6';
        case 'Sentimental': return '#ec4899';
        default: return '#10b981';
    }
};

// Helper to bold text inside ** **
const formatInsight = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <p>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                    <span key={i} className="highlight">{part.slice(2, -2)}</span>
                ) : (
                    part
                )
            )}
        </p>
    );
};
