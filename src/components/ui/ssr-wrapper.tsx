'use client';

/**
 * SSR-Friendly Wrapper Components
 * Components for handling server/client rendering differences
 */

import React, { useState, useEffect, Suspense } from 'react';
import {
  useHydration,
  useDeferredContent,
  useIntersectionActivation,
  useConnectionAwareLoading,
} from '@/hooks/useSSRPerformance';
import { cn } from '@/lib/utils';

/**
 * ClientOnly Component
 * Renders children only on the client side
 */
interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Defer rendering to idle time */
  defer?: boolean;
  /** Delay before rendering (ms) */
  delay?: number;
}

export function ClientOnly({
  children,
  fallback = null,
  defer = false,
  delay = 0,
}: ClientOnlyProps) {
  const isHydrated = useHydration();
  const shouldRenderDeferred = useDeferredContent(defer ? delay : 0);

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  if (defer && !shouldRenderDeferred) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ServerOnly Component
 * Renders children only on the server side
 */
interface ServerOnlyProps {
  children: React.ReactNode;
}

export function ServerOnly({ children }: ServerOnlyProps) {
  const isHydrated = useHydration();

  if (isHydrated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HydrationBoundary Component
 * Prevents hydration mismatches
 */
interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function HydrationBoundary({
  children,
  fallback,
  className,
}: HydrationBoundaryProps) {
  const isHydrated = useHydration();

  return (
    <div className={className} suppressHydrationWarning>
      {isHydrated ? children : fallback}
    </div>
  );
}

/**
 * LazyLoad Component
 * Loads content when it becomes visible
 */
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection */
  threshold?: number;
  /** Minimum height for placeholder */
  minHeight?: number | string;
  className?: string;
}

export function LazyLoad({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  minHeight = 100,
  className,
}: LazyLoadProps) {
  const { ref, isActive } = useIntersectionActivation({
    rootMargin,
    threshold,
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isActive ? undefined : minHeight }}
    >
      {isActive ? children : fallback}
    </div>
  );
}

/**
 * ConnectionAware Component
 * Adapts content based on network conditions
 */
interface ConnectionAwareProps {
  /** Content for fast connections */
  full: React.ReactNode;
  /** Content for slow connections */
  lite: React.ReactNode;
  /** Content when data saver is on */
  minimal?: React.ReactNode;
}

export function ConnectionAware({
  full,
  lite,
  minimal,
}: ConnectionAwareProps) {
  const { shouldLoadHeavyAssets, saveData } = useConnectionAwareLoading();

  if (saveData && minimal) {
    return <>{minimal}</>;
  }

  if (!shouldLoadHeavyAssets) {
    return <>{lite}</>;
  }

  return <>{full}</>;
}

/**
 * DeferredContent Component
 * Defers rendering of non-critical content
 */
interface DeferredContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Delay in milliseconds */
  delay?: number;
  /** Priority level */
  priority?: 'idle' | 'low' | 'normal';
}

export function DeferredContent({
  children,
  fallback = null,
  delay = 0,
  priority = 'idle',
}: DeferredContentProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (priority === 'normal') {
      setShouldRender(true);
      return;
    }

    if (priority === 'idle') {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(
          () => {
            if (delay > 0) {
              setTimeout(() => setShouldRender(true), delay);
            } else {
              setShouldRender(true);
            }
          },
          { timeout: 5000 }
        );
        return () => cancelIdleCallback(id);
      }
    }

    const timer = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timer);
  }, [delay, priority]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * SkeletonPlaceholder Component
 * Generic skeleton placeholder for loading states
 */
interface SkeletonPlaceholderProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

export function SkeletonPlaceholder({
  className,
  width,
  height,
  rounded = 'md',
  animate = true,
}: SkeletonPlaceholderProps) {
  const roundedClass =
    rounded === true
      ? 'rounded'
      : rounded === 'sm'
      ? 'rounded-sm'
      : rounded === 'md'
      ? 'rounded-md'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'full'
      ? 'rounded-full'
      : '';

  return (
    <div
      className={cn(
        'bg-muted',
        roundedClass,
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * StreamingContent Component
 * Wrapper for streaming SSR content
 */
interface StreamingContentProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function StreamingContent({
  children,
  fallback,
}: StreamingContentProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * ProgressiveHydration Component
 * Progressively hydrates content
 */
interface ProgressiveHydrationProps {
  children: React.ReactNode;
  /** Stages of content to hydrate */
  stages?: Array<{
    component: React.ReactNode;
    delay: number;
  }>;
}

export function ProgressiveHydration({
  children,
  stages = [],
}: ProgressiveHydrationProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;

    // Immediately show first stage
    setCurrentStage(0);

    // Progress through stages
    stages.forEach((stage, index) => {
      setTimeout(() => {
        setCurrentStage(index + 1);
      }, stage.delay);
    });
  }, [isHydrated, stages]);

  return (
    <>
      {/* Main content */}
      {currentStage >= stages.length && children}

      {/* Staged content */}
      {stages.map(
        (stage, index) =>
          currentStage >= index && (
            <React.Fragment key={index}>{stage.component}</React.Fragment>
          )
      )}
    </>
  );
}

/**
 * CriticalContent Component
 * Marks content as critical for rendering priority
 */
interface CriticalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CriticalContent({
  children,
  className,
}: CriticalContentProps) {
  return (
    <div
      className={className}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto',
      }}
    >
      {children}
    </div>
  );
}

/**
 * NonCriticalContent Component
 * Marks content as non-critical, allows browser to skip rendering
 */
interface NonCriticalContentProps {
  children: React.ReactNode;
  className?: string;
  /** Estimated height for layout stability */
  estimatedHeight?: number;
}

export function NonCriticalContent({
  children,
  className,
  estimatedHeight = 200,
}: NonCriticalContentProps) {
  return (
    <div
      className={className}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${estimatedHeight}px`,
      }}
    >
      {children}
    </div>
  );
}

export default {
  ClientOnly,
  ServerOnly,
  HydrationBoundary,
  LazyLoad,
  ConnectionAware,
  DeferredContent,
  SkeletonPlaceholder,
  StreamingContent,
  ProgressiveHydration,
  CriticalContent,
  NonCriticalContent,
};
