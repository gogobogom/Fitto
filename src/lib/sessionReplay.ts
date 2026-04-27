// Session Replay System
// Records user interactions for playback and analysis

export interface SessionRecording {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  events: RecordedEvent[];
  metadata: SessionMetadata;
  snapshots: DOMSnapshot[];
}

export interface SessionMetadata {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  language: string;
  timezone: string;
  referrer: string;
  url: string;
  pageTitle: string;
}

export interface RecordedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: EventData;
}

export type EventType = 
  | 'mouseMove'
  | 'mouseClick'
  | 'mouseDown'
  | 'mouseUp'
  | 'scroll'
  | 'resize'
  | 'input'
  | 'focus'
  | 'blur'
  | 'keyDown'
  | 'keyUp'
  | 'pageView'
  | 'navigation'
  | 'error'
  | 'network'
  | 'console'
  | 'custom';

export type EventData = 
  | MouseEventData
  | ScrollEventData
  | ResizeEventData
  | InputEventData
  | FocusEventData
  | KeyEventData
  | PageViewEventData
  | NavigationEventData
  | ErrorEventData
  | NetworkEventData
  | ConsoleEventData
  | CustomEventData;

export interface MouseEventData {
  x: number;
  y: number;
  target?: string;
  button?: number;
}

export interface ScrollEventData {
  scrollX: number;
  scrollY: number;
  target?: string;
}

export interface ResizeEventData {
  width: number;
  height: number;
}

export interface InputEventData {
  target: string;
  value: string;
  inputType: string;
  masked: boolean;
}

export interface FocusEventData {
  target: string;
  isFocused: boolean;
}

export interface KeyEventData {
  key: string;
  code: string;
  target: string;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
}

export interface PageViewEventData {
  url: string;
  title: string;
  referrer: string;
}

export interface NavigationEventData {
  from: string;
  to: string;
  type: 'push' | 'replace' | 'pop';
}

export interface ErrorEventData {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

export interface NetworkEventData {
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
}

export interface ConsoleEventData {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args?: unknown[];
}

export interface CustomEventData {
  name: string;
  properties: Record<string, unknown>;
}

export interface DOMSnapshot {
  id: string;
  timestamp: number;
  html: string;
  styles: string[];
}

// Configuration
export interface SessionReplayConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  maxSessionDuration: number; // ms
  maxEventsPerSession: number;
  mouseMoveThrottle: number; // ms
  scrollThrottle: number; // ms
  inputDebounce: number; // ms
  snapshotInterval: number; // ms
  maskInputs: boolean;
  maskInputSelectors: string[];
  ignoreSelectors: string[];
  captureConsole: boolean;
  captureNetwork: boolean;
  captureErrors: boolean;
}

const DEFAULT_CONFIG: SessionReplayConfig = {
  enabled: true,
  sampleRate: 0.1, // 10% of sessions
  maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  maxEventsPerSession: 10000,
  mouseMoveThrottle: 50,
  scrollThrottle: 100,
  inputDebounce: 300,
  snapshotInterval: 60000, // 1 minute
  maskInputs: true,
  maskInputSelectors: ['input[type="password"]', 'input[type="credit-card"]', '.sensitive'],
  ignoreSelectors: ['.no-record', '[data-no-record]'],
  captureConsole: true,
  captureNetwork: true,
  captureErrors: true,
};

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get CSS selector for element
function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c).slice(0, 3);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }
  
  let selector = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    if (index > 0) {
      selector += `:nth-child(${index + 1})`;
    }
  }
  
  return selector;
}

// Throttle function
function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

// Debounce function
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Session Replay Recorder
class SessionReplayRecorder {
  private config: SessionReplayConfig;
  private sessionId: string | null = null;
  private userId: string;
  private events: RecordedEvent[] = [];
  private snapshots: DOMSnapshot[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private cleanupFunctions: Array<() => void> = [];
  private snapshotIntervalId: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: Partial<SessionReplayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.userId = this.getUserId();
  }
  
  // Get or create user ID
  private getUserId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let userId = localStorage.getItem('replay_user_id');
    if (!userId) {
      userId = generateId();
      localStorage.setItem('replay_user_id', userId);
    }
    return userId;
  }
  
  // Check if session should be recorded (sampling)
  private shouldRecord(): boolean {
    if (!this.config.enabled) return false;
    return Math.random() < this.config.sampleRate;
  }
  
  // Start recording session
  start(): void {
    if (typeof window === 'undefined') return;
    if (this.isRecording) return;
    if (!this.shouldRecord()) return;
    
    this.sessionId = generateId();
    this.startTime = Date.now();
    this.events = [];
    this.snapshots = [];
    this.isRecording = true;
    
    // Record initial page view
    this.recordPageView();
    
    // Take initial snapshot
    this.takeSnapshot();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start snapshot interval
    this.snapshotIntervalId = setInterval(() => {
      this.takeSnapshot();
    }, this.config.snapshotInterval);
    
    // Set session timeout
    setTimeout(() => {
      this.stop();
    }, this.config.maxSessionDuration);
    
    console.log(`[SessionReplay] Recording started: ${this.sessionId}`);
  }
  
  // Stop recording
  stop(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    // Clean up event listeners
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    // Clear snapshot interval
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId);
      this.snapshotIntervalId = null;
    }
    
    // Save recording
    this.saveRecording();
    
    console.log(`[SessionReplay] Recording stopped: ${this.sessionId}`);
  }
  
  // Record an event
  private recordEvent(type: EventType, data: EventData): void {
    if (!this.isRecording) return;
    if (this.events.length >= this.config.maxEventsPerSession) {
      this.stop();
      return;
    }
    
    const event: RecordedEvent = {
      id: generateId(),
      type,
      timestamp: Date.now() - this.startTime,
      data,
    };
    
    this.events.push(event);
  }
  
  // Set up event listeners
  private setupEventListeners(): void {
    // Mouse move (throttled)
    const handleMouseMove = throttle((e: MouseEvent) => {
      this.recordEvent('mouseMove', {
        x: e.clientX,
        y: e.clientY,
      });
    }, this.config.mouseMoveThrottle);
    
    document.addEventListener('mousemove', handleMouseMove);
    this.cleanupFunctions.push(() => document.removeEventListener('mousemove', handleMouseMove));
    
    // Mouse click
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (this.shouldIgnoreElement(target)) return;
      
      this.recordEvent('mouseClick', {
        x: e.clientX,
        y: e.clientY,
        target: getSelector(target),
        button: e.button,
      });
    };
    
    document.addEventListener('click', handleClick);
    this.cleanupFunctions.push(() => document.removeEventListener('click', handleClick));
    
    // Scroll (throttled)
    const handleScroll = throttle(() => {
      this.recordEvent('scroll', {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });
    }, this.config.scrollThrottle);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    this.cleanupFunctions.push(() => window.removeEventListener('scroll', handleScroll));
    
    // Resize
    const handleResize = debounce(() => {
      this.recordEvent('resize', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 200);
    
    window.addEventListener('resize', handleResize);
    this.cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));
    
    // Input (debounced)
    const handleInput = debounce((e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || this.shouldIgnoreElement(target)) return;
      
      const shouldMask = this.shouldMaskInput(target);
      
      this.recordEvent('input', {
        target: getSelector(target),
        value: shouldMask ? '***' : target.value.substring(0, 100),
        inputType: target.type || 'text',
        masked: shouldMask,
      });
    }, this.config.inputDebounce);
    
    document.addEventListener('input', handleInput);
    this.cleanupFunctions.push(() => document.removeEventListener('input', handleInput));
    
    // Focus
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as Element;
      if (!target || this.shouldIgnoreElement(target)) return;
      
      this.recordEvent('focus', {
        target: getSelector(target),
        isFocused: true,
      });
    };
    
    document.addEventListener('focus', handleFocus, true);
    this.cleanupFunctions.push(() => document.removeEventListener('focus', handleFocus, true));
    
    // Blur
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as Element;
      if (!target || this.shouldIgnoreElement(target)) return;
      
      this.recordEvent('blur', {
        target: getSelector(target),
        isFocused: false,
      });
    };
    
    document.addEventListener('blur', handleBlur, true);
    this.cleanupFunctions.push(() => document.removeEventListener('blur', handleBlur, true));
    
    // Errors
    if (this.config.captureErrors) {
      const handleError = (e: ErrorEvent) => {
        this.recordEvent('error', {
          message: e.message,
          stack: e.error?.stack,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      };
      
      window.addEventListener('error', handleError);
      this.cleanupFunctions.push(() => window.removeEventListener('error', handleError));
      
      // Unhandled promise rejections
      const handleRejection = (e: PromiseRejectionEvent) => {
        this.recordEvent('error', {
          message: `Unhandled Promise Rejection: ${e.reason}`,
          stack: e.reason?.stack,
        });
      };
      
      window.addEventListener('unhandledrejection', handleRejection);
      this.cleanupFunctions.push(() => window.removeEventListener('unhandledrejection', handleRejection));
    }
    
    // Console logging
    if (this.config.captureConsole) {
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };
      
      const createConsoleHandler = (level: 'log' | 'info' | 'warn' | 'error') => {
        return (...args: unknown[]) => {
          this.recordEvent('console', {
            level,
            message: args.map(arg => String(arg)).join(' '),
          });
          originalConsole[level].apply(console, args);
        };
      };
      
      console.log = createConsoleHandler('log');
      console.info = createConsoleHandler('info');
      console.warn = createConsoleHandler('warn');
      console.error = createConsoleHandler('error');
      
      this.cleanupFunctions.push(() => {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
      });
    }
    
    // Navigation
    const handlePopState = () => {
      this.recordEvent('navigation', {
        from: '',
        to: window.location.href,
        type: 'pop',
      });
    };
    
    window.addEventListener('popstate', handlePopState);
    this.cleanupFunctions.push(() => window.removeEventListener('popstate', handlePopState));
    
    // Page unload
    const handleBeforeUnload = () => {
      this.stop();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    this.cleanupFunctions.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));
  }
  
  // Check if element should be ignored
  private shouldIgnoreElement(element: Element): boolean {
    return this.config.ignoreSelectors.some(selector => element.matches(selector));
  }
  
  // Check if input should be masked
  private shouldMaskInput(element: Element): boolean {
    if (!this.config.maskInputs) return false;
    return this.config.maskInputSelectors.some(selector => element.matches(selector));
  }
  
  // Record page view
  private recordPageView(): void {
    this.recordEvent('pageView', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });
  }
  
  // Take DOM snapshot
  private takeSnapshot(): void {
    if (!this.isRecording) return;
    
    try {
      const snapshot: DOMSnapshot = {
        id: generateId(),
        timestamp: Date.now() - this.startTime,
        html: document.documentElement.outerHTML.substring(0, 500000), // Limit size
        styles: [],
      };
      
      // Collect computed styles for key elements
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach(sheet => {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
            snapshot.styles.push(rules.substring(0, 100000));
          }
        } catch {
          // CORS may block access to some stylesheets
        }
      });
      
      this.snapshots.push(snapshot);
      
      // Keep only last 10 snapshots
      if (this.snapshots.length > 10) {
        this.snapshots.shift();
      }
    } catch (error) {
      console.error('[SessionReplay] Snapshot error:', error);
    }
  }
  
  // Get session metadata
  private getMetadata(): SessionMetadata {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      url: window.location.href,
      pageTitle: document.title,
    };
  }
  
  // Save recording
  private async saveRecording(): Promise<void> {
    if (!this.sessionId) return;
    
    const recording: SessionRecording = {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: new Date(this.startTime),
      endTime: new Date(),
      duration: Date.now() - this.startTime,
      events: this.events,
      metadata: this.getMetadata(),
      snapshots: this.snapshots,
    };
    
    try {
      // Save to localStorage as backup
      const storageKey = `replay_${this.sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        ...recording,
        events: recording.events.slice(0, 1000), // Limit for storage
        snapshots: [], // Don't store snapshots in localStorage
      }));
      
      // Send to server
      await fetch('/api/session-replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recording),
      });
      
      // Clean up localStorage on successful upload
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('[SessionReplay] Failed to save recording:', error);
    }
  }
  
  // Record custom event
  recordCustomEvent(name: string, properties: Record<string, unknown> = {}): void {
    this.recordEvent('custom', { name, properties });
  }
  
  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId;
  }
  
  // Check if recording
  isActive(): boolean {
    return this.isRecording;
  }
  
  // Get recording stats
  getStats(): { eventCount: number; duration: number; snapshotCount: number } {
    return {
      eventCount: this.events.length,
      duration: this.isRecording ? Date.now() - this.startTime : 0,
      snapshotCount: this.snapshots.length,
    };
  }
}

// Session Replay Player
export class SessionReplayPlayer {
  private recording: SessionRecording;
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private animationFrameId: number | null = null;
  private startPlaybackTime: number = 0;
  private onEventCallback: ((event: RecordedEvent) => void) | null = null;
  private onProgressCallback: ((progress: number) => void) | null = null;
  
  constructor(recording: SessionRecording) {
    this.recording = recording;
  }
  
  // Start playback
  play(speed: number = 1): void {
    this.playbackSpeed = speed;
    this.isPlaying = true;
    this.startPlaybackTime = Date.now();
    this.tick();
  }
  
  // Pause playback
  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  // Seek to specific time
  seek(timestamp: number): void {
    this.currentIndex = this.recording.events.findIndex(
      event => event.timestamp >= timestamp
    );
    if (this.currentIndex === -1) {
      this.currentIndex = this.recording.events.length - 1;
    }
  }
  
  // Set event callback
  onEvent(callback: (event: RecordedEvent) => void): void {
    this.onEventCallback = callback;
  }
  
  // Set progress callback
  onProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }
  
  // Main playback loop
  private tick(): void {
    if (!this.isPlaying) return;
    
    const currentTime = (Date.now() - this.startPlaybackTime) * this.playbackSpeed;
    
    while (
      this.currentIndex < this.recording.events.length &&
      this.recording.events[this.currentIndex].timestamp <= currentTime
    ) {
      const event = this.recording.events[this.currentIndex];
      
      if (this.onEventCallback) {
        this.onEventCallback(event);
      }
      
      this.currentIndex++;
    }
    
    // Update progress
    if (this.onProgressCallback) {
      const progress = currentTime / this.recording.duration;
      this.onProgressCallback(Math.min(progress, 1));
    }
    
    // Check if playback is complete
    if (this.currentIndex >= this.recording.events.length) {
      this.pause();
      return;
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }
  
  // Get recording info
  getInfo(): {
    duration: number;
    eventCount: number;
    metadata: SessionMetadata;
  } {
    return {
      duration: this.recording.duration,
      eventCount: this.recording.events.length,
      metadata: this.recording.metadata,
    };
  }
  
  // Get events by type
  getEventsByType(type: EventType): RecordedEvent[] {
    return this.recording.events.filter(event => event.type === type);
  }
  
  // Get heatmap data (clicks)
  getClickHeatmap(): Array<{ x: number; y: number; count: number }> {
    const clicks = this.getEventsByType('mouseClick');
    const heatmap = new Map<string, { x: number; y: number; count: number }>();
    
    clicks.forEach(click => {
      const data = click.data as MouseEventData;
      const key = `${Math.round(data.x / 10) * 10}_${Math.round(data.y / 10) * 10}`;
      
      const existing = heatmap.get(key);
      if (existing) {
        existing.count++;
      } else {
        heatmap.set(key, { x: data.x, y: data.y, count: 1 });
      }
    });
    
    return Array.from(heatmap.values());
  }
}

// Singleton recorder instance
export const sessionReplay = new SessionReplayRecorder();

export default sessionReplay;
