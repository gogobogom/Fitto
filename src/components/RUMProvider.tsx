'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { rum, type SessionData, type RUMEvent, type WebVitalMetric } from '@/lib/realUserMonitoring';

interface RUMContextValue {
  session: SessionData | null;
  events: RUMEvent[];
  webVitals: Record<string, WebVitalMetric>;
  isInitialized: boolean;
  trackInteraction: (name: string, data?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  trackCustom: (name: string, data?: Record<string, unknown>) => void;
  trackPageView: (data?: Record<string, unknown>) => void;
}

const RUMContext = createContext<RUMContextValue | null>(null);

interface RUMProviderProps {
  children: ReactNode;
  userId?: string;
  enabled?: boolean;
}

export function RUMProvider({ children, userId, enabled = true }: RUMProviderProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [events, setEvents] = useState<RUMEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initialize RUM
    rum.init({ userId });
    setIsInitialized(true);

    // Get initial session
    setSession(rum.getSession());
    setEvents(rum.getStoredEvents());

    // Update session periodically
    const interval = setInterval(() => {
      setSession(rum.getSession());
      setEvents(rum.getStoredEvents());
    }, 5000);

    return () => {
      clearInterval(interval);
      rum.destroy();
    };
  }, [userId, enabled]);

  const trackInteraction = (name: string, data?: Record<string, unknown>) => {
    if (!enabled) return;
    rum.trackInteraction(name, data);
  };

  const trackError = (error: Error, context?: Record<string, unknown>) => {
    if (!enabled) return;
    rum.trackError(error, context);
  };

  const trackCustom = (name: string, data?: Record<string, unknown>) => {
    if (!enabled) return;
    rum.trackCustom(name, data);
  };

  const trackPageView = (data?: Record<string, unknown>) => {
    if (!enabled) return;
    rum.trackPageView(data);
  };

  const webVitals = session?.webVitals || {};

  return (
    <RUMContext.Provider
      value={{
        session,
        events,
        webVitals,
        isInitialized,
        trackInteraction,
        trackError,
        trackCustom,
        trackPageView,
      }}
    >
      {children}
    </RUMContext.Provider>
  );
}

export function useRUMContext(): RUMContextValue {
  const context = useContext(RUMContext);
  if (!context) {
    throw new Error('useRUMContext must be used within a RUMProvider');
  }
  return context;
}

// Utility component for tracking route changes
export function RUMRouteTracker() {
  const { trackPageView, isInitialized } = useRUMContext();

  useEffect(() => {
    if (!isInitialized) return;

    // Track initial page view
    trackPageView();

    // Track route changes (for SPA navigation)
    const handleRouteChange = () => {
      trackPageView({ navigationType: 'client' });
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isInitialized, trackPageView]);

  return null;
}

// Error boundary integration component
interface RUMErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

import { Component, type ErrorInfo } from 'react';

class RUMErrorBoundaryClass extends Component<
  RUMErrorBoundaryProps & { trackError: (error: Error, context?: Record<string, unknown>) => void },
  ErrorBoundaryState
> {
  constructor(props: RUMErrorBoundaryProps & { trackError: (error: Error, context?: Record<string, unknown>) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.trackError(error, {
      componentStack: errorInfo.componentStack || undefined,
      timestamp: Date.now(),
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Bir hata oluştu</h2>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'Bilinmeyen hata'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RUMErrorBoundary({ children, fallback }: RUMErrorBoundaryProps) {
  const { trackError } = useRUMContext();
  
  return (
    <RUMErrorBoundaryClass trackError={trackError} fallback={fallback}>
      {children}
    </RUMErrorBoundaryClass>
  );
}
