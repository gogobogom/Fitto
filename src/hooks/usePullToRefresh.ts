'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { haptics } from '@/lib/haptics';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  disabled = false,
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only trigger if at top of scroll
    if (container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setState(prev => ({ ...prev, isPulling: true }));
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isPulling || disabled || state.isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance
    const pullDistance = Math.min(distance * 0.5, maxPull);
    const canRefresh = pullDistance >= threshold;
    
    // Haptic feedback when threshold is crossed
    if (canRefresh && !state.canRefresh) {
      haptics.tap();
    }
    
    setState(prev => ({
      ...prev,
      pullDistance,
      canRefresh,
    }));
    
    // Prevent default scroll when pulling
    if (distance > 10) {
      e.preventDefault();
    }
  }, [state.isPulling, state.canRefresh, disabled, state.isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || disabled) return;
    
    if (state.canRefresh && !state.isRefreshing) {
      setState(prev => ({
        ...prev,
        isPulling: false,
        isRefreshing: true,
        pullDistance: threshold,
      }));
      
      haptics.success();
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        haptics.error();
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
      });
    }
  }, [state.isPulling, state.canRefresh, state.isRefreshing, disabled, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: AddEventListenerOptions = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state,
  };
}

export default usePullToRefresh;
