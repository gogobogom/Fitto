// Code Splitting and Dynamic Import Utilities

import { ComponentType } from 'react';

export interface ImportConfig {
  preload?: boolean;
  prefetch?: boolean;
  priority?: 'high' | 'low' | 'auto';
  retries?: number;
  timeout?: number;
}

// Track loaded modules
const loadedModules = new Set<string>();
const loadingModules = new Map<string, Promise<unknown>>();
const preloadedLinks = new Set<string>();

// Preload a module
export function preloadModule(modulePath: string): void {
  if (loadedModules.has(modulePath) || preloadedLinks.has(modulePath)) return;
  
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = modulePath;
  document.head.appendChild(link);
  preloadedLinks.add(modulePath);
}

// Prefetch a module (lower priority than preload)
export function prefetchModule(modulePath: string): void {
  if (loadedModules.has(modulePath) || preloadedLinks.has(modulePath)) return;
  
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = modulePath;
  document.head.appendChild(link);
  preloadedLinks.add(modulePath);
}

// Smart module loader with retry logic
export async function loadModuleWithRetry<T>(
  importFn: () => Promise<{ default: T }>,
  options: ImportConfig = {}
): Promise<T> {
  const { retries = 3, timeout = 10000 } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const module = await Promise.race([
        importFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Module load timeout')), timeout)
        ),
      ]);
      return module.default;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait before retry with exponential backoff
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to load module');
}

// Route-based code splitting map
export interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType }>;
  preload?: boolean;
}

export class RoutePrefetcher {
  private routes: Map<string, RouteConfig> = new Map();
  private observer: IntersectionObserver | null = null;

  constructor(routes: RouteConfig[]) {
    routes.forEach(route => this.routes.set(route.path, route));
    this.initObserver();
  }

  private initObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const href = (entry.target as HTMLAnchorElement).getAttribute('href');
            if (href) {
              this.prefetchRoute(href);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );
  }

  prefetchRoute(path: string): void {
    const route = this.routes.get(path);
    if (!route || loadedModules.has(path)) return;

    // Start loading the component
    if (!loadingModules.has(path)) {
      const loadPromise = route.component()
        .then(() => {
          loadedModules.add(path);
          loadingModules.delete(path);
        })
        .catch(() => {
          loadingModules.delete(path);
        });
      
      loadingModules.set(path, loadPromise);
    }
  }

  observeLink(element: HTMLAnchorElement): void {
    this.observer?.observe(element);
  }

  unobserveLink(element: HTMLAnchorElement): void {
    this.observer?.unobserve(element);
  }

  prefetchVisibleRoutes(): void {
    if (typeof document === 'undefined') return;

    const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && this.routes.has(href)) {
        this.observeLink(link);
      }
    });
  }

  destroy(): void {
    this.observer?.disconnect();
    this.routes.clear();
  }
}

// Component-level code splitting utilities
export interface ChunkInfo {
  name: string;
  size?: number;
  dependencies?: string[];
}

export class ChunkManager {
  private static instance: ChunkManager;
  private chunks: Map<string, ChunkInfo> = new Map();
  private loadOrder: string[] = [];

  private constructor() {}

  static getInstance(): ChunkManager {
    if (!ChunkManager.instance) {
      ChunkManager.instance = new ChunkManager();
    }
    return ChunkManager.instance;
  }

  registerChunk(name: string, info: Omit<ChunkInfo, 'name'>): void {
    this.chunks.set(name, { name, ...info });
  }

  markLoaded(name: string): void {
    if (!this.loadOrder.includes(name)) {
      this.loadOrder.push(name);
    }
  }

  getLoadedChunks(): string[] {
    return [...this.loadOrder];
  }

  getChunkInfo(name: string): ChunkInfo | undefined {
    return this.chunks.get(name);
  }

  // Analyze chunk dependencies and suggest optimal loading order
  getOptimalLoadOrder(requiredChunks: string[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const chunk = this.chunks.get(name);
      if (chunk?.dependencies) {
        chunk.dependencies.forEach(dep => visit(dep));
      }
      order.push(name);
    };

    requiredChunks.forEach(name => visit(name));
    return order;
  }
}

// Conditional loading based on feature detection
export interface FeatureLoadConfig {
  feature: string;
  check: () => boolean;
  load: () => Promise<unknown>;
  fallback?: () => Promise<unknown>;
}

export async function loadByFeature(config: FeatureLoadConfig): Promise<unknown> {
  const { check, load, fallback } = config;

  if (check()) {
    return load();
  }

  if (fallback) {
    return fallback();
  }

  throw new Error(`Feature ${config.feature} not supported and no fallback provided`);
}

// Common feature checks
export const featureChecks = {
  webGL: () => {
    if (typeof document === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  },
  
  webWorker: () => typeof Worker !== 'undefined',
  
  indexedDB: () => typeof indexedDB !== 'undefined',
  
  serviceWorker: () => 'serviceWorker' in navigator,
  
  webSocket: () => typeof WebSocket !== 'undefined',
  
  intersectionObserver: () => typeof IntersectionObserver !== 'undefined',
  
  resizeObserver: () => typeof ResizeObserver !== 'undefined',
  
  webAnimations: () => typeof Element !== 'undefined' && 'animate' in Element.prototype,
  
  touchEvents: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  
  pointer: () => typeof PointerEvent !== 'undefined',
  
  webShare: () => navigator && 'share' in navigator,
  
  clipboard: () => navigator && 'clipboard' in navigator,
};

// Priority-based loading queue
export class LoadingQueue {
  private highPriority: Array<() => Promise<unknown>> = [];
  private lowPriority: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private concurrency: number;

  constructor(concurrency = 2) {
    this.concurrency = concurrency;
  }

  add(loadFn: () => Promise<unknown>, priority: 'high' | 'low' = 'low'): void {
    if (priority === 'high') {
      this.highPriority.push(loadFn);
    } else {
      this.lowPriority.push(loadFn);
    }

    this.process();
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.highPriority.length > 0 || this.lowPriority.length > 0) {
      const batch: Array<() => Promise<unknown>> = [];

      // High priority first
      while (batch.length < this.concurrency && this.highPriority.length > 0) {
        const fn = this.highPriority.shift();
        if (fn) batch.push(fn);
      }

      // Fill remaining slots with low priority
      while (batch.length < this.concurrency && this.lowPriority.length > 0) {
        const fn = this.lowPriority.shift();
        if (fn) batch.push(fn);
      }

      if (batch.length > 0) {
        await Promise.allSettled(batch.map(fn => fn()));
      }
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.highPriority = [];
    this.lowPriority = [];
  }
}

// Export singleton
export const chunkManager = ChunkManager.getInstance();
export const loadingQueue = new LoadingQueue();
