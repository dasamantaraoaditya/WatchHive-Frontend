import '@testing-library/jest-dom';

// Ensure localStorage mock is available in Node/JSDOM test runner
if (typeof window !== 'undefined') {
    const store: Record<string, string> = {};
    const mockStorage = {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = String(value);
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            Object.keys(store).forEach((k) => delete store[k]);
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() {
            return Object.keys(store).length;
        },
    };

    Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
    });
}
