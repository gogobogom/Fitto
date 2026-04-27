/**
 * Touch Event Optimization
 * Mobil dokunma olayları optimizasyonu
 */

// Touch event types
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  identifier: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  velocity: number;
  distance: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
}

// Touch event handler options
export interface TouchHandlerOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  passive?: boolean;
  threshold?: number;
  velocityThreshold?: number;
}

// Fast click handler (eliminates 300ms delay)
export function createFastClick(
  callback: (event: TouchEvent | MouseEvent) => void,
  options: { threshold?: number } = {}
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  onClick: (e: MouseEvent) => void;
} {
  const threshold = options.threshold || 10;
  let touchStartPos: TouchPoint | null = null;
  let touchHandled = false;

  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };
      touchHandled = false;
    },

    onTouchEnd: (e: TouchEvent) => {
      if (!touchStartPos) return;

      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);
      const duration = Date.now() - touchStartPos.timestamp;

      // Only trigger if it was a tap (small movement, short duration)
      if (dx < threshold && dy < threshold && duration < 300) {
        e.preventDefault();
        touchHandled = true;
        callback(e);
      }

      touchStartPos = null;
    },

    onClick: (e: MouseEvent) => {
      // Ignore click if touch already handled
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      callback(e);
    },
  };
}

// Swipe gesture detector
export function createSwipeDetector(
  onSwipe: (gesture: SwipeGesture) => void,
  options: TouchHandlerOptions = {}
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
} {
  const threshold = options.threshold || 50;
  const velocityThreshold = options.velocityThreshold || 0.3;
  
  let startPoint: TouchPoint | null = null;
  let lastPoint: TouchPoint | null = null;

  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0];
      startPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };
      lastPoint = startPoint;
    },

    onTouchMove: (e: TouchEvent) => {
      if (!startPoint) return;

      const touch = e.touches[0];
      lastPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };

      if (options.preventDefault) {
        e.preventDefault();
      }
    },

    onTouchEnd: (e: TouchEvent) => {
      if (!startPoint || !lastPoint) return;

      const dx = lastPoint.x - startPoint.x;
      const dy = lastPoint.y - startPoint.y;
      const duration = lastPoint.timestamp - startPoint.timestamp;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = distance / duration;

      if (distance >= threshold && velocity >= velocityThreshold) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let direction: SwipeGesture['direction'];
        if (absX > absY) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        onSwipe({ direction, velocity, distance, duration });
      }

      startPoint = null;
      lastPoint = null;
    },
  };
}

// Pinch/zoom gesture detector
export function createPinchDetector(
  onPinch: (gesture: PinchGesture) => void,
  options: TouchHandlerOptions = {}
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
} {
  let initialDistance: number | null = null;
  let initialCenter: { x: number; y: number } | null = null;

  const getDistance = (t1: Touch, t2: Touch): number => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (t1: Touch, t2: Touch): { x: number; y: number } => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  return {
    onTouchStart: (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialCenter = getCenter(e.touches[0], e.touches[1]);
      }
    },

    onTouchMove: (e: TouchEvent) => {
      if (e.touches.length !== 2 || !initialDistance || !initialCenter) return;

      if (options.preventDefault) {
        e.preventDefault();
      }

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getCenter(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;

      onPinch({ scale, center: currentCenter });
    },

    onTouchEnd: () => {
      initialDistance = null;
      initialCenter = null;
    },
  };
}

// Long press detector
export function createLongPressDetector(
  onLongPress: (point: { x: number; y: number }) => void,
  options: { duration?: number; threshold?: number } = {}
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
} {
  const duration = options.duration || 500;
  const threshold = options.threshold || 10;
  
  let startPoint: TouchPoint | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    startPoint = null;
  };

  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0];
      startPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };

      timer = setTimeout(() => {
        if (startPoint) {
          onLongPress({ x: startPoint.x, y: startPoint.y });
        }
        cancel();
      }, duration);
    },

    onTouchMove: (e: TouchEvent) => {
      if (!startPoint) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPoint.x);
      const dy = Math.abs(touch.clientY - startPoint.y);

      if (dx > threshold || dy > threshold) {
        cancel();
      }
    },

    onTouchEnd: cancel,
  };
}

// Touch ripple effect
export function createTouchRipple(
  element: HTMLElement,
  options: { color?: string; duration?: number } = {}
): () => void {
  const color = options.color || 'rgba(0, 0, 0, 0.1)';
  const duration = options.duration || 600;

  const handleTouch = (e: TouchEvent) => {
    const touch = e.touches[0];
    const rect = element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);

    ripple.style.cssText = `
      position: absolute;
      width: ${size * 2}px;
      height: ${size * 2}px;
      left: ${x - size}px;
      top: ${y - size}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple ${duration}ms ease-out;
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, duration);
  };

  element.addEventListener('touchstart', handleTouch, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouch);
  };
}

// Scroll momentum
export function createMomentumScroll(
  element: HTMLElement,
  options: { friction?: number; bounceBack?: boolean } = {}
): () => void {
  const friction = options.friction || 0.95;
  const bounceBack = options.bounceBack !== false;

  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;
  let rafId: number | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastY = e.touches[0].clientY;
    lastTime = Date.now();
    velocity = 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY;
    const time = Date.now();
    const dt = time - lastTime;

    if (dt > 0) {
      velocity = (y - lastY) / dt;
    }

    lastY = y;
    lastTime = time;
  };

  const handleTouchEnd = () => {
    const animate = () => {
      if (Math.abs(velocity) < 0.01) {
        rafId = null;
        return;
      }

      element.scrollTop -= velocity * 16;
      velocity *= friction;

      // Bounce back at edges
      if (bounceBack) {
        if (element.scrollTop <= 0) {
          element.scrollTop = 0;
          velocity = 0;
        } else if (element.scrollTop >= element.scrollHeight - element.clientHeight) {
          element.scrollTop = element.scrollHeight - element.clientHeight;
          velocity = 0;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

// Prevent pull-to-refresh
export function preventPullToRefresh(element: HTMLElement): () => void {
  let touchStartY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const scrollTop = element.scrollTop;

    // Prevent pull-to-refresh when at top
    if (scrollTop <= 0 && touchY > touchStartY) {
      e.preventDefault();
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
  };
}

// Touch feedback utility
export function addTouchFeedback(
  element: HTMLElement,
  options: { scale?: number; opacity?: number } = {}
): () => void {
  const scale = options.scale || 0.97;
  const opacity = options.opacity || 0.8;

  const originalTransform = element.style.transform;
  const originalOpacity = element.style.opacity;
  const originalTransition = element.style.transition;

  const handleTouchStart = () => {
    element.style.transition = 'transform 100ms ease, opacity 100ms ease';
    element.style.transform = `scale(${scale})`;
    element.style.opacity = String(opacity);
  };

  const handleTouchEnd = () => {
    element.style.transform = originalTransform || '';
    element.style.opacity = originalOpacity || '';
    
    setTimeout(() => {
      element.style.transition = originalTransition || '';
    }, 100);
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchEnd);
  };
}

// Check if device supports touch
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get touch support info
export function getTouchSupport(): {
  touch: boolean;
  multiTouch: boolean;
  forceTouch: boolean;
} {
  if (typeof window === 'undefined') {
    return { touch: false, multiTouch: false, forceTouch: false };
  }

  return {
    touch: 'ontouchstart' in window,
    multiTouch: navigator.maxTouchPoints > 1,
    forceTouch: 'onwebkitmouseforcechanged' in document,
  };
}
