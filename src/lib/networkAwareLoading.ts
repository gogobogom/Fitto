// Network-Aware Loading Strategies

export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'ethernet' | 'unknown';
export type ConnectionEffectiveType = '4g' | '3g' | '2g' | 'slow-2g';

export interface NetworkInfo {
  online: boolean;
  type: ConnectionType;
  effectiveType: ConnectionEffectiveType;
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

// Extended Navigator interface for Network Information API
interface NavigatorWithConnection extends Navigator {
  connection?: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
}

// Network information manager
export class NetworkManager {
  private static instance: NetworkManager;
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private cachedInfo: NetworkInfo | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline changes
    window.addEventListener('online', () => this.notifyListeners());
    window.addEventListener('offline', () => this.notifyListeners());

    // Listen for connection changes
    const nav = navigator as NavigatorWithConnection;
    if (nav.connection?.addEventListener) {
      nav.connection.addEventListener('change', () => this.notifyListeners());
    }
  }

  private notifyListeners(): void {
    this.cachedInfo = null; // Invalidate cache
    const info = this.getInfo();
    this.listeners.forEach(listener => listener(info));
  }

  getInfo(): NetworkInfo {
    if (this.cachedInfo) return this.cachedInfo;

    if (typeof navigator === 'undefined') {
      return {
        online: true,
        type: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };
    }

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;

    this.cachedInfo = {
      online: navigator.onLine,
      type: (connection?.type as ConnectionType) || 'unknown',
      effectiveType: (connection?.effectiveType as ConnectionEffectiveType) || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 50,
      saveData: connection?.saveData || false,
    };

    return this.cachedInfo;
  }

  subscribe(listener: (info: NetworkInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isOnline(): boolean {
    return this.getInfo().online;
  }

  isFastConnection(): boolean {
    const info = this.getInfo();
    return info.effectiveType === '4g' && info.downlink > 5;
  }

  isSlowConnection(): boolean {
    const info = this.getInfo();
    return ['slow-2g', '2g'].includes(info.effectiveType) || info.downlink < 1;
  }

  shouldSaveData(): boolean {
    const info = this.getInfo();
    return info.saveData || this.isSlowConnection();
  }
}

// Network-aware image loading
export interface ImageLoadOptions {
  src: string;
  srcLowQuality?: string;
  srcHighQuality?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

export function getOptimalImageSrc(options: ImageLoadOptions): string {
  const networkManager = NetworkManager.getInstance();
  const info = networkManager.getInfo();

  // Use low quality on slow connections or save data mode
  if (info.saveData || ['slow-2g', '2g', '3g'].includes(info.effectiveType)) {
    return options.srcLowQuality || options.src;
  }

  // Use high quality on fast connections
  if (info.effectiveType === '4g' && info.downlink > 5) {
    return options.srcHighQuality || options.src;
  }

  return options.src;
}

// Network-aware prefetching
export class NetworkAwarePrefetcher {
  private networkManager: NetworkManager;
  private prefetchQueue: string[] = [];
  private isPrefetching = false;

  constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  shouldPrefetch(): boolean {
    const info = this.networkManager.getInfo();
    
    // Don't prefetch on slow connections or when saving data
    if (info.saveData || !info.online) return false;
    if (['slow-2g', '2g'].includes(info.effectiveType)) return false;
    
    return true;
  }

  addToPrefetch(urls: string[]): void {
    if (!this.shouldPrefetch()) return;

    this.prefetchQueue.push(...urls.filter(url => !this.prefetchQueue.includes(url)));
    this.processPrefetchQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) return;
    if (!this.shouldPrefetch()) return;

    this.isPrefetching = true;

    while (this.prefetchQueue.length > 0 && this.shouldPrefetch()) {
      const url = this.prefetchQueue.shift();
      if (!url) continue;

      try {
        // Use link prefetch
        if (typeof document !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        }

        // Small delay to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Prefetch failed:', url, error);
      }
    }

    this.isPrefetching = false;
  }

  clearQueue(): void {
    this.prefetchQueue = [];
  }
}

// Adaptive loading strategy
export interface AdaptiveLoadConfig {
  fast: () => Promise<unknown>;
  medium: () => Promise<unknown>;
  slow: () => Promise<unknown>;
  offline?: () => unknown;
}

export async function loadAdaptively<T>(config: AdaptiveLoadConfig): Promise<T> {
  const networkManager = NetworkManager.getInstance();
  const info = networkManager.getInfo();

  if (!info.online && config.offline) {
    return config.offline() as T;
  }

  if (info.effectiveType === '4g' && info.downlink > 5) {
    return config.fast() as Promise<T>;
  }

  if (['slow-2g', '2g'].includes(info.effectiveType) || info.downlink < 1) {
    return config.slow() as Promise<T>;
  }

  return config.medium() as Promise<T>;
}

// Quality level selector
export type QualityLevel = 'low' | 'medium' | 'high' | 'auto';

export function getRecommendedQuality(): QualityLevel {
  const networkManager = NetworkManager.getInstance();
  const info = networkManager.getInfo();

  if (info.saveData) return 'low';
  if (!info.online) return 'low';

  switch (info.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    case '4g':
      return info.downlink > 5 ? 'high' : 'medium';
    default:
      return 'medium';
  }
}

// Batch size calculator based on network
export function getOptimalBatchSize(defaultSize = 20): number {
  const networkManager = NetworkManager.getInstance();
  const info = networkManager.getInfo();

  if (info.saveData || !info.online) return Math.min(5, defaultSize);

  switch (info.effectiveType) {
    case 'slow-2g':
      return Math.min(5, defaultSize);
    case '2g':
      return Math.min(10, defaultSize);
    case '3g':
      return Math.min(15, defaultSize);
    case '4g':
      return defaultSize;
    default:
      return defaultSize;
  }
}

// Timeout calculator based on network
export function getOptimalTimeout(baseTimeout = 10000): number {
  const networkManager = NetworkManager.getInstance();
  const info = networkManager.getInfo();

  const multiplier = (() => {
    switch (info.effectiveType) {
      case 'slow-2g': return 4;
      case '2g': return 3;
      case '3g': return 2;
      case '4g': return 1;
      default: return 1.5;
    }
  })();

  return baseTimeout * multiplier;
}

// Export singleton
export const networkManager = NetworkManager.getInstance();
export const networkAwarePrefetcher = new NetworkAwarePrefetcher();
