/**
 * Resource Preload Manager
 * Kaynak ön yükleme yöneticisi
 */

// Resource types
export type ResourceType = 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';

// Preload status
export type PreloadStatus = 'pending' | 'loading' | 'loaded' | 'error';

// Preload options
export interface PreloadOptions {
  as?: ResourceType;
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
  type?: string;
  integrity?: string;
  priority?: 'high' | 'low' | 'auto';
}

// Resource entry
interface ResourceEntry {
  url: string;
  status: PreloadStatus;
  options: PreloadOptions;
  element?: HTMLLinkElement;
  promise?: Promise<void>;
  error?: Error;
}

// Preload manager class
class PreloadManager {
  private resources: Map<string, ResourceEntry> = new Map();
  private queue: Array<{ url: string; options: PreloadOptions; priority: number }> = [];
  private activeLoads: number = 0;
  private readonly maxConcurrent: number;
  private readonly defaultPriority: Record<ResourceType, number> = {
    script: 3,
    style: 4,
    font: 5,
    image: 2,
    fetch: 1,
    document: 3,
  };

  constructor(maxConcurrent: number = 4) {
    this.maxConcurrent = maxConcurrent;
  }

  // Preload a resource
  preload(url: string, options: PreloadOptions = {}): Promise<void> {
    // Check if already loading/loaded
    const existing = this.resources.get(url);
    if (existing) {
      if (existing.promise) {
        return existing.promise;
      }
      if (existing.status === 'loaded') {
        return Promise.resolve();
      }
      if (existing.status === 'error' && existing.error) {
        return Promise.reject(existing.error);
      }
    }

    // Create new entry
    const entry: ResourceEntry = {
      url,
      status: 'pending',
      options,
    };
    this.resources.set(url, entry);

    // Add to queue
    const priority = options.priority === 'high' ? 10 :
                     options.priority === 'low' ? 1 :
                     options.as ? this.defaultPriority[options.as] : 2;

    this.queue.push({ url, options, priority });
    this.queue.sort((a, b) => b.priority - a.priority);

    // Process queue
    this.processQueue();

    // Return promise
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const current = this.resources.get(url);
        if (!current) {
          reject(new Error('Resource entry not found'));
          return;
        }
        
        if (current.status === 'loaded') {
          resolve();
        } else if (current.status === 'error') {
          reject(current.error || new Error('Preload failed'));
        } else {
          // Check again
          setTimeout(checkStatus, 50);
        }
      };
      checkStatus();
    });
  }

  // Process the queue
  private processQueue(): void {
    while (this.activeLoads < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        this.loadResource(item.url, item.options);
      }
    }
  }

  // Load a single resource
  private loadResource(url: string, options: PreloadOptions): void {
    const entry = this.resources.get(url);
    if (!entry || entry.status !== 'pending') return;

    entry.status = 'loading';
    this.activeLoads++;

    if (typeof document === 'undefined') {
      entry.status = 'loaded';
      this.activeLoads--;
      this.processQueue();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    if (options.as) {
      link.as = options.as;
    }
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }
    if (options.media) {
      link.media = options.media;
    }
    if (options.type) {
      link.type = options.type;
    }
    if (options.integrity) {
      link.integrity = options.integrity;
    }

    link.onload = () => {
      entry.status = 'loaded';
      this.activeLoads--;
      this.processQueue();
    };

    link.onerror = () => {
      entry.status = 'error';
      entry.error = new Error(`Failed to preload: ${url}`);
      this.activeLoads--;
      this.processQueue();
    };

    entry.element = link;
    document.head.appendChild(link);
  }

  // Prefetch a resource (lower priority than preload)
  prefetch(url: string, options: PreloadOptions = {}): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    // Check if already handled
    if (this.resources.has(url)) {
      return this.preload(url, options);
    }

    // Use prefetch instead of preload
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;

    if (options.as) {
      link.as = options.as;
    }
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    document.head.appendChild(link);

    const entry: ResourceEntry = {
      url,
      status: 'loaded',
      options,
      element: link,
    };
    this.resources.set(url, entry);

    return Promise.resolve();
  }

  // Preconnect to a domain
  preconnect(origin: string, crossOrigin: boolean = false): void {
    if (typeof document === 'undefined') return;

    const key = `preconnect:${origin}`;
    if (this.resources.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);

    this.resources.set(key, {
      url: origin,
      status: 'loaded',
      options: {},
      element: link,
    });
  }

  // DNS prefetch
  dnsPrefetch(origin: string): void {
    if (typeof document === 'undefined') return;

    const key = `dns-prefetch:${origin}`;
    if (this.resources.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;

    document.head.appendChild(link);

    this.resources.set(key, {
      url: origin,
      status: 'loaded',
      options: {},
      element: link,
    });
  }

  // Modulepreload for ES modules
  modulePreload(url: string): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    const key = `module:${url}`;
    if (this.resources.has(key)) {
      const entry = this.resources.get(key)!;
      return entry.status === 'loaded' ? Promise.resolve() : Promise.reject(entry.error);
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = url;

      link.onload = () => {
        this.resources.set(key, { url, status: 'loaded', options: {}, element: link });
        resolve();
      };

      link.onerror = () => {
        const error = new Error(`Failed to modulepreload: ${url}`);
        this.resources.set(key, { url, status: 'error', options: {}, error });
        reject(error);
      };

      document.head.appendChild(link);
    });
  }

  // Get status of a resource
  getStatus(url: string): PreloadStatus | null {
    const entry = this.resources.get(url);
    return entry ? entry.status : null;
  }

  // Check if resource is loaded
  isLoaded(url: string): boolean {
    return this.getStatus(url) === 'loaded';
  }

  // Cancel pending preloads
  cancel(url: string): void {
    const entry = this.resources.get(url);
    if (entry && entry.status === 'pending') {
      // Remove from queue
      const index = this.queue.findIndex(item => item.url === url);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
      this.resources.delete(url);
    }
  }

  // Clear all
  clear(): void {
    this.resources.forEach((entry) => {
      if (entry.element && entry.element.parentNode) {
        entry.element.parentNode.removeChild(entry.element);
      }
    });
    this.resources.clear();
    this.queue = [];
    this.activeLoads = 0;
  }

  // Get stats
  getStats(): {
    total: number;
    pending: number;
    loading: number;
    loaded: number;
    error: number;
  } {
    const stats = { total: 0, pending: 0, loading: 0, loaded: 0, error: 0 };
    
    this.resources.forEach((entry) => {
      stats.total++;
      stats[entry.status]++;
    });

    return stats;
  }
}

// Preload strategies
export const PreloadStrategies = {
  // Critical resources for initial render
  critical: (manager: PreloadManager, resources: string[]): Promise<void[]> => {
    return Promise.all(
      resources.map(url => {
        const ext = url.split('.').pop()?.toLowerCase();
        const as: ResourceType = 
          ext === 'js' ? 'script' :
          ext === 'css' ? 'style' :
          ext === 'woff2' || ext === 'woff' ? 'font' :
          'fetch';
        
        return manager.preload(url, { as, priority: 'high' });
      })
    );
  },

  // Above-the-fold images
  heroImages: (manager: PreloadManager, urls: string[]): Promise<void[]> => {
    return Promise.all(
      urls.map(url => manager.preload(url, { as: 'image', priority: 'high' }))
    );
  },

  // Route-based prefetching
  route: (manager: PreloadManager, routeAssets: Record<string, string[]>): void => {
    Object.values(routeAssets).flat().forEach(url => {
      manager.prefetch(url, { 
        as: url.endsWith('.js') ? 'script' : 
            url.endsWith('.css') ? 'style' : 
            'fetch' 
      });
    });
  },

  // Third-party origins
  thirdParty: (manager: PreloadManager, origins: string[]): void => {
    origins.forEach(origin => {
      manager.preconnect(origin, true);
    });
  },
};

// Singleton instance
let managerInstance: PreloadManager | null = null;

export function getPreloadManager(): PreloadManager {
  if (!managerInstance) {
    managerInstance = new PreloadManager();
  }
  return managerInstance;
}

// Convenience functions
export function preload(url: string, options?: PreloadOptions): Promise<void> {
  return getPreloadManager().preload(url, options);
}

export function prefetch(url: string, options?: PreloadOptions): Promise<void> {
  return getPreloadManager().prefetch(url, options);
}

export function preconnect(origin: string, crossOrigin?: boolean): void {
  getPreloadManager().preconnect(origin, crossOrigin);
}

export function dnsPrefetch(origin: string): void {
  getPreloadManager().dnsPrefetch(origin);
}

export { PreloadManager };
