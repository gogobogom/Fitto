/**
 * Request Batching and Deduplication
 * İstek birleştirme ve tekrar önleme sistemi
 */

type BatchedRequest<T> = {
  key: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
};

type BatchProcessor<K, V> = (keys: K[]) => Promise<Map<K, V>>;

// Request deduplication
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private requestTimestamps: Map<string, number> = new Map();
  private readonly dedupeWindow: number;

  constructor(dedupeWindowMs: number = 100) {
    this.dedupeWindow = dedupeWindowMs;
  }

  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const lastTimestamp = this.requestTimestamps.get(key);

    // Check if there's a recent pending request
    if (lastTimestamp && now - lastTimestamp < this.dedupeWindow) {
      const pending = this.pendingRequests.get(key);
      if (pending) {
        return pending as Promise<T>;
      }
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          if (this.requestTimestamps.get(key) === now) {
            this.pendingRequests.delete(key);
            this.requestTimestamps.delete(key);
          }
        }, this.dedupeWindow);
      });

    this.pendingRequests.set(key, promise);
    this.requestTimestamps.set(key, now);

    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
    this.requestTimestamps.clear();
  }
}

// Batch request processor
class BatchProcessor<K, V> {
  private queue: BatchedRequest<V>[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly processor: (keys: K[]) => Promise<Map<K, V>>;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly keyExtractor: (request: BatchedRequest<V>) => K;

  constructor(options: {
    processor: (keys: K[]) => Promise<Map<K, V>>;
    batchSize?: number;
    batchDelay?: number;
    keyExtractor: (request: BatchedRequest<V>) => K;
  }) {
    this.processor = options.processor;
    this.batchSize = options.batchSize || 50;
    this.batchDelay = options.batchDelay || 10;
    this.keyExtractor = options.keyExtractor;
  }

  async add(key: string): Promise<V> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        resolve: resolve as (value: V) => void,
        reject,
        timestamp: Date.now(),
      });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const keys = batch.map(this.keyExtractor);

    try {
      const results = await this.processor(keys);
      
      batch.forEach(request => {
        const key = this.keyExtractor(request);
        const result = results.get(key);
        if (result !== undefined) {
          request.resolve(result);
        } else {
          request.reject(new Error(`No result for key: ${request.key}`));
        }
      });
    } catch (error) {
      batch.forEach(request => {
        request.reject(error as Error);
      });
    }

    // Process remaining items
    if (this.queue.length > 0) {
      this.batchTimeout = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.queue.forEach(request => {
      request.reject(new Error('Batch processor cleared'));
    });
    this.queue = [];
  }
}

// Priority queue for requests
interface PriorityRequest<T> {
  priority: number;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class PriorityRequestQueue {
  private queue: PriorityRequest<unknown>[] = [];
  private processing: boolean = false;
  private readonly concurrency: number;
  private activeRequests: number = 0;

  constructor(concurrency: number = 4) {
    this.concurrency = concurrency;
  }

  async add<T>(
    request: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        priority,
        request,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.concurrency) return;
    
    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const item = this.queue.shift();
      if (!item) continue;

      this.activeRequests++;

      item.request()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.processing = false;
  }

  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeRequests;
  }
}

// Request coalescing for similar requests
class RequestCoalescer<T> {
  private groups: Map<string, {
    requests: Array<{
      resolve: (value: T) => void;
      reject: (error: Error) => void;
    }>;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  
  private readonly coalesceFn: (keys: string[]) => Promise<Map<string, T>>;
  private readonly delay: number;

  constructor(
    coalesceFn: (keys: string[]) => Promise<Map<string, T>>,
    delay: number = 50
  ) {
    this.coalesceFn = coalesceFn;
    this.delay = delay;
  }

  async request(groupKey: string, itemKey: string): Promise<T> {
    return new Promise((resolve, reject) => {
      let group = this.groups.get(groupKey);

      if (!group) {
        group = {
          requests: [],
          timeout: setTimeout(() => this.processGroup(groupKey), this.delay),
        };
        this.groups.set(groupKey, group);
      }

      group.requests.push({ resolve, reject });
    });
  }

  private async processGroup(groupKey: string): Promise<void> {
    const group = this.groups.get(groupKey);
    if (!group) return;

    this.groups.delete(groupKey);

    try {
      const results = await this.coalesceFn([groupKey]);
      const result = results.get(groupKey);

      group.requests.forEach(({ resolve, reject }) => {
        if (result !== undefined) {
          resolve(result);
        } else {
          reject(new Error(`No result for group: ${groupKey}`));
        }
      });
    } catch (error) {
      group.requests.forEach(({ reject }) => {
        reject(error as Error);
      });
    }
  }
}

// Singleton instances
let deduplicatorInstance: RequestDeduplicator | null = null;
let priorityQueueInstance: PriorityRequestQueue | null = null;

export function getDeduplicator(windowMs?: number): RequestDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new RequestDeduplicator(windowMs);
  }
  return deduplicatorInstance;
}

export function getPriorityQueue(concurrency?: number): PriorityRequestQueue {
  if (!priorityQueueInstance) {
    priorityQueueInstance = new PriorityRequestQueue(concurrency);
  }
  return priorityQueueInstance;
}

// Request priority levels
export const RequestPriority = {
  CRITICAL: 100,    // Auth, user data
  HIGH: 75,         // Current view data
  NORMAL: 50,       // Background data
  LOW: 25,          // Prefetch
  BACKGROUND: 0,    // Analytics, non-essential
};

// Utility: Batch fetch helper
export async function batchFetch<T>(
  urls: string[],
  options?: RequestInit
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        results.set(url, data);
      }
    } catch (error) {
      console.warn(`Failed to fetch ${url}:`, error);
    }
  });

  await Promise.allSettled(fetchPromises);
  return results;
}

// Utility: Debounced batch
export function createDebouncedBatch<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  delay: number = 50
): (item: T) => Promise<R> {
  let batch: T[] = [];
  let resolvers: Array<(value: R) => void> = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    const currentBatch = batch;
    const currentResolvers = resolvers;
    batch = [];
    resolvers = [];
    timeout = null;

    try {
      const results = await processor(currentBatch);
      currentResolvers.forEach((resolve, index) => {
        resolve(results[index]);
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  };

  return (item: T): Promise<R> => {
    return new Promise((resolve) => {
      batch.push(item);
      resolvers.push(resolve);

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(flush, delay);
    });
  };
}

export {
  RequestDeduplicator,
  BatchProcessor,
  PriorityRequestQueue,
  RequestCoalescer,
};
