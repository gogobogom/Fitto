'use client';

/**
 * Critical CSS Hook
 * Manages critical CSS injection and removal
 */

import { useEffect, useCallback } from 'react';
import {
  minifiedCriticalCSS,
  removeCriticalCSS,
  preloadStylesheet,
  deferStylesheet,
} from '@/lib/criticalCSS';

interface UseCriticalCSSOptions {
  /** Auto-remove critical CSS after full CSS loads */
  autoRemove?: boolean;
  /** Stylesheets to preload */
  preloadUrls?: string[];
  /** Stylesheets to defer */
  deferUrls?: string[];
}

export function useCriticalCSS(options: UseCriticalCSSOptions = {}) {
  const {
    autoRemove = true,
    preloadUrls = [],
    deferUrls = [],
  } = options;

  // Inject critical CSS on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Check if critical CSS is already injected
    const existingStyle = document.getElementById('critical-css');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = minifiedCriticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }

    // Preload stylesheets
    preloadUrls.forEach((url) => {
      preloadStylesheet(url);
    });

    // Defer non-critical stylesheets
    const loadDeferred = async () => {
      for (const url of deferUrls) {
        try {
          await deferStylesheet(url);
        } catch (error) {
          console.warn('Failed to load deferred stylesheet:', url, error);
        }
      }

      // Remove critical CSS after deferred sheets load
      if (autoRemove && deferUrls.length > 0) {
        removeCriticalCSS();
      }
    };

    if (deferUrls.length > 0) {
      // Start loading deferred stylesheets after initial render
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadDeferred());
      } else {
        setTimeout(loadDeferred, 100);
      }
    }

    return () => {
      // Cleanup is handled by removeCriticalCSS if autoRemove is true
    };
  }, [autoRemove, preloadUrls, deferUrls]);

  // Manual removal function
  const removeNow = useCallback(() => {
    removeCriticalCSS();
  }, []);

  return {
    removeNow,
  };
}

/**
 * Hook for font loading optimization
 */
export function useFontLoading() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Add font-display: swap to all font-face rules
    const applyFontDisplaySwap = () => {
      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            for (let j = 0; j < rules.length; j++) {
              const rule = rules[j];
              if (rule instanceof CSSFontFaceRule) {
                if (!rule.style.fontDisplay) {
                  rule.style.fontDisplay = 'swap';
                }
              }
            }
          } catch {
            // CORS error for external stylesheets
          }
        }
      } catch {
        // Ignore errors
      }
    };

    // Apply after stylesheets load
    if (document.readyState === 'complete') {
      applyFontDisplaySwap();
    } else {
      window.addEventListener('load', applyFontDisplaySwap);
      return () => window.removeEventListener('load', applyFontDisplaySwap);
    }
  }, []);

  // Check if fonts are loaded
  const areFontsLoaded = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    return document.fonts.status === 'loaded';
  }, []);

  // Wait for fonts to load
  const waitForFonts = useCallback(async (): Promise<void> => {
    if (typeof document === 'undefined') return;
    await document.fonts.ready;
  }, []);

  return {
    areFontsLoaded,
    waitForFonts,
  };
}

/**
 * Hook for CSS containment
 */
export function useCSSContainment(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Apply CSS containment for performance
    element.style.contain = 'content';
    element.style.contentVisibility = 'auto';

    return () => {
      element.style.contain = '';
      element.style.contentVisibility = '';
    };
  }, [elementRef]);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default useCriticalCSS;
