'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import sessionReplay, { SessionReplayPlayer, type SessionRecording } from '@/lib/sessionReplay';

// Hook for session replay recording
export function useSessionReplay(): {
  isRecording: boolean;
  sessionId: string | null;
  stats: { eventCount: number; duration: number; snapshotCount: number };
  start: () => void;
  stop: () => void;
  recordCustomEvent: (name: string, properties?: Record<string, unknown>) => void;
} {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ eventCount: 0, duration: 0, snapshotCount: 0 });

  useEffect(() => {
    // Auto-start recording on mount
    sessionReplay.start();
    setIsRecording(sessionReplay.isActive());
    setSessionId(sessionReplay.getSessionId());

    // Update stats periodically
    const interval = setInterval(() => {
      if (sessionReplay.isActive()) {
        setStats(sessionReplay.getStats());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const start = useCallback(() => {
    sessionReplay.start();
    setIsRecording(sessionReplay.isActive());
    setSessionId(sessionReplay.getSessionId());
  }, []);

  const stop = useCallback(() => {
    sessionReplay.stop();
    setIsRecording(false);
  }, []);

  const recordCustomEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      sessionReplay.recordCustomEvent(name, properties);
    },
    []
  );

  return {
    isRecording,
    sessionId,
    stats,
    start,
    stop,
    recordCustomEvent,
  };
}

// Hook for session replay playback
export function useSessionReplayPlayer(recording: SessionRecording | null): {
  isPlaying: boolean;
  progress: number;
  currentEvent: { type: string; timestamp: number } | null;
  play: (speed?: number) => void;
  pause: () => void;
  seek: (timestamp: number) => void;
  info: { duration: number; eventCount: number } | null;
  clickHeatmap: Array<{ x: number; y: number; count: number }>;
} {
  const playerRef = useRef<SessionReplayPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentEvent, setCurrentEvent] = useState<{ type: string; timestamp: number } | null>(null);
  const [clickHeatmap, setClickHeatmap] = useState<Array<{ x: number; y: number; count: number }>>([]);

  useEffect(() => {
    if (!recording) {
      playerRef.current = null;
      return;
    }

    const player = new SessionReplayPlayer(recording);
    playerRef.current = player;

    player.onEvent((event) => {
      setCurrentEvent({ type: event.type, timestamp: event.timestamp });
    });

    player.onProgress((p) => {
      setProgress(p);
      if (p >= 1) {
        setIsPlaying(false);
      }
    });

    setClickHeatmap(player.getClickHeatmap());

    return () => {
      player.pause();
    };
  }, [recording]);

  const play = useCallback((speed: number = 1) => {
    if (playerRef.current) {
      playerRef.current.play(speed);
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seek(timestamp);
    }
  }, []);

  const info = recording
    ? {
        duration: recording.duration,
        eventCount: recording.events.length,
      }
    : null;

  return {
    isPlaying,
    progress,
    currentEvent,
    play,
    pause,
    seek,
    info,
    clickHeatmap,
  };
}

// Hook for tracking user journey
export function useUserJourney(): {
  trackStep: (stepName: string, metadata?: Record<string, unknown>) => void;
  trackAction: (actionName: string, metadata?: Record<string, unknown>) => void;
  trackError: (errorName: string, metadata?: Record<string, unknown>) => void;
} {
  const trackStep = useCallback((stepName: string, metadata?: Record<string, unknown>) => {
    sessionReplay.recordCustomEvent(`journey_step_${stepName}`, {
      step: stepName,
      timestamp: Date.now(),
      ...metadata,
    });
  }, []);

  const trackAction = useCallback((actionName: string, metadata?: Record<string, unknown>) => {
    sessionReplay.recordCustomEvent(`user_action_${actionName}`, {
      action: actionName,
      timestamp: Date.now(),
      ...metadata,
    });
  }, []);

  const trackError = useCallback((errorName: string, metadata?: Record<string, unknown>) => {
    sessionReplay.recordCustomEvent(`user_error_${errorName}`, {
      error: errorName,
      timestamp: Date.now(),
      ...metadata,
    });
  }, []);

  return {
    trackStep,
    trackAction,
    trackError,
  };
}

// Hook for rage click detection
export function useRageClickDetection(
  threshold: number = 3,
  timeWindow: number = 500,
  onRageClick?: (element: Element) => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clicks: Array<{ timestamp: number; element: Element }> = [];

    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      const target = e.target as Element;

      // Add click
      clicks.push({ timestamp: now, element: target });

      // Remove old clicks
      while (clicks.length > 0 && now - clicks[0].timestamp > timeWindow) {
        clicks.shift();
      }

      // Check for rage clicks on same element
      const sameElementClicks = clicks.filter(
        (click) => click.element === target || click.element.contains(target) || target.contains(click.element)
      );

      if (sameElementClicks.length >= threshold) {
        // Rage click detected
        sessionReplay.recordCustomEvent('rage_click', {
          element: target.tagName,
          className: target.className,
          clickCount: sameElementClicks.length,
        });

        if (onRageClick) {
          onRageClick(target);
        }

        // Clear clicks for this detection
        clicks.length = 0;
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [threshold, timeWindow, onRageClick]);
}

// Hook for dead click detection
export function useDeadClickDetection(onDeadClick?: (element: Element) => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;

      // Check if element looks clickable but doesn't do anything
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('btn') ||
        target.classList.contains('button') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (!isClickable) return;

      // Check if element is disabled
      const isDisabled =
        (target as HTMLButtonElement).disabled ||
        target.getAttribute('aria-disabled') === 'true' ||
        target.classList.contains('disabled');

      if (isDisabled) {
        sessionReplay.recordCustomEvent('dead_click', {
          element: target.tagName,
          className: target.className,
          reason: 'disabled',
        });

        if (onDeadClick) {
          onDeadClick(target);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [onDeadClick]);
}

export default useSessionReplay;
