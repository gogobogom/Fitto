// DOM Performance Optimizations

// Passive event listener helper
export function addPassiveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): () => void {
  const passiveSupported = checkPassiveSupport();
  
  const finalOptions: AddEventListenerOptions = passiveSupported
    ? { ...options, passive: options.passive !== false }
    : options;

  element.addEventListener(event, handler, finalOptions);
  
  return () => element.removeEventListener(event, handler, finalOptions);
}

// Check if passive events are supported
let passiveSupported: boolean | null = null;
function checkPassiveSupport(): boolean {
  if (passiveSupported !== null) return passiveSupported;
  
  passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return true;
      }
    };
    window.addEventListener('test', null as unknown as EventListener, options);
    window.removeEventListener('test', null as unknown as EventListener, options);
  } catch {
    passiveSupported = false;
  }
  return passiveSupported;
}

// Optimized scroll handler
export class ScrollOptimizer {
  private static instance: ScrollOptimizer;
  private ticking = false;
  private lastScrollY = 0;
  private callbacks: Set<(scrollY: number, direction: 'up' | 'down') => void> = new Set();
  private cleanup: (() => void) | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): ScrollOptimizer {
    if (!ScrollOptimizer.instance) {
      ScrollOptimizer.instance = new ScrollOptimizer();
    }
    return ScrollOptimizer.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    const handleScroll = (): void => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > this.lastScrollY ? 'down' : 'up';
          
          this.callbacks.forEach(callback => callback(currentScrollY, direction));
          
          this.lastScrollY = currentScrollY;
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    this.cleanup = addPassiveEventListener(window, 'scroll', handleScroll);
  }

  subscribe(callback: (scrollY: number, direction: 'up' | 'down') => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getScrollPosition(): number {
    return this.lastScrollY;
  }

  destroy(): void {
    this.cleanup?.();
    this.callbacks.clear();
  }
}

// Optimized resize handler
export class ResizeOptimizer {
  private static instance: ResizeOptimizer;
  private ticking = false;
  private callbacks: Set<(width: number, height: number) => void> = new Set();
  private resizeObserver: ResizeObserver | null = null;
  private currentWidth = 0;
  private currentHeight = 0;

  private constructor() {
    this.init();
  }

  static getInstance(): ResizeOptimizer {
    if (!ResizeOptimizer.instance) {
      ResizeOptimizer.instance = new ResizeOptimizer();
    }
    return ResizeOptimizer.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    this.currentWidth = window.innerWidth;
    this.currentHeight = window.innerHeight;

    // Use ResizeObserver for better performance
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        if (!this.ticking) {
          requestAnimationFrame(() => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              this.currentWidth = width;
              this.currentHeight = height;
              this.callbacks.forEach(callback => callback(width, height));
            }
            this.ticking = false;
          });
          this.ticking = true;
        }
      });

      this.resizeObserver.observe(document.documentElement);
    } else {
      // Fallback to resize event
      const handleResize = (): void => {
        if (!this.ticking) {
          requestAnimationFrame(() => {
            this.currentWidth = window.innerWidth;
            this.currentHeight = window.innerHeight;
            this.callbacks.forEach(callback => 
              callback(this.currentWidth, this.currentHeight)
            );
            this.ticking = false;
          });
          this.ticking = true;
        }
      };

      window.addEventListener('resize', handleResize);
    }
  }

  subscribe(callback: (width: number, height: number) => void): () => void {
    this.callbacks.add(callback);
    // Immediately call with current dimensions
    callback(this.currentWidth, this.currentHeight);
    return () => this.callbacks.delete(callback);
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.currentWidth, height: this.currentHeight };
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.callbacks.clear();
  }
}

// DOM mutation batching
export class DOMBatcher {
  private static instance: DOMBatcher;
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private scheduled = false;

  private constructor() {}

  static getInstance(): DOMBatcher {
    if (!DOMBatcher.instance) {
      DOMBatcher.instance = new DOMBatcher();
    }
    return DOMBatcher.instance;
  }

  read(fn: () => void): void {
    this.readQueue.push(fn);
    this.schedule();
  }

  write(fn: () => void): void {
    this.writeQueue.push(fn);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      // Execute all reads first
      const reads = this.readQueue.splice(0);
      reads.forEach(fn => {
        try { fn(); } catch (e) { console.error('DOM read error:', e); }
      });

      // Then execute all writes
      const writes = this.writeQueue.splice(0);
      writes.forEach(fn => {
        try { fn(); } catch (e) { console.error('DOM write error:', e); }
      });

      this.scheduled = false;

      // If more tasks were added during execution, schedule again
      if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
        this.schedule();
      }
    });
  }

  clear(): void {
    this.readQueue = [];
    this.writeQueue = [];
    this.scheduled = false;
  }
}

// Focus trap for modals
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.updateFocusableElements();
  }

  private updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    if (this.focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }

  activate(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    this.firstFocusable?.focus();
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  update(): void {
    this.updateFocusableElements();
  }
}

// Visibility change handler
export class VisibilityManager {
  private static instance: VisibilityManager;
  private callbacks: Set<(visible: boolean) => void> = new Set();

  private constructor() {
    this.init();
  }

  static getInstance(): VisibilityManager {
    if (!VisibilityManager.instance) {
      VisibilityManager.instance = new VisibilityManager();
    }
    return VisibilityManager.instance;
  }

  private init(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      this.callbacks.forEach(callback => callback(isVisible));
    });
  }

  subscribe(callback: (visible: boolean) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  isVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  }
}

// Reduced motion detector
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

// Export singleton instances
export const scrollOptimizer = ScrollOptimizer.getInstance();
export const resizeOptimizer = ResizeOptimizer.getInstance();
export const domBatcher = DOMBatcher.getInstance();
export const visibilityManager = VisibilityManager.getInstance();
