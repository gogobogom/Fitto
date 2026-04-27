/**
 * Virtual List Utilities
 * For rendering large lists efficiently
 */

export interface VirtualListConfig {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render outside visible area */
  overscan?: number;
}

export interface VirtualListState {
  /** Index of first visible item */
  startIndex: number;
  /** Index of last visible item */
  endIndex: number;
  /** Items to render */
  visibleRange: number[];
  /** Offset for positioning */
  offsetTop: number;
  /** Total height of all items */
  totalHeight: number;
}

/**
 * Calculate virtual list state based on scroll position
 */
export function calculateVirtualListState(
  scrollTop: number,
  config: VirtualListConfig
): VirtualListState {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = config;
  
  const totalHeight = itemCount * itemHeight;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2);
  
  // Create array of visible indices
  const visibleRange: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleRange.push(i);
  }
  
  const offsetTop = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    visibleRange,
    offsetTop,
    totalHeight,
  };
}

/**
 * Variable height virtual list
 */
export interface VariableHeightConfig {
  /** Total number of items */
  itemCount: number;
  /** Function to get height of item at index */
  getItemHeight: (index: number) => number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render outside visible area */
  overscan?: number;
}

export interface ItemPosition {
  index: number;
  offset: number;
  height: number;
}

/**
 * Calculate positions for variable height items
 */
export function calculateVariableHeightPositions(
  config: VariableHeightConfig
): ItemPosition[] {
  const { itemCount, getItemHeight } = config;
  const positions: ItemPosition[] = [];
  let offset = 0;
  
  for (let i = 0; i < itemCount; i++) {
    const height = getItemHeight(i);
    positions.push({ index: i, offset, height });
    offset += height;
  }
  
  return positions;
}

/**
 * Binary search to find start index for scroll position
 */
export function findStartIndex(
  positions: ItemPosition[],
  scrollTop: number
): number {
  let low = 0;
  let high = positions.length - 1;
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (positions[mid].offset + positions[mid].height < scrollTop) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  
  return low;
}

/**
 * Get visible items for variable height list
 */
export function getVisibleItems(
  scrollTop: number,
  config: VariableHeightConfig,
  positions: ItemPosition[]
): VirtualListState {
  const { containerHeight, overscan = 3 } = config;
  
  if (positions.length === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleRange: [],
      offsetTop: 0,
      totalHeight: 0,
    };
  }
  
  const totalHeight = positions[positions.length - 1].offset + 
    positions[positions.length - 1].height;
  
  // Find start index
  let startIndex = findStartIndex(positions, scrollTop);
  startIndex = Math.max(0, startIndex - overscan);
  
  // Find end index
  const scrollBottom = scrollTop + containerHeight;
  let endIndex = startIndex;
  
  while (
    endIndex < positions.length - 1 &&
    positions[endIndex].offset < scrollBottom
  ) {
    endIndex++;
  }
  endIndex = Math.min(positions.length - 1, endIndex + overscan);
  
  // Create visible range
  const visibleRange: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleRange.push(i);
  }
  
  return {
    startIndex,
    endIndex,
    visibleRange,
    offsetTop: positions[startIndex]?.offset || 0,
    totalHeight,
  };
}

/**
 * Windowed data fetcher - for infinite scroll
 */
export interface WindowedDataConfig<T> {
  /** Fetch data for a range */
  fetchData: (startIndex: number, endIndex: number) => Promise<T[]>;
  /** Cache size in items */
  cacheSize?: number;
  /** Page size for fetching */
  pageSize?: number;
}

export class WindowedDataFetcher<T> {
  private cache = new Map<number, T>();
  private pendingRequests = new Map<number, Promise<T[]>>();
  private config: Required<WindowedDataConfig<T>>;

  constructor(config: WindowedDataConfig<T>) {
    this.config = {
      cacheSize: config.cacheSize ?? 500,
      pageSize: config.pageSize ?? 50,
      fetchData: config.fetchData,
    };
  }

  /**
   * Get items for range, fetching if necessary
   */
  async getItems(startIndex: number, endIndex: number): Promise<Map<number, T>> {
    const result = new Map<number, T>();
    const toFetch: number[] = [];

    // Check cache first
    for (let i = startIndex; i <= endIndex; i++) {
      if (this.cache.has(i)) {
        result.set(i, this.cache.get(i)!);
      } else {
        toFetch.push(i);
      }
    }

    // Fetch missing items
    if (toFetch.length > 0) {
      const fetchStart = Math.min(...toFetch);
      const fetchEnd = Math.max(...toFetch);
      
      // Check for pending request
      const pageStart = Math.floor(fetchStart / this.config.pageSize) * this.config.pageSize;
      
      if (!this.pendingRequests.has(pageStart)) {
        const fetchPromise = this.config.fetchData(
          pageStart,
          pageStart + this.config.pageSize - 1
        );
        this.pendingRequests.set(pageStart, fetchPromise);

        try {
          const items = await fetchPromise;
          items.forEach((item, idx) => {
            this.cache.set(pageStart + idx, item);
            if (pageStart + idx >= startIndex && pageStart + idx <= endIndex) {
              result.set(pageStart + idx, item);
            }
          });
        } finally {
          this.pendingRequests.delete(pageStart);
        }
      } else {
        const items = await this.pendingRequests.get(pageStart)!;
        items.forEach((item, idx) => {
          if (pageStart + idx >= startIndex && pageStart + idx <= endIndex) {
            result.set(pageStart + idx, item);
          }
        });
      }

      // Trim cache if too large
      this.trimCache(startIndex, fetchEnd);
    }

    return result;
  }

  /**
   * Trim cache to stay within size limit
   */
  private trimCache(currentStart: number, currentEnd: number): void {
    if (this.cache.size <= this.config.cacheSize) return;

    const entries = Array.from(this.cache.entries());
    const sortedByDistance = entries.sort(([a], [b]) => {
      const distA = Math.min(Math.abs(a - currentStart), Math.abs(a - currentEnd));
      const distB = Math.min(Math.abs(b - currentStart), Math.abs(b - currentEnd));
      return distB - distA;
    });

    const toRemove = sortedByDistance.slice(0, this.cache.size - this.config.cacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
    };
  }
}

export default {
  calculateVirtualListState,
  calculateVariableHeightPositions,
  findStartIndex,
  getVisibleItems,
  WindowedDataFetcher,
};
