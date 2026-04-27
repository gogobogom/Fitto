'use client';

import { useEffect, useRef } from 'react';
import { initResourceOptimization } from '@/lib/resourcePrefetch';

/**
 * Hook to initialize resource optimization on mount
 */
export function useResourceOptimization(): void {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Delay initialization to not block initial render
    const timer = setTimeout(() => {
      initResourceOptimization();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);
}

export default useResourceOptimization;
