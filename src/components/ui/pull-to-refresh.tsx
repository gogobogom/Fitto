'use client';

import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled,
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ touchAction: isPulling ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 z-50',
          (isPulling || isRefreshing) && pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: pullDistance,
          top: 0,
          transform: 'translateY(-100%)',
        }}
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg',
            'transition-all duration-200',
            canRefresh ? 'scale-110' : 'scale-100'
          )}
        >
          {isRefreshing ? (
            <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                'w-6 h-6 transition-all duration-200',
                canRefresh ? 'text-teal-500' : 'text-gray-400'
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400 font-medium">
            {isRefreshing
              ? 'Yenileniyor...'
              : canRefresh
              ? 'Bırak'
              : 'Çek'}
          </span>
        </div>
      </div>

      {/* Content wrapper */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
