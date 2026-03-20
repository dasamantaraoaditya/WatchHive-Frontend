import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import whLogo from '../assets/images/watchhive-logo.png';

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

/* ── Feature showcase data ── */
const showcaseFeatures = [
    { icon: 'search', title: 'Instant Discoveries', desc: 'TMDb-powered search pulls any movie or series to your fingertips in milliseconds.' },
    { icon: 'star_rate', title: 'Personal Ratings', desc: 'Log exact star ratings, dates, and locations to build your ultimate cinema diary.' },
    { icon: 'forum', title: 'Hive Discussion', desc: 'Dive into reviews, comment on friends\' entries, and find like-minded cinephiles.' },
    { icon: 'apps', title: 'Stunning Grids', desc: 'View your watch history laid out in beautiful, infinite glassmorphism posters.' },
    { icon: 'playlist_add_check', title: 'Watchlists', desc: 'Save what to watch next and build queues spanning genres and decades.' },
    { icon: 'label', title: 'Custom Tags', desc: 'Invent your own tags to group and organize films creatively.' },
];

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
    const [scrollY, setScrollY] = useState(0);
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        const handler = () => {
            setScrollY(window.scrollY);
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const posterReveal = useReveal(0.1);
    const featureReveal = useReveal(0.1);
    const showcaseReveal = useReveal(0.15);
    const ctaReveal = useReveal(0.2);

    return (
        <div className="min-h-screen bg-[#FFF9F0] text-[#2D2926] font-sans overflow-x-hidden selection:bg-[#ffb700] selection:text-white">
            
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? 'bg-[#FFF9F0]/90 backdrop-blur-md shadow-sm border-b border-[#ffb700]/10 py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl md:mx-auto px-6 w-full flex items-center justify-between">
                    <Link to="/watch-hive" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-all ${navSolid ? 'bg-white shadow-sm' : 'bg-white/80 backdrop-blur-md shadow-[0_4px_12px_rgba(255,183,0,0.15)] group-hover:bg-white'}`}>
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-[#2D2926]">WatchHive</span>
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8 font-bold text-[14px] text-[#2D2926]/70">
                        <a href="#features" className="hover:text-[#ffb700] transition-colors">Features</a>
                        <a href="#posters" className="hover:text-[#ffb700] transition-colors">Explore</a>
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
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex flex-col items-center text-center w-full min-h-[90vh]">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-gradient-to-b from-[#ffb700]/10 to-transparent blur-3xl rounded-full -z-10 opacity-60"></div>
                
                <div className="inline-flex items-center gap-2 bg-white border border-[#ffb700]/20 px-4 py-1.5 rounded-full shadow-sm mb-8 z-10 animate-[fadeInDown_0.6s_ease-out_forwards]">
                    <span className="w-2 h-2 rounded-full bg-[#ffb700] animate-pulse"></span>
                    <span className="text-[12px] font-bold text-[#2D2926] uppercase tracking-wider">Now Showing Everywhere</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#2D2926] max-w-4xl mx-auto leading-[1.1] mb-6 z-10">
                    Your Cinema.<br />
                    <span className="bg-gradient-to-r from-[#ffb700] to-amber-500 bg-clip-text text-transparent">Your Story.</span>
                </h1>

                <p className="text-lg md:text-xl font-medium text-[#2D2926]/60 max-w-2xl mx-auto mb-10 z-10">
                    Track every movie, rate every episode, build stunning poster grids, and share your cinematic journey with a network of fellow cinephiles.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 z-20">
                    <Link to="/watch-hive/signup" className="w-full sm:w-auto bg-[#ffb700] text-white text-[16px] font-black tracking-wide px-8 py-4 rounded-2xl shadow-[0_4px_14px_rgba(255,183,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,183,0,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                        Start Watching
                        <span className="material-symbols-outlined text-[20px]">movie</span>
                    </Link>
                    <a href="#posters" className="w-full sm:w-auto bg-white border border-[#ffb700]/20 text-[#2D2926] text-[16px] font-black tracking-wide px-8 py-4 rounded-2xl hover:bg-[#FFF9F0] hover:border-[#ffb700]/40 transition-all flex items-center justify-center gap-2">
                        Explore Hive
                        <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                    </a>
                </div>

                {/* Floating Posters via Native CSS keyframes injection below */}
                <style>{`
                    @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } 100% { transform: translateY(0px) rotate(0deg); } }
                    @keyframes marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                    .animate-float-1 { animation: float 6s ease-in-out infinite; }
                    .animate-float-2 { animation: float 7s ease-in-out infinite 1s; }
                    .animate-float-3 { animation: float 8s ease-in-out infinite 2s; }
                    .animate-float-4 { animation: float 6.5s ease-in-out infinite 0.5s; }
                    .animate-marquee-l { animation: marquee-left 40s linear infinite; }
                    .animate-marquee-r { animation: marquee-right 40s linear infinite; }
                    .lp-reveal { opacity: 0; transform: translateY(40px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
                    .lp-reveal.is-visible { opacity: 1; transform: translateY(0); }
                `}</style>

                <div className="absolute top-1/2 left-0 right-0 h-full w-full pointer-events-none -z-10 opacity-30 sm:opacity-60 overflow-hidden">
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[0].path}`} className="absolute top-[10%] left-[5%] w-32 md:w-48 rounded-2xl shadow-2xl -rotate-6 animate-float-1 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[2].path}`} className="absolute top-[30%] right-[10%] w-28 md:w-44 rounded-2xl shadow-2xl rotate-6 animate-float-2 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[4].path}`} className="absolute bottom-[20%] left-[15%] w-24 md:w-40 rounded-2xl shadow-2xl -rotate-3 animate-float-3 border-4 border-white" alt=""/>
                    <img src={`${TMDB_IMG}/w342${SHOWCASE_POSTERS[10].path}`} className="absolute bottom-[30%] right-[20%] w-32 md:w-48 rounded-2xl shadow-2xl rotate-3 animate-float-4 border-4 border-white" alt=""/>
                </div>
            </section>

            {/* Poster Marquees */}
            <section id="posters" className={`py-10 bg-white border-y border-[#ffb700]/10 overflow-hidden lp-reveal ${posterReveal.visible ? 'is-visible' : ''}`} ref={posterReveal.ref}>
                <div className="w-full flex justify-center mb-8 relative">
                    <div className="absolute left-0 w-1/3 h-px bg-gradient-to-r from-transparent to-[#ffb700]/30 top-1/2 -translate-y-1/2"></div>
                    <span className="bg-[#FFF9F0] text-[#ffb700] px-4 py-1.5 rounded-full font-black text-[12px] uppercase tracking-widest border border-[#ffb700]/30 shadow-sm z-10 relative">Trending Ecosystem</span>
                    <div className="absolute right-0 w-1/3 h-px bg-gradient-to-l from-transparent to-[#ffb700]/30 top-1/2 -translate-y-1/2"></div>
                </div>

                <div className="flex flex-col gap-6 transform -rotate-2 scale-105">
                    {/* Track 1 */}
                    <div className="flex w-[200%] animate-marquee-l">
                        {[...POSTER_ROW_1, ...POSTER_ROW_1, ...POSTER_ROW_1].map((p, i) => (
                            <div key={i} className="w-[140px] md:w-[200px] shrink-0 px-2 sm:px-3">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-xl overflow-hidden shadow-md border border-[#ffb700]/10 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Track 2 */}
                    <div className="flex w-[200%] animate-marquee-r">
                        {[...POSTER_ROW_2, ...POSTER_ROW_2, ...POSTER_ROW_2].map((p, i) => (
                            <div key={i} className="w-[140px] md:w-[200px] shrink-0 px-2 sm:px-3">
                                <div className="aspect-[2/3] w-full bg-[#FFF9F0] rounded-xl overflow-hidden shadow-md border border-[#ffb700]/10 relative group">
                                    <img src={`${TMDB_IMG}/w342${p.path}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className={`py-24 px-6 max-w-7xl mx-auto lp-reveal ${featureReveal.visible ? 'is-visible' : ''}`} ref={featureReveal.ref}>
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D2926] mb-4 tracking-tight">Everything a Cinephile Needs.</h2>
                    <p className="text-[#2D2926]/50 font-medium max-w-2xl mx-auto">No clutter, no friction. Just a gorgeous, lightning-fast platform built to chronicle your movie-watching life instantly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {showcaseFeatures.map((f, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-[#ffb700]/10 shadow-[0_8px_30px_rgba(255,183,0,0.04)] hover:shadow-[0_12px_40px_rgba(255,183,0,0.08)] hover:-translate-y-1 transition-all group">
                            <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 border border-[#ffb700]/20 group-hover:bg-[#ffb700] transition-colors">
                                <span className="material-symbols-outlined text-[28px] text-[#ffb700] group-hover:text-white transition-colors">{f.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#2D2926] mb-2">{f.title}</h3>
                            <p className="text-[#2D2926]/60 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* App Visual Showcase */}
            <section className={`py-20 px-6 max-w-7xl mx-auto my-12 bg-white rounded-[40px] border border-[#ffb700]/10 shadow-sm relative overflow-hidden lp-reveal ${showcaseReveal.visible ? 'is-visible' : ''}`} ref={showcaseReveal.ref}>
                <div className="absolute -right-64 -bottom-64 w-[600px] h-[600px] bg-[#ffb700]/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10 w-full">
                    {/* Interactive Poster Grid Graphic */}
                    <div className="flex-1 w-full grid grid-cols-3 gap-3 md:gap-4 p-4 md:p-8">
                        {SHOWCASE_POSTERS.slice(0, 6).map((p, i) => (
                            <div key={i} className={`aspect-[2/3] bg-[#FFF9F0] rounded-xl md:rounded-2xl overflow-hidden shadow-lg border-2 border-white relative transition-all hover:scale-105 ${i % 2 === 0 ? 'translate-y-8 md:translate-y-12' : ''}`}>
                                <img src={`${TMDB_IMG}/w342${p.path}`} alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-md rounded border border-white/50 shadow-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px] sm:text-[12px] text-[#ffb700]" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                                    <span className="text-[10px] sm:text-[12px] font-black text-[#2D2926]">{(7 + Math.random() * 2.5).toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 text-center lg:text-left">
                        <span className="inline-flex text-[12px] font-black tracking-widest uppercase text-[#ffb700] bg-[#FFF9F0] px-4 py-1.5 rounded-full border border-[#ffb700]/20 mb-6">Your Personal Museum</span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#2D2926] tracking-tight mb-6">
                            Every Title.<br />
                            <span className="text-[#ffb700]">Beautifully Tracked.</span>
                        </h2>
                        <p className="text-lg text-[#2D2926]/60 font-medium mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
                            WatchHive compiles your sprawling cinematic life into a singular, breathtaking profile grid. Never forget when or what you watched, down to the exact star rating.
                        </p>
                        <Link to="/watch-hive/signup" className="inline-flex items-center gap-2 text-[#ffb700] font-black text-lg hover:text-[#2D2926] transition-colors group">
                            <span>Start building yours</span>
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`py-32 px-6 text-center lp-reveal ${ctaReveal.visible ? 'is-visible' : ''}`} ref={ctaReveal.ref}>
                <div className="bg-[#ffb700] rounded-[40px] py-20 px-6 max-w-5xl mx-auto shadow-[0_20px_50px_rgba(255,183,0,0.3)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4 shadow-lg mb-8">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                            The Curtain is Raised.
                        </h2>
                        <p className="text-xl font-bold text-white/90 mb-10 max-w-xl mx-auto drop-shadow-sm">
                            Join the hive and start tracking your movies with absolute clarity and style.
                        </p>
                        <Link to="/watch-hive/signup" className="bg-white text-[#2D2926] text-xl font-black px-10 py-5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-[#ffb700]/10 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF9F0] border border-[#ffb700]/20 p-1.5 flex items-center justify-center">
                            <img src={whLogo} alt="WatchHive" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-[#2D2926] text-xl tracking-tight">WatchHive</span>
                    </div>
                    
                    <p className="text-[13px] font-bold text-[#2D2926]/40 text-center md:text-left">
                        © 2026 WatchHive. Crafted for true cinephiles.
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
