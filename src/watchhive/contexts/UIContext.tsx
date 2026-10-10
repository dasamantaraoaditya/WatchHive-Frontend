import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UIContextType {
    pageTitle: string;
    setPageTitle: (title: string) => void;
    pageIcon: string | null;
    setPageIcon: (icon: string | null) => void;
    isModalOpen: boolean;
    registerModal: () => () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState('WatchersHive');
    const [pageIcon, setPageIcon] = useState<string | null>(null);
    const [modalCount, setModalCount] = useState(0);

    const registerModal = useCallback(() => {
        setModalCount(prev => {
            const next = prev + 1;
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            return next;
        });

        return () => {
            setModalCount(prev => {
                const next = Math.max(0, prev - 1);
                if (next === 0) {
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = 'unset';
                }
                return next;
            });
        };
    }, []);

    const isModalOpen = modalCount > 0;

    return (
        <UIContext.Provider value={{ 
            pageTitle, 
            setPageTitle, 
            pageIcon, 
            setPageIcon,
            isModalOpen,
            registerModal
        }}>
            {children}
        </UIContext.Provider>
    );
};

const fallbackUI: UIContextType = {
    pageTitle: 'WatchersHive',
    setPageTitle: () => {},
    pageIcon: null,
    setPageIcon: () => {},
    isModalOpen: false,
    registerModal: () => {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = 'unset';
        };
    },
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        return fallbackUI;
    }
    return context;
};
