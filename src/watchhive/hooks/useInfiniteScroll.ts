import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    enabled?: boolean;
}

/**
 * Infinite scroll hook using a callback ref pattern.
 *
 * Key design: `observerTarget` is a *callback ref* (not useRef). React calls it
 * whenever the sentinel DOM node mounts or unmounts. That call updates `targetNode`
 * state, which triggers the useEffect below — so the IntersectionObserver is always
 * attached as soon as the sentinel enters the DOM, even if it starts hidden behind a
 * conditional render.
 */
export const useInfiniteScroll = ({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 0.1,
    enabled = true,
}: UseInfiniteScrollOptions) => {
    // Keep the latest callback values in refs so the observer callback is always fresh
    // without needing to be in the effect dependency array.
    const isLoadingRef = useRef(isLoading);
    const hasMoreRef   = useRef(hasMore);
    const onLoadMoreRef = useRef(onLoadMore);

    useEffect(() => {
        isLoadingRef.current  = isLoading;
        hasMoreRef.current    = hasMore;
        onLoadMoreRef.current = onLoadMore;
    }, [isLoading, hasMore, onLoadMore]);

    // Track the sentinel node via state so React knows to re-run the observer effect.
    const [targetNode, setTargetNode] = useState<HTMLDivElement | null>(null);

    // Callback ref — React calls this with the DOM node on mount and null on unmount.
    const observerTarget = useCallback((node: HTMLDivElement | null) => {
        setTargetNode(node);
    }, []);

    useEffect(() => {
        if (!targetNode || !enabled) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
                    onLoadMoreRef.current();
                }
            },
            {
                threshold,
                rootMargin: '200px', // Start loading 200px before sentinel is visible
            }
        );

        observer.observe(targetNode);
        return () => observer.disconnect();
    }, [targetNode, enabled, threshold]);

    return { observerTarget };
};

export default useInfiniteScroll;
