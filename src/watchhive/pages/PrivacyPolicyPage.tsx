import React, { useEffect } from 'react';
import { PageLayout } from '../components/layout';

export const PrivacyPolicyPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageLayout maxWidth="3xl" className="font-sans">
            <div className="bg-white border border-black/5 rounded-[40px] p-8 md:p-12 shadow-sm animate-slide-up">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-[#2D2926] tracking-tighter mb-4">Privacy Policy</h1>
                    <div className="inline-flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/20">
                        <span className="material-symbols-outlined text-sm font-black">update</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Last Updated: March 10, 2026</span>
                    </div>
                </header>

                <div className="space-y-12 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm">1</span>
                            Introduction
                        </h2>
                        <p className="font-medium">
                            Welcome to WatchHive. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm">2</span>
                            The Data We Collect
                        </h2>
                        <p className="mb-4 font-medium">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { label: 'Identity Data', desc: 'Username, display name, and avatar.' },
                                { label: 'Contact Data', desc: 'Email address.' },
                                { label: 'Technical Data', desc: 'IP address, login data, browser type.' },
                                { label: 'Profile Data', desc: 'Watch history, ratings, reviews.' }
                            ].map((item, i) => (
                                <li key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">{item.label}</div>
                                    <div className="text-[13px] font-medium text-slate-500">{item.desc}</div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm">3</span>
                            How We Use Your Data
                        </h2>
                        <p className="mb-4 font-medium">
                            We use your data to provide the best hive experience:
                        </p>
                        <div className="space-y-2">
                            {[
                                'To provide the core services of WatchHive',
                                'To manage your account and support',
                                'To improve our website and algorithms',
                                'To enable social interactions between users'
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <span className="material-symbols-outlined text-[#ffb700] text-sm">check_circle</span>
                                    <span className="text-[13px] font-bold text-slate-700">{text}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="p-6 rounded-3xl bg-slate-900 text-white">
                        <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#ffb700]">google</span>
                            Google OAuth
                        </h2>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">
                            WatchHive allows you to sign in using your Google account. When you use Google OAuth, we receive
                            your email address, name, and profile picture from Google. We use this information only to create
                            and manage your WatchHive account. We do not share this information with third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm">5</span>
                            Data Security
                        </h2>
                        <p className="font-medium">
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                            used or accessed in an unauthorized way, altered or disclosed.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-slate-100">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">Contact Us</h2>
                                <p className="text-[13px] font-medium text-slate-500">Have questions about your data? Reach out.</p>
                            </div>
                            <a href="mailto:privacy@watchhive.app" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs transition-colors">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                privacy@watchhive.app
                            </a>
                        </div>
                    </section>
                </div>

                <div className="mt-16 flex justify-center">
                    <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Go back to hive
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

