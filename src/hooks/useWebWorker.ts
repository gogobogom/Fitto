'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  workerManager, 
  sortInWorker, 
  calculateStatsInWorker, 
  aggregateNutritionInWorker,
  searchInWorker,
  generateReportInWorker
} from '@/lib/webWorkerManager';

// Generic web worker hook
export function useWebWorker<T, R>(
  taskType: string
): {
  execute: (data: T) => Promise<R>;
  isProcessing: boolean;
  error: Error | null;
  result: R | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<R | null>(null);

  const execute = useCallback(async (data: T): Promise<R> => {
    setIsProcessing(true);
    setError(null);

    try {
      const taskResult = await workerManager.execute<T, R>(taskType, data);
      setResult(taskResult);
      return taskResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [taskType]);

  return { execute, isProcessing, error, result };
}

// Hook for sorting large arrays in worker
export function useSortWorker<T>(): {
  sort: (array: T[], key?: keyof T, order?: 'asc' | 'desc') => Promise<T[]>;
  isProcessing: boolean;
  error: Error | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sort = useCallback(async (
    array: T[],
    key?: keyof T,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<T[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      return await sortInWorker(array, key, order);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { sort, isProcessing, error };
}

// Hook for calculating statistics
export function useStatsWorker(): {
  calculate: (values: number[]) => Promise<{
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
  } | null>;
  isProcessing: boolean;
  error: Error | null;
  stats: {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
  } | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<{
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
  } | null>(null);

  const calculate = useCallback(async (values: number[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await calculateStatsInWorker(values);
      setStats(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { calculate, isProcessing, error, stats };
}

// Hook for aggregating nutrition data
export function useNutritionAggregator(): {
  aggregate: (
    meals: Array<{
      date?: string;
      type?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }>,
    groupBy?: 'date' | 'type' | 'all'
  ) => Promise<Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  }>>;
  isProcessing: boolean;
  error: Error | null;
  aggregatedData: Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  }> | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [aggregatedData, setAggregatedData] = useState<Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  }> | null>(null);

  const aggregate = useCallback(async (
    meals: Array<{
      date?: string;
      type?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }>,
    groupBy: 'date' | 'type' | 'all' = 'date'
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await aggregateNutritionInWorker(meals, groupBy);
      setAggregatedData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { aggregate, isProcessing, error, aggregatedData };
}

// Hook for searching large datasets
export function useSearchWorker<T>(): {
  search: (items: T[], query: string, fields: (keyof T)[], limit?: number) => Promise<T[]>;
  isProcessing: boolean;
  error: Error | null;
  results: T[];
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<T[]>([]);

  const search = useCallback(async (
    items: T[],
    query: string,
    fields: (keyof T)[],
    limit = 100
  ): Promise<T[]> => {
    if (!query.trim()) {
      setResults([]);
      return [];
    }

    setIsProcessing(true);
    setError(null);

    try {
      const searchResults = await searchInWorker(items, query, fields, limit);
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { search, isProcessing, error, results };
}

// Hook for generating reports
export function useReportGenerator(): {
  generate: (
    meals: Array<{ calories?: number; protein?: number; carbs?: number; fat?: number }>,
    exercises: Array<{ calories?: number; duration?: number }>,
    goals: { calories?: number; protein?: number },
    dateRange: { start: string; end: string }
  ) => Promise<{
    summary: Record<string, number>;
    progress: Record<string, number>;
    dateRange: { start: string; end: string };
  }>;
  isProcessing: boolean;
  error: Error | null;
  report: {
    summary: Record<string, number>;
    progress: Record<string, number>;
    dateRange: { start: string; end: string };
  } | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [report, setReport] = useState<{
    summary: Record<string, number>;
    progress: Record<string, number>;
    dateRange: { start: string; end: string };
  } | null>(null);

  const generate = useCallback(async (
    meals: Array<{ calories?: number; protein?: number; carbs?: number; fat?: number }>,
    exercises: Array<{ calories?: number; duration?: number }>,
    goals: { calories?: number; protein?: number },
    dateRange: { start: string; end: string }
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await generateReportInWorker(meals, exercises, goals, dateRange);
      setReport(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { generate, isProcessing, error, report };
}

// Hook for debounced worker tasks
export function useDebouncedWorker<T, R>(
  taskType: string,
  delay = 300
): {
  execute: (data: T) => void;
  cancel: () => void;
  isProcessing: boolean;
  error: Error | null;
  result: R | null;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const execute = useCallback((data: T) => {
    cancel();

    timeoutRef.current = setTimeout(async () => {
      setIsProcessing(true);
      setError(null);

      try {
        const taskResult = await workerManager.execute<T, R>(taskType, data);
        setResult(taskResult);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setIsProcessing(false);
      }
    }, delay);
  }, [taskType, delay, cancel]);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { execute, cancel, isProcessing, error, result };
}
