/**
 * Intersection Observer Utilities
 * Görünürlük gözlem araçları
 */

// Observer options
export interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

// Callback types
export type IntersectionCallback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
) => void;

// Shared observer manager
class IntersectionObserverManager {
  private observers: Map<string, IntersectionObserver> = new Map();
  private callbacks: Map<Element, Map<string, IntersectionCallback>> = new Map();

  // Get or create observer for given options
  private getObserver(options: IntersectionOptions): IntersectionObserver {
    const key = this.getOptionsKey(options);
    
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const elementCallbacks = this.callbacks.get(entry.target);
          if (elementCallbacks) {
            elementCallbacks.forEach(callback => {
              callback(entry, observer);
            });
          }
        });
      }, options);
      
      this.observers.set(key, observer);
    }

    return this.observers.get(key)!;
  }

  // Generate unique key for options
  private getOptionsKey(options: IntersectionOptions): string {
    return JSON.stringify({
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0,
    });
  }

  // Observe an element
  observe(
    element: Element,
    callback: IntersectionCallback,
    options: IntersectionOptions = {}
  ): () => void {
    const observer = this.getObserver(options);
    const key = this.getOptionsKey(options);

    // Store callback
    if (!this.callbacks.has(element)) {
      this.callbacks.set(element, new Map());
    }
    this.callbacks.get(element)!.set(key, callback);

    // Start observing
    observer.observe(element);

    // Return unobserve function
    return () => {
      const elementCallbacks = this.callbacks.get(element);
      if (elementCallbacks) {
        elementCallbacks.delete(key);
        if (elementCallbacks.size === 0) {
          this.callbacks.delete(element);
        }
      }
      observer.unobserve(element);
    };
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.callbacks.clear();
  }
}

// Singleton manager
const observerManager = new IntersectionObserverManager();

// Simple observe function
export function observe(
  element: Element,
  callback: IntersectionCallback,
  options?: IntersectionOptions
): () => void {
  return observerManager.observe(element, callback, options);
}

// Lazy load images
export function lazyLoadImage(
  img: HTMLImageElement,
  options: {
    src: string;
    srcset?: string;
    placeholder?: string;
    onLoad?: () => void;
    rootMargin?: string;
  }
): () => void {
  const { src, srcset, placeholder, onLoad, rootMargin = '50px' } = options;

  // Set placeholder
  if (placeholder) {
    img.src = placeholder;
  }

  return observe(
    img,
    (entry, observer) => {
      if (entry.isIntersecting) {
        // Load actual image
        img.src = src;
        if (srcset) {
          img.srcset = srcset;
        }

        img.onload = () => {
          img.classList.add('loaded');
          onLoad?.();
        };

        observer.unobserve(img);
      }
    },
    { rootMargin }
  );
}

// Lazy load component (visibility trigger)
export function lazyLoadComponent(
  element: Element,
  onVisible: () => void,
  options: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
  } = {}
): () => void {
  const { rootMargin = '100px', threshold = 0, once = true } = options;

  return observe(
    element,
    (entry, observer) => {
      if (entry.isIntersecting) {
        onVisible();
        if (once) {
          observer.unobserve(element);
        }
      }
    },
    { rootMargin, threshold }
  );
}

// Infinite scroll trigger
export function infiniteScroll(
  sentinel: Element,
  onLoadMore: () => Promise<void>,
  options: {
    rootMargin?: string;
    enabled?: boolean;
  } = {}
): () => void {
  const { rootMargin = '200px' } = options;
  let isLoading = false;

  return observe(
    sentinel,
    async (entry) => {
      if (entry.isIntersecting && !isLoading) {
        isLoading = true;
        try {
          await onLoadMore();
        } finally {
          isLoading = false;
        }
      }
    },
    { rootMargin }
  );
}

// Scroll spy for navigation
export function scrollSpy(
  sections: Element[],
  onActiveChange: (activeIndex: number, element: Element) => void,
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): () => void {
  const { rootMargin = '-50% 0px', threshold = 0 } = options;
  const unobservers: Array<() => void> = [];

  sections.forEach((section, index) => {
    const unobserve = observe(
      section,
      (entry) => {
        if (entry.isIntersecting) {
          onActiveChange(index, section);
        }
      },
      { rootMargin, threshold }
    );
    unobservers.push(unobserve);
  });

  return () => {
    unobservers.forEach(fn => fn());
  };
}

// Animate on scroll
export function animateOnScroll(
  element: Element,
  animationClass: string,
  options: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
    delay?: number;
  } = {}
): () => void {
  const { rootMargin = '0px', threshold = 0.1, once = true, delay = 0 } = options;

  return observe(
    element,
    (entry, observer) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          element.classList.add(animationClass);
        }, delay);

        if (once) {
          observer.unobserve(element);
        }
      } else if (!once) {
        element.classList.remove(animationClass);
      }
    },
    { rootMargin, threshold }
  );
}

// Track element visibility
export function trackVisibility(
  element: Element,
  onVisibilityChange: (isVisible: boolean, visibilityRatio: number) => void,
  options: {
    threshold?: number[];
  } = {}
): () => void {
  const { threshold = [0, 0.25, 0.5, 0.75, 1] } = options;

  return observe(
    element,
    (entry) => {
      onVisibilityChange(entry.isIntersecting, entry.intersectionRatio);
    },
    { threshold }
  );
}

// Pause video when out of view
export function autoPauseVideo(video: HTMLVideoElement): () => void {
  let wasPlaying = false;

  return observe(
    video,
    (entry) => {
      if (entry.isIntersecting) {
        if (wasPlaying) {
          video.play().catch(() => {});
        }
      } else {
        wasPlaying = !video.paused;
        video.pause();
      }
    },
    { threshold: 0.5 }
  );
}

// Preload content before it's visible
export function preloadOnApproach(
  element: Element,
  preloadFn: () => void,
  options: {
    rootMargin?: string;
  } = {}
): () => void {
  const { rootMargin = '500px' } = options;

  return observe(
    element,
    (entry, observer) => {
      if (entry.isIntersecting) {
        preloadFn();
        observer.unobserve(element);
      }
    },
    { rootMargin }
  );
}

// Batch visibility changes
export function batchVisibilityObserver(
  elements: Element[],
  onBatchChange: (visibleElements: Element[], hiddenElements: Element[]) => void,
  options: IntersectionOptions = {}
): () => void {
  const visibleSet = new Set<Element>();
  const unobservers: Array<() => void> = [];
  let rafId: number | null = null;

  const notifyBatch = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      const visible = elements.filter(el => visibleSet.has(el));
      const hidden = elements.filter(el => !visibleSet.has(el));
      onBatchChange(visible, hidden);
      rafId = null;
    });
  };

  elements.forEach(element => {
    const unobserve = observe(
      element,
      (entry) => {
        if (entry.isIntersecting) {
          visibleSet.add(element);
        } else {
          visibleSet.delete(element);
        }
        notifyBatch();
      },
      options
    );
    unobservers.push(unobserve);
  });

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    unobservers.forEach(fn => fn());
  };
}

// Sticky element detector
export function detectSticky(
  element: Element,
  onStickyChange: (isSticky: boolean) => void
): () => void {
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position: absolute; top: -1px; height: 1px; width: 100%; pointer-events: none;';
  
  const parent = element.parentElement;
  if (parent) {
    parent.style.position = 'relative';
    parent.insertBefore(sentinel, element);
  }

  const unobserve = observe(
    sentinel,
    (entry) => {
      onStickyChange(!entry.isIntersecting);
    },
    { threshold: [1] }
  );

  return () => {
    unobserve();
    sentinel.remove();
  };
}

// Export manager for manual control
export { observerManager as IntersectionObserverManager };
