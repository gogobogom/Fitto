/**
 * Image Format Optimizer
 * WebP/AVIF format detection, conversion, and optimization
 */

// Format support cache
let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

/**
 * Check WebP support
 */
export async function supportsWebP(): Promise<boolean> {
  if (webpSupport !== null) return webpSupport;
  if (typeof document === 'undefined') return false;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupport = img.width > 0 && img.height > 0;
      resolve(webpSupport);
    };
    img.onerror = () => {
      webpSupport = false;
      resolve(false);
    };
    // Minimal WebP test image
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
  });
}

/**
 * Check AVIF support
 */
export async function supportsAVIF(): Promise<boolean> {
  if (avifSupport !== null) return avifSupport;
  if (typeof document === 'undefined') return false;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      avifSupport = img.width > 0 && img.height > 0;
      resolve(avifSupport);
    };
    img.onerror = () => {
      avifSupport = false;
      resolve(false);
    };
    // Minimal AVIF test image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABc0JhqwK/P7w2AAAADAQmQAADA0Aig==';
  });
}

/**
 * Get best supported format
 */
export async function getBestSupportedFormat(): Promise<'avif' | 'webp' | 'original'> {
  const [avif, webp] = await Promise.all([
    supportsAVIF(),
    supportsWebP(),
  ]);

  if (avif) return 'avif';
  if (webp) return 'webp';
  return 'original';
}

/**
 * Image format info
 */
export interface ImageFormatInfo {
  format: string;
  quality: number;
  compressionRatio: number;
  recommended: boolean;
}

export const formatInfo: Record<string, ImageFormatInfo> = {
  avif: {
    format: 'AVIF',
    quality: 80,
    compressionRatio: 0.5, // ~50% smaller than JPEG
    recommended: true,
  },
  webp: {
    format: 'WebP',
    quality: 85,
    compressionRatio: 0.7, // ~30% smaller than JPEG
    recommended: true,
  },
  jpeg: {
    format: 'JPEG',
    quality: 85,
    compressionRatio: 1,
    recommended: false,
  },
  png: {
    format: 'PNG',
    quality: 100,
    compressionRatio: 1.2, // Usually larger
    recommended: false,
  },
};

/**
 * Get optimal image URL based on format support
 */
export async function getOptimalImageUrl(
  originalUrl: string,
  options: {
    webpUrl?: string;
    avifUrl?: string;
  } = {}
): Promise<string> {
  const bestFormat = await getBestSupportedFormat();

  if (bestFormat === 'avif' && options.avifUrl) {
    return options.avifUrl;
  }
  if (bestFormat === 'webp' && options.webpUrl) {
    return options.webpUrl;
  }

  return originalUrl;
}

/**
 * Generate srcset for responsive images with format optimization
 */
export interface ResponsiveSrcSet {
  srcset: string;
  sizes: string;
  type: string;
}

export function generateResponsiveSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920],
  format: 'webp' | 'avif' | 'original' = 'original'
): ResponsiveSrcSet {
  const extension = format === 'original' ? '' : `.${format}`;
  
  const srcset = widths
    .map((w) => {
      // Assuming URL pattern like: /images/photo.jpg -> /images/photo-320.webp
      const optimizedUrl = baseUrl.replace(
        /\.(jpg|jpeg|png|gif)$/i,
        `-${w}${extension || '.$1'}`
      );
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');

  const sizes = `
    (max-width: 320px) 320px,
    (max-width: 640px) 640px,
    (max-width: 768px) 768px,
    (max-width: 1024px) 1024px,
    (max-width: 1280px) 1280px,
    1920px
  `.replace(/\s+/g, ' ').trim();

  const mimeTypes: Record<string, string> = {
    webp: 'image/webp',
    avif: 'image/avif',
    original: 'image/jpeg',
  };

  return {
    srcset,
    sizes,
    type: mimeTypes[format],
  };
}

/**
 * Picture element source generator
 */
export interface PictureSource {
  srcset: string;
  type: string;
  media?: string;
}

export async function generatePictureSources(
  baseUrl: string,
  widths: number[] = [640, 1024, 1920]
): Promise<PictureSource[]> {
  const sources: PictureSource[] = [];
  const [hasAvif, hasWebp] = await Promise.all([
    supportsAVIF(),
    supportsWebP(),
  ]);

  // AVIF sources (if supported)
  if (hasAvif) {
    sources.push({
      srcset: widths
        .map((w) => `${baseUrl.replace(/\.[^.]+$/, `-${w}.avif`)} ${w}w`)
        .join(', '),
      type: 'image/avif',
    });
  }

  // WebP sources (if supported)
  if (hasWebp) {
    sources.push({
      srcset: widths
        .map((w) => `${baseUrl.replace(/\.[^.]+$/, `-${w}.webp`)} ${w}w`)
        .join(', '),
      type: 'image/webp',
    });
  }

  // Fallback JPEG/PNG
  sources.push({
    srcset: widths
      .map((w) => `${baseUrl.replace(/\.([^.]+)$/, `-${w}.$1`)} ${w}w`)
      .join(', '),
    type: baseUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
  });

  return sources;
}

/**
 * Lazy load image with format optimization
 */
export function createOptimizedImage(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    fetchPriority?: 'high' | 'low' | 'auto';
    placeholder?: string;
    onLoad?: () => void;
    onError?: () => void;
  } = {}
): HTMLImageElement {
  const img = new Image();
  
  // Set dimensions to prevent layout shift
  if (options.width) img.width = options.width;
  if (options.height) img.height = options.height;
  
  // Performance attributes
  img.loading = options.loading || 'lazy';
  img.decoding = options.decoding || 'async';
  if (options.fetchPriority) {
    img.setAttribute('fetchpriority', options.fetchPriority);
  }
  
  // Accessibility
  img.alt = alt;
  
  // Event handlers
  if (options.onLoad) img.onload = options.onLoad;
  if (options.onError) img.onerror = options.onError;
  
  // Set placeholder first if provided
  if (options.placeholder) {
    img.src = options.placeholder;
  }
  
  // Then set actual source
  img.src = src;
  
  return img;
}

/**
 * Image quality presets
 */
export const qualityPresets = {
  thumbnail: { width: 150, height: 150, quality: 60 },
  small: { width: 320, height: 240, quality: 70 },
  medium: { width: 640, height: 480, quality: 80 },
  large: { width: 1024, height: 768, quality: 85 },
  xlarge: { width: 1920, height: 1080, quality: 90 },
  hero: { width: 2560, height: 1440, quality: 90 },
} as const;

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }
  
  return { width, height };
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#e5e5e5'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#b)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Generate dominant color placeholder
 */
export function generateColorPlaceholder(
  color: string,
  width: number = 1,
  height: number = 1
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="${color}" width="100%" height="100%"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Progressive image loading
 */
export async function loadProgressively(
  lowQualitySrc: string,
  highQualitySrc: string,
  imgElement: HTMLImageElement
): Promise<void> {
  // First, load low quality
  imgElement.src = lowQualitySrc;
  imgElement.style.filter = 'blur(10px)';
  imgElement.style.transition = 'filter 0.3s ease-out';

  // Then, load high quality
  const highQualityImg = new Image();
  
  return new Promise((resolve, reject) => {
    highQualityImg.onload = () => {
      imgElement.src = highQualitySrc;
      imgElement.style.filter = 'blur(0)';
      resolve();
    };
    highQualityImg.onerror = reject;
    highQualityImg.src = highQualitySrc;
  });
}

/**
 * Estimate file size reduction
 */
export function estimateFileSizeReduction(
  originalSizeKB: number,
  targetFormat: 'webp' | 'avif'
): number {
  const reductionRatios: Record<string, number> = {
    webp: 0.25, // ~25-35% smaller
    avif: 0.50, // ~50% smaller
  };
  
  return Math.round(originalSizeKB * reductionRatios[targetFormat]);
}

/**
 * Get image format from URL or content type
 */
export function getImageFormat(urlOrType: string): string {
  const url = urlOrType.toLowerCase();
  
  if (url.includes('webp') || url.endsWith('.webp')) return 'webp';
  if (url.includes('avif') || url.endsWith('.avif')) return 'avif';
  if (url.includes('png') || url.endsWith('.png')) return 'png';
  if (url.includes('gif') || url.endsWith('.gif')) return 'gif';
  if (url.includes('svg') || url.endsWith('.svg')) return 'svg';
  
  return 'jpeg';
}

/**
 * Check if image is already optimized format
 */
export function isOptimizedFormat(url: string): boolean {
  const format = getImageFormat(url);
  return format === 'webp' || format === 'avif';
}

/**
 * Image optimization report
 */
export interface OptimizationReport {
  format: string;
  isOptimized: boolean;
  recommendedFormat: 'avif' | 'webp' | 'original';
  estimatedSavings: string;
  suggestions: string[];
}

export async function analyzeImage(url: string): Promise<OptimizationReport> {
  const format = getImageFormat(url);
  const isOptimized = isOptimizedFormat(url);
  const recommendedFormat = await getBestSupportedFormat();
  
  const suggestions: string[] = [];
  
  if (!isOptimized) {
    suggestions.push(`Convert to ${recommendedFormat.toUpperCase()} for better compression`);
  }
  
  if (!url.includes('-') || !/\d+w/.test(url)) {
    suggestions.push('Add responsive image variants for different screen sizes');
  }
  
  if (!url.includes('blur') && !url.includes('placeholder')) {
    suggestions.push('Add blur placeholder for better perceived performance');
  }

  const estimatedSavings = isOptimized
    ? '0%'
    : recommendedFormat === 'avif'
    ? '~50%'
    : '~25-35%';

  return {
    format,
    isOptimized,
    recommendedFormat,
    estimatedSavings,
    suggestions,
  };
}

export default {
  supportsWebP,
  supportsAVIF,
  getBestSupportedFormat,
  getOptimalImageUrl,
  generateResponsiveSrcSet,
  generatePictureSources,
  createOptimizedImage,
  qualityPresets,
  calculateOptimalDimensions,
  generateBlurPlaceholder,
  generateColorPlaceholder,
  loadProgressively,
  estimateFileSizeReduction,
  getImageFormat,
  isOptimizedFormat,
  analyzeImage,
};
