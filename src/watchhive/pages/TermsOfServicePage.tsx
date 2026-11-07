import React, { useEffect } from 'react';
import { PageLayout } from '../components/layout';
import { Link } from 'react-router-dom';

export const TermsOfServicePage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageLayout maxWidth="3xl" className="font-sans">
            <div className="bg-white border border-black/5 rounded-[40px] p-8 md:p-12 shadow-sm animate-slide-up">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-[#2D2926] tracking-tighter mb-4">Terms of Service</h1>
                    <div className="inline-flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-1.5 rounded-full border border-[#ffb700]/20">
                        <span className="material-symbols-outlined text-sm font-black">gavel</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Effective Date: November 7, 2026</span>
                    </div>
                </header>

                <div className="space-y-10 text-slate-600 leading-relaxed text-[14px]">
                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm font-bold">1</span>
                            Agreement & Acceptance of Terms
                        </h2>
                        <p className="font-medium text-slate-600 leading-relaxed">
                            These Terms of Service ("Terms") constitute a legally binding agreement between you and WatchersHive ("WatchHive", "we", "us", or "our") concerning your access to and use of our website (<a href="https://watchershive.com" className="font-bold text-[#2D2926] underline">watchershive.com</a>), progressive web application, mobile applications (iOS and Android), APIs, and social features (collectively, the "Platform").
                        </p>
                        <p className="font-medium text-slate-600 leading-relaxed mt-2">
                            By creating an account, browsing the site, or logging watch activity, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/watch-hive/privacy" className="font-bold text-[#ffb700] hover:underline">Privacy Policy</Link>. If you do not agree, you must immediately cease using the Platform.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm font-bold">2</span>
                            Eligibility & Age Requirements
                        </h2>
                        <p className="font-medium text-slate-600 leading-relaxed">
                            You must be at least <strong>13 years of age</strong> (or 16 years of age for users residing in the European Economic Area / UK) to access or create an account on WatchersHive. If you are under the legal age of digital consent in your jurisdiction, you may only use the Platform under the supervision of a parent or legal guardian who agrees to these Terms. We do not knowingly collect personal information from individuals under 13.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 rounded-3xl bg-amber-50/70 border border-[#ffb700]/30 text-slate-800">
                        <h2 className="text-lg font-black text-slate-950 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb700] text-xl">favorite</span>
                            Strict Non-Commercial & Fan-Made Operation
                        </h2>
                        <p className="text-xs font-medium leading-relaxed mb-2">
                            WatchersHive is an independent, non-commercial, fan-made social movie and TV tracking community application built strictly for educational, personal cataloging, critique, and commentary purposes.
                        </p>
                        <p className="text-xs font-semibold leading-relaxed">
                            WatchersHive generates <strong>zero revenue</strong>, displays <strong>zero commercial advertisements</strong>, sells no user data or merchandise, and charges no fees or subscriptions.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm font-bold">4</span>
                            TMDb API Attribution & Intellectual Property
                        </h2>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                            <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                <strong>TMDb Attribution:</strong> This product uses the TMDB API but is not endorsed or certified by TMDB. All movie/TV metadata, titles, synopses, cast info, and promotional posters are queried via TMDb under standard developer API terms of service.
                            </p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                <strong>Third-Party Trademarks:</strong> All movie and television titles, artwork, posters, character names, and related marks belong exclusively to their respective copyright holders and production studios. They are displayed strictly under Fair Use / Fair Dealing doctrines for identification, commentary, and cataloging.
                            </p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                <strong>WatchHive Content:</strong> The WatchersHive branding, logo, software code, UI designs, and proprietary algorithms (including MindLens mathematical profiles) are the intellectual property of WatchersHive and protected by applicable copyright laws.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 - Apple UGC Guideline 1.2 Compliance */}
                    <section className="p-6 rounded-3xl bg-slate-900 text-white">
                        <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb700] text-xl">verified_user</span>
                            User Conduct & Zero Tolerance for Objectionable Content
                        </h2>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">
                            WatchersHive enforces a <strong>zero-tolerance policy</strong> for objectionable content, abusive behavior, and harassment (in compliance with Apple App Store Review Guideline 1.2 and global social standards). You agree that you will NOT:
                        </p>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside font-medium mb-3">
                            <li>Post defamatory, obscene, pornographic, harassing, hateful, or discriminatory comments or reviews.</li>
                            <li>Post content promoting violence, self-harm, hate speech, or illegal activities.</li>
                            <li>Impersonate any person or entity, or falsely claim affiliation with any entity or creator.</li>
                            <li>Engage in automated scraping, spamming, denial-of-service attacks, or malicious data mining.</li>
                            <li>Violate the intellectual property, privacy, or publicity rights of any third party.</li>
                        </ul>
                        <div className="p-3.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-[#ffb700] text-sm shrink-0 mt-0.5">report</span>
                            <span>
                                <strong>Moderation & Enforcement:</strong> Users can flag/report offensive content or block abusive accounts at any time. We review reported user-generated content within 24 hours and reserve the right to delete content and permanently ban offending accounts without prior notice.
                            </span>
                        </div>
                    </section>

                    {/* Section 6 - Account Deletion & Termination */}
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm font-bold">6</span>
                            Account Deletion & Data Portability
                        </h2>
                        <p className="font-medium text-slate-600 leading-relaxed mb-3">
                            You maintain total sovereignty over your personal data:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[#ffb700] text-base">download</span>
                                    Data Portability (GDPR Art. 20)
                                </div>
                                <p className="text-[12px] font-medium text-slate-500">
                                    You may export all your watch entries, episode watches, lists, and comments at any time via your Profile Settings.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-red-500 text-base">delete_forever</span>
                                    Right to Erasure (GDPR Art. 17)
                                </div>
                                <p className="text-[12px] font-medium text-slate-500">
                                    You may permanently delete your account directly inside the Web or Mobile app at any time. All associated logs, reviews, and tokens will be permanently erased.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7 - DMCA Safe Harbor */}
                    <section className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
                        <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb700] text-xl">policy</span>
                            DMCA Copyright Notice & Takedown Policy
                        </h2>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed mb-3">
                            If you believe that any material on WatchersHive infringes your copyright under the Digital Millennium Copyright Act (17 U.S.C. § 512) or international copyright law, please provide our designated copyright agent with written notice containing:
                        </p>
                        <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside font-medium mb-3">
                            <li>Identification of the copyrighted work claimed to have been infringed.</li>
                            <li>Identification of the material claimed to be infringing and its specific URL on WatchersHive.</li>
                            <li>Your contact details (name, physical address, telephone number, and email address).</li>
                            <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
                            <li>A physical or electronic signature of an authorized representative.</li>
                        </ol>
                        <div className="flex items-center gap-3 pt-2">
                            <span className="text-xs font-bold text-slate-700">Designated Agent Email:</span>
                            <a href="mailto:watchershive@gmail.com?subject=DMCA%20Takedown%20Notice" className="text-xs font-black text-[#ffb700] hover:underline flex items-center gap-1">
                                <span>watchershive@gmail.com</span>
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                        </div>
                    </section>

                    {/* Section 8 - Disclaimers & Liability */}
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#ffb700]/10 text-[#ffb700] flex items-center justify-center text-sm font-bold">8</span>
                            Disclaimer of Warranties & Limitation of Liability
                        </h2>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase tracking-wider mb-2">
                            THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                        </p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            To the maximum extent permitted by applicable law, WatchersHive, its developers, and contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of (or inability to use) the Platform.
                        </p>
                    </section>

                    {/* Section 9 - Contact */}
                    <section className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Questions about our Terms?</h3>
                            <p className="text-xs font-medium text-slate-500">We are dedicated to transparent, community-first cinephile tracking.</p>
                        </div>
                        <a
                            href="mailto:watchershive@gmail.com"
                            className="inline-flex items-center gap-2 bg-[#ffb700] hover:bg-[#e5a500] text-[#2D2926] px-5 py-2.5 rounded-xl font-black text-xs transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">mail</span>
                            Contact Legal Team
                        </a>
                    </section>
                </div>

                <div className="mt-12 flex justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Go back to hive
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default TermsOfServicePage;
