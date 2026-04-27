'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Placeholder image or color */
  placeholder?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Blur placeholder effect */
  blur?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Aspect ratio (width/height) */
  aspectRatio?: number;
  /** Fill mode */
  fill?: boolean;
}

/**
 * Lazy loaded image component with placeholder support
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  rootMargin = '200px',
  blur = true,
  loadingComponent,
  errorComponent,
  aspectRatio,
  fill = false,
  className,
  style,
  ...props
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(container);
        }
      },
      { rootMargin }
    );
    
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [rootMargin]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };
  
  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };
  
  const containerStyle: React.CSSProperties = {
    position: fill ? 'absolute' : 'relative',
    ...(aspectRatio && !fill && { paddingBottom: `${(1 / aspectRatio) * 100}%` }),
    ...(fill && { inset: 0 }),
    ...style,
  };
  
  const imageStyle: React.CSSProperties = {
    ...(aspectRatio && { position: 'absolute', inset: 0 }),
    width: '100%',
    height: aspectRatio ? '100%' : 'auto',
    objectFit: 'cover',
    transition: blur ? 'filter 0.3s ease-out, opacity 0.3s ease-out' : 'opacity 0.3s ease-out',
    ...(blur && !isLoaded && { filter: 'blur(10px)' }),
    opacity: isLoaded ? 1 : 0,
  };
  
  // Render error state
  if (hasError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={containerStyle}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)} style={containerStyle}>
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: placeholder?.startsWith('#') ? placeholder : undefined,
            backgroundImage: placeholder && !placeholder.startsWith('#') ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {loadingComponent || (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      )}
      
      {/* Actual image */}
      {isVisible && src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          onLoad={handleLoad}
          onError={handleError}
          style={imageStyle}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Progressive image loading - shows low quality first, then high quality
 */
interface ProgressiveImageProps extends Omit<LazyImageProps, 'placeholder'> {
  /** Low quality image source */
  lowQualitySrc?: string;
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || '');
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  
  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighQualityLoaded(true);
    };
  }, [src]);
  
  return (
    <LazyImage
      src={currentSrc}
      alt={alt}
      blur={!isHighQualityLoaded}
      className={className}
      {...props}
    />
  );
}

/**
 * Image with native lazy loading and fallback
 */
interface NativeLazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function NativeLazyImage({
  src,
  alt,
  fallback,
  className,
  ...props
}: NativeLazyImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);
  
  const handleError = () => {
    if (fallback && !hasError) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };
  
  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      {...props}
    />
  );
}

export default LazyImage;
