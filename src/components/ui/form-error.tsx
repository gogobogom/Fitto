/**
 * Form Error Component - Displays validation errors with animation
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-red-600 dark:text-red-400',
        'fade-in-down',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

/**
 * Form Field Wrapper with Error Display
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

export function FormField({ label, error, required, children, htmlFor }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      <FormError error={error} />
    </div>
  );
}

/**
 * Success Message Component
 */
interface FormSuccessProps {
  message?: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-green-600 dark:text-green-400',
        'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md',
        'fade-in-down',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
