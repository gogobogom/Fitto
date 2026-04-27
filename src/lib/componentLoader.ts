/**
 * Component Loader
 * Utilities for lazy loading and code splitting
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface LoaderOptions {
  /** Show loading state */
  loading?: ComponentType;
  /** Show error state */
  error?: ComponentType<{ error: Error }>;
  /** SSR enabled */
  ssr?: boolean;
  /** Preload on hover/focus */
  preload?: boolean;
}

/**
 * Create a lazy-loaded component with loading state
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LoaderOptions = {}
): ComponentType<P> {
  return dynamic(importFn, {
    loading: options.loading,
    ssr: options.ssr ?? true,
  });
}

/**
 * Preload a component
 */
export function preloadComponent(
  importFn: () => Promise<unknown>
): void {
  // Use requestIdleCallback for non-critical preloading
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently ignore preload errors
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch(() => {});
    }, 1);
  }
}

/**
 * Component registry for dynamic imports
 */
const componentRegistry = new Map<string, () => Promise<{ default: ComponentType<Record<string, unknown>> }>>();

/**
 * Register a component for lazy loading
 */
export function registerComponent(
  name: string,
  importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
): void {
  componentRegistry.set(name, importFn);
}

/**
 * Get a registered component
 */
export function getComponent(
  name: string
): ComponentType<Record<string, unknown>> | null {
  const importFn = componentRegistry.get(name);
  if (!importFn) return null;
  
  return lazyLoad(importFn);
}

/**
 * Preload multiple components
 */
export function preloadComponents(names: string[]): void {
  names.forEach((name) => {
    const importFn = componentRegistry.get(name);
    if (importFn) {
      preloadComponent(importFn);
    }
  });
}

/**
 * Route-based code splitting helper
 */
export const routeComponents = {
  // Main pages
  Dashboard: () => import('@/components/Dashboard'),
  Profile: () => import('@/components/Profile'),
  StatsPage: () => import('@/components/StatsPage'),
  MorePage: () => import('@/components/MorePage'),
  
  // Feature pages
  MealTrackingPage: () => import('@/components/MealTrackingPage'),
  ExerciseTrackingPage: () => import('@/components/ExerciseTrackingPage'),
  WaterTracking: () => import('@/components/WaterTracking'),
  
  // Dialogs
  AddMealDialog: () => import('@/components/AddMealDialog'),
  AddExerciseDialog: () => import('@/components/AddExerciseDialog'),
  EditProfileDialog: () => import('@/components/EditProfileDialog'),
  EditGoalsDialog: () => import('@/components/EditGoalsDialog'),
  
  // AI Features
  AIChatInterface: () => import('@/components/ai/AIChatInterface'),
  AIFeaturesHub: () => import('@/components/ai/AIFeaturesHub'),
  AIMealPhotoAnalyzer: () => import('@/components/ai/AIMealPhotoAnalyzer'),
  AIRecipeGenerator: () => import('@/components/ai/AIRecipeGenerator'),
};

/**
 * Preload components based on current route
 */
export function preloadForRoute(route: string): void {
  const preloadMap: Record<string, string[]> = {
    '/': ['Dashboard', 'AddMealDialog', 'WaterTracking'],
    '/nutrition': ['MealTrackingPage', 'AddMealDialog', 'AIMealPhotoAnalyzer'],
    '/exercise': ['ExerciseTrackingPage', 'AddExerciseDialog'],
    '/stats': ['StatsPage', 'WeeklyCalorieChart'],
    '/more': ['MorePage', 'Profile', 'SettingsPage'],
  };

  const componentsToPreload = preloadMap[route] || [];
  
  componentsToPreload.forEach((name) => {
    const importFn = routeComponents[name as keyof typeof routeComponents];
    if (importFn) {
      preloadComponent(importFn);
    }
  });
}

/**
 * Intersection Observer based lazy loading
 */
export function createLazyLoader(): {
  observe: (element: HTMLElement, callback: () => void) => void;
  disconnect: () => void;
} {
  if (typeof IntersectionObserver === 'undefined') {
    return {
      observe: (_, callback) => callback(),
      disconnect: () => {},
    };
  }

  const callbacks = new Map<HTMLElement, () => void>();
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = callbacks.get(entry.target as HTMLElement);
          if (callback) {
            callback();
            observer.unobserve(entry.target);
            callbacks.delete(entry.target as HTMLElement);
          }
        }
      });
    },
    {
      rootMargin: '200px', // Start loading before element is visible
    }
  );

  return {
    observe: (element: HTMLElement, callback: () => void) => {
      callbacks.set(element, callback);
      observer.observe(element);
    },
    disconnect: () => {
      observer.disconnect();
      callbacks.clear();
    },
  };
}

/**
 * Priority-based component loading
 */
export type LoadPriority = 'critical' | 'high' | 'medium' | 'low';

const priorityQueue: Map<LoadPriority, Array<() => Promise<unknown>>> = new Map([
  ['critical', []],
  ['high', []],
  ['medium', []],
  ['low', []],
]);

let isProcessing = false;

/**
 * Queue a component for loading based on priority
 */
export function queueLoad(
  priority: LoadPriority,
  importFn: () => Promise<unknown>
): void {
  const queue = priorityQueue.get(priority);
  if (queue) {
    queue.push(importFn);
  }
  
  if (!isProcessing) {
    processQueue();
  }
}

/**
 * Process the priority queue
 */
async function processQueue(): Promise<void> {
  isProcessing = true;
  
  const priorities: LoadPriority[] = ['critical', 'high', 'medium', 'low'];
  
  for (const priority of priorities) {
    const queue = priorityQueue.get(priority);
    if (!queue) continue;
    
    while (queue.length > 0) {
      const importFn = queue.shift();
      if (importFn) {
        try {
          await importFn();
        } catch {
          // Silently ignore load errors
        }
        
        // Yield to main thread between loads
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
  
  isProcessing = false;
}

export default {
  lazyLoad,
  preloadComponent,
  registerComponent,
  getComponent,
  preloadComponents,
  routeComponents,
  preloadForRoute,
  createLazyLoader,
  queueLoad,
};
