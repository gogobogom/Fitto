// A/B Testing Infrastructure
// Experiment management, variant assignment, and metrics tracking

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Variant[];
  targetAudience: TargetAudience;
  metrics: ExperimentMetric[];
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100 percentage
  isControl: boolean;
  config: Record<string, unknown>;
}

export interface TargetAudience {
  percentage: number; // 0-100 percentage of users to include
  filters: AudienceFilter[];
}

export interface AudienceFilter {
  type: 'device' | 'browser' | 'country' | 'language' | 'newUser' | 'custom';
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'custom';
  goal: 'increase' | 'decrease';
  minimumDetectableEffect: number; // percentage
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  context: AssignmentContext;
}

export interface AssignmentContext {
  device: string;
  browser: string;
  country: string;
  language: string;
  isNewUser: boolean;
  customAttributes: Record<string, unknown>;
}

export interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  userId: string;
  eventType: string;
  eventValue?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ExperimentResults {
  experimentId: string;
  variants: VariantResults[];
  statisticalSignificance: number;
  winner: string | null;
  confidenceLevel: number;
  sampleSize: number;
  duration: number; // days
}

export interface VariantResults {
  variantId: string;
  name: string;
  sampleSize: number;
  conversionRate: number;
  averageValue: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
  improvement: number; // percentage vs control
}

// Storage keys
const STORAGE_KEYS = {
  ASSIGNMENTS: 'ab_assignments',
  USER_ID: 'ab_user_id',
  EVENTS: 'ab_events_queue',
} as const;

// Generate consistent user ID
function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

// Hash function for consistent variant assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get stored assignments
function getStoredAssignments(): Map<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // Ignore parse errors
  }
  return new Map();
}

// Store assignment
function storeAssignment(assignment: ExperimentAssignment): void {
  if (typeof window === 'undefined') return;
  
  const assignments = getStoredAssignments();
  assignments.set(assignment.experimentId, assignment);
  
  const obj: Record<string, ExperimentAssignment> = {};
  assignments.forEach((value, key) => {
    obj[key] = value;
  });
  
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(obj));
}

// Get user context
function getUserContext(): AssignmentContext {
  if (typeof window === 'undefined') {
    return {
      device: 'server',
      browser: 'server',
      country: 'unknown',
      language: 'en',
      isNewUser: false,
      customAttributes: {},
    };
  }
  
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'chrome';
  else if (ua.includes('Firefox')) browser = 'firefox';
  else if (ua.includes('Safari')) browser = 'safari';
  else if (ua.includes('Edge')) browser = 'edge';
  
  const isNewUser = !localStorage.getItem('returning_user');
  if (!isNewUser) {
    localStorage.setItem('returning_user', 'true');
  }
  
  return {
    device: isMobile ? 'mobile' : 'desktop',
    browser,
    country: 'unknown', // Would need geolocation API
    language: navigator.language.split('-')[0],
    isNewUser,
    customAttributes: {},
  };
}

// Check if user matches audience filters
function matchesAudience(context: AssignmentContext, audience: TargetAudience): boolean {
  // Check percentage inclusion
  const userId = getUserId();
  const hash = hashString(userId);
  if ((hash % 100) >= audience.percentage) {
    return false;
  }
  
  // Check filters
  for (const filter of audience.filters) {
    let value: unknown;
    
    switch (filter.type) {
      case 'device':
        value = context.device;
        break;
      case 'browser':
        value = context.browser;
        break;
      case 'country':
        value = context.country;
        break;
      case 'language':
        value = context.language;
        break;
      case 'newUser':
        value = context.isNewUser;
        break;
      case 'custom':
        value = context.customAttributes[filter.type];
        break;
    }
    
    let matches = false;
    switch (filter.operator) {
      case 'equals':
        matches = value === filter.value;
        break;
      case 'notEquals':
        matches = value !== filter.value;
        break;
      case 'contains':
        matches = String(value).includes(String(filter.value));
        break;
      case 'greaterThan':
        matches = Number(value) > Number(filter.value);
        break;
      case 'lessThan':
        matches = Number(value) < Number(filter.value);
        break;
    }
    
    if (!matches) return false;
  }
  
  return true;
}

// Select variant based on weights
function selectVariant(experiment: Experiment, userId: string): Variant {
  const hash = hashString(`${experiment.id}_${userId}`);
  const normalizedHash = hash % 100;
  
  let cumulativeWeight = 0;
  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight;
    if (normalizedHash < cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback to first variant
  return experiment.variants[0];
}

// A/B Testing Manager
class ABTestingManager {
  private experiments: Map<string, Experiment> = new Map();
  private eventQueue: ExperimentEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<(variant: Variant) => void>> = new Map();
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.loadEventQueue();
      this.startEventFlushing();
    }
  }
  
  // Register an experiment
  registerExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
  }
  
  // Get variant for user
  getVariant(experimentId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }
    
    const userId = getUserId();
    const context = getUserContext();
    
    // Check if user matches audience
    if (!matchesAudience(context, experiment.targetAudience)) {
      return null;
    }
    
    // Check for existing assignment
    const assignments = getStoredAssignments();
    const existingAssignment = assignments.get(experimentId);
    
    if (existingAssignment) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
      if (variant) return variant;
    }
    
    // Assign new variant
    const variant = selectVariant(experiment, userId);
    
    const assignment: ExperimentAssignment = {
      experimentId,
      variantId: variant.id,
      userId,
      assignedAt: new Date(),
      context,
    };
    
    storeAssignment(assignment);
    
    // Notify listeners
    this.notifyListeners(experimentId, variant);
    
    // Track assignment event
    this.trackEvent(experimentId, 'assignment', undefined, { variantName: variant.name });
    
    return variant;
  }
  
  // Get feature flag value
  getFeatureFlag<T>(experimentId: string, defaultValue: T): T {
    const variant = this.getVariant(experimentId);
    if (!variant) return defaultValue;
    
    const value = variant.config['value'];
    return (value as T) ?? defaultValue;
  }
  
  // Track conversion event
  trackConversion(experimentId: string, value?: number): void {
    this.trackEvent(experimentId, 'conversion', value);
  }
  
  // Track engagement event
  trackEngagement(experimentId: string, action: string, value?: number): void {
    this.trackEvent(experimentId, `engagement_${action}`, value);
  }
  
  // Track custom event
  trackEvent(
    experimentId: string,
    eventType: string,
    eventValue?: number,
    metadata?: Record<string, unknown>
  ): void {
    const assignments = getStoredAssignments();
    const assignment = assignments.get(experimentId);
    
    if (!assignment) return;
    
    const event: ExperimentEvent = {
      experimentId,
      variantId: assignment.variantId,
      userId: getUserId(),
      eventType,
      eventValue,
      metadata,
      timestamp: new Date(),
    };
    
    this.eventQueue.push(event);
    this.saveEventQueue();
  }
  
  // Subscribe to variant changes
  subscribe(experimentId: string, callback: (variant: Variant) => void): () => void {
    if (!this.listeners.has(experimentId)) {
      this.listeners.set(experimentId, new Set());
    }
    
    this.listeners.get(experimentId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(experimentId)?.delete(callback);
    };
  }
  
  // Notify listeners
  private notifyListeners(experimentId: string, variant: Variant): void {
    const callbacks = this.listeners.get(experimentId);
    if (callbacks) {
      callbacks.forEach(callback => callback(variant));
    }
  }
  
  // Load event queue from storage
  private loadEventQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch {
      this.eventQueue = [];
    }
  }
  
  // Save event queue to storage
  private saveEventQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.eventQueue));
  }
  
  // Start periodic event flushing
  private startEventFlushing(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
  }
  
  // Flush events to server
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    this.saveEventQueue();
    
    try {
      await fetch('/api/ab-testing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Re-add events to queue on failure
      this.eventQueue = [...events, ...this.eventQueue];
      this.saveEventQueue();
    }
  }
  
  // Get all active experiments
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }
  
  // Get user's current assignments
  getCurrentAssignments(): ExperimentAssignment[] {
    const assignments = getStoredAssignments();
    return Array.from(assignments.values());
  }
  
  // Force variant (for testing/debugging)
  forceVariant(experimentId: string, variantId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;
    
    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;
    
    const assignment: ExperimentAssignment = {
      experimentId,
      variantId,
      userId: getUserId(),
      assignedAt: new Date(),
      context: getUserContext(),
    };
    
    storeAssignment(assignment);
    this.notifyListeners(experimentId, variant);
  }
  
  // Reset user's experiment assignments
  resetAssignments(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  }
  
  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

// Statistical analysis utilities
export const StatisticalAnalysis = {
  // Calculate conversion rate
  conversionRate(conversions: number, total: number): number {
    if (total === 0) return 0;
    return conversions / total;
  },
  
  // Calculate standard error
  standardError(rate: number, sampleSize: number): number {
    if (sampleSize === 0) return 0;
    return Math.sqrt((rate * (1 - rate)) / sampleSize);
  },
  
  // Calculate confidence interval
  confidenceInterval(rate: number, sampleSize: number, confidence: number = 0.95): [number, number] {
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
    const se = this.standardError(rate, sampleSize);
    return [
      Math.max(0, rate - z * se),
      Math.min(1, rate + z * se),
    ];
  },
  
  // Calculate statistical significance (z-test)
  zTest(
    controlRate: number,
    controlSize: number,
    treatmentRate: number,
    treatmentSize: number
  ): { zScore: number; pValue: number; significant: boolean } {
    const pooledRate = (controlRate * controlSize + treatmentRate * treatmentSize) /
      (controlSize + treatmentSize);
    
    const se = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / controlSize + 1 / treatmentSize)
    );
    
    const zScore = se > 0 ? (treatmentRate - controlRate) / se : 0;
    
    // Approximate p-value using normal distribution
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      zScore,
      pValue,
      significant: pValue < 0.05,
    };
  },
  
  // Normal cumulative distribution function
  normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  },
  
  // Calculate sample size needed for significance
  requiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    significance: number = 0.05
  ): number {
    const zAlpha = significance === 0.05 ? 1.96 : 2.576;
    const zBeta = power === 0.8 ? 0.84 : 1.28;
    
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);
    const pAvg = (p1 + p2) / 2;
    
    const n = 2 * Math.pow(zAlpha + zBeta, 2) * pAvg * (1 - pAvg) /
      Math.pow(p2 - p1, 2);
    
    return Math.ceil(n);
  },
  
  // Calculate improvement percentage
  improvement(controlRate: number, treatmentRate: number): number {
    if (controlRate === 0) return 0;
    return ((treatmentRate - controlRate) / controlRate) * 100;
  },
};

// Singleton instance
export const abTesting = new ABTestingManager();

// Create experiment helper
export function createExperiment(config: {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    isControl?: boolean;
    config?: Record<string, unknown>;
  }>;
  targetPercentage?: number;
  filters?: AudienceFilter[];
}): Experiment {
  const experiment: Experiment = {
    id: config.id,
    name: config.name,
    description: config.description,
    status: 'draft',
    variants: config.variants.map(v => ({
      id: v.id,
      name: v.name,
      description: '',
      weight: v.weight,
      isControl: v.isControl ?? false,
      config: v.config ?? {},
    })),
    targetAudience: {
      percentage: config.targetPercentage ?? 100,
      filters: config.filters ?? [],
    },
    metrics: [],
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return experiment;
}

export default abTesting;
