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
                <MindLensView />
            </div>
        </PageLayout>
    );
};

export default MindLensPage;
