'use client';

/**
 * Image Format Optimization Hook
 * Provides WebP/AVIF format detection and optimization utilities
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  supportsWebP,
  supportsAVIF,
  getBestSupportedFormat,
  getOptimalImageUrl,
  generatePictureSources,
  generateBlurPlaceholder,
  loadProgressively,
  analyzeImage,
  type PictureSource,
  type OptimizationReport,
} from '@/lib/imageFormatOptimizer';

interface FormatSupport {
  webp: boolean;
  avif: boolean;
  bestFormat: 'avif' | 'webp' | 'original';
  isLoading: boolean;
}

/**
 * Hook for checking image format support
 */
export function useImageFormatSupport(): FormatSupport {
  const [support, setSupport] = useState<FormatSupport>({
    webp: false,
    avif: false,
    bestFormat: 'original',
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const checkSupport = async () => {
      const [webp, avif] = await Promise.all([
        supportsWebP(),
        supportsAVIF(),
      ]);

      const bestFormat = avif ? 'avif' : webp ? 'webp' : 'original';

      if (mounted) {
        setSupport({
          webp,
          avif,
          bestFormat,
          isLoading: false,
        });
      }
    };

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  return support;
}

/**
 * Hook for optimal image URL selection
 */
export function useOptimalImage(
  originalUrl: string,
  options: {
    webpUrl?: string;
    avifUrl?: string;
  } = {}
): { url: string; isLoading: boolean } {
  const [url, setUrl] = useState(originalUrl);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const selectOptimal = async () => {
      const optimalUrl = await getOptimalImageUrl(originalUrl, options);
      
      if (mounted) {
        setUrl(optimalUrl);
        setIsLoading(false);
      }
    };

    selectOptimal();

    return () => {
      mounted = false;
    };
  }, [originalUrl, options]);

  return { url, isLoading };
}

/**
 * Hook for generating picture sources
 */
export function usePictureSources(
  baseUrl: string,
  widths: number[] = [640, 1024, 1920]
): { sources: PictureSource[]; isLoading: boolean } {
  const [sources, setSources] = useState<PictureSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const generate = async () => {
      const generatedSources = await generatePictureSources(baseUrl, widths);
      
      if (mounted) {
        setSources(generatedSources);
        setIsLoading(false);
      }
    };

    generate();

    return () => {
      mounted = false;
    };
  }, [baseUrl, widths]);

  return { sources, isLoading };
}

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
): {
  currentSrc: string;
  isLoaded: boolean;
  error: Error | null;
} {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      // Start with low quality
      setCurrentSrc(lowQualitySrc);

      // Load high quality
      const img = new Image();
      
      img.onload = () => {
        if (mounted) {
          setCurrentSrc(highQualitySrc);
          setIsLoaded(true);
        }
      };

      img.onerror = () => {
        if (mounted) {
          setError(new Error(`Failed to load image: ${highQualitySrc}`));
        }
      };

      img.src = highQualitySrc;
    };

    loadImages();

    return () => {
      mounted = false;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { currentSrc, isLoaded, error };
}

/**
 * Hook for blur placeholder generation
 */
export function useBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#e5e5e5'
): string {
  return useMemo(
    () => generateBlurPlaceholder(width, height, color),
    [width, height, color]
  );
}

/**
 * Hook for image analysis
 */
export function useImageAnalysis(
  url: string
): {
  report: OptimizationReport | null;
  isAnalyzing: boolean;
  analyze: () => Promise<void>;
} {
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const analysisReport = await analyzeImage(url);
      setReport(analysisReport);
    } catch (error) {
      console.error('Image analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [url]);

  return { report, isAnalyzing, analyze };
}

/**
 * Hook for responsive image handling
 */
export function useResponsiveImage(
  sources: Array<{ src: string; minWidth?: number; maxWidth?: number }>
): string {
  const [currentSrc, setCurrentSrc] = useState(sources[0]?.src || '');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSource = () => {
      const width = window.innerWidth;
      
      for (const source of sources) {
        const matchesMin = !source.minWidth || width >= source.minWidth;
        const matchesMax = !source.maxWidth || width <= source.maxWidth;
        
        if (matchesMin && matchesMax) {
          setCurrentSrc(source.src);
          return;
        }
      }
      
      // Fallback to last source
      setCurrentSrc(sources[sources.length - 1]?.src || '');
    };

    updateSource();

    window.addEventListener('resize', updateSource);
    return () => window.removeEventListener('resize', updateSource);
  }, [sources]);

  return currentSrc;
}

/**
 * Hook for lazy image loading with intersection observer
 */
export function useLazyImage(
  src: string,
  options: {
    threshold?: number;
    rootMargin?: string;
    placeholder?: string;
  } = {}
): {
  ref: (node: HTMLElement | null) => void;
  isLoaded: boolean;
  currentSrc: string;
} {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    placeholder = generateBlurPlaceholder(10, 10),
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setCurrentSrc(src);
              setIsLoaded(true);
            };
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, src, threshold, rootMargin]);

  return { ref, isLoaded, currentSrc };
}

export default useImageFormatSupport;
