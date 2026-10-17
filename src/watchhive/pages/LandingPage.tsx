import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import whLogo from '../assets/images/watchhive-logo.png';
import { showInstallPrompt, isInstallPromptReady } from '../../serviceWorkerRegistration';

/* ── TMDb poster URLs for showcasing popular movies ── */
const TMDB_IMG = 'https://image.tmdb.org/t/p';

/* Curated list of iconic/popular movie posters */
const SHOWCASE_POSTERS = [
    { title: "Dune: Part Two", path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", year: "2024" },
    { title: "Past Lives", path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", year: "2023" },
    { title: "Interstellar", path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", year: "2014" },
    { title: "Spirited Away", path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", year: "2001" },
    { title: "The Shawshank Redemption", path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", year: "1994" },
    { title: "Arrival", path: "/x2O0m22972990666016641.jpg", year: "2016" },
    { title: "The Godfather", path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", year: "1972" },
    { title: "Blade Runner 2049", path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", year: "2017" },
    { title: "Parasite", path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", year: "2019" },
    { title: "Inception", path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", year: "2010" },
    { title: "Oppenheimer", path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", year: "2023" },
    { title: "Pulp Fiction", path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", year: "1994" },
    { title: "The Truman Show", path: "/vuza0WqY239cuGhKVYhaioGjjmj.jpg", year: "1998" },
    { title: "Fight Club", path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", year: "1999" },
    { title: "Spider-Man: Across the Spider-Verse", path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", year: "2023" },
    { title: "La La Land", path: "/uDO8zWDhfWwoFdKS4fzkVJb0Rf0.jpg", year: "2016" },
];

const POSTER_ROW_1 = SHOWCASE_POSTERS.slice(0, 8);
const POSTER_ROW_2 = SHOWCASE_POSTERS.slice(8, 16);

function useReveal(threshold = 0.12) {
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

    // ── Interactive Demo 1: Suggester Impact & Hive Cheers ──
    const [selectedFriend, setSelectedFriend] = useState<'maya' | 'karan' | 'elena'>('maya');
    const [acceptedSuggestions, setAcceptedSuggestions] = useState<Record<string, boolean>>({});
    const [friendCheers, setFriendCheers] = useState<Record<string, number>>({
        maya: 24,
        karan: 19,
        elena: 31
    });
    const [justCheered, setJustCheered] = useState<string | null>(null);

    const friendProfiles = {
        maya: {
            name: "Maya Chen",
            handle: "@cinephile_maya",
            avatar: "🌸",
            role: "Soul Healer & Indie Cinephile",
            resonanceScore: 98,
            suggestionsSent: 16,
            suggestionsWatched: 15,
            topStacked: 6,
            movieTitle: "Past Lives",
            year: "2023",
            poster: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
            personalNote: "You mentioned having a nostalgic, contemplative week. Put your phone away, make a warm tea, and let this film wash over you. It stayed with me for weeks.",
            tag: "High Resonance Compass",
            badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
        },
        karan: {
            name: "Karan Mehta",
            handle: "@scifi_karan",
            avatar: "🪐",
            role: "Cosmic Visionary & Nolan Buff",
            resonanceScore: 94,
            suggestionsSent: 20,
            suggestionsWatched: 18,
            topStacked: 9,
            movieTitle: "Interstellar",
            year: "2014",
            poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            personalNote: "If you need a reminder of what human curiosity and love can do across the cosmos, turn up your sound system for Zimmer's organ score. Pure awe.",
            tag: "Cosmic Architect",
            badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20"
        },
        elena: {
            name: "Elena Rostova",
            handle: "@cinema_elena",
            avatar: "🌿",
            role: "Sanctuary Curator & Ghibli Lover",
            resonanceScore: 99,
            suggestionsSent: 12,
            suggestionsWatched: 12,
            topStacked: 7,
            movieTitle: "Spirited Away",
            year: "2001",
            poster: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
            personalNote: "Whenever the world feels overly heavy, this hand-drawn miracle grounds my spirit. An instant dose of warmth to cheer you up this weekend!",
            tag: "Comfort Sanctuary",
            badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20"
        }
    };

    // ── Interactive Demo 2: Cinematic Stacks as Movie Experience Report Card ──
    const [activeStackTheme, setActiveStackTheme] = useState<'worldview' | 'comfort'>('worldview');
    const [worldviewStack, setWorldviewStack] = useState([
        {
            id: '1',
            title: 'Interstellar',
            year: '2014',
            path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            userReflection: 'Watched with my dad before moving across continents. Made me realize love is the only dimensional constant.',
            impactTier: 'Monumental Life Anchor',
            emotionalTone: 'Cosmic Wonder & Familial Love'
        },
        {
            id: '2',
            title: 'Past Lives',
            year: '2023',
            path: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
            userReflection: 'Helped me make peace with parallel versions of my life and the people I left behind in earlier chapters.',
            impactTier: 'Soul Mirror',
            emotionalTone: 'Gentle Melancholy & Acceptance'
        },
        {
            id: '3',
            title: 'Dune: Part Two',
            year: '2024',
            path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            userReflection: 'The pinnacle of theatrical transport. Showed me how myth and sound design can vibrate your entire body in IMAX.',
            impactTier: 'Cinematic Grandeur',
            emotionalTone: 'Awe, Myth & Visual Majesty'
        }
    ]);

    const [comfortStack, setComfortStack] = useState([
        {
            id: 'c1',
            title: 'Spirited Away',
            year: '2001',
            path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
            userReflection: 'My safe haven since childhood. Whenever burnout strikes, this world rebuilds my wonder for living.',
            impactTier: 'Eternal Sanctuary',
            emotionalTone: 'Handcrafted Warmth & Innocence'
        },
        {
            id: 'c2',
            title: 'The Truman Show',
            year: '1998',
            path: '/vuza0WqY239cuGhKVYhaioGjjmj.jpg',
            userReflection: 'Inspired me to live courageously and choose genuine truth over comfortable illusions.',
            impactTier: 'Awakening Call',
            emotionalTone: 'Existential Hope & Freedom'
        },
        {
            id: 'c3',
            title: 'La La Land',
            year: '2016',
            path: '/uDO8zWDhfWwoFdKS4fzkVJb0Rf0.jpg',
            userReflection: 'A bittersweet celebration of dreams, sacrifices, and the fleeting beauty of who we meet along the way.',
            impactTier: 'Bittersweet Melody',
            emotionalTone: 'Passion, Nostalgia & Dreams'
        }
    ]);

    // Active stack list selector
    const currentStack = activeStackTheme === 'worldview' ? worldviewStack : comfortStack;
    const setCurrentStack = activeStackTheme === 'worldview' ? setWorldviewStack : setComfortStack;

    const moveStackItem = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentStack.length) return;
        const copy = [...currentStack];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        setCurrentStack(copy);
    };

    // ── Interactive Demo 3: Live Community Cheering Feed Simulator ──
    const [feedItems, setFeedItems] = useState([
        {
            id: 1,
            from: "Marcus",
            to: "Sarah",
            action: "suggested to cheer up",
            movie: "Spirited Away",
            note: "Heard work has been exhausting. Take 2 hours for yourself tonight, this film cures everything 🐝✨",
            cheers: 18,
            cheered: false
        },
        {
            id: 2,
            from: "Hannah",
            to: "Community",
            action: "updated Report Card Stack",
            movie: "Films That Shaped My 20s",
            note: "Moved Interstellar to #1. No other film captures grief and optimism quite like it.",
            cheers: 27,
            cheered: false
        }
    ]);

    const handleFeedCheer = (id: number) => {
        setFeedItems(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    cheers: item.cheered ? item.cheers - 1 : item.cheers + 1,
                    cheered: !item.cheered
                };
            }
            return item;
        }));
    };

    // ── PWA & Scroll Listeners ──
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
            setNavSolid(window.scrollY > 50);
        };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Scroll reveal hooks
    const heroReveal = useReveal(0.05);
    const communityReveal = useReveal(0.08);
    const suggestionReveal = useReveal(0.08);
    const stackReveal = useReveal(0.08);
    const openSourceReveal = useReveal(0.08);
    const posterReveal = useReveal(0.05);
    const ctaReveal = useReveal(0.1);

    const activeFriendData = friendProfiles[selectedFriend];
    const topRankedFilm = currentStack[0];

    return (
        <div className="min-h-screen bg-[#FFF9F0] text-[#2D2926] font-sans overflow-x-hidden selection:bg-[#ffb700] selection:text-white">
            
            {/* Custom Animations & Styling */}
            <style>{`
                @keyframes float-slow { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } 100% { transform: translateY(0px) rotate(0deg); } }
                @keyframes marquee-l { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-r { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                @keyframes cheer-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3) rotate(8deg); } 100% { transform: scale(1); } }
                
                .anim-float { animation: float-slow 7s ease-in-out infinite; }
                .anim-float-delayed { animation: float-slow 8.5s ease-in-out infinite 1.2s; }
                .marquee-left { animation: marquee-l 45s linear infinite; }
                .marquee-right { animation: marquee-r 45s linear infinite; }
                .cheer-pop { animation: cheer-pop 0.35s ease-out; }
                
                .lp-reveal { opacity: 0; transform: translateY(32px); transition: all 0.85s cubic-bezier(0.16, 1, 0.3, 1); }
                .lp-reveal.is-visible { opacity: 1; transform: translateY(0); }

                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    display: inline-block;
                    line-height: 1;
                }
            `}</style>

            {/* ── Top Navigation Bar ───────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? 'bg-[#FFF9F0]/95 backdrop-blur-md shadow-sm border-b border-[#ffb700]/15 py-3.5' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <Link to="/watch-hive" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center p-2 transition-all ${navSolid ? 'bg-white shadow-sm border border-[#ffb700]/20' : 'bg-white/90 backdrop-blur-md shadow-[0_4px_12px_rgba(255,183,0,0.18)] group-hover:scale-105'}`}>
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-black tracking-tight text-[#2D2926]">WatchersHive</span>
                            <span className="text-[10px] font-bold text-[#b07d00] tracking-wider uppercase -mt-1 hidden sm:block">Community & Suggestions</span>
                        </div>
                    </Link>
                    
                    <div className="hidden lg:flex items-center gap-8 font-extrabold text-[13.5px] text-[#2D2926]/70">
                        <a href="#community" className="hover:text-[#ffb700] transition-colors">The Watchers Hive</a>
                        <a href="#suggestions" className="hover:text-[#ffb700] transition-colors">Suggestion Impact</a>
                        <a href="#stacks" className="hover:text-[#ffb700] transition-colors">Report Card Stacks</a>
                        <a href="#open-source" className="hover:text-[#ffb700] transition-colors flex items-center gap-1.5">
                            <span>Open Source</span>
                            <span className="text-[10px] bg-[#ffb700]/15 text-[#92660a] px-2 py-0.5 rounded-full font-black">GitHub</span>
                        </a>
                    </div>
                    
                    <div className="flex items-center gap-3.5">
                        <a 
                            href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#2D2926]/75 bg-white border border-[#ffb700]/25 hover:border-[#ffb700] transition-all shadow-sm"
                            title="Star WatchersHive on GitHub"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            <span>Open Source</span>
                        </a>

                        <Link to="/watch-hive/login" className="text-[13.5px] font-bold text-[#2D2926] hover:text-[#ffb700] transition-colors px-3 py-2">
                            Sign In
                        </Link>
                        <Link to="/watch-hive/signup" className="bg-[#ffb700] text-black text-[13.5px] font-black tracking-wide px-5 py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.45)] hover:-translate-y-0.5 transition-all">
                            Join Hive
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ───────────────────────────────────── */}
            <section className={`relative pt-32 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden flex flex-col items-center text-center w-full min-h-[92vh] lp-reveal ${heroReveal.visible ? 'is-visible' : ''}`} ref={heroReveal.ref}>
                {/* Honey Aura Radial Gradient */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[650px] bg-gradient-to-b from-[#ffb700]/20 via-[#ffb700]/5 to-transparent blur-[130px] rounded-full -z-10 pointer-events-none"></div>

                {/* Subtitle Badge */}
                <div className="inline-flex items-center gap-2.5 bg-white border border-[#ffb700]/30 px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,183,0,0.1)] mb-6 z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb700] animate-ping"></span>
                    <span className="text-[11.5px] font-black text-[#855700] uppercase tracking-wider">A Community of Watchers • Open Source Collective</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#2D2926] max-w-5xl mx-auto leading-[1.08] mb-6 z-10">
                    Where Cinephiles Connect,<br />
                    <span className="bg-gradient-to-r from-[#e59700] via-[#ffb700] to-amber-600 bg-clip-text text-transparent">Suggest & Cheer Up.</span>
                </h1>

                {/* Narrative Subhead */}
                <p className="text-base sm:text-lg md:text-xl font-medium text-[#2D2926]/70 max-w-3xl mx-auto mb-10 z-10 leading-relaxed">
                    Movie watching is never meant to be a cold, solitary algorithm. WatchersHive is a living community where friends handpick cinema for each other, discover whose suggestions actually leave a lasting mark, and preserve their personal <strong className="text-[#2D2926] font-black">Movie Experience Report Cards</strong>.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center z-20 mb-14">
                    <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-[#ffb700] text-black text-[15.5px] font-black tracking-wide px-8 py-4 rounded-2xl shadow-[0_8px_24px_rgba(255,183,0,0.35)] hover:shadow-[0_12px_32px_rgba(255,183,0,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                        <span>Join the Watchers Hive</span>
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>

                    {isInstalled ? (
                        <div className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[15px] font-extrabold px-6 py-4 rounded-2xl flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                            <span>App Installed</span>
                        </div>
                    ) : isInstallReady ? (
                        <button 
                            onClick={handleInstall}
                            className="w-full sm:w-auto bg-white border border-[#ffb700]/30 text-[#855700] text-[15px] font-black px-6 py-4 rounded-2xl hover:bg-[#FFF9F0] hover:border-[#ffb700] transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>Install App</span>
                        </button>
                    ) : (
                        <button 
                            onClick={handleInstall}
                            className="w-full sm:w-auto bg-white border border-[#ffb700]/30 text-[#855700] text-[15px] font-black px-6 py-4 rounded-2xl hover:bg-[#FFF9F0] hover:border-[#ffb700] transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">devices</span>
                            <span>Mobile & PWA Ready</span>
                        </button>
                    )}
                </div>

                {showInstallHint && !isInstallReady && !isInstalled && (
                    <div className="p-5 bg-white border border-[#ffb700]/30 rounded-3xl shadow-xl max-w-md w-full mb-8 z-30 flex flex-col gap-3 text-left">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-[11px] font-black text-[#855700] uppercase tracking-widest">Install App on Your Device</h4>
                                <p className="text-xs text-[#2D2926]/60 font-semibold mt-0.5">Instant offline access directly from your home screen or desktop.</p>
                            </div>
                            <button onClick={() => setShowInstallHint(false)} className="text-slate-400 hover:text-[#ffb700] text-sm font-bold">✕</button>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#b07d00] w-24 shrink-0">iOS Safari</span>
                                <span className="text-[#2D2926]/75 font-medium">Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#b07d00] w-24 shrink-0">Android / Chrome</span>
                                <span className="text-[#2D2926]/75 font-medium">Tap <strong>Menu (⋮)</strong> → <strong>Install app</strong></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Interactive Hero Sandbox: Suggestion Experience & Impact Card ── */}
                <div className="w-full max-w-5xl bg-white rounded-[36px] p-6 sm:p-8 border border-[#ffb700]/25 shadow-[0_20px_50px_rgba(255,183,0,0.12)] text-left relative z-20 overflow-hidden">
                    {/* Top Tab Bar: Demonstrating the 3 Friends */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-[#855700] uppercase tracking-widest bg-[#ffb700]/15 px-3 py-1 rounded-full inline-block mb-1.5">Interactive Demo</span>
                            <h3 className="text-xl sm:text-2xl font-black text-[#2D2926] tracking-tight">
                                A Genuine Movie Suggestion From Your Hive
                            </h3>
                            <p className="text-xs sm:text-sm text-[#2D2926]/60 font-semibold mt-0.5">
                                Select a friend in your circle to see how heartfelt suggestions and resonance impact work:
                            </p>
                        </div>

                        {/* Friend Switcher */}
                        <div className="flex bg-[#FFF9F0] p-1.5 rounded-2xl border border-[#ffb700]/20 w-full sm:w-auto">
                            {(['maya', 'karan', 'elena'] as const).map(friendKey => (
                                <button
                                    key={friendKey}
                                    onClick={() => setSelectedFriend(friendKey)}
                                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 capitalize ${selectedFriend === friendKey ? 'bg-white text-[#2D2926] shadow-sm border border-slate-100' : 'text-[#2D2926]/50 hover:text-[#2D2926]'}`}
                                >
                                    <span>{friendProfiles[friendKey].avatar}</span>
                                    <span>{friendProfiles[friendKey].name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
                        
                        {/* Poster & Film Preview (4 cols) */}
                        <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
                            <div className="relative w-44 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FFF9F0] group">
                                <img 
                                    src={`${TMDB_IMG}/w342${activeFriendData.poster}`} 
                                    alt={activeFriendData.movieTitle} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                />
                                <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-black text-[11px] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] text-[#ffb700]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span>{activeFriendData.year}</span>
                                </div>
                            </div>
                            <h4 className="font-black text-lg text-[#2D2926] mt-3">{activeFriendData.movieTitle}</h4>
                            <span className="text-xs text-[#2D2926]/50 font-bold">Suggested to cheer you up</span>
                        </div>

                        {/* Suggestion Card & Note Content (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col justify-between h-full gap-5">
                            {/* Friend Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/30 flex items-center justify-center text-2xl shadow-inner">
                                        {activeFriendData.avatar}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-extrabold text-[15px] text-[#2D2926]">{activeFriendData.name}</h5>
                                            <span className="text-xs text-[#2D2926]/40 font-semibold">{activeFriendData.handle}</span>
                                        </div>
                                        <p className="text-xs text-[#b07d00] font-bold">{activeFriendData.role}</p>
                                    </div>
                                </div>

                                <div className={`px-3 py-1 rounded-full text-[11px] font-black border ${activeFriendData.badgeColor}`}>
                                    {activeFriendData.tag}
                                </div>
                            </div>

                            {/* Personal Note Box */}
                            <div className="bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl p-5 relative">
                                <span className="material-symbols-outlined text-[#ffb700] text-[20px] absolute -top-2.5 left-4 bg-white px-1 rounded-md border border-[#ffb700]/20">chat_bubble</span>
                                <p className="text-sm font-semibold text-[#2D2926]/85 italic leading-relaxed pt-1">
                                    "{activeFriendData.personalNote}"
                                </p>
                            </div>

                            {/* Suggester Impact Insight Metrics */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <span className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-wider block">Resonance Rate</span>
                                    <span className="text-lg font-black text-emerald-600">{activeFriendData.resonanceScore}%</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-wider block">Watched & Loved</span>
                                    <span className="text-lg font-black text-[#2D2926]">{activeFriendData.suggestionsWatched} / {activeFriendData.suggestionsSent}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-[#2D2926]/40 uppercase tracking-wider block">Moved to Stacks</span>
                                    <span className="text-lg font-black text-[#b07d00]">#{activeFriendData.topStacked} Films</span>
                                </div>
                            </div>

                            {/* Interactive Micro-Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button 
                                    onClick={() => {
                                        setAcceptedSuggestions(prev => ({
                                            ...prev,
                                            [selectedFriend]: !prev[selectedFriend]
                                        }));
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${acceptedSuggestions[selectedFriend] ? 'bg-emerald-600 text-white shadow-md' : 'bg-[#ffb700] text-black hover:bg-amber-400'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {acceptedSuggestions[selectedFriend] ? 'done' : 'bookmark_add'}
                                    </span>
                                    <span>{acceptedSuggestions[selectedFriend] ? 'Accepted to Watchlist! ✨' : 'Accept Suggestion'}</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        setFriendCheers(prev => ({
                                            ...prev,
                                            [selectedFriend]: prev[selectedFriend] + 1
                                        }));
                                        setJustCheered(selectedFriend);
                                        setTimeout(() => setJustCheered(null), 1000);
                                    }}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-white border border-[#ffb700]/30 text-[#855700] hover:bg-[#FFF9F0] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                    <span className={`material-symbols-outlined text-[16px] text-[#ffb700] ${justCheered === selectedFriend ? 'cheer-pop' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                        favorite
                                    </span>
                                    <span>Send Cheer ({friendCheers[selectedFriend]})</span>
                                </button>

                                {justCheered === selectedFriend && (
                                    <span className="text-xs font-black text-amber-700 animate-pulse">
                                        🐝 Cheered {activeFriendData.name.split(' ')[0]}!
                                    </span>
                                )}
                            </div>

                        </div>

                    </div>
                </div>

                {/* Floating posters backdrop decor */}
                <div className="absolute top-[35%] left-0 right-0 h-[65%] w-full pointer-events-none -z-10 opacity-20 sm:opacity-40 overflow-hidden">
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[1].path}`} className="absolute top-[8%] left-[3%] w-28 md:w-40 rounded-2xl shadow-xl -rotate-6 anim-float border-2 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[3].path}`} className="absolute top-[28%] right-[4%] w-28 md:w-36 rounded-2xl shadow-xl rotate-6 anim-float-delayed border-2 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[5].path}`} className="absolute bottom-[18%] left-[7%] w-24 md:w-32 rounded-2xl shadow-xl -rotate-3 anim-float border-2 border-white" alt=""/>
                </div>
            </section>

            {/* ── Marquee Poster Reel ─────────────────────────────── */}
            <section className={`py-8 bg-white border-y border-[#ffb700]/15 overflow-hidden lp-reveal ${posterReveal.visible ? 'is-visible' : ''}`} ref={posterReveal.ref}>
                <div className="flex flex-col gap-4">
                    <div className="flex w-[200%] marquee-left">
                        {[...POSTER_ROW_1, ...POSTER_ROW_1].map((p, i) => (
                            <div key={i} className="w-[130px] sm:w-[160px] md:w-[180px] shrink-0 px-2">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-xl overflow-hidden shadow-sm border border-[#ffb700]/15 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <span className="text-white text-xs font-black leading-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex w-[200%] marquee-right">
                        {[...POSTER_ROW_2, ...POSTER_ROW_2].map((p, i) => (
                            <div key={i} className="w-[130px] sm:w-[160px] md:w-[180px] shrink-0 px-2">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-xl overflow-hidden shadow-sm border border-[#ffb700]/15 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <span className="text-white text-xs font-black leading-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 1: The Community of Watchers & The Suggestion Experience ── */}
            <section id="community" className={`py-24 px-6 max-w-7xl mx-auto lp-reveal ${communityReveal.visible ? 'is-visible' : ''}`} ref={communityReveal.ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#855700] bg-[#ffb700]/15 px-4 py-1.5 rounded-full inline-block mb-3">
                        Human Connection Over Algorithms
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-[#2D2926] tracking-tight mb-4">
                        A Real Community of Watchers.
                    </h2>
                    <p className="text-base sm:text-lg text-[#2D2926]/70 font-semibold leading-relaxed">
                        Algorithms optimize for watch time and advertisement clicks. Friends optimize for your soul. In WatchersHive, you share cinema to inspire, comfort, and cheer each other up.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    {/* Card 1 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/25 flex items-center justify-center mb-6 text-[#ffb700]">
                                <span className="material-symbols-outlined text-[26px]">favorite</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#2D2926] mb-3">Cheer Up Suggestions</h3>
                            <p className="text-sm text-[#2D2926]/70 font-semibold leading-relaxed">
                                Had an exhausting day? Your hive friends can handpick a heartwarming classic or a thrilling distraction, attached with a warm note written just for you.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-extrabold text-[#b07d00] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">celebration</span>
                            <span>Direct personal notes attached to every title</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/25 flex items-center justify-center mb-6 text-[#ffb700]">
                                <span className="material-symbols-outlined text-[26px]">insights</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#2D2926] mb-3">Suggester Impact Insights</h3>
                            <p className="text-sm text-[#2D2926]/70 font-semibold leading-relaxed">
                                Discover who in your circle has the golden taste. WatchersHive tracks whose recommendations you actually end up watching, loving, and preserving in your top stacks.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-extrabold text-[#b07d00] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>Know whose taste never misses</span>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-8 rounded-3xl border border-[#ffb700]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/25 flex items-center justify-center mb-6 text-[#ffb700]">
                                <span className="material-symbols-outlined text-[26px]">group</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#2D2926] mb-3">Zero Commercial Noise</h3>
                            <p className="text-sm text-[#2D2926]/70 font-semibold leading-relaxed">
                                No sponsored movie studios forcing ads onto your feed. No bot reviews inflating scores. Just genuine watchers discussing what moved them.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-extrabold text-[#b07d00] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">lock_open</span>
                            <span>Clean, honest, community-first space</span>
                        </div>
                    </div>
                </div>

                {/* ── Community Swarm Cheer Simulator ── */}
                <div id="suggestions" className={`mt-14 bg-white rounded-3xl p-6 sm:p-8 border border-[#ffb700]/20 shadow-sm max-w-4xl mx-auto text-left lp-reveal ${suggestionReveal.visible ? 'is-visible' : ''}`} ref={suggestionReveal.ref}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb700]">hive</span>
                            <h4 className="font-extrabold text-base text-[#2D2926]">Live Community Cheers</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#855700] bg-[#ffb700]/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Micro-Interaction Feed
                        </span>
                    </div>

                    <div className="space-y-3.5">
                        {feedItems.map(item => (
                            <div key={item.id} className="bg-[#FFF9F0]/80 border border-[#ffb700]/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-[#2D2926]">@{item.from}</span>
                                        <span className="text-[11px] font-bold text-[#b07d00] bg-[#ffb700]/15 px-2 py-0.5 rounded-md">{item.action}</span>
                                        <span className="text-xs font-black text-[#2D2926] underline decoration-[#ffb700]">{item.movie}</span>
                                    </div>
                                    <p className="text-xs text-[#2D2926]/70 font-semibold italic">"{item.note}"</p>
                                </div>
                                <button
                                    onClick={() => handleFeedCheer(item.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 ${item.cheered ? 'bg-[#ffb700] text-black shadow-sm' : 'bg-white border border-[#ffb700]/25 text-[#855700] hover:bg-[#FFF9F0]'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: item.cheered ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                    <span>{item.cheers} Cheers</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 2: Cinematic Stacks: The Movie Experience Report Card ── */}
            <section id="stacks" className={`py-24 px-6 bg-white border-y border-[#ffb700]/15 relative overflow-hidden lp-reveal ${stackReveal.visible ? 'is-visible' : ''}`} ref={stackReveal.ref}>
                <div className="max-w-7xl mx-auto">
                    
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#855700] bg-[#FFF9F0] px-4 py-1.5 rounded-full inline-block border border-[#ffb700]/30 mb-3">
                            Beyond Sterile Numbers
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-[#2D2926] tracking-tight mb-4">
                            Cinematic Stacks as Your Experience Report Card.
                        </h2>
                        <p className="text-base sm:text-lg text-[#2D2926]/70 font-semibold leading-relaxed">
                            We don't obsess over generic star ratings or whether a movie is an 8.1 or an 8.2. Instead, your <strong className="text-[#2D2926]">Cinematic Stack</strong> is your emotional report card. The order you choose to preserve defines who you are, what you treasure, and the monumental impact those films made on your life.
                        </p>
                    </div>

                    {/* Interactive Stack Re-orderer Sandbox */}
                    <div className="bg-[#FFF9F0] border border-[#ffb700]/25 rounded-[36px] p-6 sm:p-10 shadow-lg text-left">
                        {/* Theme Switcher */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#ffb700]/20 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-[#855700] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#ffb700]/25 inline-block mb-1">
                                    Try Reordering Movies Below (▲ / ▼)
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-[#2D2926]">
                                    Report Card Stack: {activeStackTheme === 'worldview' ? '"Films That Changed My Worldview"' : '"Sanctuary for a Tired Soul"'}
                                </h3>
                            </div>

                            <div className="flex bg-white p-1 rounded-2xl border border-[#ffb700]/25">
                                <button
                                    onClick={() => setActiveStackTheme('worldview')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeStackTheme === 'worldview' ? 'bg-[#ffb700] text-black shadow-sm' : 'text-[#2D2926]/50 hover:text-[#2D2926]'}`}
                                >
                                    Worldview Stack
                                </button>
                                <button
                                    onClick={() => setActiveStackTheme('comfort')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeStackTheme === 'comfort' ? 'bg-[#ffb700] text-black shadow-sm' : 'text-[#2D2926]/50 hover:text-[#2D2926]'}`}
                                >
                                    Sanctuary Stack
                                </button>
                            </div>
                        </div>

                        {/* Interactive Body: Stacks on left, Dynamic Report Card Meaning on right */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                            
                            {/* Stack Items (7 cols) */}
                            <div className="lg:col-span-7 space-y-4">
                                {currentStack.map((movie, index) => (
                                    <div 
                                        key={movie.id}
                                        className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${index === 0 ? 'border-[#ffb700] ring-2 ring-[#ffb700]/20' : 'border-slate-100'}`}
                                    >
                                        <div className="flex items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${index === 0 ? 'bg-[#ffb700] text-black shadow-md' : 'bg-slate-100 text-[#2D2926]/60'}`}>
                                                    #{index + 1}
                                                </div>
                                                <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200">
                                                    <img src={`${TMDB_IMG}/w92${movie.path}`} alt={movie.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-sm sm:text-base text-[#2D2926]">{movie.title}</h4>
                                                        <span className="text-xs text-[#2D2926]/40 font-bold">({movie.year})</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#855700] bg-[#ffb700]/15 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                                        {movie.impactTier}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Move buttons */}
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <button
                                                    onClick={() => moveStackItem(index, 'up')}
                                                    disabled={index === 0}
                                                    aria-label="Move movie up"
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${index === 0 ? 'text-slate-200 border border-slate-100 cursor-not-allowed' : 'bg-[#FFF9F0] text-[#855700] border border-[#ffb700]/30 hover:bg-[#ffb700] hover:text-black'}`}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    onClick={() => moveStackItem(index, 'down')}
                                                    disabled={index === currentStack.length - 1}
                                                    aria-label="Move movie down"
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${index === currentStack.length - 1 ? 'text-slate-200 border border-slate-100 cursor-not-allowed' : 'bg-[#FFF9F0] text-[#855700] border border-[#ffb700]/30 hover:bg-[#ffb700] hover:text-black'}`}
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-[#2D2926]/75 font-semibold mt-3 pl-1 sm:pl-11 italic border-l-2 border-[#ffb700]/30 py-0.5">
                                            "{movie.userReflection}"
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Dynamic "Report Card Insight" (5 cols) */}
                            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#ffb700]/25 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-[#ffb700]">school</span>
                                        <h4 className="font-black text-sm text-[#855700] uppercase tracking-wider">Your Report Card Statement</h4>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/20 mb-5">
                                        <span className="text-[10px] font-black text-[#2D2926]/40 uppercase tracking-widest block mb-1">
                                            Your #1 Film Definition
                                        </span>
                                        <h5 className="font-black text-lg text-[#2D2926] mb-1">
                                            {topRankedFilm.title} sits at your summit.
                                        </h5>
                                        <p className="text-xs text-[#2D2926]/70 font-semibold leading-relaxed">
                                            Keeping <strong>{topRankedFilm.title}</strong> at the top signals that you prioritize <strong className="text-[#855700]">{topRankedFilm.emotionalTone}</strong>. Anyone who visits your profile immediately understands what touched you most deeply.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                                            <span className="font-bold text-[#2D2926]/50">Emotional Imprint Tier</span>
                                            <span className="font-black text-emerald-700">{topRankedFilm.impactTier}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                                            <span className="font-bold text-[#2D2926]/50">Community Resonance</span>
                                            <span className="font-black text-[#2D2926]">Shared by 1.2k Cinephiles</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-[#2D2926]/50">Stack Purpose</span>
                                            <span className="font-black text-[#855700]">Personal Life Monument</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <p className="text-[11px] text-[#2D2926]/50 font-semibold leading-relaxed">
                                        💡 In WatchersHive, your stacks act as your personal cinematic DNA. You don't have to defend why a movie is your favorite—the stack tells your story.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </section>

            {/* ── Section 3: 100% Open Source Collaborative Ground ── */}
            <section id="open-source" className={`py-24 px-6 max-w-7xl mx-auto lp-reveal ${openSourceReveal.visible ? 'is-visible' : ''}`} ref={openSourceReveal.ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#855700] bg-[#ffb700]/15 px-4 py-1.5 rounded-full inline-block mb-3">
                        Public Good • Free Forever
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-[#2D2926] tracking-tight mb-4">
                        A Truly Open Source Ground.
                    </h2>
                    <p className="text-base sm:text-lg text-[#2D2926]/70 font-semibold leading-relaxed">
                        WatchersHive is built completely in the open. A collaborative ground where developers, designers, and cinephiles unite to build the purest movie recommendation, suggestion, and tracking experience on Earth.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* Left: Open Source Philosophy (7 cols) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#ffb700]/20 shadow-sm flex flex-col justify-between text-left">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/30 flex items-center justify-center text-black">
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D2926]">Collaborate & Build With Us</h3>
                                    <span className="text-xs text-[#b07d00] font-black">GitHub / dasamantaraoaditya</span>
                                </div>
                            </div>

                            <p className="text-sm sm:text-base text-[#2D2926]/75 font-semibold leading-relaxed">
                                Most platforms trap your reviews and watch histories behind closed APIs, proprietary walls, and corporate monetization. WatchersHive believes cinema data belongs to the community.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/15">
                                    <span className="text-sm font-black text-[#2D2926] block mb-1">🛠️ Full Transparency</span>
                                    <p className="text-xs text-[#2D2926]/60 font-semibold">
                                        Frontend, backend, and mobile apps are open for anyone to inspect, fork, and enhance.
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#ffb700]/15">
                                    <span className="text-sm font-black text-[#2D2926] block mb-1">🎬 TMDb Powered</span>
                                    <p className="text-xs text-[#2D2926]/60 font-semibold">
                                        Direct integration with high-fidelity movie metadata, cast, director notes, and trailers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
                            <a
                                href="https://github.com/dasamantaraoaditya/WatchHive-Frontend"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#2D2926] text-white px-6 py-3.5 rounded-xl text-xs font-black hover:bg-black transition-all flex items-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                <span>Star on GitHub</span>
                            </a>
                            <Link to="/watch-hive/signup" className="bg-[#ffb700] text-black px-6 py-3.5 rounded-xl text-xs font-black hover:bg-amber-400 transition-all shadow-sm">
                                Join the Collective
                            </Link>
                        </div>
                    </div>

                    {/* Right: Repository Ecosystem (5 cols) */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-[#2D2926] to-[#1a1715] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between text-left">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb700] bg-white/10 px-3 py-1 rounded-full inline-block mb-4">
                                The Codebase
                            </span>
                            <h4 className="text-2xl font-black mb-2">Built Across 3 Repositories</h4>
                            <p className="text-xs text-white/60 font-semibold mb-6">
                                Everything is designed to be lightweight, modular, and blazing fast.
                            </p>

                            <div className="space-y-4">
                                <a 
                                    href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ffb700]/50 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-black text-white group-hover:text-[#ffb700] transition-colors">WatchHive-Frontend</span>
                                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">React • Vite • Tailwind</span>
                                    </div>
                                    <p className="text-xs text-white/50 font-medium">Responsive web app, PWA service worker, interactive stacks.</p>
                                </a>

                                <a 
                                    href="https://github.com/dasamantaraoaditya/WatchHive-Mobile" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ffb700]/50 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-black text-white group-hover:text-[#ffb700] transition-colors">WatchHive-Mobile</span>
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Flutter • Android & iOS</span>
                                    </div>
                                    <p className="text-xs text-white/50 font-medium">Native mobile app, Play Store internal release code, offline SQLite sync.</p>
                                </a>

                                <a 
                                    href="https://github.com/dasamantaraoaditya/WatchHive-Backend" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ffb700]/50 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-black text-white group-hover:text-[#ffb700] transition-colors">WatchHive-Backend</span>
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Node • Express • PostgreSQL</span>
                                    </div>
                                    <p className="text-xs text-white/50 font-medium">High-speed API, TMDb caching layer, suggestion notifications.</p>
                                </a>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60 font-bold">
                            <span>Licensed under MIT</span>
                            <span className="text-[#ffb700]">PRs & Issues Welcome</span>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Section 4: Offline Capable & Multi-Device ─────────── */}
            <section className="py-20 px-6 max-w-7xl mx-auto my-8 bg-white rounded-[40px] border border-[#ffb700]/15 shadow-sm text-left">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-4">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#855700] bg-[#FFF9F0] px-4 py-1.5 rounded-full inline-block border border-[#ffb700]/25">
                            Built For Real Life
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight">
                            Log Inside Theaters. Zero Signal Required.
                        </h2>
                        <p className="text-sm sm:text-base text-[#2D2926]/70 font-semibold leading-relaxed">
                            Ever walked out of a movie theater with zero cellular reception, wanting to log your thoughts before the magic fades? WatchersHive includes offline caching and SQLite sync: your entries are safely queued and sync automatically once you re-connect.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-[#2D2926]/60">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[#ffb700] text-[18px]">signal_wifi_off</span> Offline SQLite Queuing</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[#ffb700] text-[18px]">sync</span> Background Auto-Sync</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[#ffb700] text-[18px]">phone_android</span> Android Play Store Testing Ready</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-md bg-[#FFF9F0] p-6 rounded-3xl border border-[#ffb700]/25 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white p-3 mx-auto shadow-sm border border-[#ffb700]/20 mb-4">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <h4 className="font-extrabold text-base text-[#2D2926] mb-1">Get WatchersHive on Any Device</h4>
                        <p className="text-xs text-[#2D2926]/60 font-semibold mb-5">Install as a standalone app on your desktop, iPhone, or Android.</p>
                        
                        <div className="space-y-2">
                            <button
                                onClick={handleInstall}
                                className="w-full bg-[#ffb700] text-black font-black text-xs py-3 rounded-xl hover:bg-amber-400 transition-all shadow-sm"
                            >
                                {isInstalled ? 'App Ready & Installed' : 'Install PWA Application'}
                            </button>
                            <Link
                                to="/watch-hive/support"
                                className="block w-full bg-white border border-[#ffb700]/25 text-[#855700] font-black text-xs py-3 rounded-xl hover:bg-[#FFF9F0] transition-all"
                            >
                                Learn About Mobile Internal Testing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 5: Community Voices ─────────────────────── */}
            <section className="py-20 px-6 max-w-7xl mx-auto text-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#855700] bg-[#ffb700]/15 px-4 py-1.5 rounded-full inline-block mb-3">
                    Voices from the Swarm
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#2D2926] tracking-tight mb-12">
                    What Cinephiles Are Saying.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white p-6 rounded-3xl border border-[#ffb700]/15 shadow-sm">
                        <div className="flex items-center gap-1 text-[#ffb700] mb-3">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#2D2926]/80 font-semibold italic mb-4 leading-relaxed">
                            "I stopped caring about IMDb numbers. When a friend suggested 'Past Lives' with a 2-line note on WatchersHive, it was the best cinematic experience of my year."
                        </p>
                        <span className="text-xs font-black text-[#2D2926] block">Sarah Jenkins</span>
                        <span className="text-[10px] text-[#2D2926]/40 font-bold">Hive Member</span>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#ffb700]/15 shadow-sm">
                        <div className="flex items-center gap-1 text-[#ffb700] mb-3">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#2D2926]/80 font-semibold italic mb-4 leading-relaxed">
                            "Looking at someone's Stacks is like seeing their emotional DNA. You instantly know if you'll click as friends based on what they treasure at #1."
                        </p>
                        <span className="text-xs font-black text-[#2D2926] block">Devon Miller</span>
                        <span className="text-[10px] text-[#2D2926]/40 font-bold">Film Columnist</span>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#ffb700]/15 shadow-sm">
                        <div className="flex items-center gap-1 text-[#ffb700] mb-3">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#2D2926]/80 font-semibold italic mb-4 leading-relaxed">
                            "An open-source movie community with genuine suggestions and zero sponsored spam? This is exactly what the cinephile web has been waiting for."
                        </p>
                        <span className="text-xs font-black text-[#2D2926] block">Rohan V.</span>
                        <span className="text-[10px] text-[#2D2926]/40 font-bold">Open Source Contributor</span>
                    </div>
                </div>
            </section>

            {/* ── Final Call to Action ───────────────────────────── */}
            <section className={`py-24 px-6 text-center lp-reveal ${ctaReveal.visible ? 'is-visible' : ''}`} ref={ctaReveal.ref}>
                <div className="bg-gradient-to-r from-amber-500 via-[#ffb700] to-amber-600 rounded-[44px] py-20 px-6 max-w-5xl mx-auto shadow-[0_20px_50px_rgba(255,183,0,0.3)] relative overflow-hidden text-black">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4 shadow-xl border border-white/50 mb-6">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-[#2D2926]">
                            Step into the Hive.
                        </h2>
                        <p className="text-base sm:text-xl font-bold text-[#2D2926]/80 mb-10 max-w-xl mx-auto leading-relaxed">
                            Track what you love, cheer up the people you care about with unforgettable cinema, and build your personal Movie Experience Report Card today.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-[#2D2926] text-white text-base font-black px-10 py-5 rounded-2xl shadow-xl hover:-translate-y-1 hover:bg-black transition-all">
                                Create Free Account
                            </Link>
                            <a 
                                href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto bg-white/90 text-[#2D2926] text-base font-black px-8 py-5 rounded-2xl shadow-sm hover:bg-white hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Star on GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="bg-white border-t border-[#ffb700]/15 py-14 px-6 text-left">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF9F0] border border-[#ffb700]/25 p-1.5 flex items-center justify-center">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <span className="font-black text-[#2D2926] text-xl tracking-tight block">WatchersHive</span>
                            <span className="text-[10px] font-bold text-[#b07d00] uppercase tracking-wider">A Community of Watchers</span>
                        </div>
                    </div>
                    
                    <p className="text-xs font-semibold text-[#2D2926]/50 text-center md:text-left">
                        © 2026 WatchersHive. Crafted with love for cinema, open-source collaboration, and genuine human suggestions.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-xs font-extrabold text-[#2D2926]/70">
                        <Link to="/watch-hive/login" className="hover:text-[#ffb700] transition-colors">Sign In</Link>
                        <Link to="/watch-hive/signup" className="hover:text-[#ffb700] transition-colors">Sign Up</Link>
                        <Link to="/watch-hive/support" className="hover:text-[#ffb700] transition-colors">Support</Link>
                        <Link to="/watch-hive/privacy" className="hover:text-[#ffb700] transition-colors">Privacy Policy</Link>
                        <a 
                            href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-[#ffb700] transition-colors flex items-center gap-1"
                        >
                            <span>GitHub</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
