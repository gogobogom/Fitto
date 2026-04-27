'use client';

/**
 * Touch Gesture Hooks
 * Dokunma hareket hook'ları
 */

import { useCallback, useRef, useEffect, useState } from 'react';

// Swipe direction
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// Gesture event
export interface GestureEvent {
  direction: SwipeDirection;
  velocity: number;
  distance: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Pinch event
export interface PinchEvent {
  scale: number;
  centerX: number;
  centerY: number;
}

// Long press event
export interface LongPressEvent {
  x: number;
  y: number;
}

// Swipe hook options
interface UseSwipeOptions {
  onSwipe: (event: GestureEvent) => void;
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

// Swipe hook
export function useSwipe(options: UseSwipeOptions): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
} {
  const { onSwipe, threshold = 50, velocityThreshold = 0.3, preventScroll = false } = options;
  
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    lastRef.current = startRef.current;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    const touch = e.touches[0];
    lastRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    if (preventScroll) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const onTouchEnd = useCallback(() => {
    if (!startRef.current || !lastRef.current) return;

    const dx = lastRef.current.x - startRef.current.x;
    const dy = lastRef.current.y - startRef.current.y;
    const duration = lastRef.current.time - startRef.current.time;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / duration;

    if (distance >= threshold && velocity >= velocityThreshold) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      let direction: SwipeDirection;
      if (absX > absY) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      onSwipe({
        direction,
        velocity,
        distance,
        duration,
        startX: startRef.current.x,
        startY: startRef.current.y,
        endX: lastRef.current.x,
        endY: lastRef.current.y,
      });
    }

    startRef.current = null;
    lastRef.current = null;
  }, [onSwipe, threshold, velocityThreshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Pinch hook
export function usePinch(
  onPinch: (event: PinchEvent) => void
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
} {
  const initialDistanceRef = useRef<number | null>(null);

  const getDistance = (t1: React.Touch, t2: React.Touch): number => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (t1: React.Touch, t2: React.Touch): { x: number; y: number } => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !initialDistanceRef.current) return;

    const currentDistance = getDistance(e.touches[0], e.touches[1]);
    const center = getCenter(e.touches[0], e.touches[1]);
    const scale = currentDistance / initialDistanceRef.current;

    onPinch({
      scale,
      centerX: center.x,
      centerY: center.y,
    });
  }, [onPinch]);

  const onTouchEnd = useCallback(() => {
    initialDistanceRef.current = null;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Long press hook
export function useLongPress(
  onLongPress: (event: LongPressEvent) => void,
  options: { duration?: number; threshold?: number } = {}
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
} {
  const { duration = 500, threshold = 10 } = options;
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    timerRef.current = setTimeout(() => {
      if (startRef.current) {
        onLongPress({
          x: startRef.current.x,
          y: startRef.current.y,
        });
      }
      cancel();
    }, duration);
  }, [onLongPress, duration, cancel]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startRef.current.x);
    const dy = Math.abs(touch.clientY - startRef.current.y);

    if (dx > threshold || dy > threshold) {
      cancel();
    }
  }, [threshold, cancel]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}

// Double tap hook
export function useDoubleTap(
  onDoubleTap: (x: number, y: number) => void,
  options: { delay?: number } = {}
): {
  onTouchEnd: (e: React.TouchEvent) => void;
} {
  const { delay = 300 } = options;
  
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();

    if (lastTapRef.current) {
      const dt = now - lastTapRef.current.time;
      const dx = Math.abs(touch.clientX - lastTapRef.current.x);
      const dy = Math.abs(touch.clientY - lastTapRef.current.y);

      if (dt < delay && dx < 30 && dy < 30) {
        onDoubleTap(touch.clientX, touch.clientY);
        lastTapRef.current = null;
        return;
      }
    }

    lastTapRef.current = {
      time: now,
      x: touch.clientX,
      y: touch.clientY,
    };
  }, [onDoubleTap, delay]);

  return { onTouchEnd };
}

// Pan/drag hook
export function usePan(
  onPan: (deltaX: number, deltaY: number) => void,
  onPanEnd?: () => void
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
} {
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!lastRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastRef.current.x;
    const deltaY = touch.clientY - lastRef.current.y;

    lastRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    onPan(deltaX, deltaY);
  }, [onPan]);

  const onTouchEnd = useCallback(() => {
    lastRef.current = null;
    onPanEnd?.();
  }, [onPanEnd]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Fast click hook (eliminates 300ms delay)
export function useFastClick(
  onClick: () => void
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onClick: (e: React.MouseEvent) => void;
} {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const touchHandledRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchHandledRef.current = false;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - startRef.current.x);
    const dy = Math.abs(touch.clientY - startRef.current.y);

    if (dx < 10 && dy < 10) {
      e.preventDefault();
      touchHandledRef.current = true;
      onClick();
    }

    startRef.current = null;
  }, [onClick]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  return {
    onTouchStart,
    onTouchEnd,
    onClick: handleClick,
  };
}

// Touch feedback hook
export function useTouchFeedback(): {
  isPressed: boolean;
  handlers: {
    onTouchStart: () => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
} {
  const [isPressed, setIsPressed] = useState(false);

  const press = useCallback(() => setIsPressed(true), []);
  const release = useCallback(() => setIsPressed(false), []);

  return {
    isPressed,
    handlers: {
      onTouchStart: press,
      onTouchEnd: release,
      onTouchCancel: release,
      onMouseDown: press,
      onMouseUp: release,
      onMouseLeave: release,
    },
  };
}

// Pull to refresh hook
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: { threshold?: number; maxPull?: number } = {}
): {
  pullDistance: number;
  isRefreshing: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
} {
  const { threshold = 80, maxPull = 120 } = options;
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startYRef = useRef<number | null>(null);
  const canPullRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Only allow pull when at top of scroll
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop || window.scrollY;
    
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      canPullRef.current = true;
    }
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPullRef.current || startYRef.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    if (delta > 0) {
      const distance = Math.min(delta * 0.5, maxPull);
      setPullDistance(distance);
      
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [maxPull, isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!canPullRef.current || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    startYRef.current = null;
    canPullRef.current = false;
  }, [pullDistance, threshold, onRefresh, isRefreshing]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
