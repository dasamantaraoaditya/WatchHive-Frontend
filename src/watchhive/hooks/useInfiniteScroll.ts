import { useEffect, useRef } from 'react';

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
    const isLoadingRef = useRef(isLoading);
    const hasMoreRef = useRef(hasMore);
    const onLoadMoreRef = useRef(onLoadMore);

    // Keep refs updated without triggering re-renders or recreating the observer
    useEffect(() => {
        isLoadingRef.current = isLoading;
        hasMoreRef.current = hasMore;
        onLoadMoreRef.current = onLoadMore;
    }, [isLoading, hasMore, onLoadMore]);

    useEffect(() => {
        const element = observerTarget.current;
        if (!element || !enabled) return;

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            // Use refs to check latest state without needing to recreate the observer
            if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
                onLoadMoreRef.current();
            }
        }, {
            threshold,
            rootMargin: '100px', // Start loading before reaching the very bottom
        });

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [threshold, enabled]); // Only recreate observer if threshold or enabled changes

    return { observerTarget };
};

export default useInfiniteScroll;
