/**
 * Animation Performance Utilities
 * GPU-accelerated animations and performance optimizations
 */

/**
 * CSS properties that trigger GPU acceleration
 */
export const gpuAcceleratedProperties = [
  'transform',
  'opacity',
  'filter',
  'will-change',
] as const;

/**
 * Animation timing functions
 */
export const easings = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom bezier curves
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Spring-like
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Optimized animation frame scheduler
 */
class AnimationScheduler {
  private callbacks: Map<string, (timestamp: number) => void> = new Map();
  private rafId: number | null = null;
  private isRunning = false;

  /**
   * Schedule a callback to run on next animation frame
   */
  schedule(id: string, callback: (timestamp: number) => void): void {
    this.callbacks.set(id, callback);
    
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Cancel a scheduled callback
   */
  cancel(id: string): void {
    this.callbacks.delete(id);
    
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    this.isRunning = true;
    this.tick(performance.now());
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Animation loop tick
   */
  private tick = (timestamp: number): void => {
    if (!this.isRunning) return;
    
    this.callbacks.forEach((callback) => {
      callback(timestamp);
    });
    
    if (this.callbacks.size > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.stop();
    }
  };
}

export const animationScheduler = new AnimationScheduler();

/**
 * Create a smooth scroll animation
 */
export function smoothScrollTo(
  element: HTMLElement,
  target: { x?: number; y?: number },
  duration = 300,
  easing: keyof typeof easings = 'easeOutCubic'
): Promise<void> {
  return new Promise((resolve) => {
    const startX = element.scrollLeft;
    const startY = element.scrollTop;
    const targetX = target.x ?? startX;
    const targetY = target.y ?? startY;
    const startTime = performance.now();
    
    const easingFn = getEasingFunction(easing);
    
    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      
      element.scrollLeft = startX + (targetX - startX) * easedProgress;
      element.scrollTop = startY + (targetY - startY) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
}

/**
 * Get easing function from name
 */
function getEasingFunction(name: keyof typeof easings): (t: number) => number {
  // Simple easing implementations
  const functions: Record<string, (t: number) => number> = {
    linear: (t) => t,
    ease: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => {
      if (t === 0 || t === 1) return t;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    spring: (t) => 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 6),
    bounce: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };
  
  return functions[name] || functions.linear;
}

/**
 * Create optimized CSS animation
 */
export function createOptimizedAnimation(
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): KeyframeAnimationOptions {
  return {
    ...options,
    composite: 'replace',
    fill: options.fill || 'forwards',
  };
}

/**
 * Animate element with Web Animations API
 */
export function animateElement(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation | null {
  if (!element.animate) {
    return null;
  }
  
  // Force GPU layer creation
  element.style.willChange = 'transform, opacity';
  
  const animation = element.animate(keyframes, options);
  
  // Cleanup will-change after animation
  animation.onfinish = () => {
    element.style.willChange = 'auto';
  };
  
  return animation;
}

/**
 * Batch DOM reads and writes for optimal performance
 */
class DOMBatcher {
  private reads: Array<() => void> = [];
  private writes: Array<() => void> = [];
  private scheduled = false;

  /**
   * Schedule a DOM read
   */
  read(fn: () => void): void {
    this.reads.push(fn);
    this.schedule();
  }

  /**
   * Schedule a DOM write
   */
  write(fn: () => void): void {
    this.writes.push(fn);
    this.schedule();
  }

  /**
   * Schedule the batch execution
   */
  private schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => this.flush());
  }

  /**
   * Execute all batched operations
   */
  private flush(): void {
    this.scheduled = false;
    
    // Execute all reads first
    const reads = this.reads;
    this.reads = [];
    reads.forEach((fn) => fn());
    
    // Then execute all writes
    const writes = this.writes;
    this.writes = [];
    writes.forEach((fn) => fn());
  }
}

export const domBatcher = new DOMBatcher();

/**
 * Reduce motion detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal animation duration based on user preferences
 */
export function getOptimalDuration(baseDuration: number): number {
  if (prefersReducedMotion()) {
    return 0; // Skip animations for reduced motion
  }
  return baseDuration;
}

/**
 * Common animation presets
 */
export const animationPresets = {
  fadeIn: {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 },
    ],
    options: { duration: 200, easing: easings.easeOut },
  },
  fadeOut: {
    keyframes: [
      { opacity: 1 },
      { opacity: 0 },
    ],
    options: { duration: 200, easing: easings.easeIn },
  },
  slideUp: {
    keyframes: [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    options: { duration: 300, easing: easings.easeOutCubic },
  },
  slideDown: {
    keyframes: [
      { transform: 'translateY(-20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    options: { duration: 300, easing: easings.easeOutCubic },
  },
  scaleIn: {
    keyframes: [
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    options: { duration: 200, easing: easings.spring },
  },
  scaleOut: {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 },
    ],
    options: { duration: 150, easing: easings.easeIn },
  },
  shake: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' },
    ],
    options: { duration: 400, easing: easings.easeInOut },
  },
  pulse: {
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' },
    ],
    options: { duration: 300, easing: easings.easeInOut },
  },
};

/**
 * Apply animation preset to element
 */
export function applyPreset(
  element: HTMLElement,
  presetName: keyof typeof animationPresets
): Animation | null {
  const preset = animationPresets[presetName];
  if (!preset) return null;
  
  const duration = getOptimalDuration(preset.options.duration as number);
  if (duration === 0) return null;
  
  return animateElement(element, preset.keyframes, {
    ...preset.options,
    duration,
  });
}

export default {
  easings,
  animationScheduler,
  smoothScrollTo,
  createOptimizedAnimation,
  animateElement,
  domBatcher,
  prefersReducedMotion,
  getOptimalDuration,
  animationPresets,
  applyPreset,
};
