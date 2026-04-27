'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  calculateVirtualListState,
  calculateVariableHeightPositions,
  getVisibleItems,
  type VirtualListConfig,
  type VirtualListState,
  type VariableHeightConfig,
  type ItemPosition,
} from '@/lib/virtualList';

export interface UseVirtualListOptions {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render outside visible area */
  overscan?: number;
}

export interface UseVirtualListReturn {
  /** Visible item indices */
  visibleRange: number[];
  /** Total height for spacer */
  totalHeight: number;
  /** Offset for positioning visible items */
  offsetTop: number;
  /** Props to spread on container */
  containerProps: {
    ref: React.RefCallback<HTMLElement>;
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
  /** Props to spread on content wrapper */
  contentProps: {
    style: React.CSSProperties;
  };
  /** Scroll to specific index */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** Current scroll position */
  scrollTop: number;
  /** Start and end indices */
  startIndex: number;
  endIndex: number;
}

/**
 * Virtual list hook for fixed height items
 */
export function useVirtualList(options: UseVirtualListOptions): UseVirtualListReturn {
  const { itemCount, itemHeight, overscan = 3 } = options;
  
  const containerRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Set container ref and measure height
  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
    if (node) {
      setContainerHeight(node.clientHeight);
    }
  }, []);

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate virtual state
  const virtualState: VirtualListState = useMemo(() => {
    if (containerHeight === 0) {
      return {
        startIndex: 0,
        endIndex: Math.min(10, itemCount - 1),
        visibleRange: Array.from({ length: Math.min(10, itemCount) }, (_, i) => i),
        offsetTop: 0,
        totalHeight: itemCount * itemHeight,
      };
    }

    const config: VirtualListConfig = {
      itemCount,
      itemHeight,
      containerHeight,
      overscan,
    };

    return calculateVirtualListState(scrollTop, config);
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const targetTop = index * itemHeight;
    container.scrollTo({ top: targetTop, behavior });
  }, [itemHeight]);

  return {
    visibleRange: virtualState.visibleRange,
    totalHeight: virtualState.totalHeight,
    offsetTop: virtualState.offsetTop,
    containerProps: {
      ref: setContainerRef,
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        position: 'relative' as const,
      },
    },
    contentProps: {
      style: {
        height: virtualState.totalHeight,
        position: 'relative' as const,
      },
    },
    scrollToIndex,
    scrollTop,
    startIndex: virtualState.startIndex,
    endIndex: virtualState.endIndex,
  };
}

export interface UseVariableVirtualListOptions {
  /** Total number of items */
  itemCount: number;
  /** Function to get height of item at index */
  getItemHeight: (index: number) => number;
  /** Number of items to render outside visible area */
  overscan?: number;
}

export interface UseVariableVirtualListReturn extends Omit<UseVirtualListReturn, 'offsetTop'> {
  /** Item positions */
  itemPositions: ItemPosition[];
  /** Get style for specific item */
  getItemStyle: (index: number) => React.CSSProperties;
}

/**
 * Virtual list hook for variable height items
 */
export function useVariableVirtualList(
  options: UseVariableVirtualListOptions
): UseVariableVirtualListReturn {
  const { itemCount, getItemHeight, overscan = 3 } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate positions (memoized)
  const itemPositions = useMemo(() => {
    return calculateVariableHeightPositions({
      itemCount,
      getItemHeight,
      containerHeight,
      overscan,
    });
  }, [itemCount, getItemHeight, containerHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Set container ref
  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
    if (node) {
      setContainerHeight(node.clientHeight);
    }
  }, []);

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate virtual state
  const virtualState = useMemo(() => {
    if (containerHeight === 0 || itemPositions.length === 0) {
      return {
        startIndex: 0,
        endIndex: Math.min(10, itemCount - 1),
        visibleRange: Array.from({ length: Math.min(10, itemCount) }, (_, i) => i),
        offsetTop: 0,
        totalHeight: itemPositions[itemPositions.length - 1]?.offset + 
          itemPositions[itemPositions.length - 1]?.height || 0,
      };
    }

    const config: VariableHeightConfig = {
      itemCount,
      getItemHeight,
      containerHeight,
      overscan,
    };

    return getVisibleItems(scrollTop, config, itemPositions);
  }, [scrollTop, containerHeight, itemCount, getItemHeight, overscan, itemPositions]);

  // Get item style
  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    const position = itemPositions[index];
    if (!position) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      };
    }

    return {
      position: 'absolute',
      top: position.offset,
      left: 0,
      right: 0,
      height: position.height,
    };
  }, [itemPositions]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container || !itemPositions[index]) return;

    const targetTop = itemPositions[index].offset;
    container.scrollTo({ top: targetTop, behavior });
  }, [itemPositions]);

  return {
    visibleRange: virtualState.visibleRange,
    totalHeight: virtualState.totalHeight,
    itemPositions,
    containerProps: {
      ref: setContainerRef,
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        position: 'relative' as const,
      },
    },
    contentProps: {
      style: {
        height: virtualState.totalHeight,
        position: 'relative' as const,
      },
    },
    getItemStyle,
    scrollToIndex,
    scrollTop,
    startIndex: virtualState.startIndex,
    endIndex: virtualState.endIndex,
  };
}

/**
 * Infinite scroll hook
 */
export interface UseInfiniteScrollOptions {
  /** Load more items */
  loadMore: () => Promise<void>;
  /** Whether more items are available */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Threshold in pixels before triggering load */
  threshold?: number;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions): {
  sentinelRef: React.RefCallback<HTMLElement>;
} {
  const { loadMore, hasMore, isLoading, threshold = 200 } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node || !hasMore || isLoading) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            void loadMore();
          }
        },
        { rootMargin: `${threshold}px` }
      );

      observerRef.current.observe(node);
    },
    [loadMore, hasMore, isLoading, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { sentinelRef };
}

export default {
  useVirtualList,
  useVariableVirtualList,
  useInfiniteScroll,
};
