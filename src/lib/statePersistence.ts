/**
 * State Persistence
 * Save and restore application state across sessions
 */

export interface PersistenceConfig {
  /** Storage key prefix */
  prefix?: string;
  /** Serializer function */
  serialize?: (data: unknown) => string;
  /** Deserializer function */
  deserialize?: (data: string) => unknown;
  /** Storage type */
  storage?: 'local' | 'session' | 'memory';
  /** Version for migrations */
  version?: number;
  /** Migration functions */
  migrations?: Record<number, (data: unknown) => unknown>;
  /** Exclude keys from persistence */
  exclude?: string[];
  /** Include only specific keys */
  include?: string[];
  /** Throttle save operations (ms) */
  throttle?: number;
  /** Encrypt data */
  encrypt?: boolean;
}

const DEFAULT_CONFIG: Required<PersistenceConfig> = {
  prefix: 'app_state_',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  storage: 'local',
  version: 1,
  migrations: {},
  exclude: [],
  include: [],
  throttle: 1000,
  encrypt: false,
};

// In-memory storage fallback
const memoryStorage = new Map<string, string>();

/**
 * Get storage implementation
 */
function getStorage(type: 'local' | 'session' | 'memory'): Storage | Map<string, string> {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }
  
  switch (type) {
    case 'local':
      return localStorage;
    case 'session':
      return sessionStorage;
    case 'memory':
      return memoryStorage;
    default:
      return localStorage;
  }
}

/**
 * Simple encryption/decryption (not cryptographically secure)
 */
function simpleEncrypt(data: string): string {
  return btoa(encodeURIComponent(data));
}

function simpleDecrypt(data: string): string {
  return decodeURIComponent(atob(data));
}

/**
 * State persistence manager
 */
export class StatePersistence<T extends Record<string, unknown>> {
  private config: Required<PersistenceConfig>;
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastSave = 0;

  constructor(
    private readonly key: string,
    config: PersistenceConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Save state to storage
   */
  save(state: T): void {
    const now = Date.now();
    const elapsed = now - this.lastSave;
    
    // Throttle saves
    if (elapsed < this.config.throttle) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      
      this.saveTimeout = setTimeout(() => {
        this.doSave(state);
      }, this.config.throttle - elapsed);
      
      return;
    }
    
    this.doSave(state);
  }

  /**
   * Actually perform the save
   */
  private doSave(state: T): void {
    try {
      // Filter state based on include/exclude
      let filteredState = { ...state };
      
      if (this.config.include.length > 0) {
        filteredState = {} as T;
        this.config.include.forEach((key) => {
          if (key in state) {
            (filteredState as Record<string, unknown>)[key] = state[key];
          }
        });
      } else if (this.config.exclude.length > 0) {
        this.config.exclude.forEach((key) => {
          delete (filteredState as Record<string, unknown>)[key];
        });
      }
      
      const payload = {
        version: this.config.version,
        timestamp: Date.now(),
        data: filteredState,
      };
      
      let serialized = this.config.serialize(payload);
      
      if (this.config.encrypt) {
        serialized = simpleEncrypt(serialized);
      }
      
      const storage = getStorage(this.config.storage);
      const storageKey = `${this.config.prefix}${this.key}`;
      
      if (storage instanceof Map) {
        storage.set(storageKey, serialized);
      } else {
        storage.setItem(storageKey, serialized);
      }
      
      this.lastSave = Date.now();
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Load state from storage
   */
  load(): T | null {
    try {
      const storage = getStorage(this.config.storage);
      const storageKey = `${this.config.prefix}${this.key}`;
      
      let serialized: string | null;
      
      if (storage instanceof Map) {
        serialized = storage.get(storageKey) || null;
      } else {
        serialized = storage.getItem(storageKey);
      }
      
      if (!serialized) return null;
      
      if (this.config.encrypt) {
        serialized = simpleDecrypt(serialized);
      }
      
      const payload = this.config.deserialize(serialized) as {
        version: number;
        timestamp: number;
        data: T;
      };
      
      // Apply migrations
      let data = payload.data;
      
      if (payload.version < this.config.version) {
        for (let v = payload.version; v < this.config.version; v++) {
          const migration = this.config.migrations[v + 1];
          if (migration) {
            data = migration(data) as T;
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  /**
   * Clear persisted state
   */
  clear(): void {
    const storage = getStorage(this.config.storage);
    const storageKey = `${this.config.prefix}${this.key}`;
    
    if (storage instanceof Map) {
      storage.delete(storageKey);
    } else {
      storage.removeItem(storageKey);
    }
  }

  /**
   * Check if state exists
   */
  exists(): boolean {
    const storage = getStorage(this.config.storage);
    const storageKey = `${this.config.prefix}${this.key}`;
    
    if (storage instanceof Map) {
      return storage.has(storageKey);
    }
    return storage.getItem(storageKey) !== null;
  }

  /**
   * Get last save timestamp
   */
  getLastSaveTime(): number | null {
    try {
      const storage = getStorage(this.config.storage);
      const storageKey = `${this.config.prefix}${this.key}`;
      
      let serialized: string | null;
      
      if (storage instanceof Map) {
        serialized = storage.get(storageKey) || null;
      } else {
        serialized = storage.getItem(storageKey);
      }
      
      if (!serialized) return null;
      
      if (this.config.encrypt) {
        serialized = simpleDecrypt(serialized);
      }
      
      const payload = this.config.deserialize(serialized) as {
        timestamp: number;
      };
      
      return payload.timestamp;
    } catch {
      return null;
    }
  }
}

/**
 * Create a persistence instance with React hook pattern
 */
export function createPersistence<T extends Record<string, unknown>>(
  key: string,
  config?: PersistenceConfig
): StatePersistence<T> {
  return new StatePersistence<T>(key, config);
}

/**
 * Session state helpers
 */
export const sessionState = {
  /**
   * Save session data
   */
  save<T>(key: string, data: T): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(`session_${key}`, JSON.stringify(data));
  },

  /**
   * Load session data
   */
  load<T>(key: string): T | null {
    if (typeof sessionStorage === 'undefined') return null;
    const data = sessionStorage.getItem(`session_${key}`);
    return data ? (JSON.parse(data) as T) : null;
  },

  /**
   * Remove session data
   */
  remove(key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(`session_${key}`);
  },

  /**
   * Clear all session data
   */
  clear(): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.clear();
  },
};

/**
 * Form state persistence
 */
export class FormPersistence {
  private persistence: StatePersistence<Record<string, unknown>>;

  constructor(formId: string) {
    this.persistence = new StatePersistence(`form_${formId}`, {
      storage: 'session',
      throttle: 500,
    });
  }

  /**
   * Save form field value
   */
  saveField(name: string, value: unknown): void {
    const current = this.persistence.load() || {};
    current[name] = value;
    this.persistence.save(current);
  }

  /**
   * Load form data
   */
  loadForm(): Record<string, unknown> {
    return this.persistence.load() || {};
  }

  /**
   * Clear form data
   */
  clearForm(): void {
    this.persistence.clear();
  }
}

/**
 * Navigation history persistence
 */
export const navigationHistory = {
  stack: [] as string[],
  maxLength: 50,

  /**
   * Push route to history
   */
  push(route: string): void {
    this.stack.push(route);
    if (this.stack.length > this.maxLength) {
      this.stack.shift();
    }
    this.save();
  },

  /**
   * Get previous route
   */
  getPrevious(): string | null {
    return this.stack[this.stack.length - 2] || null;
  },

  /**
   * Save to storage
   */
  save(): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem('nav_history', JSON.stringify(this.stack));
  },

  /**
   * Load from storage
   */
  load(): void {
    if (typeof sessionStorage === 'undefined') return;
    const data = sessionStorage.getItem('nav_history');
    if (data) {
      this.stack = JSON.parse(data);
    }
  },
};

/**
 * User preferences persistence
 */
export const userPreferences = {
  persistence: createPersistence<Record<string, unknown>>('user_prefs', {
    storage: 'local',
    version: 1,
  }),

  /**
   * Get preference
   */
  get<T>(key: string, defaultValue: T): T {
    const prefs = this.persistence.load();
    return prefs && key in prefs ? (prefs[key] as T) : defaultValue;
  },

  /**
   * Set preference
   */
  set<T>(key: string, value: T): void {
    const prefs = this.persistence.load() || {};
    prefs[key] = value;
    this.persistence.save(prefs);
  },

  /**
   * Remove preference
   */
  remove(key: string): void {
    const prefs = this.persistence.load() || {};
    delete prefs[key];
    this.persistence.save(prefs);
  },

  /**
   * Get all preferences
   */
  getAll(): Record<string, unknown> {
    return this.persistence.load() || {};
  },
};

export default {
  StatePersistence,
  createPersistence,
  sessionState,
  FormPersistence,
  navigationHistory,
  userPreferences,
};
