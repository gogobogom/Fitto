/**
 * Animation Frame Scheduler
 * Animasyon kare zamanlayıcısı
 */

type TaskCallback = () => void;
type TaskPriority = 'immediate' | 'high' | 'normal' | 'low' | 'idle';

interface ScheduledTask {
  id: number;
  callback: TaskCallback;
  priority: TaskPriority;
  deadline?: number;
  cancelled: boolean;
}

// Priority values for sorting
const PRIORITY_VALUES: Record<TaskPriority, number> = {
  immediate: 0,
  high: 1,
  normal: 2,
  low: 3,
  idle: 4,
};

// Animation frame scheduler
class AnimationScheduler {
  private taskQueue: ScheduledTask[] = [];
  private nextTaskId: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private frameDeadline: number = 0;
  private readonly frameLength: number = 16; // ~60fps

  // Schedule a task
  schedule(callback: TaskCallback, priority: TaskPriority = 'normal'): number {
    const task: ScheduledTask = {
      id: this.nextTaskId++,
      callback,
      priority,
      cancelled: false,
    };

    // Insert in priority order
    const insertIndex = this.taskQueue.findIndex(
      t => PRIORITY_VALUES[t.priority] > PRIORITY_VALUES[priority]
    );

    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }

    this.startLoop();
    return task.id;
  }

  // Schedule immediate (sync-like) task
  scheduleImmediate(callback: TaskCallback): number {
    return this.schedule(callback, 'immediate');
  }

  // Schedule high priority task
  scheduleHigh(callback: TaskCallback): number {
    return this.schedule(callback, 'high');
  }

  // Schedule idle task (when browser is free)
  scheduleIdle(callback: TaskCallback): number {
    if (typeof requestIdleCallback !== 'undefined') {
      const id = this.nextTaskId++;
      requestIdleCallback(() => {
        if (!this.isTaskCancelled(id)) {
          callback();
        }
      });
      return id;
    }
    return this.schedule(callback, 'idle');
  }

  // Cancel a scheduled task
  cancel(taskId: number): boolean {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (task) {
      task.cancelled = true;
      return true;
    }
    return false;
  }

  // Check if task is cancelled
  private isTaskCancelled(taskId: number): boolean {
    const task = this.taskQueue.find(t => t.id === taskId);
    return task ? task.cancelled : true;
  }

  // Start the animation loop
  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  // Stop the animation loop
  private stopLoop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Main tick function
  private tick(timestamp: number): void {
    this.frameDeadline = timestamp + this.frameLength;

    // Process tasks until deadline or queue empty
    while (this.taskQueue.length > 0 && this.hasTimeRemaining()) {
      const task = this.taskQueue.shift();
      if (task && !task.cancelled) {
        try {
          task.callback();
        } catch (error) {
          console.error('Animation task error:', error);
        }
      }
    }

    // Continue loop if tasks remain
    if (this.taskQueue.length > 0) {
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    } else {
      this.stopLoop();
    }
  }

  // Check if we have time remaining in this frame
  private hasTimeRemaining(): boolean {
    return performance.now() < this.frameDeadline;
  }

  // Get remaining time in current frame
  getTimeRemaining(): number {
    return Math.max(0, this.frameDeadline - performance.now());
  }

  // Clear all tasks
  clear(): void {
    this.taskQueue = [];
    this.stopLoop();
  }

  // Get queue length
  get queueLength(): number {
    return this.taskQueue.length;
  }
}

// Frame rate monitor
class FrameRateMonitor {
  private frameTimes: number[] = [];
  private readonly sampleSize: number;
  private lastFrameTime: number = 0;
  private rafId: number | null = null;
  private callbacks: Array<(fps: number) => void> = [];

  constructor(sampleSize: number = 60) {
    this.sampleSize = sampleSize;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick(timestamp: number): void {
    const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }

    const fps = this.getFPS();
    this.callbacks.forEach(cb => cb(fps));

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  getFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgDelta);
  }

  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  onFPSUpdate(callback: (fps: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  isJanky(): boolean {
    return this.getFPS() < 55;
  }
}

// Smooth animation interpolation
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t: number): number {
  return t * t * t;
}

export function spring(t: number, damping: number = 0.5): number {
  return 1 - Math.exp(-6 * t) * Math.cos(12 * t * damping);
}

// Animated value
export class AnimatedValue {
  private currentValue: number;
  private targetValue: number;
  private velocity: number = 0;
  private readonly stiffness: number;
  private readonly damping: number;
  private rafId: number | null = null;
  private callbacks: Array<(value: number) => void> = [];

  constructor(
    initialValue: number,
    options: { stiffness?: number; damping?: number } = {}
  ) {
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.stiffness = options.stiffness || 170;
    this.damping = options.damping || 26;
  }

  get value(): number {
    return this.currentValue;
  }

  set(target: number, immediate: boolean = false): void {
    this.targetValue = target;

    if (immediate) {
      this.currentValue = target;
      this.velocity = 0;
      this.notifyCallbacks();
      return;
    }

    this.startAnimation();
  }

  private startAnimation(): void {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  private tick(): void {
    const dt = 1 / 60; // Assume 60fps

    // Spring physics
    const displacement = this.currentValue - this.targetValue;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    const acceleration = springForce + dampingForce;

    this.velocity += acceleration * dt;
    this.currentValue += this.velocity * dt;

    this.notifyCallbacks();

    // Check if animation should stop
    if (
      Math.abs(this.velocity) < 0.01 &&
      Math.abs(this.currentValue - this.targetValue) < 0.01
    ) {
      this.currentValue = this.targetValue;
      this.velocity = 0;
      this.rafId = null;
      this.notifyCallbacks();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(cb => cb(this.currentValue));
  }

  onChange(callback: (value: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Batch DOM updates
export class DOMBatcher {
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private scheduled: boolean = false;

  read(fn: () => void): void {
    this.readQueue.push(fn);
    this.scheduleFlush();
  }

  write(fn: () => void): void {
    this.writeQueue.push(fn);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => this.flush());
  }

  private flush(): void {
    // Execute all reads first
    const reads = this.readQueue;
    this.readQueue = [];
    reads.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('DOM read error:', error);
      }
    });

    // Then execute all writes
    const writes = this.writeQueue;
    this.writeQueue = [];
    writes.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('DOM write error:', error);
      }
    });

    this.scheduled = false;

    // If new tasks were added during flush, schedule another
    if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
      this.scheduleFlush();
    }
  }
}

// Throttled animation frame
export function throttledRAF(callback: () => void): () => void {
  let rafId: number | null = null;
  let lastArgs: unknown[] | null = null;

  const frame = () => {
    rafId = null;
    callback();
  };

  const throttled = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return Object.assign(throttled, { cancel });
}

// Time-sliced work
export async function timeSlice<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  options: { chunkTime?: number; onProgress?: (progress: number) => void } = {}
): Promise<void> {
  const { chunkTime = 16, onProgress } = options;
  let index = 0;

  return new Promise((resolve) => {
    const processChunk = () => {
      const startTime = performance.now();

      while (index < items.length) {
        processor(items[index], index);
        index++;

        if (performance.now() - startTime > chunkTime) {
          if (onProgress) {
            onProgress(index / items.length);
          }
          requestAnimationFrame(processChunk);
          return;
        }
      }

      if (onProgress) {
        onProgress(1);
      }
      resolve();
    };

    requestAnimationFrame(processChunk);
  });
}

// Singleton instances
let schedulerInstance: AnimationScheduler | null = null;
let fpsMonitorInstance: FrameRateMonitor | null = null;
let domBatcherInstance: DOMBatcher | null = null;

export function getScheduler(): AnimationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AnimationScheduler();
  }
  return schedulerInstance;
}

export function getFPSMonitor(): FrameRateMonitor {
  if (!fpsMonitorInstance) {
    fpsMonitorInstance = new FrameRateMonitor();
  }
  return fpsMonitorInstance;
}

export function getDOMBatcher(): DOMBatcher {
  if (!domBatcherInstance) {
    domBatcherInstance = new DOMBatcher();
  }
  return domBatcherInstance;
}

export { AnimationScheduler, FrameRateMonitor };
