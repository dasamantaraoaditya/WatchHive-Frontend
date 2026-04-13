import React from 'react';

interface PageLayoutProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'none';
    className?: string;
    showFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
    children, 
    maxWidth = '5xl', 
    className = '',
    showFooter = true 
}) => {
    return (
        <div className={`page-container max-w-${maxWidth} ${className} animate-fade-in`}>
            {children}
            
            {showFooter && (
                <footer className="mt-12 mb-8 py-8 border-t border-black/5 opacity-40">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Handcrafted for the Hive</p>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PageLayout;
