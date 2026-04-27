'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { haptics } from '@/lib/haptics';

/**
 * Micro-interactions için custom hook'lar
 */

// Press state hook - basılı tutma efekti
export function usePressState() {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlers = {
    onMouseDown: useCallback(() => {
      setIsPressed(true);
      haptics.tap();
    }, []),
    onMouseUp: useCallback(() => setIsPressed(false), []),
    onMouseLeave: useCallback(() => setIsPressed(false), []),
    onTouchStart: useCallback(() => {
      setIsPressed(true);
      haptics.tap();
    }, []),
    onTouchEnd: useCallback(() => setIsPressed(false), []),
  };
  
  return { isPressed, handlers };
}

// Long press hook - uzun basma algılama
export function useLongPress(
  onLongPress: () => void,
  options: { delay?: number; onStart?: () => void; onEnd?: () => void } = {}
) {
  const { delay = 500, onStart, onEnd } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  const start = useCallback(() => {
    isLongPress.current = false;
    onStart?.();
    haptics.tap();
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      haptics.longPress();
      onLongPress();
    }, delay);
  }, [onLongPress, delay, onStart]);
  
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onEnd?.();
  }, [onEnd]);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}

// Ripple effect hook
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    haptics.tap();
    
    // Ripple'ı kaldır
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);
  
  return { ripples, createRipple };
}

// Bounce animation hook
export function useBounce() {
  const [isBouncing, setIsBouncing] = useState(false);
  
  const trigger = useCallback(() => {
    setIsBouncing(true);
    haptics.impact();
    
    setTimeout(() => {
      setIsBouncing(false);
    }, 300);
  }, []);
  
  return { isBouncing, trigger };
}

// Shake animation hook (hata durumları için)
export function useShake() {
  const [isShaking, setIsShaking] = useState(false);
  
  const trigger = useCallback(() => {
    setIsShaking(true);
    haptics.error();
    
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  }, []);
  
  return { isShaking, trigger };
}

// Success animation hook
export function useSuccessAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const trigger = useCallback(() => {
    setIsAnimating(true);
    haptics.success();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  }, []);
  
  return { isAnimating, trigger };
}

// Counter animation hook (sayı artış/azalış)
export function useCounterAnimation(targetValue: number, duration: number = 500) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValue = useRef(targetValue);
  
  useEffect(() => {
    if (previousValue.current === targetValue) return;
    
    const startValue = previousValue.current;
    const difference = targetValue - startValue;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeOut;
      
      setDisplayValue(Math.round(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
        haptics.selection();
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue, duration]);
  
  return displayValue;
}

// Pull to refresh hook
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(distance, threshold * 1.5));
    
    if (distance > threshold && !isRefreshing) {
      haptics.selection();
    }
  }, [isPulling, isRefreshing]);
  
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      haptics.success();
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);
  
  return {
    pullDistance,
    isRefreshing,
    isPulling,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// Swipe detection hook
export function useSwipe(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
} = {}) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options;
  const startX = useRef(0);
  const startY = useRef(0);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const diffX = endX - startX.current;
    const diffY = endY - startY.current;
    
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    if (absX > absY && absX > threshold) {
      if (diffX > 0) {
        onSwipeRight?.();
        haptics.selection();
      } else {
        onSwipeLeft?.();
        haptics.selection();
      }
    } else if (absY > absX && absY > threshold) {
      if (diffY > 0) {
        onSwipeDown?.();
        haptics.selection();
      } else {
        onSwipeUp?.();
        haptics.selection();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// Double tap hook
export function useDoubleTap(onDoubleTap: () => void, delay: number = 300) {
  const lastTapRef = useRef<number>(0);
  
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < delay && timeDiff > 0) {
      haptics.success();
      onDoubleTap();
    } else {
      haptics.tap();
    }
    
    lastTapRef.current = now;
  }, [onDoubleTap, delay]);
  
  return { onClick: handleTap };
}
