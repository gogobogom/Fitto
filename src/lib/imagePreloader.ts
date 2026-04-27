/**
 * Image Preloader
 * Advanced image preloading and caching utilities
 */

export interface PreloadOptions {
  /** Priority level */
  priority?: 'high' | 'low';
  /** Timeout in milliseconds */
  timeout?: number;
  /** Cache image */
  cache?: boolean;
  /** Decode image after loading */
  decode?: boolean;
}

// Image cache
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Preload a single image
 */
export function preloadImage(
  src: string,
  options: PreloadOptions = {}
): Promise<HTMLImageElement> {
  const { timeout = 30000, cache = true, decode = true } = options;

  // Return cached image if available
  if (cache && imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  // Return existing promise if already loading
  const existing = loadingPromises.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
      loadingPromises.delete(src);
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);

    img.onload = async () => {
      clearTimeout(timeoutId);
      loadingPromises.delete(src);

      // Decode image for smoother rendering
      if (decode && 'decode' in img) {
        try {
          await img.decode();
        } catch {
          // Ignore decode errors
        }
      }

      if (cache) {
        imageCache.set(src, img);
      }

      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      loadingPromises.delete(src);
      reject(new Error(`Failed to load image: ${src}`));
    };

    // Set fetchpriority for supported browsers
    if (options.priority === 'high') {
      img.setAttribute('fetchpriority', 'high');
    } else if (options.priority === 'low') {
      img.setAttribute('fetchpriority', 'low');
    }

    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

/**
 * Preload multiple images
 */
export async function preloadImages(
  sources: string[],
  options: PreloadOptions & { concurrent?: number } = {}
): Promise<Map<string, HTMLImageElement>> {
  const { concurrent = 4, ...preloadOptions } = options;
  const results = new Map<string, HTMLImageElement>();
  
  // Load in batches
  for (let i = 0; i < sources.length; i += concurrent) {
    const batch = sources.slice(i, i + concurrent);
    const promises = batch.map(async (src) => {
      try {
        const img = await preloadImage(src, preloadOptions);
        results.set(src, img);
      } catch {
        // Skip failed images
      }
    });
    
    await Promise.all(promises);
  }
  
  return results;
}

/**
 * Preload image on idle
 */
export function preloadOnIdle(
  src: string,
  options: PreloadOptions = {}
): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      preloadImage(src, options).catch(() => {});
    });
  } else {
    setTimeout(() => {
      preloadImage(src, options).catch(() => {});
    }, 1);
  }
}

/**
 * Preload images on intersection
 */
export function createIntersectionPreloader(): {
  observe: (element: HTMLElement, src: string, options?: PreloadOptions) => void;
  disconnect: () => void;
} {
  if (typeof IntersectionObserver === 'undefined') {
    return {
      observe: (_, src, options) => {
        preloadImage(src, options).catch(() => {});
      },
      disconnect: () => {},
    };
  }

  const elementSources = new Map<HTMLElement, { src: string; options?: PreloadOptions }>();
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const data = elementSources.get(entry.target as HTMLElement);
          if (data) {
            preloadImage(data.src, data.options).catch(() => {});
            observer.unobserve(entry.target);
            elementSources.delete(entry.target as HTMLElement);
          }
        }
      });
    },
    {
      rootMargin: '300px', // Start preloading before image is visible
    }
  );

  return {
    observe: (element: HTMLElement, src: string, options?: PreloadOptions) => {
      elementSources.set(element, { src, options });
      observer.observe(element);
    },
    disconnect: () => {
      observer.disconnect();
      elementSources.clear();
    },
  };
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  const img = await preloadImage(src);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

/**
 * Check if image is cached
 */
export function isImageCached(src: string): boolean {
  return imageCache.has(src);
}

/**
 * Clear image cache
 */
export function clearImageCache(src?: string): void {
  if (src) {
    imageCache.delete(src);
  } else {
    imageCache.clear();
  }
}

/**
 * Get cache size
 */
export function getImageCacheSize(): number {
  return imageCache.size;
}

/**
 * Responsive image source selector
 */
export function selectResponsiveSource(
  sources: Array<{ src: string; minWidth?: number; maxWidth?: number }>
): string | null {
  if (typeof window === 'undefined') {
    return sources[0]?.src || null;
  }

  const width = window.innerWidth;
  
  for (const source of sources) {
    const matchesMin = !source.minWidth || width >= source.minWidth;
    const matchesMax = !source.maxWidth || width <= source.maxWidth;
    
    if (matchesMin && matchesMax) {
      return source.src;
    }
  }
  
  return sources[sources.length - 1]?.src || null;
}

/**
 * Create srcset string
 */
export function createSrcSet(
  baseSrc: string,
  sizes: number[]
): string {
  return sizes
    .map((size) => {
      const src = baseSrc.replace(/\.(jpg|jpeg|png|webp)$/, `-${size}.$1`);
      return `${src} ${size}w`;
    })
    .join(', ');
}

/**
 * Low-Quality Image Placeholder (LQIP) loader
 */
export async function loadWithLQIP(
  lqipSrc: string,
  fullSrc: string,
  onLqipLoad?: (img: HTMLImageElement) => void,
  onFullLoad?: (img: HTMLImageElement) => void
): Promise<void> {
  // Load LQIP first
  try {
    const lqip = await preloadImage(lqipSrc, { priority: 'high' });
    onLqipLoad?.(lqip);
  } catch {
    // Continue even if LQIP fails
  }

  // Then load full image
  try {
    const full = await preloadImage(fullSrc, { priority: 'low' });
    onFullLoad?.(full);
  } catch {
    // Handle full image load failure
  }
}

/**
 * BlurHash placeholder generator (returns data URL)
 */
export function generatePlaceholderDataUrl(
  width: number,
  height: number,
  color = '#f0f0f0'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * Preload critical images for a page
 */
export function preloadCriticalImages(images: string[]): void {
  images.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Check if image format is supported
 */
export async function supportsImageFormat(
  format: 'webp' | 'avif'
): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  const testImages: Record<string, string> = {
    webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABc0JhqwK/P7w2AAAADAQmQAADA0Aig==',
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0);
    img.onerror = () => resolve(false);
    img.src = testImages[format];
  });
}

export default {
  preloadImage,
  preloadImages,
  preloadOnIdle,
  createIntersectionPreloader,
  getImageDimensions,
  isImageCached,
  clearImageCache,
  getImageCacheSize,
  selectResponsiveSource,
  createSrcSet,
  loadWithLQIP,
  generatePlaceholderDataUrl,
  preloadCriticalImages,
  supportsImageFormat,
};
