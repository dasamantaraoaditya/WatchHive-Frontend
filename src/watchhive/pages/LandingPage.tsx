import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import whLogo from '../assets/images/watchhive-logo.png';
import { showInstallPrompt, isInstallPromptReady } from '../../serviceWorkerRegistration';

/* ── TMDb poster URLs for showcasing popular movies ── */
const TMDB_IMG = 'https://image.tmdb.org/t/p';

/* Curated list of iconic movie posters */
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

function useReveal(threshold = 0.1) {
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

    // ── Interactive Widget 1: Real SuggestionCard Replica & Suggester Impact ──
    const [selectedFriend, setSelectedFriend] = useState<'maya' | 'karan' | 'elena'>('maya');
    const [suggestionStatus, setSuggestionStatus] = useState<Record<string, 'idle' | 'watching' | 'watched' | 'watchlist'>>({});
    const [friendCheers, setFriendCheers] = useState<Record<string, number>>({
        maya: 28,
        karan: 22,
        elena: 35
    });
    const [cheerNotice, setCheerNotice] = useState<string | null>(null);

    const friendProfiles = {
        maya: {
            name: "Maya Chen",
            username: "cinephile_maya",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
            role: "Soul Healer & Indie Cinephile",
            resonanceScore: 98,
            suggestionsSent: 16,
            suggestionsWatched: 15,
            topStacked: 6,
            movieTitle: "Past Lives",
            year: "2023",
            rating: "8.0",
            genres: ["Drama", "Romance"],
            poster: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
            overview: "Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora's family emigrates from South Korea.",
            personalNote: "You mentioned having a contemplative week. Put your phone away and just let this film wash over you. The cinematography healed my soul.",
            tag: "98% Resonance Compass"
        },
        karan: {
            name: "Karan Mehta",
            username: "scifi_karan",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
            role: "Cosmic Visionary & Nolan Buff",
            resonanceScore: 94,
            suggestionsSent: 20,
            suggestionsWatched: 18,
            topStacked: 9,
            movieTitle: "Interstellar",
            year: "2014",
            rating: "8.7",
            genres: ["Sci-Fi", "Drama", "Adventure"],
            poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth faces famine.",
            personalNote: "Turn up your speakers for Zimmer's organ score. If you need a reminder of what human curiosity and love can do across space, this is it.",
            tag: "94% Cosmic Architect"
        },
        elena: {
            name: "Elena Rostova",
            username: "cinema_elena",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
            role: "Sanctuary Curator & Ghibli Lover",
            resonanceScore: 100,
            suggestionsSent: 12,
            suggestionsWatched: 12,
            topStacked: 7,
            movieTitle: "Spirited Away",
            year: "2001",
            rating: "8.5",
            genres: ["Animation", "Fantasy"],
            poster: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
            overview: "A young girl wandering into a world ruled by gods and witches must find a way to free her parents who have been transformed into pigs.",
            personalNote: "Whenever the modern world gets too noisy, this hand-drawn miracle grounds my spirit. An instant dose of warmth to cheer you up!",
            tag: "100% Comfort Sanctuary"
        }
    };

    // ── Interactive Widget 2: Real RankedItem Stacks Replica (Movie Experience Report Card) ──
    const [activeStackTheme, setActiveStackTheme] = useState<'worldview' | 'comfort'>('worldview');
    const [worldviewStack, setWorldviewStack] = useState([
        {
            id: 's1',
            title: 'Interstellar',
            year: '2014',
            rating: '9.8',
            mediaType: 'movie',
            genre: 'Sci-Fi / Drama',
            path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            reflection: 'Watched with my dad before moving across continents. Made me realize love is the only dimensional constant.',
            impactTier: 'Monumental Life Anchor',
            emotionalTone: 'Cosmic Wonder & Familial Love'
        },
        {
            id: 's2',
            title: 'Past Lives',
            year: '2023',
            rating: '9.5',
            mediaType: 'movie',
            genre: 'Drama / Romance',
            path: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
            reflection: 'Helped me make peace with parallel versions of my life and the people left behind in earlier chapters.',
            impactTier: 'Soul Mirror',
            emotionalTone: 'Gentle Melancholy & Acceptance'
        },
        {
            id: 's3',
            title: 'Dune: Part Two',
            year: '2024',
            rating: '9.3',
            mediaType: 'movie',
            genre: 'Sci-Fi / Adventure',
            path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            reflection: 'The pinnacle of audiovisual cinema. Showed me how myth and sound design can vibrate your entire soul in IMAX.',
            impactTier: 'Theatrical Masterpiece',
            emotionalTone: 'Awe, Myth & Visual Majesty'
        }
    ]);

    const [comfortStack, setComfortStack] = useState([
        {
            id: 'c1',
            title: 'Spirited Away',
            year: '2001',
            rating: '9.9',
            mediaType: 'movie',
            genre: 'Animation / Fantasy',
            path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
            reflection: 'My safe haven since childhood. Whenever burnout strikes, this world rebuilds my wonder for living.',
            impactTier: 'Eternal Sanctuary',
            emotionalTone: 'Handcrafted Warmth & Innocence'
        },
        {
            id: 'c2',
            title: 'The Truman Show',
            year: '1998',
            rating: '9.4',
            mediaType: 'movie',
            genre: 'Drama / Comedy',
            path: '/vuza0WqY239cuGhKVYhaioGjjmj.jpg',
            reflection: 'Inspired me to live courageously and choose genuine truth over comfortable illusions.',
            impactTier: 'Awakening Call',
            emotionalTone: 'Existential Hope & Courage'
        },
        {
            id: 'c3',
            title: 'La La Land',
            year: '2016',
            rating: '9.2',
            mediaType: 'movie',
            genre: 'Musical / Romance',
            path: '/uDO8zWDhfWwoFdKS4fzkVJb0Rf0.jpg',
            reflection: 'A bittersweet celebration of dreams, sacrifices, and the fleeting beauty of who we meet along the way.',
            impactTier: 'Bittersweet Melody',
            emotionalTone: 'Passion, Nostalgia & Dreams'
        }
    ]);

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

    // ── Interactive Widget 3: Real MindLens Dashboard Replica ──
    const [mindLensMood, setMindLensMood] = useState<'existential' | 'comfort' | 'dopamine'>('existential');
    const mindLensData = {
        existential: {
            icon: "🌌",
            mood: "Cosmic Existential Reflection",
            confidence: 96,
            status: "High Existential & Atmospheric Resonance",
            description: "Your recent logs lean into sweeping philosophical horizons, non-linear timelines, and poignant questions about humanity's place in time.",
            persona: "The Cosmic Dreamer",
            dominantVibe: "Awe & Transcendent Wonder",
            recentTitles: ["Interstellar", "Arrival", "Blade Runner 2049"],
            dopamine: 78,
            atmosphere: 98,
            depth: 96
        },
        comfort: {
            icon: "🌿",
            mood: "Sanctuary & Wholesome Healing",
            confidence: 94,
            status: "High Emotional Nourishment & Catharsis",
            description: "Your viewing pattern shows an active search for hand-drawn beauty, comforting domestic intimacy, and gentle escapism that heals mental fatigue.",
            persona: "The Nostalgic Sanctuary Keeper",
            dominantVibe: "Warmth & Pure Tenderness",
            recentTitles: ["Spirited Away", "Past Lives", "My Neighbor Totoro"],
            dopamine: 85,
            atmosphere: 92,
            depth: 88
        },
        dopamine: {
            icon: "⚡",
            mood: "Adrenaline & Mythological Thrill",
            confidence: 91,
            status: "High Kinetic Drive & Epic Scale",
            description: "You are craving dense world-building, massive IMAX percussion, and pulse-raising narrative conflicts with high cinematic velocity.",
            persona: "The Mythic Seeker",
            dominantVibe: "Intensity & Grand Spectacle",
            recentTitles: ["Dune: Part Two", "Oppenheimer", "The Batman"],
            dopamine: 96,
            atmosphere: 94,
            depth: 82
        }
    };

    // ── Interactive Widget 4: Real FeedCard Replica ──
    const [feedLiked, setFeedLiked] = useState(false);
    const [feedLikes, setFeedLikes] = useState(48);

    // ── PWA & Scroll Hooks ──
    useEffect(() => {
        const handleBeforeInstall = () => setIsInstallReady(true);
        const handleAppInstalled = () => { setIsInstalled(true); setIsInstallReady(false); };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        if (isStandalone) setIsInstalled(true);

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
        const handler = () => setNavSolid(window.scrollY > 40);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Reveal references
    const heroReveal = useReveal(0.04);
    const androidReveal = useReveal(0.08);
    const suggestionSectionReveal = useReveal(0.08);
    const stacksSectionReveal = useReveal(0.08);
    const mindLensSectionReveal = useReveal(0.08);
    const feedSectionReveal = useReveal(0.08);
    const openSourceReveal = useReveal(0.08);
    const ctaReveal = useReveal(0.1);

    const activeFriend = friendProfiles[selectedFriend];
    const topStackMovie = currentStack[0];
    const activeMoodData = mindLensData[mindLensMood];

    return (
        <div className="min-h-screen bg-[#FFF9F0] text-stone-900 font-sans overflow-x-hidden selection:bg-[#ffb700] selection:text-stone-900">
            
            {/* Custom Animations & Material Symbols */}
            <style>{`
                @keyframes float-gentle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                @keyframes marquee-l { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-r { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                @keyframes pulse-soft { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(0.98); } }
                
                .anim-float { animation: float-gentle 6s ease-in-out infinite; }
                .marquee-left { animation: marquee-l 50s linear infinite; }
                .marquee-right { animation: marquee-r 50s linear infinite; }
                .pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }

                .lp-reveal { opacity: 0; transform: translateY(28px); transition: all 0.75s cubic-bezier(0.16, 1, 0.3, 1); }
                .lp-reveal.is-visible { opacity: 1; transform: translateY(0); }

                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    display: inline-block;
                    line-height: 1;
                }
            `}</style>

            {/* ── Top Navigation Bar ───────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? 'bg-[#FFF9F0]/95 backdrop-blur-md shadow-sm border-b border-amber-200/80 py-3.5' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full flex items-center justify-between">
                    <Link to="/watch-hive" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-amber-300/80 p-2 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-black tracking-tight text-stone-900">WatchersHive</span>
                            <span className="text-[10px] font-extrabold text-amber-800 tracking-wider uppercase -mt-1 hidden sm:block">A Community of Watchers</span>
                        </div>
                    </Link>
                    
                    {/* Preserved center space for future top-level routes */}
                    <div className="hidden lg:flex items-center gap-8 font-extrabold text-sm text-stone-700">
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link to="/watch-hive/login" className="text-xs sm:text-sm font-extrabold text-stone-800 hover:text-amber-600 transition-colors px-2 py-1.5">
                            Sign In
                        </Link>
                        <Link to="/watch-hive/signup" className="bg-[#ffb700] hover:bg-amber-400 text-stone-900 text-xs sm:text-sm font-black tracking-wide px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                            Join Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ───────────────────────────────────── */}
            <section className={`relative pt-32 pb-20 md:pt-44 md:pb-28 px-4 sm:px-6 md:px-8 overflow-hidden flex flex-col items-center text-center w-full lp-reveal ${heroReveal.visible ? 'is-visible' : ''}`} ref={heroReveal.ref}>
                {/* Honey Aura Radial Gradient */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[550px] bg-gradient-to-b from-[#ffb700]/25 via-amber-200/20 to-transparent blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                {/* Subtitle Badge */}
                <div className="inline-flex items-center gap-2.5 bg-white border border-amber-300/80 px-4 py-2 rounded-full shadow-xs mb-6 z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">A Social Hive For True Cinephiles • 100% Open Source</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-stone-950 max-w-5xl mx-auto leading-[1.08] mb-6 z-10">
                    Cinema Is Better Shared.<br />
                    <span className="bg-gradient-to-r from-amber-600 via-[#e59700] to-amber-500 bg-clip-text text-transparent">Suggest, Cheer & Connect.</span>
                </h1>

                {/* Narrative Subhead */}
                <p className="text-base sm:text-lg md:text-xl font-medium text-stone-700 max-w-3xl mx-auto mb-10 z-10 leading-relaxed">
                    Stop letting cold commercial algorithms dictate what you watch. WatchersHive is built as a warm collective where friends trade heartfelt recommendations with personal notes, see whose taste actually impacts their lives, and curate their personal <strong className="text-stone-900 font-black">Movie Experience Report Cards</strong>.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg justify-center z-20 mb-12">
                    <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-[#ffb700] hover:bg-amber-400 text-stone-950 text-base font-black tracking-wide px-8 py-4 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
                        <span>Enter the Watchers Hive</span>
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>

                    <a 
                        href="#android-launch"
                        className="w-full sm:w-auto bg-white border border-amber-300 hover:border-amber-500 text-amber-900 text-base font-extrabold px-6 py-4 rounded-2xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                        <span className="material-symbols-outlined text-[20px] text-emerald-600">android</span>
                        <span>Android App Launch</span>
                    </a>
                </div>

                {/* Android App Launch Announcement Banner (Joyful & Professional) */}
                <div id="android-launch" className={`w-full max-w-5xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-xl mb-16 text-left relative overflow-hidden lp-reveal ${androidReveal.visible ? 'is-visible' : ''}`} ref={androidReveal.ref}>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ffb700]/15 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="bg-emerald-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    <span>Play Store Internal Testing</span>
                                </span>
                                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                                    Flutter v1.0.33+34 Ready
                                </span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                WatchersHive for Android — Launching Soon!
                            </h3>
                            <p className="text-sm text-stone-300 font-medium max-w-2xl leading-relaxed">
                                Experience buttery 60/120 FPS native performance, offline theater mode with local SQLite queuing (rate & log even with zero cellular bars in the cinema), and seamless background synchronization.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                            <button
                                onClick={handleInstall}
                                className="bg-[#ffb700] hover:bg-amber-300 text-stone-950 font-black text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span>{isInstalled ? 'PWA Ready on Device' : 'Install PWA Today'}</span>
                            </button>
                            <Link
                                to="/watch-hive/support"
                                className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all text-center"
                            >
                                Request Tester Access
                            </Link>
                        </div>
                    </div>

                    {showInstallHint && !isInstallReady && !isInstalled && (
                        <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-2xl p-4 text-xs text-stone-200">
                            <span className="font-bold text-amber-300 block mb-1">How to Install on Mobile & Desktop:</span>
                            <p className="text-stone-300">iOS Safari: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. Android / Chrome: Tap <strong>Menu (⋮)</strong> → <strong>Install app</strong>.</p>
                        </div>
                    )}
                </div>

                {/* ── Marquee Poster Reel ─────────────────────────────── */}
                <div className="w-full overflow-hidden py-4 border-y border-amber-200/80 bg-white/70 backdrop-blur-xs mb-16 space-y-3">
                    <div className="flex w-[200%] marquee-left">
                        {[...POSTER_ROW_1, ...POSTER_ROW_1].map((p, i) => (
                            <div key={i} className="w-[120px] sm:w-[150px] md:w-[170px] shrink-0 px-2">
                                <div className="aspect-[2/3] w-full bg-stone-900 rounded-xl overflow-hidden shadow-xs border border-amber-300/40 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                        <span className="text-white text-[11px] font-black leading-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex w-[200%] marquee-right">
                        {[...POSTER_ROW_2, ...POSTER_ROW_2].map((p, i) => (
                            <div key={i} className="w-[120px] sm:w-[150px] md:w-[170px] shrink-0 px-2">
                                <div className="aspect-[2/3] w-full bg-stone-900 rounded-xl overflow-hidden shadow-xs border border-amber-300/40 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                        <span className="text-white text-[11px] font-black leading-tight">{p.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </section>

            {/* ── Section 1: Direct Suggestions & Suggester Impact (Accurate SuggestionCard Replica) ── */}
            <section id="suggestions" className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto lp-reveal ${suggestionSectionReveal.visible ? 'is-visible' : ''}`} ref={suggestionSectionReveal.ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full inline-block border border-amber-300 mb-3">
                        Word of Mouth
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight mb-4">
                        Recommendations from People Who Actually Know You.
                    </h2>
                    <p className="text-base sm:text-lg text-stone-700 font-medium leading-relaxed">
                        Stop letting cold corporate algorithms guess what you should watch next. Your friends know your taste best. Receive handpicked movie suggestions with heartfelt personal notes — and discover whose recommendations never miss.
                    </p>
                </div>

                {/* Interactive Showcase */}
                <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-amber-200/90 shadow-[0_12px_40px_rgba(255,183,0,0.08)] text-left">
                    
                    {/* Top Switcher for Friends */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full inline-block mb-1">
                                Try It Live
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-stone-950">
                                A Note Waiting Just For You
                            </h3>
                            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
                                Select a friend below to see how recommendations feel when they land in your Hive:
                            </p>
                        </div>

                        <div className="flex bg-[#FFF9F0] p-1.5 rounded-2xl border border-amber-300/80 w-full sm:w-auto">
                            {(['maya', 'karan', 'elena'] as const).map(friendKey => (
                                <button
                                    key={friendKey}
                                    onClick={() => setSelectedFriend(friendKey)}
                                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 capitalize ${selectedFriend === friendKey ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                    <img src={friendProfiles[friendKey].avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    <span>{friendProfiles[friendKey].name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accurate SuggestionCard Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
                        
                        {/* The Actual SuggestionCard (5 cols) */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="w-full max-w-sm bg-white rounded-3xl border border-amber-300/80 overflow-hidden shadow-md flex flex-col">
                                {/* Poster Wrapper */}
                                <div className="aspect-[2/3] relative overflow-hidden bg-stone-900">
                                    <img 
                                        src={`${TMDB_IMG}/w342${activeFriend.poster}`} 
                                        alt={activeFriend.movieTitle} 
                                        className="w-full h-full object-cover" 
                                    />
                                    {/* Real Yellow Badge */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="bg-[#ffb700] text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                                            Suggested
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1">
                                        <span className="material-symbols-outlined text-amber-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span>{activeFriend.rating}</span>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 flex flex-col flex-1 gap-2 text-left">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-base font-black text-stone-900 truncate">
                                            {activeFriend.movieTitle}
                                        </h4>
                                        <span className="text-xs font-bold text-stone-500">({activeFriend.year})</span>
                                    </div>
                                    
                                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                                        {activeFriend.overview}
                                    </p>

                                    {/* Recommendation Comment Box (Exact Web App Style) */}
                                    <div className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-stone-900 text-xs leading-relaxed shadow-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">format_quote</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="italic text-stone-800 line-clamp-3 font-medium">
                                                    "{activeFriend.personalNote}"
                                                </p>
                                                <div className="flex items-center justify-between gap-1 mt-2">
                                                    <span className="text-[11px] font-black text-amber-900">
                                                        — @{activeFriend.username}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        To Cheer You Up
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Footer: From your Hive */}
                                    <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 block">
                                                From Your Hive
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <img src={activeFriend.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-amber-300" />
                                                <span className="text-xs font-black text-stone-800">@{activeFriend.username}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    const nextStatus = suggestionStatus[selectedFriend] === 'watchlist' ? 'idle' : 'watchlist';
                                                    setSuggestionStatus(prev => ({ ...prev, [selectedFriend]: nextStatus }));
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${suggestionStatus[selectedFriend] === 'watchlist' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}
                                            >
                                                <span className="material-symbols-outlined text-[15px]">
                                                    {suggestionStatus[selectedFriend] === 'watchlist' ? 'done' : 'bookmark_add'}
                                                </span>
                                                <span>{suggestionStatus[selectedFriend] === 'watchlist' ? 'In Watchlist' : 'Watchlist'}</span>
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Suggester Impact Report Card & Cheer Actions (7 cols) */}
                        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={activeFriend.avatarUrl} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-lg text-stone-900">{activeFriend.name}</h4>
                                            <span className="text-xs font-bold text-stone-500">@{activeFriend.username}</span>
                                        </div>
                                        <p className="text-xs font-extrabold text-amber-800">{activeFriend.role}</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                            Friend Taste Chemistry
                                         </span>
                                        <span className="text-xs font-black bg-white px-3 py-1 rounded-full border border-amber-300 text-amber-800">
                                            {activeFriend.tag}
                                        </span>
                                    </div>

                                    <p className="text-sm text-stone-700 font-medium leading-relaxed">
                                        WatchersHive keeps track of whose recommendations you enjoy most. No more wondering whose taste aligns with yours — see your circle's hit rate at a glance.
                                    </p>

                                    {/* 3 Metrics */}
                                    <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                                        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">Taste Match</span>
                                            <span className="text-2xl font-black text-emerald-600">{activeFriend.resonanceScore}%</span>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">Watched & Loved</span>
                                            <span className="text-2xl font-black text-stone-900">{activeFriend.suggestionsWatched} / {activeFriend.suggestionsSent}</span>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">All-Time Favorites</span>
                                            <span className="text-2xl font-black text-amber-700">#{activeFriend.topStacked} Films</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cheer Up Button & Interactive Response */}
                            <div className="p-5 bg-white rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs font-black text-stone-900 block">Say thanks to your friend</span>
                                    <span className="text-xs text-stone-600 font-medium">Send a quick buzz to let them know their pick hit the spot.</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setFriendCheers(prev => ({ ...prev, [selectedFriend]: prev[selectedFriend] + 1 }));
                                            setCheerNotice(`🐝 Cheered ${activeFriend.name.split(' ')[0]} with a Hive Buzz!`);
                                            setTimeout(() => setCheerNotice(null), 2000);
                                        }}
                                        className="bg-[#ffb700] hover:bg-amber-400 text-stone-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                        <span>Send Cheer ({friendCheers[selectedFriend]})</span>
                                    </button>
                                </div>
                            </div>

                            {cheerNotice && (
                                <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-xs font-black text-amber-900 text-center animate-pulse">
                                    {cheerNotice}
                                </div>
                            )}

                        </div>

                    </div>
                </div>
            </section>

            {/* ── Section 2: Cinematic Stacks (Movie Experience Report Cards) ── */}
            <section id="stacks" className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 bg-white border-y border-amber-200/80 lp-reveal ${stacksSectionReveal.visible ? 'is-visible' : ''}`} ref={stacksSectionReveal.ref}>
                <div className="max-w-7xl mx-auto">
                    
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full inline-block border border-amber-300 mb-3">
                            Beyond Star Ratings
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight mb-4">
                            Your Movie Journey, Told as a Personal Story.
                        </h2>
                        <p className="text-base sm:text-lg text-stone-700 font-medium leading-relaxed">
                            A sterile 5-star rating or decimal number can't explain how a movie changed you. Cinematic Stacks are your living, curated collections: rank the stories that reshaped your perspective, the comfort watches you replay on rainy nights, and the films you'll cherish forever.
                        </p>
                    </div>

                    {/* Stacks Interactive Sandbox */}
                    <div className="bg-[#FFF9F0] rounded-[36px] p-6 sm:p-10 border border-amber-300/80 shadow-lg text-left">
                        
                        {/* Stack Header & Switcher */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-amber-300/60 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-amber-300 inline-block mb-1">
                                    Click ▲ / ▼ to reorder
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-stone-950">
                                    Collection: {activeStackTheme === 'worldview' ? '"Films That Changed My Worldview"' : '"Sanctuary for a Tired Soul"'}
                                </h3>
                            </div>

                            <div className="flex bg-white p-1 rounded-2xl border border-amber-300">
                                <button
                                    onClick={() => setActiveStackTheme('worldview')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeStackTheme === 'worldview' ? 'bg-[#ffb700] text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                    Worldview Shifters
                                </button>
                                <button
                                    onClick={() => setActiveStackTheme('comfort')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeStackTheme === 'comfort' ? 'bg-[#ffb700] text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                    Soul Sanctuary
                                </button>
                            </div>
                        </div>

                        {/* Stack Items & Live Report Card Explanation */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                            
                            {/* Ranked Items (7 cols) */}
                            <div className="lg:col-span-7 space-y-3.5">
                                {currentStack.map((movie, index) => (
                                    <div 
                                        key={movie.id}
                                        className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${index === 0 ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-stone-200'}`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Stylized Rank Badge (#1, #2, #3) */}
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${index === 0 ? 'bg-[#ffb700] text-stone-950 border-amber-400 shadow-xs' : 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                                                    #{index + 1}
                                                </div>

                                                {/* 64x96 Poster wrap */}
                                                <div className="w-12 h-18 rounded-lg overflow-hidden shrink-0 shadow-xs bg-stone-900 border border-stone-200">
                                                    <img src={`${TMDB_IMG}/w92${movie.path}`} alt="" className="w-full h-full object-cover" />
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-sm sm:text-base text-stone-950 truncate">{movie.title}</h4>
                                                        <span className="text-xs font-bold text-stone-500 shrink-0">({movie.year})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                                            ★ {movie.rating}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-stone-500 uppercase">{movie.genre}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reorder Buttons */}
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <button
                                                    onClick={() => moveStackItem(index, 'up')}
                                                    disabled={index === 0}
                                                    aria-label="Move item up"
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border transition-all ${index === 0 ? 'text-stone-300 border-stone-200 bg-stone-50 cursor-not-allowed' : 'bg-white text-stone-900 border-amber-300 hover:bg-[#ffb700]'}`}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    onClick={() => moveStackItem(index, 'down')}
                                                    disabled={index === currentStack.length - 1}
                                                    aria-label="Move item down"
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border transition-all ${index === currentStack.length - 1 ? 'text-stone-300 border-stone-200 bg-stone-50 cursor-not-allowed' : 'bg-white text-stone-900 border-amber-300 hover:bg-[#ffb700]'}`}
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-stone-700 font-medium mt-3 pl-3 sm:pl-11 border-l-2 border-amber-400 italic">
                                            "{movie.reflection}"
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Report Card Meaning Analysis (5 cols) */}
                            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-amber-300/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-amber-600">badge</span>
                                        <h4 className="font-black text-xs text-amber-900 uppercase tracking-widest">
                                            What Your Stack Says
                                        </h4>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5">
                                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                                            Top Pick In This Collection
                                        </span>
                                        <h5 className="font-black text-lg text-stone-950 mb-1">
                                            {topStackMovie.title} takes the crown
                                        </h5>
                                        <p className="text-xs text-stone-700 font-medium leading-relaxed">
                                            Placing <strong>{topStackMovie.title}</strong> at #1 shows your love for <strong className="text-amber-900">{topStackMovie.emotionalTone}</strong>. Anyone viewing your profile gets an instant glimpse into the kind of stories that move you.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs pb-2.5 border-b border-stone-200">
                                            <span className="font-bold text-stone-600">Emotional Vibe</span>
                                            <span className="font-black text-emerald-700">{topStackMovie.impactTier}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pb-2.5 border-b border-stone-200">
                                            <span className="font-bold text-stone-600">Shared Taste</span>
                                            <span className="font-black text-stone-900">Loved by 1.4k Members</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-stone-600">Collection Purpose</span>
                                            <span className="font-black text-amber-900">Personal Favorites</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-stone-200">
                                    <p className="text-xs text-stone-600 font-medium leading-relaxed">
                                        💡 Your stacks aren't a scoreboard. They are a personal celebration of the movies you cherish and the memories tied to them.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </section>

            {/* ── Section 3: MindLens Psychological Analytics (Accurate MindLensView Replica) ── */}
            <section id="mindlens" className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto lp-reveal ${mindLensSectionReveal.visible ? 'is-visible' : ''}`} ref={mindLensSectionReveal.ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full inline-block border border-amber-300 mb-3">
                        AI For Self-Discovery
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight mb-4">
                        Discover What Your Movie Habits Say About You.
                    </h2>
                    <p className="text-base sm:text-lg text-stone-700 font-medium leading-relaxed">
                        Ever wonder why you crave quiet, slow dramas on Sunday evenings or intense thrillers after a chaotic week? MindLens looks at the emotional rhythm of what you watch to reveal your cinephile persona, your mood patterns, and the feelings you seek out most.
                    </p>
                </div>

                {/* MindLens Interactive Sandbox */}
                <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-amber-200/90 shadow-lg text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full inline-block mb-1">
                                Interactive Preview
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-stone-950">
                                Your Mood Patterns & Persona
                            </h3>
                        </div>

                        {/* Mood Matrix Toggle */}
                        <div className="flex bg-[#FFF9F0] p-1.5 rounded-2xl border border-amber-300 w-full sm:w-auto">
                            {(['existential', 'comfort', 'dopamine'] as const).map(moodKey => (
                                <button
                                    key={moodKey}
                                    onClick={() => setMindLensMood(moodKey)}
                                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${mindLensMood === moodKey ? 'bg-white text-stone-950 shadow-xs border border-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                    {moodKey === 'existential' ? 'Deep & Thoughtful' : moodKey === 'comfort' ? 'Warm & Comforting' : 'High Adrenaline'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accurate MindLens Highlights Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-stretch">
                        
                        {/* Predicted Mood Card (8 cols) */}
                        <div className="lg:col-span-8 bg-[#FFF9F0] rounded-3xl p-6 sm:p-8 border border-amber-300/80 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-300">
                                        <span className="text-lg">{activeMoodData.icon}</span>
                                        <span className="text-xs font-black uppercase tracking-wider text-amber-900">Current Vibe</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>{activeMoodData.confidence}% Confidence</span>
                                    </div>
                                </div>

                                <h4 className="text-2xl sm:text-3xl font-black text-stone-950 mb-1">
                                    {activeMoodData.mood}
                                </h4>
                                <span className="text-xs font-black text-amber-900 uppercase tracking-widest block mb-4">
                                    Status: {activeMoodData.status}
                                </span>

                                <p className="text-sm text-stone-700 font-medium leading-relaxed mb-6">
                                    {activeMoodData.description}
                                </p>
                            </div>

                            {/* Trigger Titles */}
                            <div className="pt-4 border-t border-amber-300/60">
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
                                    Recent Movies Shaping This Vibe
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {activeMoodData.recentTitles.map((title, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-amber-200 text-xs font-bold text-stone-800 rounded-xl">
                                            🎬 {title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Soul Persona Card (4 cols) */}
                        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 flex flex-col justify-between text-center items-center">
                            <div className="w-full flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full p-1 mb-4 shadow-sm bg-gradient-to-tr from-amber-400 to-[#ffb700]">
                                    <div className="w-full h-full rounded-full bg-[#FFF9F0] flex items-center justify-center text-3xl border-2 border-white">
                                        {activeMoodData.icon}
                                    </div>
                                </div>

                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">
                                    Your Film Persona
                                </span>
                                <h4 className="text-xl font-black text-stone-950 mb-2">
                                    {activeMoodData.persona}
                                </h4>
                                <p className="text-xs text-stone-600 font-medium leading-relaxed mb-4">
                                    Dominant Vibe: <strong>{activeMoodData.dominantVibe}</strong>
                                </p>
                            </div>

                            {/* Trait Meters */}
                            <div className="w-full space-y-2.5 pt-4 border-t border-stone-200 text-left">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold text-stone-700 mb-1">
                                        <span>Visual & Sound Immersion</span>
                                        <span>{activeMoodData.atmosphere}%</span>
                                    </div>
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${activeMoodData.atmosphere}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold text-stone-700 mb-1">
                                        <span>Emotional & Mental Depth</span>
                                        <span>{activeMoodData.depth}%</span>
                                    </div>
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${activeMoodData.depth}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Section 4: Pure Community Feed ─────────────────── */}
            <section className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 bg-white border-t border-amber-200/80 lp-reveal ${feedSectionReveal.visible ? 'is-visible' : ''}`} ref={feedSectionReveal.ref}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full inline-block border border-amber-300 mb-3">
                            Pure Community
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight mb-4">
                            Real Conversations with Real Film Lovers.
                        </h2>
                        <p className="text-base sm:text-lg text-stone-700 font-medium leading-relaxed">
                            A calm, ad-free social feed where friends share heartfelt reactions. See what people in your circle are watching, exchange thoughts, and talk about cinema that moves you.
                        </p>
                    </div>

                    {/* FeedCard Replica Box */}
                    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-md text-left">
                        {/* Feed Card Header */}
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#ffb700] ring-offset-2 shrink-0">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-black text-stone-900">Sarah Jenkins</span>
                                    <span className="text-xs text-stone-500 font-semibold">@sarah_cine</span>
                                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">reviewed</span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">Dune: Part Two • 2 hours ago</span>
                            </div>
                        </div>

                        {/* Review Body */}
                        <div className="bg-[#FFF9F0] border border-amber-200/80 rounded-2xl p-4.5 mb-4 space-y-2">
                            <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                ))}
                                <span className="text-xs font-black text-stone-800 ml-1.5">5.0 / 5.0</span>
                            </div>
                            <p className="text-sm text-stone-800 font-medium leading-relaxed italic">
                                "Visually staggering and sonically earth-shaking. Denis Villeneuve took Herbert's dense mythology and made it breathe with primal energy in IMAX. Easily one of the defining science fiction experiences of this century."
                            </p>
                        </div>

                        {/* Micro-Interaction Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs font-bold text-stone-600">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setFeedLiked(!feedLiked);
                                        setFeedLikes(prev => feedLiked ? prev - 1 : prev + 1);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${feedLiked ? 'bg-amber-100 text-amber-900 font-black' : 'hover:text-amber-600'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: feedLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                    <span>{feedLikes} Buzzes</span>
                                </button>
                                <span className="flex items-center gap-1.5 hover:text-amber-600 cursor-pointer">
                                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                                    <span>14 Comments</span>
                                </span>
                            </div>
                            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                <span>Verified Watch</span>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 5: Open Source & Community First ─────────── */}
            <section id="open-source" className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto lp-reveal ${openSourceReveal.visible ? 'is-visible' : ''}`} ref={openSourceReveal.ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full inline-block border border-amber-300 mb-3">
                        100% Free & Open
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight mb-4">
                        Built for Film Lovers. Not Wall Street.
                    </h2>
                    <p className="text-base sm:text-lg text-stone-700 font-medium leading-relaxed">
                        No corporate paywalls, tracking pixels, or algorithmic tricks. WatchersHive is community-powered and open source — designed to serve cinema enthusiasts, forever.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <a 
                        href="https://github.com/dasamantaraoaditya/WatchHive-Frontend"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white p-7 rounded-3xl border border-amber-300/80 shadow-xs hover:border-amber-500 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                                    <span className="material-symbols-outlined text-[22px]">laptop</span>
                                </div>
                                <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Web & Desktop</span>
                            </div>
                            <h4 className="text-lg font-black text-stone-950 mb-1 group-hover:text-amber-600 transition-colors">
                                Fast Everywhere
                            </h4>
                            <p className="text-xs text-stone-600 font-medium leading-relaxed">
                                Access your watchlist anywhere. Instantly responsive, works offline on your laptop or tablet, and installs like a native app.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs font-black text-amber-900">
                            <span>Explore Web Project</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
                    </a>

                    <a 
                        href="https://github.com/dasamantaraoaditya/WatchHive-Mobile"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white p-7 rounded-3xl border border-amber-300/80 shadow-xs hover:border-amber-500 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-emerald-700">
                                    <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Mobile Companion</span>
                            </div>
                            <h4 className="text-lg font-black text-stone-950 mb-1 group-hover:text-amber-600 transition-colors">
                                Movies In Your Pocket
                            </h4>
                            <p className="text-xs text-stone-600 font-medium leading-relaxed">
                                Log movies straight from the theater seat. Smooth animations, instant offline logging, and home-screen widgets for Android & iOS.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs font-black text-amber-900">
                            <span>Explore Mobile App</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
                    </a>

                    <a 
                        href="https://github.com/dasamantaraoaditya/WatchHive-Backend"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white p-7 rounded-3xl border border-amber-300/80 shadow-xs hover:border-amber-500 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-blue-700">
                                    <span className="material-symbols-outlined text-[22px]">lock_open</span>
                                </div>
                                <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Transparent & Private</span>
                            </div>
                            <h4 className="text-lg font-black text-stone-950 mb-1 group-hover:text-amber-600 transition-colors">
                                Your Movie Life Stays Yours
                            </h4>
                            <p className="text-xs text-stone-600 font-medium leading-relaxed">
                                No algorithmic manipulation, no data harvesting for ad networks. 100% open-source code built purely for the love of film.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs font-black text-amber-900">
                            <span>Explore Core Platform</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
                    </a>
                </div>
            </section>

            {/* ── Final Call to Action ───────────────────────────── */}
            <section className={`py-20 md:py-28 px-4 sm:px-6 md:px-8 text-center lp-reveal ${ctaReveal.visible ? 'is-visible' : ''}`} ref={ctaReveal.ref}>
                <div className="bg-gradient-to-r from-amber-500 via-[#ffb700] to-amber-600 rounded-[44px] py-16 sm:py-20 px-6 max-w-5xl mx-auto shadow-xl relative overflow-hidden text-stone-950">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-4 shadow-md border border-white/80 mb-6">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-stone-950">
                            Step into the Hive Today.
                        </h2>
                        <p className="text-base sm:text-xl font-bold text-stone-900/90 mb-10 max-w-xl mx-auto leading-relaxed">
                            Join a joyful community of watchers. Suggest cinema that heals your friends, track your journey offline, and build your Movie Experience Report Card.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-stone-950 text-white text-base font-black px-10 py-5 rounded-2xl shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all">
                                Create Free Account
                            </Link>
                            <a 
                                href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto bg-white text-stone-950 text-base font-black px-8 py-5 rounded-2xl shadow-xs hover:bg-stone-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Star on GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="bg-white border-t border-amber-200/80 py-12 px-4 sm:px-6 md:px-8 text-left">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF9F0] border border-amber-300 p-1 flex items-center justify-center">
                            <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <span className="font-black text-stone-950 text-lg tracking-tight block">WatchersHive</span>
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">A Community of Watchers</span>
                        </div>
                    </div>
                    
                    <p className="text-xs font-medium text-stone-500 text-center md:text-left">
                        © 2026 WatchersHive. Crafted for true cinephiles worldwide. Open source & ad-free.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-xs font-black text-stone-700">
                        <Link to="/watch-hive/login" className="hover:text-amber-600 transition-colors">Sign In</Link>
                        <Link to="/watch-hive/signup" className="hover:text-amber-600 transition-colors">Sign Up</Link>
                        <Link to="/watch-hive/support" className="hover:text-amber-600 transition-colors">Support</Link>
                        <Link to="/watch-hive/privacy" className="hover:text-amber-600 transition-colors">Privacy Policy</Link>
                        <a 
                            href="https://github.com/dasamantaraoaditya/WatchHive-Frontend" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-amber-600 transition-colors flex items-center gap-1"
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
