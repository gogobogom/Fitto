// Web Worker Manager for Heavy Computations

export interface WorkerTask<T = unknown, R = unknown> {
  id: string;
  type: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timeout?: number;
}

export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  data: T;
}

export interface WorkerResponse<R = unknown> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
}

// Generic worker code that can handle multiple task types
const workerCode = `
  // Task handlers
  const handlers = {
    // Heavy array operations
    sortLargeArray: (data) => {
      const { array, key, order } = data;
      return [...array].sort((a, b) => {
        const aVal = key ? a[key] : a;
        const bVal = key ? b[key] : b;
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    },

    // Filter large datasets
    filterLargeArray: (data) => {
      const { array, predicate } = data;
      const predicateFn = new Function('item', 'return ' + predicate);
      return array.filter(predicateFn);
    },

    // Calculate statistics
    calculateStatistics: (data) => {
      const { values } = data;
      if (!values.length) return null;

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const median = values.length % 2 === 0
        ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
        : sorted[Math.floor(values.length / 2)];

      return {
        count: values.length,
        sum,
        mean,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        variance,
        stdDev,
      };
    },

    // Aggregate nutrition data
    aggregateNutrition: (data) => {
      const { meals, groupBy } = data;
      const groups = {};

      for (const meal of meals) {
        const key = groupBy === 'date' 
          ? meal.date?.split('T')[0] 
          : groupBy === 'type' 
            ? meal.type 
            : 'all';

        if (!groups[key]) {
          groups[key] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            count: 0,
          };
        }

        groups[key].calories += meal.calories || 0;
        groups[key].protein += meal.protein || 0;
        groups[key].carbs += meal.carbs || 0;
        groups[key].fat += meal.fat || 0;
        groups[key].count += 1;
      }

      return groups;
    },

    // Search through large datasets
    searchData: (data) => {
      const { items, query, fields, limit } = data;
      const lowerQuery = query.toLowerCase();
      const results = [];

      for (const item of items) {
        if (results.length >= (limit || 100)) break;

        for (const field of fields) {
          const value = item[field];
          if (value && String(value).toLowerCase().includes(lowerQuery)) {
            results.push(item);
            break;
          }
        }
      }

      return results;
    },

    // Calculate calorie trends
    calculateTrends: (data) => {
      const { entries, period } = data;
      if (entries.length < 2) return { trend: 'stable', change: 0 };

      const recent = entries.slice(0, Math.ceil(entries.length / 2));
      const older = entries.slice(Math.ceil(entries.length / 2));

      const recentAvg = recent.reduce((a, b) => a + b.value, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b.value, 0) / older.length;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trend = change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';

      return {
        trend,
        change: Math.round(change * 100) / 100,
        recentAvg: Math.round(recentAvg),
        olderAvg: Math.round(olderAvg),
      };
    },

    // Parse and validate CSV data
    parseCSV: (data) => {
      const { content, headers } = data;
      const lines = content.split('\\n').filter(line => line.trim());
      const headerRow = headers || lines[0].split(',').map(h => h.trim());
      const dataLines = headers ? lines : lines.slice(1);

      return dataLines.map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headerRow.forEach((header, index) => {
          const value = values[index];
          // Try to parse numbers
          const num = parseFloat(value);
          row[header] = isNaN(num) ? value : num;
        });
        return row;
      });
    },

    // Generate report data
    generateReport: (data) => {
      const { meals, exercises, goals, dateRange } = data;
      
      const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
      const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
      const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

      const totalExerciseCalories = exercises.reduce((sum, e) => sum + (e.calories || 0), 0);
      const totalExerciseMinutes = exercises.reduce((sum, e) => sum + (e.duration || 0), 0);

      const netCalories = totalCalories - totalExerciseCalories;
      const calorieGoal = goals?.calories || 2000;
      const proteinGoal = goals?.protein || 150;

      return {
        summary: {
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          totalExerciseCalories,
          totalExerciseMinutes,
          netCalories,
          mealCount: meals.length,
          exerciseCount: exercises.length,
        },
        progress: {
          calorieProgress: Math.round((netCalories / calorieGoal) * 100),
          proteinProgress: Math.round((totalProtein / proteinGoal) * 100),
        },
        dateRange,
      };
    },
  };

  // Message handler
  self.onmessage = function(e) {
    const { id, type, data } = e.data;

    try {
      const handler = handlers[type];
      if (!handler) {
        throw new Error('Unknown task type: ' + type);
      }

      const result = handler(data);
      self.postMessage({ id, success: true, result });
    } catch (error) {
      self.postMessage({ id, success: false, error: error.message });
    }
  };
`;

export class WebWorkerManager {
  private static instance: WebWorkerManager;
  private worker: Worker | null = null;
  private pendingTasks: Map<string, WorkerTask> = new Map();
  private taskIdCounter = 0;
  private isSupported = false;

  private constructor() {
    this.isSupported = typeof Worker !== 'undefined';
  }

  static getInstance(): WebWorkerManager {
    if (!WebWorkerManager.instance) {
      WebWorkerManager.instance = new WebWorkerManager();
    }
    return WebWorkerManager.instance;
  }

  private initWorker(): void {
    if (!this.isSupported || this.worker) return;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, result, error } = e.data;
        const task = this.pendingTasks.get(id);

        if (task) {
          this.pendingTasks.delete(id);
          if (success) {
            task.resolve(result);
          } else {
            task.reject(new Error(error || 'Unknown worker error'));
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending tasks
        for (const [id, task] of this.pendingTasks) {
          task.reject(new Error('Worker error'));
          this.pendingTasks.delete(id);
        }
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.isSupported = false;
    }
  }

  async execute<T, R>(type: string, data: T, timeout = 30000): Promise<R> {
    // Fall back to main thread if workers not supported
    if (!this.isSupported) {
      return this.executeFallback<T, R>(type, data);
    }

    this.initWorker();

    if (!this.worker) {
      return this.executeFallback<T, R>(type, data);
    }

    const id = `task_${++this.taskIdCounter}`;

    return new Promise<R>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingTasks.delete(id);
        reject(new Error('Task timeout'));
      }, timeout);

      const task: WorkerTask<T, R> = {
        id,
        type,
        data,
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      };

      this.pendingTasks.set(id, task as WorkerTask);

      const message: WorkerMessage<T> = { id, type, data };
      this.worker!.postMessage(message);
    });
  }

  private executeFallback<T, R>(type: string, data: T): Promise<R> {
    // Execute synchronously on main thread (for browsers without worker support)
    return new Promise((resolve, reject) => {
      try {
        // Simple fallback implementations
        switch (type) {
          case 'sortLargeArray': {
            const { array, key, order } = data as { array: unknown[]; key?: string; order?: string };
            const sorted = [...array].sort((a, b) => {
              const aVal = key ? (a as Record<string, number>)[key] : (a as number);
              const bVal = key ? (b as Record<string, number>)[key] : (b as number);
              return order === 'desc' ? bVal - aVal : aVal - bVal;
            });
            resolve(sorted as R);
            break;
          }
          default:
            reject(new Error(`Fallback not implemented for: ${type}`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingTasks.clear();
  }

  get supported(): boolean {
    return this.isSupported;
  }
}

// Convenience functions
export const workerManager = WebWorkerManager.getInstance();

export async function sortInWorker<T>(
  array: T[],
  key?: keyof T,
  order: 'asc' | 'desc' = 'asc'
): Promise<T[]> {
  if (array.length < 1000) {
    // For small arrays, sort on main thread
    return [...array].sort((a, b) => {
      const aVal = key ? (a[key] as number) : (a as unknown as number);
      const bVal = key ? (b[key] as number) : (b as unknown as number);
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }
  return workerManager.execute('sortLargeArray', { array, key, order });
}

export async function calculateStatsInWorker(values: number[]): Promise<{
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  variance: number;
  stdDev: number;
} | null> {
  return workerManager.execute('calculateStatistics', { values });
}

export async function aggregateNutritionInWorker(
  meals: Array<{
    date?: string;
    type?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>,
  groupBy: 'date' | 'type' | 'all' = 'date'
): Promise<Record<string, {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}>> {
  return workerManager.execute('aggregateNutrition', { meals, groupBy });
}

export async function searchInWorker<T>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  limit = 100
): Promise<T[]> {
  if (items.length < 500) {
    // For small arrays, search on main thread
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      for (const field of fields) {
        const value = item[field];
        if (value && String(value).toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
      return false;
    }).slice(0, limit);
  }
  return workerManager.execute('searchData', { items, query, fields, limit });
}

export async function generateReportInWorker(
  meals: Array<{ calories?: number; protein?: number; carbs?: number; fat?: number }>,
  exercises: Array<{ calories?: number; duration?: number }>,
  goals: { calories?: number; protein?: number },
  dateRange: { start: string; end: string }
): Promise<{
  summary: Record<string, number>;
  progress: Record<string, number>;
  dateRange: { start: string; end: string };
}> {
  return workerManager.execute('generateReport', { meals, exercises, goals, dateRange });
}
