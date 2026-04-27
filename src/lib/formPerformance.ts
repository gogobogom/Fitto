/**
 * Form Performance Optimization
 * Form performans optimizasyonu
 */

// Debounced input handler
export function createDebouncedInput<T>(
  handler: (value: T) => void,
  delay: number = 300
): (value: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (value: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      handler(value);
      timeout = null;
    }, delay);
  };
}

// Throttled input handler
export function createThrottledInput<T>(
  handler: (value: T) => void,
  limit: number = 100
): (value: T) => void {
  let lastCall = 0;
  let lastValue: T | undefined;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (value: T) => {
    const now = Date.now();
    lastValue = value;

    if (now - lastCall >= limit) {
      handler(value);
      lastCall = now;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        if (lastValue !== undefined) {
          handler(lastValue);
        }
        lastCall = Date.now();
        timeout = null;
      }, limit - (now - lastCall));
    }
  };
}

// Form state manager with dirty tracking
export interface FormField<T> {
  value: T;
  initialValue: T;
  isDirty: boolean;
  isTouched: boolean;
  error: string | null;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

export function createFormState<T extends Record<string, unknown>>(
  initialValues: T
): FormState<T> {
  const fields = {} as { [K in keyof T]: FormField<T[K]> };

  for (const key in initialValues) {
    fields[key] = {
      value: initialValues[key],
      initialValue: initialValues[key],
      isDirty: false,
      isTouched: false,
      error: null,
    };
  }

  return {
    fields,
    isDirty: false,
    isValid: true,
    isSubmitting: false,
  };
}

// Optimized form validation
export type ValidationRule<T> = (value: T) => string | null;

export interface ValidationSchema<T extends Record<string, unknown>> {
  [K: string]: ValidationRule<T[keyof T]>[];
}

export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[]
): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: ValidationSchema<T>
): { [K in keyof T]?: string } {
  const errors: { [K in keyof T]?: string } = {};

  for (const key in schema) {
    const rules = schema[key];
    const value = values[key as keyof T];
    const error = validateField(value, rules as ValidationRule<typeof value>[]);
    if (error) {
      errors[key as keyof T] = error;
    }
  }

  return errors;
}

// Common validation rules
export const ValidationRules = {
  required: (message: string = 'Bu alan zorunludur'): ValidationRule<unknown> => 
    (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    },

  minLength: (min: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (value && value.length < min) {
        return message || `En az ${min} karakter olmalıdır`;
      }
      return null;
    },

  maxLength: (max: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (value && value.length > max) {
        return message || `En fazla ${max} karakter olmalıdır`;
      }
      return null;
    },

  email: (message: string = 'Geçerli bir e-posta adresi giriniz'): ValidationRule<string> =>
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  number: (message: string = 'Geçerli bir sayı giriniz'): ValidationRule<string> =>
    (value) => {
      if (value && isNaN(Number(value))) {
        return message;
      }
      return null;
    },

  min: (min: number, message?: string): ValidationRule<number | string> =>
    (value) => {
      const num = typeof value === 'string' ? Number(value) : value;
      if (!isNaN(num) && num < min) {
        return message || `En az ${min} olmalıdır`;
      }
      return null;
    },

  max: (max: number, message?: string): ValidationRule<number | string> =>
    (value) => {
      const num = typeof value === 'string' ? Number(value) : value;
      if (!isNaN(num) && num > max) {
        return message || `En fazla ${max} olmalıdır`;
      }
      return null;
    },

  pattern: (regex: RegExp, message: string): ValidationRule<string> =>
    (value) => {
      if (value && !regex.test(value)) {
        return message;
      }
      return null;
    },

  custom: <T>(validator: (value: T) => boolean, message: string): ValidationRule<T> =>
    (value) => {
      if (!validator(value)) {
        return message;
      }
      return null;
    },
};

// Input masking
export interface MaskOptions {
  mask: string;
  maskChar?: string;
  formatChars?: Record<string, RegExp>;
}

export function createInputMask(options: MaskOptions): {
  format: (value: string) => string;
  parse: (value: string) => string;
} {
  const { mask, maskChar = '_' } = options;
  const formatChars = options.formatChars || {
    '9': /[0-9]/,
    'a': /[a-zA-Z]/,
    '*': /[a-zA-Z0-9]/,
  };

  const format = (value: string): string => {
    let result = '';
    let valueIndex = 0;

    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      const maskChar_i = mask[i];
      const formatChar = formatChars[maskChar_i];

      if (formatChar) {
        // This is a format position
        while (valueIndex < value.length) {
          const char = value[valueIndex];
          valueIndex++;
          if (formatChar.test(char)) {
            result += char;
            break;
          }
        }
      } else {
        // This is a literal character
        result += maskChar_i;
        if (value[valueIndex] === maskChar_i) {
          valueIndex++;
        }
      }
    }

    return result;
  };

  const parse = (value: string): string => {
    let result = '';

    for (let i = 0, j = 0; i < value.length && j < mask.length; i++, j++) {
      const char = value[i];
      const maskChar_j = mask[j];
      const formatChar = formatChars[maskChar_j];

      if (formatChar) {
        if (formatChar.test(char)) {
          result += char;
        } else {
          i--; // Stay on current value char
        }
      }
      // Skip literal characters
    }

    return result;
  };

  return { format, parse };
}

// Common masks
export const InputMasks = {
  phone: createInputMask({ mask: '(999) 999-9999' }),
  creditCard: createInputMask({ mask: '9999 9999 9999 9999' }),
  date: createInputMask({ mask: '99/99/9999' }),
  time: createInputMask({ mask: '99:99' }),
  zipCode: createInputMask({ mask: '99999' }),
};

// Auto-resize textarea
export function autoResizeTextarea(
  textarea: HTMLTextAreaElement,
  options: { minHeight?: number; maxHeight?: number } = {}
): () => void {
  const { minHeight = 40, maxHeight = 300 } = options;

  const resize = () => {
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  textarea.addEventListener('input', resize);
  textarea.addEventListener('focus', resize);

  // Initial resize
  resize();

  return () => {
    textarea.removeEventListener('input', resize);
    textarea.removeEventListener('focus', resize);
  };
}

// Form autosave
export function createAutosave<T>(
  saveFn: (data: T) => Promise<void>,
  options: { delay?: number; key?: string } = {}
): {
  save: (data: T) => void;
  flush: () => Promise<void>;
  cancel: () => void;
  getLastSaved: () => T | null;
} {
  const { delay = 2000, key = 'form_autosave' } = options;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingData: T | null = null;
  let lastSaved: T | null = null;

  // Load from localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        lastSaved = JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
  }

  const save = (data: T) => {
    pendingData = data;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(async () => {
      if (pendingData) {
        try {
          await saveFn(pendingData);
          lastSaved = pendingData;
          
          // Also save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(pendingData));
          }
        } catch (error) {
          console.error('Autosave failed:', error);
        }
        pendingData = null;
      }
      timeout = null;
    }, delay);
  };

  const flush = async () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (pendingData) {
      try {
        await saveFn(pendingData);
        lastSaved = pendingData;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(pendingData));
        }
      } catch (error) {
        console.error('Autosave flush failed:', error);
      }
      pendingData = null;
    }
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    pendingData = null;
  };

  const getLastSaved = () => lastSaved;

  return { save, flush, cancel, getLastSaved };
}

// Form field focus management
export function createFocusManager(
  formRef: React.RefObject<HTMLFormElement>
): {
  focusFirst: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusField: (name: string) => void;
} {
  const getFields = (): HTMLElement[] => {
    if (!formRef.current) return [];
    return Array.from(
      formRef.current.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button[type="submit"]'
      )
    ).filter(el => !el.hasAttribute('disabled'));
  };

  const getCurrentIndex = (): number => {
    const fields = getFields();
    const active = document.activeElement as HTMLElement;
    return fields.indexOf(active);
  };

  return {
    focusFirst: () => {
      const fields = getFields();
      if (fields.length > 0) {
        fields[0].focus();
      }
    },

    focusNext: () => {
      const fields = getFields();
      const current = getCurrentIndex();
      if (current < fields.length - 1) {
        fields[current + 1].focus();
      }
    },

    focusPrevious: () => {
      const fields = getFields();
      const current = getCurrentIndex();
      if (current > 0) {
        fields[current - 1].focus();
      }
    },

    focusField: (name: string) => {
      if (!formRef.current) return;
      const field = formRef.current.querySelector<HTMLElement>(`[name="${name}"]`);
      if (field) {
        field.focus();
      }
    },
  };
}

// Optimized onChange handler
export function createOptimizedOnChange<T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
  callback: (name: string, value: string) => void,
  options: { debounce?: number; immediate?: boolean } = {}
): (event: React.ChangeEvent<T>) => void {
  const { debounce = 0, immediate = true } = options;

  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (event: React.ChangeEvent<T>) => {
    const { name, value } = event.target;

    if (immediate && debounce === 0) {
      callback(name, value);
      return;
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    if (immediate) {
      callback(name, value);
    }

    if (debounce > 0) {
      timeout = setTimeout(() => {
        if (!immediate) {
          callback(name, value);
        }
        timeout = null;
      }, debounce);
    }
  };
}
