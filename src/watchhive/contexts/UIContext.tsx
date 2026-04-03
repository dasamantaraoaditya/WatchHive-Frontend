import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    pageTitle: string;
    setPageTitle: (title: string) => void;
    pageIcon: string | null;
    setPageIcon: (icon: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState('WatchHive');
    const [pageIcon, setPageIcon] = useState<string | null>(null);

    return (
        <UIContext.Provider value={{ pageTitle, setPageTitle, pageIcon, setPageIcon }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
