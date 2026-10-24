import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../contexts';
import { SUPPORT_EMAIL, SupportCategory } from '../../pages/SupportPage';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: SupportCategory;
    initialSubject?: string;
    initialMessage?: string;
}

const CATEGORIES: { id: SupportCategory; label: string; icon: string; placeholder: string }[] = [
    { id: 'bug', label: 'Bug / Glitch', icon: 'bug_report', placeholder: 'Describe what went wrong and steps to reproduce...' },
    { id: 'movieData', label: 'Movie / Data Issue', icon: 'movie_filter', placeholder: 'Tell us the movie or show title and what data is incorrect...' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb', placeholder: 'What feature or improvement would you love to see in WatchersHive?' },
    { id: 'account', label: 'Account & Login', icon: 'manage_accounts', placeholder: 'Describe your account, OAuth, or profile issue...' },
    { id: 'other', label: 'Feedback / Other', icon: 'chat_bubble_outline', placeholder: 'Share any feedback or questions with the hive team...' },
];

export const SupportModal: React.FC<SupportModalProps> = ({
    isOpen,
    onClose,
    initialCategory = 'bug',
    initialSubject = '',
    initialMessage = '',
}) => {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<SupportCategory>(initialCategory);
    const [subject, setSubject] = useState(initialSubject);
    const [message, setMessage] = useState(initialMessage);
    const [email, setEmail] = useState('');
    const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedReport, setCopiedReport] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedCategory(initialCategory);
            setSubject(initialSubject);
            setMessage(initialMessage);
            if (user?.email) setEmail(user.email);
        }
    }, [isOpen, initialCategory, initialSubject, initialMessage, user]);

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
- App: WatchersHive Web (PWA: ${isStandalone ? 'Yes' : 'No'})
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
            setTimeout(() => setCopiedEmail(false), 2000);
        } catch {}
    };

    const handleCopyReport = async () => {
        try {
            await navigator.clipboard.writeText(getFullReportText());
            setCopiedReport(true);
            setTimeout(() => setCopiedReport(false), 2000);
        } catch {}
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Help & Support" maxWidth="max-w-xl">
            <div className="space-y-5 text-slate-800">
                {/* Email Banner */}
                <div className="flex items-center justify-between p-3.5 bg-[#FFF9F0] border border-[#ffb700]/30 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#ffb700] text-lg font-black">support_agent</span>
                        <div className="text-xs">
                            <span className="font-bold text-slate-500">Official Support: </span>
                            <span className="font-black text-slate-900">{SUPPORT_EMAIL}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-xs font-bold text-[#b07d00] hover:text-[#8f6500] flex items-center gap-1 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">{copiedEmail ? 'check' : 'content_copy'}</span>
                        <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>

                {/* Category Pills */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                        Issue Topic
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#ffb700] text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g., Movie poster not loading in feed"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ffb700]"
                    />
                </div>

                {/* Details */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Details & Description
                    </label>
                    <textarea
                        rows={3}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={activeCat.placeholder}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ffb700] resize-y"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Your Contact Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ffb700]"
                    />
                </div>

                {/* Diagnostics Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium">
                    <input
                        type="checkbox"
                        checked={includeDiagnostics}
                        onChange={e => setIncludeDiagnostics(e.target.checked)}
                        className="rounded border-slate-300 text-[#ffb700] focus:ring-[#ffb700]"
                    />
                    <span>Attach app version, browser, and user handle for faster resolution</span>
                </label>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={handleSendMailto}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ffb700] hover:bg-[#ffaa00] text-[#2D2926] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffb700]/20 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base">outgoing_mail</span>
                        <span>Email App</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenGmail}
                        className="flex items-center justify-center gap-1.5 py-3 px-4 bg-white border border-slate-200 hover:border-[#ffb700] text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        title="Open in Gmail Web"
                    >
                        <span className="material-symbols-outlined text-rose-500 text-base">mail</span>
                        <span>Gmail</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyReport}
                        className="flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        title="Copy report to clipboard"
                    >
                        <span className="material-symbols-outlined text-slate-500 text-base">
                            {copiedReport ? 'check' : 'assignment'}
                        </span>
                        <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SupportModal;
