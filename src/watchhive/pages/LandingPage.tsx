import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import whLogo from '../assets/images/watchhive-logo.png';
import { showInstallPrompt, isInstallPromptReady } from '../../serviceWorkerRegistration';

/* ── TMDb poster URLs for showcasing popular movies ── */
const TMDB_IMG = 'https://image.tmdb.org/t/p';

/* Curated list of iconic/popular movie posters */
const SHOWCASE_POSTERS = [
    { title: "Dune: Part Two", path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
    { title: "Deadpool & Wolverine", path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
    { title: "Interstellar", path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
    { title: "The Shawshank Redemption", path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg" },
    { title: "The Godfather", path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
    { title: "The Matrix", path: "/p96dm7sCMn4VYAStA6siNz30G1r.jpg" },
    { title: "Lord of the Rings", path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg" },
    { title: "Fight Club", path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
    { title: "Joker", path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg" },
    { title: "The Avengers", path: "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg" },
    { title: "Inception", path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg" },
    { title: "Pulp Fiction", path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg" },
    { title: "Parasite", path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
    { title: "Oppenheimer", path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
    { title: "Spirited Away", path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
    { title: "Avatar", path: "/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg" },
];

const POSTER_ROW_1 = SHOWCASE_POSTERS.slice(0, 8);
const POSTER_ROW_2 = SHOWCASE_POSTERS.slice(8, 16);

function useReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                obs.unobserve(el);
            }
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return { ref, visible };
}

export const LandingPage: React.FC = () => {
    const [navSolid, setNavSolid] = useState(false);
    const [isInstallReady, setIsInstallReady] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstallHint, setShowInstallHint] = useState(false);

    // Interactive Demo State 1: Profile Preview Card in Hero
    const [activeTab, setActiveTab] = useState<'watching' | 'completed' | 'watchlist'>('watching');
    const [profileLikes, setProfileLikes] = useState(148);
    const [hasLikedProfile, setHasLikedProfile] = useState(false);

    // Interactive Demo State 2: MindLens Mood Sandbox
    const [selectedMood, setSelectedMood] = useState<'scifi' | 'noir' | 'drama'>('scifi');
    const moodMetrics = {
        scifi: {
            title: "Cosmic Sci-Fi Swarm",
            tagline: "Intellectual, Atmospheric, Existential",
            dopamine: 88,
            atmosphere: 96,
            existential: 92,
            color: "from-blue-500 to-indigo-600",
            recommendation: "Interstellar • Blade Runner 2049"
        },
        noir: {
            title: "Neon Noir Melancholy",
            tagline: "Gritty, Suspenseful, Cinematographic",
            dopamine: 74,
            atmosphere: 98,
            existential: 85,
            color: "from-purple-500 to-pink-600",
            recommendation: "Drive • Se7en"
        },
        drama: {
            title: "Golden Age Drama Resonance",
            tagline: "Deep, Emotional, Character-Driven",
            dopamine: 65,
            atmosphere: 82,
            existential: 95,
            color: "from-amber-500 to-rose-600",
            recommendation: "The Shawshank Redemption • Parasite"
        }
    };

    // Interactive Demo State 3: Swarm Feed Simulator
    const [feedPosts, setFeedPosts] = useState([
        { id: 1, user: "sarah_k", avatar: "🐝", action: "reviewed", movie: "Dune: Part Two", text: "Visually staggering, Hans Zimmer's score literally rattled my floorboards. 10/10.", rating: 5, buzz: 42, buzzed: false },
        { id: 2, user: "cine_mark", avatar: "🎬", action: "stacked", movie: "Nolan Sci-Fi Ranked", text: "Moved Interstellar back to #1. Still his masterpiece.", rating: 4.5, buzz: 29, buzzed: false }
    ]);

    // Interactive Demo State 4: Cinematic Stacks Ranker
    const [movieStack, setMovieStack] = useState([
        { id: '1', title: 'Interstellar', rating: '9.8', year: '2014', path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
        { id: '2', title: 'Inception', rating: '9.4', year: '2010', path: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg' },
        { id: '3', title: 'Dune: Part Two', rating: '9.2', year: '2024', path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' }
    ]);

    useEffect(() => {
        const handleBeforeInstall = () => setIsInstallReady(true);
        const handleAppInstalled = () => { setIsInstalled(true); setIsInstallReady(false); };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
        }

        setIsInstallReady(isInstallPromptReady());

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (isInstallPromptReady() || isInstallReady) {
            await showInstallPrompt();
        } else {
            setShowInstallHint(h => !h);
        }
    };

    useEffect(() => {
        const handler = () => {
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const posterReveal = useReveal(0.08);
    const featureReveal = useReveal(0.08);
    const showcaseReveal = useReveal(0.12);
    const interactiveReveal = useReveal(0.1);
    const ctaReveal = useReveal(0.15);

    // Profile Card Mock Data based on active tab
    const getProfileContent = () => {
        switch (activeTab) {
            case 'watching':
                return {
                    title: "Succession • S4E10",
                    subtitle: "Watching on HBO Max",
                    badge: "Currently Watching",
                    progress: 80,
                    meta: "Season Finale"
                };
            case 'completed':
                return {
                    title: "Oppenheimer",
                    subtitle: "Rated 5.0 / 5.0",
                    badge: "Masterpiece",
                    progress: 100,
                    meta: "Watched in IMAX 70mm"
                };
            case 'watchlist':
                return {
                    title: "Spider-Man: Beyond the Spider-Verse",
                    subtitle: "Highly Anticipated Sci-Fi",
                    badge: "Next on Deck",
                    progress: 0,
                    meta: "Releasing Soon"
                };
        }
    };

    const currentCard = getProfileContent();

    // Buzzing handler
    const handleBuzz = (id: number) => {
        setFeedPosts(posts => posts.map(post => {
            if (post.id === id) {
                return {
                    ...post,
                    buzz: post.buzzed ? post.buzz - 1 : post.buzz + 1,
                    buzzed: !post.buzzed
                };
            }
            return post;
        }));
    };

    // Move stack item up
    const moveStackUp = (index: number) => {
        if (index === 0) return;
        const newStack = [...movieStack];
        const temp = newStack[index];
        newStack[index] = newStack[index - 1];
        newStack[index - 1] = temp;
        setMovieStack(newStack);
    };

    // Move stack item down
    const moveStackDown = (index: number) => {
        if (index === movieStack.length - 1) return;
        const newStack = [...movieStack];
        const temp = newStack[index];
        newStack[index] = newStack[index + 1];
        newStack[index + 1] = temp;
        setMovieStack(newStack);
    };

    return (
        <div className="min-h-screen bg-[#FFF9F0] text-[#2D2926] font-sans overflow-x-hidden selection:bg-[#ffb700] selection:text-white">
            
            {/* Custom Animations Styling */}
            <style>{`
                @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(2.5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
                @keyframes marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(0.95); opacity: 0.5; } }
                
                .animate-float-1 { animation: float 7s ease-in-out infinite; }
                .animate-float-2 { animation: float 8.5s ease-in-out infinite 0.8s; }
                .animate-float-3 { animation: float 6.8s ease-in-out infinite 1.5s; }
                .animate-float-4 { animation: float 7.2s ease-in-out infinite 0.3s; }
                .animate-marquee-l { animation: marquee-left 42s linear infinite; }
                .animate-marquee-r { animation: marquee-right 42s linear infinite; }
                .pulse-ring-slow { animation: pulse-ring 4s ease-in-out infinite; }
                
                .lp-reveal { opacity: 0; transform: translateY(35px); transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
                .lp-reveal.is-visible { opacity: 1; transform: translateY(0); }
                
                /* Outlined material fonts styling override if missing load */
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    display: inline-block;
                    line-height: 1;
                }
            `}</style>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? 'bg-[#FFF9F0]/90 backdrop-blur-md shadow-sm border-b border-[#ffb700]/10 py-3.5' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl md:mx-auto px-6 w-full flex items-center justify-between">
                    <Link to="/watch-hive" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-all ${navSolid ? 'bg-white shadow-sm border border-[#ffb700]/10' : 'bg-white/80 backdrop-blur-md shadow-[0_4px_12px_rgba(255,183,0,0.15)] group-hover:bg-white'}`}>
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain animate-pulse" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-[#2D2926]">WatchHive</span>
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8 font-bold text-[14px] text-[#2D2926]/70">
                        <a href="#features" className="hover:text-[#ffb700] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#ffb700] hover:after:w-full after:transition-all">Core Features</a>
                        <a href="#interactive-preview" className="hover:text-[#ffb700] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#ffb700] hover:after:w-full after:transition-all">Live Sandbox</a>
                        <a href="#posters" className="hover:text-[#ffb700] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#ffb700] hover:after:w-full after:transition-all">Ecosystem</a>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Link to="/watch-hive/login" className="hidden sm:block text-[14px] font-bold text-[#2D2926] hover:text-[#ffb700] transition-colors">
                            Sign In
                        </Link>
                        <Link to="/watch-hive/signup" className="bg-[#ffb700] text-white text-[14px] font-black tracking-wide px-5 py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,183,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-0.5 transition-all">
                            Join Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-6 overflow-hidden flex flex-col items-center text-center w-full min-h-[95vh]">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[700px] bg-gradient-to-b from-[#ffb700]/15 to-transparent blur-[120px] rounded-full -z-10 opacity-70"></div>
                
                <div className="inline-flex items-center gap-2.5 bg-white border border-[#ffb700]/25 px-4.5 py-2 rounded-full shadow-[0_2px_10px_rgba(255,183,0,0.08)] mb-8 z-10 animate-[fadeInDown_0.6s_ease-out_forwards]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb700] animate-ping"></span>
                    <span className="text-[11px] font-extrabold text-[#92660a] uppercase tracking-wider">Premium Cinematic Hub 2.0</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#2D2926] max-w-5xl mx-auto leading-[1.05] mb-6 z-10">
                    Track Cinema.<br />
                    <span className="bg-gradient-to-r from-[#ffb700] via-amber-500 to-amber-600 bg-clip-text text-transparent">Share the Swarm.</span>
                </h1>

                <p className="text-lg md:text-xl font-medium text-[#2D2926]/60 max-w-2xl mx-auto mb-12 z-10 leading-relaxed">
                    Welcome to the ultimate digital sanctuary for film buffs. Document your entries, map your psychological genres with MindLens, rank custom cinematic stacks, and connect with a dedicated community.
                </p>

                {/* Hero CTA & Interactive Card Row */}
                <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl w-full mt-4 z-20">
                    
                    {/* Left: Instant Navigation and PWA installers */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center lg:justify-start">
                            <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-[#ffb700] text-white text-[16px] font-black tracking-wide px-8 py-4.5 rounded-2xl shadow-[0_8px_20px_rgba(255,183,0,0.3)] hover:shadow-[0_12px_28px_rgba(255,183,0,0.45)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                Start Your Journey
                                <span className="material-symbols-outlined text-[20px]">movie</span>
                            </Link>
                            {isInstalled ? (
                                <div className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[16px] font-black tracking-wide px-8 py-4.5 rounded-2xl flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    Hive App Installed
                                </div>
                            ) : isInstallReady ? (
                                <button 
                                    onClick={handleInstall}
                                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-[#ffb700] text-white text-[16px] font-black tracking-wide px-8 py-4.5 rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                >
                                    Install WatchHive
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleInstall}
                                    className="w-full sm:w-auto bg-white border border-[#ffb700]/25 text-[#b07d00] text-[16px] font-black tracking-wide px-8 py-4.5 rounded-2xl hover:bg-[#FFF9F0] hover:border-[#ffb700]/50 transition-all flex items-center justify-center gap-2 shadow-sm group"
                                >
                                    <span>Get Offline App</span>
                                    <span className="material-symbols-outlined text-[20px] group-hover:translate-y-0.5 transition-transform">keyboard_arrow_down</span>
                                </button>
                            )}
                        </div>

                        {showInstallHint && !isInstallReady && !isInstalled && (
                            <div className="p-6 bg-white border border-[#ffb700]/20 rounded-3xl shadow-xl max-w-md w-full animate-[wh-dropdown-in_0.2s_ease-out_forwards] flex flex-col gap-4 text-left">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-[11px] font-black text-[#b07d00] uppercase tracking-widest">Standalone PWA Feature</h4>
                                        <p className="text-xs text-[#2D2926]/50 font-medium mt-0.5">Enjoy instant, offline-enabled movie logging straight from your device screen.</p>
                                    </div>
                                    <button onClick={() => setShowInstallHint(false)} className="text-slate-400 hover:text-[#ffb700] text-sm">✕</button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/10 rounded-lg px-2.5 py-1">⚡ Instantly Ready</span>
                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/10 rounded-lg px-2.5 py-1">📶 Offline Syncing</span>
                                    <span className="text-[9px] font-bold text-[#92660a] bg-[#ffb700]/10 rounded-lg px-2.5 py-1">🖥️ Fullscreen Canvas</span>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#b07d00] w-20 shrink-0">iOS Safari</span>
                                        <span className="text-xs text-[#6b7280]">Tap <strong className="text-[#374151] font-bold">Share</strong> → Add to Home Screen</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#b07d00] w-20 shrink-0">Chrome Desktop</span>
                                        <span className="text-xs text-[#6b7280]">Click <strong className="text-[#374151] font-bold">⊕</strong> in the URL search bar</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-6 mt-2 text-[#2D2926]/50 font-semibold text-[13px] justify-center lg:justify-start">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-[#ffb700]">verified</span> 100% Free</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-[#ffb700]">devices</span> Multi-device Sync</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-[#ffb700]">cloud_off</span> Offline Capable</span>
                        </div>
                    </div>

                    {/* Right: Live Interactive Profile Card Widget */}
                    <div className="flex-1 w-full flex justify-center">
                        <div className="relative w-full max-w-[420px] bg-white rounded-[32px] p-6 shadow-[0_15px_40px_rgba(255,183,0,0.06)] border border-[#ffb700]/15 hover:shadow-[0_20px_50px_rgba(255,183,0,0.12)] transition-all">
                            {/* Card Background Glows */}
                            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#ffb700]/10 blur-2xl rounded-full"></div>
                            
                            {/* Profile Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ffb700] to-amber-400 flex items-center justify-center text-lg font-black text-white shadow-md">
                                        CH
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-extrabold text-[15px] text-[#2D2926]">Hannah Brooks</h4>
                                        <p className="text-[12px] text-[#2D2926]/50 font-semibold">@cinemax_hannah</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setProfileLikes(prev => hasLikedProfile ? prev - 1 : prev + 1);
                                        setHasLikedProfile(!hasLikedProfile);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 ${hasLikedProfile ? 'bg-[#ffb700] text-white' : 'bg-[#FFF9F0] text-[#ffb700] hover:bg-[#ffb700]/10'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: hasLikedProfile ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                    <span>{profileLikes} Buzzes</span>
                                </button>
                            </div>

                            {/* Card Tab Selectors */}
                            <div className="flex bg-[#FFF9F0] rounded-xl p-1 mb-5">
                                {(['watching', 'completed', 'watchlist'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white text-[#2D2926] shadow-sm' : 'text-[#2D2926]/40 hover:text-[#2D2926]/70'}`}
                                    >
                                        {tab === 'watching' ? 'Binging' : tab}
                                    </button>
                                ))}
                            </div>

                            {/* Interactive Showcase Card Content */}
                            <div className="bg-[#FFF9F0]/65 border border-[#ffb700]/10 rounded-2xl p-5 text-left transition-all relative overflow-hidden group">
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb700] animate-ping"></span>
                                    <span className="text-[9px] font-black text-[#ffb700] uppercase tracking-wider">{currentCard.badge}</span>
                                </div>
                                
                                <span className="material-symbols-outlined text-[#ffb700] text-[24px] mb-2">
                                    {activeTab === 'watching' ? 'live_tv' : activeTab === 'completed' ? 'verified' : 'bookmark_added'}
                                </span>
                                
                                <h5 className="font-extrabold text-[16px] text-[#2D2926] mb-1.5 group-hover:text-[#ffb700] transition-colors">
                                    {currentCard.title}
                                </h5>
                                <p className="text-[12px] text-[#2D2926]/60 font-semibold mb-4">
                                    {currentCard.subtitle}
                                </p>

                                {/* Mini Progress bar / Meta details */}
                                {activeTab === 'watching' && (
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold text-[#2D2926]/40 mb-1">
                                            <span>Progress</span>
                                            <span>{currentCard.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[#ffb700]/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#ffb700] rounded-full transition-all duration-500" style={{ width: `${currentCard.progress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                {activeTab !== 'watching' && (
                                    <div className="text-[10px] font-extrabold text-[#92660a] bg-[#ffb700]/10 rounded-md px-2.5 py-1 inline-block">
                                        {currentCard.meta}
                                    </div>
                                )}
                            </div>

                            {/* Interactive User Bio Stats */}
                            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                                <div>
                                    <h6 className="text-[16px] font-black text-[#2D2926]">2,410</h6>
                                    <p className="text-[9px] font-bold text-[#2D2926]/40 uppercase tracking-wider">Minutes</p>
                                </div>
                                <div>
                                    <h6 className="text-[16px] font-black text-[#2D2926]">182</h6>
                                    <p className="text-[9px] font-bold text-[#2D2926]/40 uppercase tracking-wider">Logged</p>
                                </div>
                                <div>
                                    <h6 className="text-[16px] font-black text-[#2D2926]">14</h6>
                                    <p className="text-[9px] font-bold text-[#2D2926]/40 uppercase tracking-wider">Stacks</p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Floating Showcase Backdrop Posters */}
                <div className="absolute top-[40%] left-0 right-0 h-[60%] w-full pointer-events-none -z-10 opacity-20 sm:opacity-55 overflow-hidden">
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[0].path}`} className="absolute top-[10%] left-[4%] w-32 md:w-44 rounded-2xl shadow-2xl -rotate-6 animate-float-1 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[2].path}`} className="absolute top-[30%] right-[3%] w-28 md:w-40 rounded-2xl shadow-2xl rotate-6 animate-float-2 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[4].path}`} className="absolute bottom-[20%] left-[8%] w-24 md:w-36 rounded-2xl shadow-2xl -rotate-3 animate-float-3 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[10].path}`} className="absolute bottom-[25%] right-[12%] w-32 md:w-44 rounded-2xl shadow-2xl rotate-3 animate-float-4 border-4 border-white" alt=""/>
                </div>
            </section>

            {/* Poster Marquee Grid Section */}
            <section id="posters" className={`py-12 bg-white border-y border-[#ffb700]/10 overflow-hidden lp-reveal ${posterReveal.visible ? 'is-visible' : ''}`} ref={posterReveal.ref}>
                <div className="w-full flex justify-center mb-8 relative">
                    <div className="absolute left-0 w-1/3 h-px bg-gradient-to-r from-transparent to-[#ffb700]/30 top-1/2 -translate-y-1/2"></div>
                    <span className="bg-[#FFF9F0] text-[#ffb700] px-4 py-1.5 rounded-full font-black text-[12px] uppercase tracking-widest border border-[#ffb700]/30 shadow-sm z-10 relative">Trending Ecosystem</span>
                    <div className="absolute right-0 w-1/3 h-px bg-gradient-to-l from-transparent to-[#ffb700]/30 top-1/2 -translate-y-1/2"></div>
                </div>

                <div className="flex flex-col gap-6 transform -rotate-1 scale-102">
                    {/* Track 1 */}
                    <div className="flex w-[200%] animate-marquee-l">
                        {[...POSTER_ROW_1, ...POSTER_ROW_1, ...POSTER_ROW_1].map((p, i) => (
                            <div key={i} className="w-[140px] md:w-[190px] shrink-0 px-2 sm:px-3">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-2xl overflow-hidden shadow-md border border-[#ffb700]/10 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white text-xs font-black tracking-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Track 2 */}
                    <div className="flex w-[200%] animate-marquee-r">
                        {[...POSTER_ROW_2, ...POSTER_ROW_2, ...POSTER_ROW_2].map((p, i) => (
                            <div key={i} className="w-[140px] md:w-[190px] shrink-0 px-2 sm:px-3">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-2xl overflow-hidden shadow-md border border-[#ffb700]/10 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white text-xs font-black tracking-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section id="features" className={`py-24 px-6 max-w-7xl mx-auto lp-reveal ${featureReveal.visible ? 'is-visible' : ''}`} ref={featureReveal.ref}>
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D2926] mb-4 tracking-tight">Everything a Cinephile Needs.</h2>
                    <p className="text-[#2D2926]/50 font-semibold max-w-2xl mx-auto">No clutter, no friction. Just a gorgeous, lightning-fast platform designed to document your cinematic life beautifully.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">psychology</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">MindLens Analytics</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Analyze emotional patterns, genre weights, and atmospheric swarms based on your watch logs.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">hive</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">The Swarm Feed</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Share micro-reviews, customize rating levels, and explore what your hive mates are currently watching.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">layers</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">Cinematic Stacks</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Compile movies into beautiful interactive stack arrays to rank saga sequences, directors, or custom themes.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">library_add</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">Cinematic Entries</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Log locations, specific rewatch dates, and customized glassmorphic rating metrics for future filters.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">live_tv</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">Currently Watching</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Keep constant track of series, television episodes, and seasons as you binge, logging individual episode markers.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.02)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.06)] hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/25 group-hover:bg-[#ffb700] transition-colors">
                            <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">cloud_done</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2D2926] mb-2">Standalone PWA Mode</h3>
                        <p className="text-[#2D2926]/60 font-semibold leading-relaxed">
                            Fully functional offline caching allows swift logging in theaters even when you are disconnected.
                        </p>
                    </div>
                </div>
            </section>

            {/* Live Interactive Preview Sandbox Section */}
            <section id="interactive-preview" className={`py-24 px-6 bg-[#FFFdfa] border-y border-[#ffb700]/15 relative overflow-hidden lp-reveal ${interactiveReveal.visible ? 'is-visible' : ''}`} ref={interactiveReveal.ref}>
                <div className="absolute inset-0 bg-[radial-gradient(#ffb700_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <span className="inline-flex text-[11px] font-black tracking-widest uppercase text-[#ffb700] bg-[#FFF9F0] px-4.5 py-2 rounded-full border border-[#ffb700]/25 mb-4 shadow-sm">
                        Experience the Platform Now
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-4">
                        Try It In Action
                    </h2>
                    <p className="text-[#2D2926]/50 font-semibold max-w-2xl mx-auto">
                        We don't just talk about features—we build them. Click around to see how WatchHive operates.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                    
                    {/* sandbox Column 1: MindLens Mood Swarm */}
                    <div className="bg-white rounded-[32px] p-6.5 border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">psychology</span>
                                    <h4 className="font-extrabold text-[16px]">MindLens Sandbox</h4>
                                </div>
                                <span className="text-[10px] font-black text-[#92660a] bg-[#ffb700]/10 px-2 py-0.5 rounded-full">Interactive</span>
                            </div>

                            <p className="text-[13px] text-[#2D2926]/60 font-semibold mb-6">
                                Toggle mood matrices to see how WatchHive dynamically classifies your watchlist's psychological density.
                            </p>

                            {/* Toggles */}
                            <div className="flex gap-2 mb-6">
                                {(['scifi', 'noir', 'drama'] as const).map(mood => (
                                    <button
                                        key={mood}
                                        onClick={() => setSelectedMood(mood)}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-xl capitalize transition-all border ${selectedMood === mood ? 'bg-[#ffb700] text-white border-[#ffb700]' : 'bg-transparent text-[#2D2926]/60 border-slate-100 hover:border-[#ffb700]/30'}`}
                                    >
                                        {mood === 'scifi' ? 'Cosmic' : mood === 'noir' ? 'Noir' : 'Drama'}
                                    </button>
                                ))}
                            </div>

                            {/* Visualization Output */}
                            <div className="bg-[#FFF9F0]/60 rounded-2xl p-5 border border-[#ffb700]/5 transition-all">
                                <h5 className="font-extrabold text-[14px] text-[#2D2926] mb-1 capitalize">
                                    {moodMetrics[selectedMood].title}
                                </h5>
                                <p className="text-[11px] text-[#2D2926]/40 font-bold mb-4">
                                    {moodMetrics[selectedMood].tagline}
                                </p>

                                {/* Bar 1 */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] font-extrabold text-[#2D2926]/60 mb-1">
                                        <span>Dopamine Focus</span>
                                        <span>{moodMetrics[selectedMood].dopamine}%</span>
                                    </div>
                                    <div className="h-2 bg-[#ffb700]/10 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${moodMetrics[selectedMood].color} rounded-full transition-all duration-700`} style={{ width: `${moodMetrics[selectedMood].dopamine}%` }}></div>
                                    </div>
                                </div>

                                {/* Bar 2 */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] font-extrabold text-[#2D2926]/60 mb-1">
                                        <span>Atmosphere Resonance</span>
                                        <span>{moodMetrics[selectedMood].atmosphere}%</span>
                                    </div>
                                    <div className="h-2 bg-[#ffb700]/10 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${moodMetrics[selectedMood].color} rounded-full transition-all duration-700`} style={{ width: `${moodMetrics[selectedMood].atmosphere}%` }}></div>
                                    </div>
                                </div>

                                {/* Bar 3 */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] font-extrabold text-[#2D2926]/60 mb-1">
                                        <span>Existential Depth</span>
                                        <span>{moodMetrics[selectedMood].existential}%</span>
                                    </div>
                                    <div className="h-2 bg-[#ffb700]/10 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${moodMetrics[selectedMood].color} rounded-full transition-all duration-700`} style={{ width: `${moodMetrics[selectedMood].existential}%` }}></div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200/50 my-3"></div>

                                <p className="text-[10px] text-[#2D2926]/50 font-bold">
                                    💡 Matches: <strong className="text-[#2D2926]">{moodMetrics[selectedMood].recommendation}</strong>
                                </p>
                            </div>
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 mt-5 block text-center">Part of MindLens Core Dashboard Integration</span>
                    </div>

                    {/* sandbox Column 2: Feed Simulator */}
                    <div className="bg-white rounded-[32px] p-6.5 border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">hive</span>
                                    <h4 className="font-extrabold text-[16px]">Live Feed Buzzing</h4>
                                </div>
                                <span className="text-[10px] font-black text-[#92660a] bg-[#ffb700]/10 px-2 py-0.5 rounded-full">Interactive</span>
                            </div>

                            <p className="text-[13px] text-[#2D2926]/60 font-semibold mb-6">
                                Give reviews in the Swarm Social Feed a "Buzz" and feel the micro-interaction. Try rating buzz indicators.
                            </p>

                            {/* Feed Container */}
                            <div className="flex flex-col gap-4">
                                {feedPosts.map(post => (
                                    <div key={post.id} className="bg-[#FFF9F0]/60 border border-[#ffb700]/10 rounded-2xl p-4.5 text-left relative transition-all hover:bg-white hover:border-[#ffb700]/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{post.avatar}</span>
                                                <div>
                                                    <span className="font-bold text-[12px] text-[#2D2926] block">@{post.user}</span>
                                                    <span className="text-[9px] text-[#2D2926]/40 font-bold capitalize">{post.action} {post.movie}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: Math.ceil(post.rating) }).map((_, idx) => (
                                                    <span key={idx} className="material-symbols-outlined text-[10px] text-[#ffb700]" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-[#2D2926]/70 font-semibold leading-relaxed mb-3">
                                            "{post.text}"
                                        </p>

                                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                                            <button 
                                                onClick={() => handleBuzz(post.id)}
                                                className={`flex items-center gap-1 text-[10px] font-black transition-all ${post.buzzed ? 'text-[#ffb700]' : 'text-slate-400 hover:text-[#ffb700]'}`}
                                            >
                                                <span className="material-symbols-outlined text-[13px] animate-bounce" style={{ fontVariationSettings: post.buzzed ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                                <span>{post.buzz} Buzzes</span>
                                            </button>
                                            <span className="text-[9px] font-bold text-slate-400">Just now</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 mt-5 block text-center">Simulated from WatchHive Social Core Feed</span>
                    </div>

                    {/* sandbox Column 3: Cinematic Stacks */}
                    <div className="bg-white rounded-[32px] p-6.5 border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ffb700]">layers</span>
                                    <h4 className="font-extrabold text-[16px]">Cinematic Stacks</h4>
                                </div>
                                <span className="text-[10px] font-black text-[#92660a] bg-[#ffb700]/10 px-2 py-0.5 rounded-full">Interactive</span>
                            </div>

                            <p className="text-[13px] text-[#2D2926]/60 font-semibold mb-6">
                                Order your ultimate cinema sagas. Click buttons to rank these Nolan masterpieces up or down the list.
                            </p>

                            {/* Ranker List */}
                            <div className="flex flex-col gap-3">
                                {movieStack.map((movie, index) => (
                                    <div key={movie.id} className="bg-[#FFF9F0]/60 border border-[#ffb700]/10 rounded-2xl p-3.5 flex items-center justify-between transition-all hover:bg-white hover:border-[#ffb700]/30">
                                        <div className="flex items-center gap-3">
                                            {/* Rank Badge */}
                                            <div className="w-6 h-6 rounded-lg bg-[#ffb700]/15 flex items-center justify-center text-[11px] font-black text-[#92660a]">
                                                #{index + 1}
                                            </div>
                                            <div className="w-9 aspect-[2/3] rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                                <img src={`${TMDB_IMG}/w92${movie.path}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-left">
                                                <h5 className="font-extrabold text-[12px] text-[#2D2926] leading-tight">{movie.title}</h5>
                                                <p className="text-[10px] text-[#2D2926]/40 font-bold mt-0.5">{movie.year} • ★ {movie.rating}</p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button 
                                                onClick={() => moveStackUp(index)}
                                                disabled={index === 0}
                                                className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${index === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-[#ffb700]/20 bg-white text-[#ffb700] hover:bg-[#ffb700]/10'}`}
                                            >
                                                ▲
                                            </button>
                                            <button 
                                                onClick={() => moveStackDown(index)}
                                                disabled={index === movieStack.length - 1}
                                                className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${index === movieStack.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-[#ffb700]/20 bg-white text-[#ffb700] hover:bg-[#ffb700]/10'}`}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 mt-5 block text-center">Live rendering from Stacks & Ranking modules</span>
                    </div>

                </div>
            </section>

            {/* App Visual Showcase */}
            <section className={`py-20 px-6 max-w-7xl mx-auto my-12 bg-white rounded-[40px] border border-[#ffb700]/10 shadow-[0_4px_25px_rgba(255,183,0,0.02)] relative overflow-hidden lp-reveal ${showcaseReveal.visible ? 'is-visible' : ''}`} ref={showcaseReveal.ref}>
                <div className="absolute -right-64 -bottom-64 w-[600px] h-[600px] bg-[#ffb700]/5 rounded-full blur-[110px] pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10 w-full">
                    {/* Interactive Poster Grid Graphic */}
                    <div className="flex-1 w-full grid grid-cols-3 gap-3 md:gap-4 p-4 md:p-8">
                        {SHOWCASE_POSTERS.slice(0, 6).map((p, i) => (
                            <div key={i} className={`aspect-[2/3] bg-[#FFF9F0] rounded-2xl overflow-hidden shadow-lg border-2 border-white relative transition-all hover:scale-105 ${i % 2 === 0 ? 'translate-y-8 md:translate-y-12' : ''}`}>
                                <img src={`${TMDB_IMG}/w342${p.path}`} alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-lg border border-white/50 shadow-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px] sm:text-[11px] text-[#ffb700]" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                                    <span className="text-[10px] sm:text-[11px] font-black text-[#2D2926]">{(8 + Math.random() * 1.8).toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 text-center lg:text-left">
                        <span className="inline-flex text-[11px] font-black tracking-widest uppercase text-[#ffb700] bg-[#FFF9F0] px-4 py-1.5 rounded-full border border-[#ffb700]/25 mb-6">Your Personal Museum</span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-6">
                            Every Title.<br />
                            <span className="text-[#ffb700]">Beautifully Cataloged.</span>
                        </h2>
                        <p className="text-lg text-[#2D2926]/60 font-semibold mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
                            WatchHive compiles your sprawling cinematic universe into a singular, breathtaking profile grid. Never forget what you watched or how you rated it, down to the exact atmosphere details.
                        </p>
                        <Link to="/watch-hive/signup" className="inline-flex items-center gap-2 text-[#ffb700] font-black text-lg hover:text-[#2D2926] transition-colors group">
                            <span>Start building yours today</span>
                            <span className="material-symbols-outlined group-hover:translate-x-1.5 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`py-28 px-6 text-center lp-reveal ${ctaReveal.visible ? 'is-visible' : ''}`} ref={ctaReveal.ref}>
                <div className="bg-[#ffb700] rounded-[44px] py-20 px-6 max-w-5xl mx-auto shadow-[0_20px_50px_rgba(255,183,0,0.25)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-8"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4.5 shadow-lg border border-[#ffb700]/10 mb-8">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-sm">
                            The Curtain is Raised.
                        </h2>
                        <p className="text-xl font-bold text-white/90 mb-10 max-w-xl mx-auto drop-shadow-sm leading-relaxed">
                            Join the hive today and start tracking your cinema with absolute clarity, offline resilience, and gorgeous aesthetics.
                        </p>
                        <Link to="/watch-hive/signup" className="bg-white text-[#2D2926] text-lg font-black px-10 py-5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                            Create Your Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-[#ffb700]/10 py-14 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF9F0] border border-[#ffb700]/20 p-1.5 flex items-center justify-center">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-[#2D2926] text-xl tracking-tight">WatchHive</span>
                    </div>
                    
                    <p className="text-[13px] font-bold text-[#2D2926]/40 text-center md:text-left">
                        © 2026 WatchHive. Crafted for true cinephiles worldwide.
                    </p>
                    
                    <div className="flex items-center gap-6 text-[14px] font-bold text-[#2D2926]/60">
                        <Link to="/watch-hive/login" className="hover:text-[#ffb700] transition-colors">Sign In</Link>
                        <Link to="/watch-hive/signup" className="hover:text-[#ffb700] transition-colors">Sign Up</Link>
                        <Link to="/watch-hive/privacy" className="hover:text-[#ffb700] transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
