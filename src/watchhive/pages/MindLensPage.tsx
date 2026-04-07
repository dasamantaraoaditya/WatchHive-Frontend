import React, { useEffect } from 'react';
import { useUI } from '../contexts';
import { MindLensView } from '../components/mindlens/MindLensView';

export const MindLensPage: React.FC = () => {
    const { setPageTitle, setPageIcon } = useUI();

    useEffect(() => {
        setPageTitle('MindLens');
        setPageIcon('psychology');
    }, [setPageTitle, setPageIcon]);

    return (
        <div className="flex-1 overflow-y-auto bg-[#FFF9F0] font-display text-[#2D241E] min-h-full">
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#F5E6D3] shadow-sm rounded-3xl p-6 md:px-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#2D241E]">
                            MindLens
                        </h1>
                        <p className="text-[#2D241E]/60 mt-1 font-medium">
                            Your cinematic psychological profile and habits
                        </p>
                    </div>
                </div>

                <MindLensView />
                
                <div className="h-8"></div>
            </div>
        </div>
    );
};

export default MindLensPage;
