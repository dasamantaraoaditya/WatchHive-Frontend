import React, { useEffect } from 'react';
import { useUI } from '../contexts';
import { MindLensView } from '../components/mindlens/MindLensView';
import { PageLayout } from '../components/layout';

export const MindLensPage: React.FC = () => {
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('MindLens');
        setPageIcon('psychology');
    }, [setPageTitle, setPageIcon]);

    return (
        <PageLayout maxWidth="7xl">
            <div className="space-y-8 pb-12 animate-slide-up">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 bg-white border border-black/5 shadow-sm rounded-[32px] p-8 md:px-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-[#2D241E] mb-1">
                            Mind<span className="text-[#ffb700]">Lens</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-sm">
                            Your cinematic psychological profile and habits
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#ffb700]/10 text-[#ffb700] px-4 py-2 rounded-2xl border border-[#ffb700]/20">
                        <span className="material-symbols-outlined text-sm font-black text-[#ffb700]">insights</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb700]">AI Analysis Active</span>
                    </div>
                </div>

                <MindLensView />
            </div>
        </PageLayout>
    );
};

export default MindLensPage;
