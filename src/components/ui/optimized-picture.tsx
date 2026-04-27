'use client';

/**
 * Optimized Picture Component
 * Automatically serves WebP/AVIF with fallbacks
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  useImageFormatSupport,
  useLazyImage,
  useProgressiveImage,
  useBlurPlaceholder,
} from '@/hooks/useImageFormat';

export interface OptimizedPictureProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  imgClassName?: string;
  /** WebP version URL */
  webpSrc?: string;
  /** AVIF version URL */
  avifSrc?: string;
  /** Low quality preview URL for progressive loading */
  lqipSrc?: string;
  /** Placeholder color for blur effect */
  placeholderColor?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Priority hint */
  priority?: 'high' | 'low' | 'auto';
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** Aspect ratio (e.g., "16/9") */
  aspectRatio?: string;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Srcset for responsive images */
  srcSet?: string;
  /** Enable progressive loading */
  progressive?: boolean;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: () => void;
  /** Fallback element on error */
  fallback?: React.ReactNode;
  /** Show loading skeleton */
  showSkeleton?: boolean;
  /** Enable zoom on click */
  enableZoom?: boolean;
}

export function OptimizedPicture({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  webpSrc,
  avifSrc,
  lqipSrc,
  placeholderColor = '#e5e5e5',
  loading = 'lazy',
  priority = 'auto',
  objectFit = 'cover',
  objectPosition = 'center',
  aspectRatio,
  sizes,
  srcSet,
  progressive = true,
  onLoad,
  onError,
  fallback,
  showSkeleton = true,
  enableZoom = false,
}: OptimizedPictureProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { webp: supportsWebp, avif: supportsAvif } = useImageFormatSupport();
  const blurPlaceholder = useBlurPlaceholder(10, 10, placeholderColor);

  // Determine best source
  const bestSrc = supportsAvif && avifSrc
    ? avifSrc
    : supportsWebp && webpSrc
    ? webpSrc
    : src;

  // Progressive loading
  const { currentSrc: progressiveSrc, isLoaded: progressiveLoaded } = useProgressiveImage(
    lqipSrc || blurPlaceholder,
    bestSrc
  );

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleZoom = useCallback(() => {
    if (enableZoom) {
      setIsZoomed(!isZoomed);
    }
  }, [enableZoom, isZoomed]);

  // Handle native lazy loading
  useEffect(() => {
    if (loading === 'eager' && imgRef.current) {
      if (imgRef.current.complete) {
        handleLoad();
      }
    }
  }, [loading, handleLoad]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && { aspectRatio }),
    ...(width && { width }),
    ...(height && { height }),
  };

  const imgStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    transition: 'filter 0.3s ease-out, transform 0.3s ease-out',
    filter: isLoaded || progressiveLoaded ? 'blur(0)' : 'blur(10px)',
    transform: isZoomed ? 'scale(2)' : 'scale(1)',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={containerStyle}
    >
      {/* Loading skeleton */}
      {showSkeleton && !isLoaded && !progressiveLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}

      <picture>
        {/* AVIF source */}
        {avifSrc && (
          <source srcSet={avifSrc} type="image/avif" />
        )}
        
        {/* WebP source */}
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        
        {/* Fallback image */}
        <img
          ref={imgRef}
          src={progressive ? progressiveSrc : bestSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={priority}
          sizes={sizes}
          srcSet={srcSet}
          className={cn(
            'w-full h-full',
            enableZoom && 'cursor-zoom-in',
            isZoomed && 'cursor-zoom-out',
            imgClassName
          )}
          style={imgStyle}
          onLoad={handleLoad}
          onError={handleError}
          onClick={handleZoom}
        />
      </picture>

      {/* Zoom overlay */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={bestSrc}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Picture Component
 * Automatically selects best image size and format
 */
export interface ResponsivePictureProps extends Omit<OptimizedPictureProps, 'srcSet' | 'sizes'> {
  /** Image variants for different sizes */
  variants: Array<{
    src: string;
    webpSrc?: string;
    avifSrc?: string;
    minWidth?: number;
    maxWidth?: number;
  }>;
}

export function ResponsivePicture({
  variants,
  ...props
}: ResponsivePictureProps) {
  const [currentVariant, setCurrentVariant] = useState(variants[0]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateVariant = () => {
      const width = window.innerWidth;
      
      for (const variant of variants) {
        const matchesMin = !variant.minWidth || width >= variant.minWidth;
        const matchesMax = !variant.maxWidth || width <= variant.maxWidth;
        
        if (matchesMin && matchesMax) {
          setCurrentVariant(variant);
          return;
        }
      }
      
      setCurrentVariant(variants[variants.length - 1]);
    };

    updateVariant();
    window.addEventListener('resize', updateVariant);
    return () => window.removeEventListener('resize', updateVariant);
  }, [variants]);

  return (
    <OptimizedPicture
      {...props}
      src={currentVariant.src}
      webpSrc={currentVariant.webpSrc}
      avifSrc={currentVariant.avifSrc}
    />
  );
}

/**
 * Lazy Picture Component
 * Loads image only when visible
 */
export function LazyPicture({
  src,
  alt,
  className,
  placeholderColor = '#e5e5e5',
  ...props
}: OptimizedPictureProps) {
  const blurPlaceholder = useBlurPlaceholder(10, 10, placeholderColor);
  const { ref, isLoaded, currentSrc } = useLazyImage(src, {
    placeholder: blurPlaceholder,
    rootMargin: '200px',
  });

  return (
    <div ref={ref} className={className}>
      <OptimizedPicture
        {...props}
        src={currentSrc}
        alt={alt}
        showSkeleton={!isLoaded}
      />
    </div>
  );
}

export default OptimizedPicture;
