'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useRipple, usePressState, useBounce, useShake, useSuccessAnimation } from '@/hooks/useMicroInteractions';

/**
 * Micro-interaction UI Componentleri
 */

// Ripple Effect Container
interface RippleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

export const RippleContainer = forwardRef<HTMLDivElement, RippleContainerProps>(
  ({ children, className, disabled, ...props }, ref) => {
    const { ripples, createRipple } = useRipple();
    
    const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!disabled) {
        createRipple(e);
      }
    };
    
    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
        {...props}
      >
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </div>
    );
  }
);
RippleContainer.displayName = 'RippleContainer';

// Press Effect Button
interface PressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const PressButton = forwardRef<HTMLButtonElement, PressButtonProps>(
  ({ children, className, ...props }, ref) => {
    const { isPressed, handlers } = usePressState();
    
    return (
      <button
        ref={ref}
        className={cn(
          'transition-transform duration-100',
          isPressed && 'scale-95',
          className
        )}
        {...handlers}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PressButton.displayName = 'PressButton';

// Bounce Animation Wrapper
interface BounceWrapperProps {
  children: React.ReactNode;
  className?: string;
  trigger?: boolean;
}

export function BounceWrapper({ children, className, trigger }: BounceWrapperProps) {
  const { isBouncing, trigger: triggerBounce } = useBounce();
  
  React.useEffect(() => {
    if (trigger) {
      triggerBounce();
    }
  }, [trigger, triggerBounce]);
  
  return (
    <div
      className={cn(
        'transition-transform duration-300',
        isBouncing && 'animate-bounce-once',
        className
      )}
    >
      {children}
    </div>
  );
}

// Shake Animation Wrapper
interface ShakeWrapperProps {
  children: React.ReactNode;
  className?: string;
  trigger?: boolean;
}

export function ShakeWrapper({ children, className, trigger }: ShakeWrapperProps) {
  const { isShaking, trigger: triggerShake } = useShake();
  
  React.useEffect(() => {
    if (trigger) {
      triggerShake();
    }
  }, [trigger, triggerShake]);
  
  return (
    <div
      className={cn(
        isShaking && 'animate-shake',
        className
      )}
    >
      {children}
    </div>
  );
}

// Success Check Animation
interface SuccessCheckProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SuccessCheck({ show, size = 'md', className }: SuccessCheckProps) {
  const { isAnimating, trigger } = useSuccessAnimation();
  
  React.useEffect(() => {
    if (show) {
      trigger();
    }
  }, [show, trigger]);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  if (!show && !isAnimating) return null;
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-green-500',
        sizeClasses[size],
        isAnimating && 'animate-success-pop',
        className
      )}
    >
      <svg
        className={cn(
          'text-white',
          size === 'sm' && 'w-3 h-3',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-8 h-8'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
          className={isAnimating ? 'animate-draw-check' : ''}
        />
      </svg>
    </div>
  );
}

// Pulse Indicator
interface PulseIndicatorProps {
  active?: boolean;
  color?: 'green' | 'red' | 'orange' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseIndicator({ 
  active = true, 
  color = 'green', 
  size = 'md',
  className 
}: PulseIndicatorProps) {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
  };
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <span className={cn('relative inline-flex', className)}>
      {active && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            colorClasses[color]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          colorClasses[color],
          sizeClasses[size]
        )}
      />
    </span>
  );
}

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 500, 
  className,
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const previousValue = React.useRef(value);
  
  React.useEffect(() => {
    if (previousValue.current === value) return;
    
    const startValue = previousValue.current;
    const difference = value - startValue;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeOut;
      
      setDisplayValue(Math.round(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{displayValue.toLocaleString('tr-TR')}{suffix}
    </span>
  );
}

// Progress Ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = '#f97316',
  bgColor = '#e5e7eb',
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={bgColor}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// Slide In Animation
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
  show?: boolean;
}

export function SlideIn({ 
  children, 
  direction = 'up', 
  delay = 0,
  className,
  show = true
}: SlideInProps) {
  const directionClasses = {
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right',
    up: 'animate-fade-in-up',
    down: 'animate-fade-in-down',
  };
  
  if (!show) return null;
  
  return (
    <div
      className={cn(directionClasses[direction], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger Children Animation
interface StaggerChildrenProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggerChildren({ 
  children, 
  staggerDelay = 50,
  className 
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
