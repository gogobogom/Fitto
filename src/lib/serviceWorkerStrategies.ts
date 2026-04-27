// Service Worker Strategies for Caching and Offline Support

export type CacheStrategy = 
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

export interface CacheConfig {
  name: string;
  strategy: CacheStrategy;
  maxAge?: number; // milliseconds
  maxEntries?: number;
  urlPatterns: RegExp[];
}

// Default cache configurations
export const defaultCacheConfigs: CacheConfig[] = [
  {
    name: 'static-assets',
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100,
    urlPatterns: [
      /\.(?:js|css|woff2?|ttf|otf|eot)$/,
      /\/_next\/static\//,
    ],
  },
  {
    name: 'images',
    strategy: 'cache-first',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 50,
    urlPatterns: [
      /\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)$/,
    ],
  },
  {
    name: 'api-responses',
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    urlPatterns: [
      /\/api\//,
    ],
  },
  {
    name: 'pages',
    strategy: 'stale-while-revalidate',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 30,
    urlPatterns: [
      /^\//,
    ],
  },
];

// Cache management utilities
export class CacheManager {
  private static instance: CacheManager;
  private cacheConfigs: CacheConfig[];

  private constructor(configs: CacheConfig[] = defaultCacheConfigs) {
    this.cacheConfigs = configs;
  }

  static getInstance(configs?: CacheConfig[]): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(configs);
    }
    return CacheManager.instance;
  }

  // Find matching cache config for URL
  findConfigForUrl(url: string): CacheConfig | null {
    for (const config of this.cacheConfigs) {
      for (const pattern of config.urlPatterns) {
        if (pattern.test(url)) {
          return config;
        }
      }
    }
    return null;
  }

  // Get cache name for URL
  getCacheNameForUrl(url: string): string | null {
    const config = this.findConfigForUrl(url);
    return config?.name || null;
  }

  // Clear specific cache
  async clearCache(cacheName: string): Promise<boolean> {
    if (typeof caches === 'undefined') return false;
    try {
      return await caches.delete(cacheName);
    } catch (error) {
      console.error(`Error clearing cache ${cacheName}:`, error);
      return false;
    }
  }

  // Clear all caches
  async clearAllCaches(): Promise<void> {
    if (typeof caches === 'undefined') return;
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<Map<string, { count: number; size: number }>> {
    const stats = new Map<string, { count: number; size: number }>();
    
    if (typeof caches === 'undefined') return stats;

    try {
      const cacheNames = await caches.keys();
      
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        let totalSize = 0;

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.clone().blob();
            totalSize += blob.size;
          }
        }

        stats.set(name, { count: keys.length, size: totalSize });
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return stats;
  }

  // Prune old entries from cache
  async pruneCache(cacheName: string, maxEntries: number): Promise<void> {
    if (typeof caches === 'undefined') return;

    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      if (keys.length > maxEntries) {
        const entriesToDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(entriesToDelete.map(key => cache.delete(key)));
      }
    } catch (error) {
      console.error(`Error pruning cache ${cacheName}:`, error);
    }
  }
}

// Offline storage for critical data
export class OfflineStorage {
  private static readonly DB_NAME = 'fitwell-offline';
  private static readonly DB_VERSION = 1;
  private static readonly STORES = ['pending-actions', 'cached-data', 'user-preferences'];

  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OfflineStorage.DB_NAME, OfflineStorage.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        for (const storeName of OfflineStorage.STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        }
      };
    });
  }

  async addPendingAction(action: {
    type: string;
    payload: Record<string, unknown>;
    timestamp: number;
  }): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) return -1;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
      const store = transaction.objectStore('pending-actions');
      const request = store.add(action);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getPendingActions(): Promise<Array<{
    id: number;
    type: string;
    payload: Record<string, unknown>;
    timestamp: number;
  }>> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending-actions'], 'readonly');
      const store = transaction.objectStore('pending-actions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removePendingAction(id: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
      const store = transaction.objectStore('pending-actions');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async cacheData(key: string, data: unknown): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const request = store.put({ id: key, data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readonly');
      const store = transaction.objectStore('cached-data');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? (result.data as T) : null);
      };
    });
  }
}

// Background sync manager
export class BackgroundSyncManager {
  private offlineStorage: OfflineStorage;
  private syncInProgress = false;

  constructor() {
    this.offlineStorage = new OfflineStorage();
  }

  async init(): Promise<void> {
    await this.offlineStorage.init();
    
    // Listen for online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncPendingActions());
    }
  }

  async queueAction(type: string, payload: Record<string, unknown>): Promise<void> {
    await this.offlineStorage.addPendingAction({
      type,
      payload,
      timestamp: Date.now(),
    });

    // Try to sync immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncPendingActions();
    }
  }

  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const actions = await this.offlineStorage.getPendingActions();

      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.offlineStorage.removePendingAction(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Keep action in queue for retry
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeAction(action: {
    type: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // Execute action based on type
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }
}

// Export singleton instances
export const cacheManager = CacheManager.getInstance();
export const offlineStorage = new OfflineStorage();
export const backgroundSync = new BackgroundSyncManager();
