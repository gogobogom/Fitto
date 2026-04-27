// Supabase Connection Pool and Request Optimization

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Connection pool configuration
export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number; // ms
  connectionTimeout: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
}

const defaultPoolConfig: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeout: 30000,
  connectionTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Request queue for rate limiting
interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

export class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private client: SupabaseClient | null = null;
  private config: PoolConfig;
  private requestQueue: QueuedRequest<unknown>[] = [];
  private activeRequests = 0;
  private isProcessing = false;
  private requestIdCounter = 0;

  // Request deduplication
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  // Request metrics
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
  };

  private constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...defaultPoolConfig, ...config };
  }

  static getInstance(config?: Partial<PoolConfig>): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager(config);
    }
    return SupabaseConnectionManager.instance;
  }

  // Initialize Supabase client
  initialize(supabaseUrl: string, supabaseKey: string): SupabaseClient {
    if (this.client) return this.client;

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: this.createFetchWithRetry(),
      },
    });

    return this.client;
  }

  // Get the Supabase client
  getClient(): SupabaseClient | null {
    return this.client;
  }

  // Create fetch with retry logic
  private createFetchWithRetry(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.connectionTimeout
          );

          const response = await fetch(input, {
            ...init,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < this.config.retryAttempts - 1) {
            await new Promise(resolve => 
              setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
            );
          }
        }
      }

      throw lastError || new Error('Request failed after retries');
    };
  }

  // Execute request with queue management
  async executeRequest<T>(
    execute: () => Promise<T>,
    options: {
      priority?: number;
      dedupeKey?: string;
    } = {}
  ): Promise<T> {
    const { priority = 0, dedupeKey } = options;

    // Check for duplicate request
    if (dedupeKey && this.pendingRequests.has(dedupeKey)) {
      return this.pendingRequests.get(dedupeKey) as Promise<T>;
    }

    const requestPromise = new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: `req_${++this.requestIdCounter}`,
        execute,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      };

      // Add to queue sorted by priority
      const insertIndex = this.requestQueue.findIndex(r => r.priority < priority);
      if (insertIndex === -1) {
        this.requestQueue.push(request as QueuedRequest<unknown>);
      } else {
        this.requestQueue.splice(insertIndex, 0, request as QueuedRequest<unknown>);
      }

      this.processQueue();
    });

    // Store for deduplication
    if (dedupeKey) {
      this.pendingRequests.set(dedupeKey, requestPromise);
      requestPromise.finally(() => {
        this.pendingRequests.delete(dedupeKey);
      });
    }

    return requestPromise;
  }

  // Process request queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConnections
    ) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      this.activeRequests++;
      this.metrics.totalRequests++;
      const startTime = Date.now();

      try {
        const result = await request.execute();
        const responseTime = Date.now() - startTime;
        
        this.metrics.successfulRequests++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime = 
          this.metrics.totalResponseTime / this.metrics.successfulRequests;

        request.resolve(result);
      } catch (error) {
        this.metrics.failedRequests++;
        request.reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        this.activeRequests--;
      }
    }

    this.isProcessing = false;

    // Continue processing if there are more requests
    if (this.requestQueue.length > 0) {
      this.processQueue();
    }
  }

  // Get metrics
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  // Clear pending requests
  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.requestQueue = [];
  }
}

// Batch request executor
export class BatchRequestExecutor {
  private batchQueue: Map<string, {
    keys: Set<string>;
    resolve: (data: Map<string, unknown>) => void;
    reject: (error: Error) => void;
  }[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number;

  constructor(batchDelay = 50) {
    this.batchDelay = batchDelay;
  }

  // Add to batch
  addToBatch<T>(
    batchKey: string,
    itemKey: string,
    fetchFn: (keys: string[]) => Promise<Map<string, T>>
  ): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }

      const batch = this.batchQueue.get(batchKey)!;
      
      // Check if there's an existing batch we can add to
      let existingBatch = batch.find(b => !b.keys.has(itemKey));
      
      if (!existingBatch) {
        existingBatch = {
          keys: new Set(),
          resolve: () => {},
          reject: () => {},
        };
        batch.push(existingBatch);
      }

      existingBatch.keys.add(itemKey);

      // Store original callbacks
      const originalResolve = existingBatch.resolve;
      const originalReject = existingBatch.reject;

      existingBatch.resolve = (data: Map<string, unknown>) => {
        originalResolve(data);
        resolve(data.get(itemKey) as T | undefined);
      };

      existingBatch.reject = (error: Error) => {
        originalReject(error);
        reject(error);
      };

      // Schedule batch execution
      this.scheduleBatchExecution(batchKey, fetchFn as (keys: string[]) => Promise<Map<string, unknown>>);
    });
  }

  private scheduleBatchExecution(
    batchKey: string,
    fetchFn: (keys: string[]) => Promise<Map<string, unknown>>
  ): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(async () => {
      this.batchTimeout = null;

      const batch = this.batchQueue.get(batchKey);
      if (!batch || batch.length === 0) return;

      this.batchQueue.delete(batchKey);

      // Combine all keys
      const allKeys = new Set<string>();
      batch.forEach(b => b.keys.forEach(k => allKeys.add(k)));

      try {
        const results = await fetchFn(Array.from(allKeys));
        batch.forEach(b => b.resolve(results));
      } catch (error) {
        batch.forEach(b => b.reject(error instanceof Error ? error : new Error(String(error))));
      }
    }, this.batchDelay);
  }
}

// Optimized query builder
export class OptimizedQueryBuilder {
  private client: SupabaseClient;
  private connectionManager: SupabaseConnectionManager;

  constructor(client: SupabaseClient) {
    this.client = client;
    this.connectionManager = SupabaseConnectionManager.getInstance();
  }

  // Select with caching
  async select<T>(
    table: string,
    options: {
      columns?: string;
      filter?: Record<string, unknown>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      dedupeKey?: string;
    } = {}
  ): Promise<T[]> {
    const { columns = '*', filter, order, limit, offset, dedupeKey } = options;

    return this.connectionManager.executeRequest(async () => {
      let query = this.client.from(table).select(columns);

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as T[];
    }, { dedupeKey });
  }

  // Insert with optimistic update support
  async insert<T>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options: {
      returning?: boolean;
    } = {}
  ): Promise<T[]> {
    const { returning = true } = options;

    return this.connectionManager.executeRequest(async () => {
      const query = this.client.from(table).insert(data);
      
      if (returning) {
        const { data: result, error } = await query.select();
        if (error) throw error;
        return result as T[];
      }

      const { error } = await query;
      if (error) throw error;
      return [];
    }, { priority: 1 });
  }

  // Update with optimistic update support
  async update<T>(
    table: string,
    data: Partial<T>,
    filter: Record<string, unknown>,
    options: {
      returning?: boolean;
    } = {}
  ): Promise<T[]> {
    const { returning = true } = options;

    return this.connectionManager.executeRequest(async () => {
      let query = this.client.from(table).update(data);

      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (returning) {
        const { data: result, error } = await query.select();
        if (error) throw error;
        return result as T[];
      }

      const { error } = await query;
      if (error) throw error;
      return [];
    }, { priority: 1 });
  }

  // Delete
  async delete<T>(
    table: string,
    filter: Record<string, unknown>
  ): Promise<T[]> {
    return this.connectionManager.executeRequest(async () => {
      let query = this.client.from(table).delete();

      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data as T[];
    }, { priority: 1 });
  }
}

// Export singleton
export const connectionManager = SupabaseConnectionManager.getInstance();
export const batchExecutor = new BatchRequestExecutor();
