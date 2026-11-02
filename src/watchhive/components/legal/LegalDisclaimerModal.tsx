import React from 'react';
import { Modal } from '../common/Modal';

interface LegalDisclaimerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LegalDisclaimerModal: React.FC<LegalDisclaimerModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Legal & Non-Commercial Disclaimer"
            maxWidth="max-w-2xl"
        >
            <div className="flex flex-col gap-6 text-[#2D2926] p-1 font-sans">
                {/* Intro Banner */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">
                        gavel
                    </span>
                    <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">
                            Legal Notice & Transparency
                        </h4>
                        <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            WatchersHive is built with respect for intellectual property rights, open-source standards, and full compliance with copyright laws.
                        </p>
                    </div>
                </div>

                {/* Section 1: Non-Commercial */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                            1
                        </span>
                        <h5 className="text-sm font-black text-slate-900">
                            Strict Non-Commercial & Fan-Made Nature
                        </h5>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        WatchersHive is an independent, non-commercial, fan-made social movie and TV tracking community application built strictly for personal cataloging, education, and entertainment purposes.
                    </p>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                        WatchersHive does <strong>NOT</strong> generate any revenue, does <strong>NOT</strong> sell any products, user data, or merchandise, displays <strong>ZERO</strong> commercial advertisements, and charges <strong>NO</strong> subscription or membership fees. We do not make a penny on this platform.
                    </p>
                </div>

                {/* Section 2: TMDb Attribution */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">
                            2
                        </span>
                        <h5 className="text-sm font-black text-slate-900">
                            TMDb API Attribution
                        </h5>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        All film and television metadata, synopses, cast information, release years, and promotional poster artwork are queried from The Movie Database (TMDb) via their standard API.
                    </p>
                    <div>
                        <a
                            href="https://www.themoviedb.org/documentation/api/terms-of-use"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                        >
                            <span>TMDb API Terms of Use</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </a>
                    </div>
                </div>

                {/* Section 3: Intellectual Property & Copyright */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                            3
                        </span>
                        <h5 className="text-sm font-black text-slate-900">
                            Intellectual Property Rights & Fair Use
                        </h5>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        All movie titles, series names, poster artwork, still images, backdrops, logotypes, and character names remain the exclusive intellectual property and copyright of their respective creators, film studios, and distribution entities.
                    </p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        WatchersHive asserts no ownership over any third-party copyrighted material. All visual assets and information are used strictly under Fair Use / Fair Dealing doctrines for personal cataloging, commentary, critique, and non-commercial identification.
                    </p>
                </div>

                {/* Section 4: Takedown Policy */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                            4
                        </span>
                        <h5 className="text-sm font-black text-slate-900">
                            Copyright Inquiries & Takedown
                        </h5>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        If you are a copyright owner or an authorized representative and believe that any content hosted or referenced on WatchersHive infringes upon your copyright or intellectual property rights, please contact us immediately. We will promptly review and take appropriate action.
                    </p>
                    <div>
                        <a
                            href="mailto:watchershive@gmail.com?subject=WatchersHive%20Legal%20Inquiry"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                            <span>watchershive@gmail.com</span>
                        </a>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ffb700] hover:bg-[#e5a500] text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default LegalDisclaimerModal;
