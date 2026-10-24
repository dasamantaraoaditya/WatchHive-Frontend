import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout';
import { useAuth } from '../contexts';
import whLogo from '../assets/images/watchhive-logo.png';

export type SupportCategory = 'bug' | 'movieData' | 'feature' | 'account' | 'other';

interface CategoryOption {
    id: SupportCategory;
    label: string;
    icon: string;
    badgeColor: string;
    placeholder: string;
}

const CATEGORIES: CategoryOption[] = [
    {
        id: 'bug',
        label: 'Bug / Glitch',
        icon: 'bug_report',
        badgeColor: 'text-rose-500 bg-rose-50 border-rose-200 hover:border-rose-400',
        placeholder: 'Describe what went wrong, what you expected, and steps to reproduce...',
    },
    {
        id: 'movieData',
        label: 'Movie / Data Issue',
        icon: 'movie_filter',
        badgeColor: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400',
        placeholder: 'Tell us the title, year, or TMDB link and what details need updating (poster, cast, title)...',
    },
    {
        id: 'feature',
        label: 'Feature Request',
        icon: 'lightbulb',
        badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400',
        placeholder: 'What feature or improvement would make WatchersHive even better for you?',
    },
    {
        id: 'account',
        label: 'Account & Login',
        icon: 'manage_accounts',
        badgeColor: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400',
        placeholder: 'Describe your login, Google OAuth, password reset, or profile issue...',
    },
    {
        id: 'other',
        label: 'General Feedback',
        icon: 'chat_bubble_outline',
        badgeColor: 'text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-400',
        placeholder: 'Share your thoughts, suggestions, or general questions with the team...',
    },
];

export const SUPPORT_EMAIL = 'watchershive@gmail.com';

export const SupportPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('bug');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
    const [showDiagnosticsDetails, setShowDiagnosticsDetails] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedReport, setCopiedReport] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    const activeCat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

    const getDiagnosticsText = (): string => {
        const isStandalone = typeof window !== 'undefined' && 
            (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
        const userStr = user ? `@${user.username} (ID: ${user.id})` : 'Unauthenticated Guest';
        const contactStr = email.trim() || (user?.email || 'Not provided');
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
        const screenStr = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} px` : 'Unknown';

        return `------------------------------------------------
App Diagnostics:
- App: WatchersHive Web (PWA: ${isStandalone ? 'Yes (Installed)' : 'No (Browser)'})
- URL: ${typeof window !== 'undefined' ? window.location.href : 'Web'}
- Screen Size: ${screenStr}
- Browser: ${userAgent}
- User: ${userStr}
- Contact Email: ${contactStr}
- Timestamp: ${new Date().toISOString()}
------------------------------------------------`;
    };

    const getFullReportText = (): string => {
        const sub = subject.trim() || `Support Request: ${activeCat.label}`;
        const msg = message.trim() || '(No details provided)';
        let report = `Subject: [WatchersHive] [${activeCat.label}] ${sub}\nCategory: ${activeCat.label}\n\nDetails / Description:\n${msg}\n\n`;
        if (includeDiagnostics) {
            report += getDiagnosticsText();
        }
        return report;
    };

    const handleSendMailto = () => {
        const sub = subject.trim() || `${activeCat.label} report`;
        const fullSubject = `[WatchersHive Support - ${activeCat.label}] ${sub}`;
        let body = message.trim() ? `${message.trim()}\n\n` : `Hi WatchersHive Team,\n\nI am reporting an issue regarding ${activeCat.label}.\n\n`;
        if (includeDiagnostics) {
            body += getDiagnosticsText();
        }

        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    };

    const handleOpenGmail = () => {
        const sub = subject.trim() || `${activeCat.label} report`;
        const fullSubject = `[WatchersHive Support - ${activeCat.label}] ${sub}`;
        let body = message.trim() ? `${message.trim()}\n\n` : `Hi WatchersHive Team,\n\nI am reporting an issue regarding ${activeCat.label}.\n\n`;
        if (includeDiagnostics) {
            body += getDiagnosticsText();
        }

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(SUPPORT_EMAIL);
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2500);
        } catch {
            // Fallback
        }
    };

    const handleCopyReport = async () => {
        try {
            await navigator.clipboard.writeText(getFullReportText());
            setCopiedReport(true);
            setTimeout(() => setCopiedReport(false), 2500);
        } catch {
            // Fallback
        }
    };

    const faqs = [
        {
            q: 'Missing movie poster or incorrect title / year?',
            a: 'WatchersHive syncs movie & TV metadata directly with TMDB. If a title was released very recently or has alternate regional titles, try searching with its official English title. Metadata typically refreshes within a few hours.',
        },
        {
            q: 'Trouble signing in with Google or Origin Mismatch?',
            a: 'If you encounter an OAuth origin error or popup blocker, ensure you are accessing https://www.watchershive.com. You can also sign in via email or set an account password using the "Forgot Password" link.',
        },
        {
            q: 'Where does imported watch history go?',
            a: 'Export and Import are processed directly into your private watch library and MindLens statistics. To protect followers\' feeds from notification floods, imported history is intentionally not published to the community feed.',
        },
        {
            q: 'How do I install WatchersHive as a standalone app?',
            a: 'On Chrome/Edge Desktop: click the install icon in the address bar or the "Install App" button in your account dropdown. On Safari iOS: tap Share → "Add to Home Screen". On Android Chrome: tap ⋮ → "Install app".',
        },
        {
            q: 'How do I suggest movies to friends in the hive?',
            a: 'Click the "+" quick action button in the bottom-right and select "Suggest to Friends", or select a friend in the "Recommended by a friend" section when logging a watch entry.',
        },
    ];

    return (
        <PageLayout maxWidth="3xl" className="font-sans">
            <div className="bg-white border border-black/5 rounded-[40px] p-6 sm:p-10 md:p-12 shadow-sm animate-slide-up">
                {/* Header Section */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#ffb700]/15 flex items-center justify-center p-2.5 border border-[#ffb700]/25 shadow-sm">
                                <img src={whLogo} alt="WatchersHive" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-[#2D2926] tracking-tight">Help & Support</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">We are here to help the hive</p>
                            </div>
                        </div>

                        {/* Direct Email Badge */}
                        <button
                            onClick={handleCopyEmail}
                            className="inline-flex items-center gap-2 bg-[#FFF9F0] border border-[#ffb700]/30 hover:border-[#ffb700] px-4 py-2 rounded-2xl transition-all cursor-pointer group shadow-2xs"
                            title="Click to copy email"
                        >
                            <span className="material-symbols-outlined text-[#ffb700] text-sm font-bold">mail</span>
                            <span className="text-xs font-black text-slate-800">{SUPPORT_EMAIL}</span>
                            <span className="material-symbols-outlined text-slate-400 text-xs group-hover:text-[#ffb700] transition-colors">
                                {copiedEmail ? 'check' : 'content_copy'}
                            </span>
                        </button>
                    </div>

                    <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xl">
                        Have an issue, bug to report, or an idea to improve WatchersHive? Fill out the details below to email us or copy your report directly.
                    </p>
                </header>

                {/* Step 1: Select Topic */}
                <section className="mb-6">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
                        1. Select Topic
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-[#ffb700] bg-[#FFF9F0] shadow-xs'
                                            : 'border-slate-100 bg-white hover:border-[#ffb700]/30 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-[#ffb700]' : 'text-slate-400'}`}>
                                        {cat.icon}
                                    </span>
                                    <span className={`text-xs font-black tracking-tight leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Step 2: Subject */}
                <section className="mb-5">
                    <label htmlFor="support-subject" className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-2">
                        2. Subject / Title
                    </label>
                    <input
                        id="support-subject"
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g., Cannot view movie poster in feed"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/30 focus:border-[#ffb700] transition-all"
                    />
                </section>

                {/* Step 3: Message / Description */}
                <section className="mb-5">
                    <label htmlFor="support-message" className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-2">
                        3. Description & Details
                    </label>
                    <textarea
                        id="support-message"
                        rows={4}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={activeCat.placeholder}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/30 focus:border-[#ffb700] transition-all resize-y"
                    />
                </section>

                {/* Step 4: Contact Email */}
                <section className="mb-6">
                    <label htmlFor="support-email" className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-2">
                        4. Your Contact Email
                    </label>
                    <input
                        id="support-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb700]/30 focus:border-[#ffb700] transition-all"
                    />
                </section>

                {/* Step 5: System Diagnostics Attachment */}
                <section className="mb-8 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-500 text-[22px]">devices</span>
                            <div>
                                <p className="text-xs font-black text-slate-800">Attach Technical Diagnostics</p>
                                <p className="text-[11px] font-medium text-slate-400">
                                    Includes browser, screen resolution, and user account handle for fast debugging.
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={includeDiagnostics}
                                onChange={e => setIncludeDiagnostics(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb700]"></div>
                        </label>
                    </div>

                    {includeDiagnostics && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => setShowDiagnosticsDetails(s => !s)}
                                className="text-[11px] font-bold text-[#b07d00] hover:text-[#8f6500] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {showDiagnosticsDetails ? 'expand_less' : 'expand_more'}
                                </span>
                                {showDiagnosticsDetails ? 'Hide technical summary' : 'Preview diagnostic payload'}
                            </button>

                            {showDiagnosticsDetails && (
                                <pre className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-mono text-slate-700 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                    {getDiagnosticsText()}
                                </pre>
                            )}
                        </div>
                    )}
                </section>

                {/* Primary & Secondary Action CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                    <button
                        onClick={handleSendMailto}
                        className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-[#ffb700] hover:bg-[#ffaa00] text-[#2D2926] font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-[#ffb700]/25 cursor-pointer active:scale-[0.99]"
                    >
                        <span className="material-symbols-outlined text-lg">outgoing_mail</span>
                        <span>Send via Email Client</span>
                    </button>

                    <button
                        onClick={handleOpenGmail}
                        className="flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-slate-200 hover:border-[#ffb700] text-slate-800 font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all cursor-pointer hover:bg-slate-50"
                        title="Open composed draft in Gmail Web"
                    >
                        <span className="material-symbols-outlined text-rose-500 text-lg">mail</span>
                        <span>Gmail Web</span>
                    </button>

                    <button
                        onClick={handleCopyReport}
                        className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all cursor-pointer"
                        title="Copy full report to clipboard"
                    >
                        <span className="material-symbols-outlined text-slate-500 text-lg">
                            {copiedReport ? 'check' : 'assignment'}
                        </span>
                        <span>{copiedReport ? 'Copied Report!' : 'Copy Report'}</span>
                    </button>
                </div>

                {/* Quick FAQ Section */}
                <section className="pt-8 border-t border-black/5">
                    <h3 className="text-lg font-black text-[#2D2926] tracking-tight mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffb700]">quiz</span>
                        Frequently Asked Questions
                    </h3>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => {
                            const isOpen = openFaqIndex === index;
                            return (
                                <div
                                    key={index}
                                    className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50 transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-left font-black text-xs sm:text-sm text-slate-800 hover:text-[#ffb700] transition-colors cursor-pointer"
                                    >
                                        <span className="pr-4">{faq.q}</span>
                                        <span className={`material-symbols-outlined text-slate-400 text-base transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#ffb700]' : ''}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/40 bg-white">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Unauthenticated helpful back link */}
                {!isAuthenticated && (
                    <div className="mt-8 text-center">
                        <Link to="/watch-hive/login" className="text-xs font-black text-[#ffb700] hover:underline uppercase tracking-widest">
                            ← Back to Sign In
                        </Link>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default SupportPage;
