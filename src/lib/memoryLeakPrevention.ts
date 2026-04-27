/**
 * Memory Leak Prevention Utilities
 * Bellek sızıntısı önleme araçları
 */

// Weak reference cache for objects
class WeakCache<K extends object, V> {
  private cache: WeakMap<K, V> = new WeakMap();

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

// Auto-cleanup map with TTL
class AutoCleanupMap<K, V> {
  private map: Map<K, { value: V; expiry: number }> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly ttl: number;

  constructor(ttlMs: number = 300000, cleanupIntervalMs: number = 60000) {
    this.ttl = ttlMs;
    this.startCleanup(cleanupIntervalMs);
  }

  set(key: K, value: V, customTtl?: number): void {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.map.set(key, { value, expiry });
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiry) {
      this.map.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  private startCleanup(intervalMs: number): void {
    if (typeof window === 'undefined') return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: K[] = [];
      
      this.map.forEach((entry, key) => {
        if (now > entry.expiry) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.map.delete(key));
    }, intervalMs);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

// Event listener tracker
class EventListenerTracker {
  private listeners: Map<
    EventTarget,
    Array<{
      type: string;
      listener: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }>
  > = new Map();

  add(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);

    const existing = this.listeners.get(target) || [];
    existing.push({ type, listener, options });
    this.listeners.set(target, existing);
  }

  remove(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    target.removeEventListener(type, listener);

    const existing = this.listeners.get(target);
    if (existing) {
      const index = existing.findIndex(
        e => e.type === type && e.listener === listener
      );
      if (index > -1) {
        existing.splice(index, 1);
      }
      if (existing.length === 0) {
        this.listeners.delete(target);
      }
    }
  }

  removeAll(target: EventTarget): void {
    const existing = this.listeners.get(target);
    if (existing) {
      existing.forEach(({ type, listener, options }) => {
        target.removeEventListener(type, listener, options);
      });
      this.listeners.delete(target);
    }
  }

  cleanup(): void {
    this.listeners.forEach((listeners, target) => {
      listeners.forEach(({ type, listener, options }) => {
        target.removeEventListener(type, listener, options);
      });
    });
    this.listeners.clear();
  }

  getCount(): number {
    let count = 0;
    this.listeners.forEach(listeners => {
      count += listeners.length;
    });
    return count;
  }
}

// Timer tracker
class TimerTracker {
  private timeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  private intervals: Set<ReturnType<typeof setInterval>> = new Set();
  private animationFrames: Set<number> = new Set();

  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.timeouts.delete(id);
  }

  setInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const id = setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id: ReturnType<typeof setInterval>): void {
    clearInterval(id);
    this.intervals.delete(id);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = requestAnimationFrame((time) => {
      this.animationFrames.delete(id);
      callback(time);
    });
    this.animationFrames.add(id);
    return id;
  }

  cancelAnimationFrame(id: number): void {
    cancelAnimationFrame(id);
    this.animationFrames.delete(id);
  }

  cleanup(): void {
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    this.animationFrames.forEach(id => cancelAnimationFrame(id));
    this.animationFrames.clear();
  }

  getStats(): { timeouts: number; intervals: number; animationFrames: number } {
    return {
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      animationFrames: this.animationFrames.size,
    };
  }
}

// Subscription tracker
class SubscriptionTracker {
  private subscriptions: Set<{ unsubscribe: () => void }> = new Set();

  add(subscription: { unsubscribe: () => void }): void {
    this.subscriptions.add(subscription);
  }

  remove(subscription: { unsubscribe: () => void }): void {
    subscription.unsubscribe();
    this.subscriptions.delete(subscription);
  }

  cleanup(): void {
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.warn('Failed to unsubscribe:', error);
      }
    });
    this.subscriptions.clear();
  }

  get count(): number {
    return this.subscriptions.size;
  }
}

// DOM reference tracker
class DOMReferenceTracker {
  private references: WeakSet<Node> = new WeakSet();
  private strongRefs: Set<Node> = new Set();

  trackWeak(node: Node): void {
    this.references.add(node);
  }

  trackStrong(node: Node): void {
    this.strongRefs.add(node);
  }

  releaseStrong(node: Node): void {
    this.strongRefs.delete(node);
  }

  cleanup(): void {
    this.strongRefs.clear();
  }

  get strongCount(): number {
    return this.strongRefs.size;
  }
}

// Closure detector
export function detectClosureLeak(fn: Function): string[] {
  const fnString = fn.toString();
  const potentialLeaks: string[] = [];

  // Check for common leak patterns
  const patterns = [
    { regex: /document\.(getElementById|querySelector)/g, name: 'DOM reference' },
    { regex: /window\./g, name: 'Window reference' },
    { regex: /localStorage|sessionStorage/g, name: 'Storage reference' },
    { regex: /setInterval|setTimeout/g, name: 'Timer without cleanup' },
    { regex: /addEventListener/g, name: 'Event listener' },
  ];

  patterns.forEach(({ regex, name }) => {
    if (regex.test(fnString)) {
      potentialLeaks.push(name);
    }
  });

  return potentialLeaks;
}

// Memory pressure detector
export function detectMemoryPressure(): {
  isUnderPressure: boolean;
  usedHeapRatio: number;
} {
  if (typeof window === 'undefined') {
    return { isUnderPressure: false, usedHeapRatio: 0 };
  }

  const memory = (performance as unknown as { memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  } }).memory;

  if (!memory) {
    return { isUnderPressure: false, usedHeapRatio: 0 };
  }

  const usedHeapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  return {
    isUnderPressure: usedHeapRatio > 0.9,
    usedHeapRatio,
  };
}

// Resource cleanup manager
export class ResourceCleanupManager {
  private eventTracker = new EventListenerTracker();
  private timerTracker = new TimerTracker();
  private subscriptionTracker = new SubscriptionTracker();
  private domTracker = new DOMReferenceTracker();
  private customCleanups: Array<() => void> = [];

  // Event listeners
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.eventTracker.add(target, type, listener, options);
  }

  removeEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    this.eventTracker.remove(target, type, listener);
  }

  // Timers
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    return this.timerTracker.setTimeout(callback, delay);
  }

  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    this.timerTracker.clearTimeout(id);
  }

  setInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    return this.timerTracker.setInterval(callback, delay);
  }

  clearInterval(id: ReturnType<typeof setInterval>): void {
    this.timerTracker.clearInterval(id);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    return this.timerTracker.requestAnimationFrame(callback);
  }

  cancelAnimationFrame(id: number): void {
    this.timerTracker.cancelAnimationFrame(id);
  }

  // Subscriptions
  addSubscription(subscription: { unsubscribe: () => void }): void {
    this.subscriptionTracker.add(subscription);
  }

  // Custom cleanup
  addCleanup(cleanup: () => void): void {
    this.customCleanups.push(cleanup);
  }

  // Get stats
  getStats(): {
    eventListeners: number;
    timers: { timeouts: number; intervals: number; animationFrames: number };
    subscriptions: number;
    domReferences: number;
    customCleanups: number;
  } {
    return {
      eventListeners: this.eventTracker.getCount(),
      timers: this.timerTracker.getStats(),
      subscriptions: this.subscriptionTracker.count,
      domReferences: this.domTracker.strongCount,
      customCleanups: this.customCleanups.length,
    };
  }

  // Cleanup everything
  cleanup(): void {
    this.eventTracker.cleanup();
    this.timerTracker.cleanup();
    this.subscriptionTracker.cleanup();
    this.domTracker.cleanup();
    
    this.customCleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Custom cleanup failed:', error);
      }
    });
    this.customCleanups = [];
  }
}

// Global instance
let globalCleanupManager: ResourceCleanupManager | null = null;

export function getCleanupManager(): ResourceCleanupManager {
  if (!globalCleanupManager) {
    globalCleanupManager = new ResourceCleanupManager();
  }
  return globalCleanupManager;
}

// Export classes
export {
  WeakCache,
  AutoCleanupMap,
  EventListenerTracker,
  TimerTracker,
  SubscriptionTracker,
  DOMReferenceTracker,
};
