import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    enabled?: boolean;
}

export const useInfiniteScroll = ({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 0.5,
    enabled = true
}: UseInfiniteScrollOptions) => {
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading && enabled) {
                onLoadMore();
            }
        },
        [onLoadMore, hasMore, isLoading, enabled]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element || !enabled) return;

        const observer = new IntersectionObserver(handleObserver, {
            threshold,
            rootMargin: '100px', // Start loading before reaching the very bottom
        });

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [handleObserver, threshold, enabled]);

    return { observerTarget };
};

export default useInfiniteScroll;
