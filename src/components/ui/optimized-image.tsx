'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Width for aspect ratio calculation */
  width?: number;
  /** Height for aspect ratio calculation */
  height?: number;
  /** Priority loading (above the fold) */
  priority?: boolean;
  /** Blur placeholder */
  placeholder?: 'blur' | 'empty';
  /** Custom blur data URL */
  blurDataURL?: string;
  /** Callback when image loads */
  onLoadComplete?: () => void;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Fallback image URL */
  fallbackSrc?: string;
}

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder
 * - Error handling with fallback
 * - Smooth loading transition
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoadComplete,
  objectFit = 'cover',
  fallbackSrc,
  className,
  style,
  ...props
}: OptimizedImageProps): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default blur placeholder
  const defaultBlur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';
  
  const placeholderSrc = placeholder === 'blur' 
    ? (blurDataURL || defaultBlur)
    : undefined;

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  // Handle image error
  const handleError = useCallback(() => {
    setIsError(true);
    if (fallbackSrc && imgRef.current) {
      imgRef.current.src = fallbackSrc;
    }
  }, [fallbackSrc]);

  // Calculate aspect ratio
  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{
        aspectRatio: aspectRatio,
        ...style,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
        />
      )}

      {/* Skeleton placeholder */}
      {placeholder === 'empty' && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={isError && fallbackSrc ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {isError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Image with zoom functionality
 */
export interface ZoomableImageProps extends OptimizedImageProps {
  /** Enable zoom on click */
  zoomEnabled?: boolean;
  /** Zoom scale */
  zoomScale?: number;
}

export function ZoomableImage({
  zoomEnabled = true,
  zoomScale = 2,
  className,
  ...props
}: ZoomableImageProps): React.JSX.Element {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleClick = useCallback(() => {
    if (zoomEnabled) {
      setIsZoomed((prev) => !prev);
    }
  }, [zoomEnabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (zoomEnabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsZoomed((prev) => !prev);
    }
  }, [zoomEnabled]);

  return (
    <div
      role={zoomEnabled ? 'button' : undefined}
      tabIndex={zoomEnabled ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-zoom-in',
        isZoomed && 'cursor-zoom-out'
      )}
    >
      <OptimizedImage
        {...props}
        className={cn(
          className,
          'transition-transform duration-300 ease-out',
          isZoomed && `scale-[${zoomScale}]`
        )}
        style={{
          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
        }}
      />
    </div>
  );
}

/**
 * Image gallery with lazy loading
 */
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 'md',
  className,
}: ImageGalleryProps): React.JSX.Element {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {images.map((image, index) => (
        <OptimizedImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          placeholder="blur"
          className="rounded-lg"
        />
      ))}
    </div>
  );
}

export default OptimizedImage;
