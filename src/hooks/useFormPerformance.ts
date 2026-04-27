'use client';

/**
 * Form Performance Hooks
 * Form performans hook'ları
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// Form field state
interface FieldState<T> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

// Form state
interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Validation function type
type Validator<T> = (value: T, values: Record<string, unknown>) => string | null;

// Form options
interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validators?: Partial<Record<keyof T, Validator<T[keyof T]>[]>>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

// Optimized form hook
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => string | null;
  validateForm: () => boolean;
  getFieldProps: (field: keyof T) => {
    name: string;
    value: T[keyof T];
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  };
} {
  const {
    initialValues,
    validators = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 0,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValuesRef = useRef(initialValues);
  const debounceTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      key => values[key as keyof T] !== initialValuesRef.current[key as keyof T]
    );
  }, [values]);

  // Validate single field
  const validateField = useCallback((field: keyof T): string | null => {
    const fieldValidators = validators[field];
    if (!fieldValidators) return null;

    for (const validator of fieldValidators) {
      const error = validator(values[field], values as Record<string, unknown>);
      if (error) return error;
    }
    return null;
  }, [values, validators]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validators).forEach(field => {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validators]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Handle field change
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof T;
    
    // Handle different input types
    let fieldValue: unknown = value;
    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      fieldValue = value === '' ? '' : Number(value);
    }

    setValues(prev => ({
      ...prev,
      [fieldName]: fieldValue,
    }));

    // Debounced validation
    if (validateOnChange) {
      if (debounceTimerRef.current[name]) {
        clearTimeout(debounceTimerRef.current[name]);
      }

      if (debounceMs > 0) {
        debounceTimerRef.current[name] = setTimeout(() => {
          const error = validateField(fieldName);
          setErrors(prev => ({
            ...prev,
            [fieldName]: error || undefined,
          }));
        }, debounceMs);
      } else {
        const error = validateField(fieldName);
        setErrors(prev => ({
          ...prev,
          [fieldName]: error || undefined,
        }));
      }
    }
  }, [validateOnChange, validateField, debounceMs]);

  // Handle field blur
  const handleBlur = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    const fieldName = name as keyof T;

    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }));

    if (validateOnBlur) {
      const error = validateField(fieldName);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || undefined,
      }));
    }
  }, [validateOnBlur, validateField]);

  // Handle form submit
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach(key => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit]);

  // Set field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Set field error programmatically
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error || undefined,
    }));
  }, []);

  // Set field touched programmatically
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  // Get field props helper
  const getFieldProps = useCallback((field: keyof T) => ({
    name: field as string,
    value: values[field],
    onChange: handleChange,
    onBlur: handleBlur,
  }), [values, handleChange, handleBlur]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateField,
    validateForm,
    getFieldProps,
  };
}

// Debounced input hook
export function useDebouncedInput<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setValueDebounced = useCallback((newValue: T) => {
    setValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, setValueDebounced];
}

// Auto-save hook
export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  delay: number = 2000
): {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  saveNow: () => Promise<void>;
} {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      await saveFn(dataRef.current);
      setLastSaved(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSaving(false);
    }
  }, [saveFn]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(save, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, save]);

  return {
    isSaving,
    lastSaved,
    error,
    saveNow: save,
  };
}

// Field array hook for dynamic form fields
export function useFieldArray<T>(
  initialItems: T[] = []
): {
  items: T[];
  append: (item: T) => void;
  prepend: (item: T) => void;
  insert: (index: number, item: T) => void;
  remove: (index: number) => void;
  swap: (indexA: number, indexB: number) => void;
  move: (from: number, to: number) => void;
  update: (index: number, item: T) => void;
  replace: (items: T[]) => void;
} {
  const [items, setItems] = useState<T[]>(initialItems);

  const append = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const prepend = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const insert = useCallback((index: number, item: T) => {
    setItems(prev => {
      const next = [...prev];
      next.splice(index, 0, item);
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const swap = useCallback((indexA: number, indexB: number) => {
    setItems(prev => {
      const next = [...prev];
      [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
      return next;
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setItems(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const update = useCallback((index: number, item: T) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const replace = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    update,
    replace,
  };
}

// Common validators
export const validators = {
  required: (message: string = 'Bu alan zorunludur') => 
    (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    },

  minLength: (min: number, message?: string) =>
    (value: string): string | null => {
      if (value && value.length < min) {
        return message || `En az ${min} karakter olmalıdır`;
      }
      return null;
    },

  maxLength: (max: number, message?: string) =>
    (value: string): string | null => {
      if (value && value.length > max) {
        return message || `En fazla ${max} karakter olmalıdır`;
      }
      return null;
    },

  email: (message: string = 'Geçerli bir e-posta adresi giriniz') =>
    (value: string): string | null => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  pattern: (regex: RegExp, message: string) =>
    (value: string): string | null => {
      if (value && !regex.test(value)) {
        return message;
      }
      return null;
    },

  min: (min: number, message?: string) =>
    (value: number | string): string | null => {
      const num = typeof value === 'string' ? Number(value) : value;
      if (!isNaN(num) && num < min) {
        return message || `En az ${min} olmalıdır`;
      }
      return null;
    },

  max: (max: number, message?: string) =>
    (value: number | string): string | null => {
      const num = typeof value === 'string' ? Number(value) : value;
      if (!isNaN(num) && num > max) {
        return message || `En fazla ${max} olmalıdır`;
      }
      return null;
    },
};
