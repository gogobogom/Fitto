'use client';

import { useState, useEffect, useCallback } from 'react';
import abTesting, {
  type Experiment,
  type Variant,
  type ExperimentAssignment,
  createExperiment,
} from '@/lib/abTesting';

// Hook for getting variant for an experiment
export function useExperiment(experimentId: string): {
  variant: Variant | null;
  isLoading: boolean;
  isControl: boolean;
  config: Record<string, unknown>;
} {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const v = abTesting.getVariant(experimentId);
    setVariant(v);
    setIsLoading(false);

    // Subscribe to changes
    const unsubscribe = abTesting.subscribe(experimentId, (newVariant) => {
      setVariant(newVariant);
    });

    return unsubscribe;
  }, [experimentId]);

  return {
    variant,
    isLoading,
    isControl: variant?.isControl ?? true,
    config: variant?.config ?? {},
  };
}

// Hook for feature flags
export function useFeatureFlag<T>(
  experimentId: string,
  defaultValue: T
): { value: T; isLoading: boolean } {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const v = abTesting.getFeatureFlag(experimentId, defaultValue);
    setValue(v);
    setIsLoading(false);
  }, [experimentId, defaultValue]);

  return { value, isLoading };
}

// Hook for tracking conversions
export function useConversionTracking(experimentId: string): {
  trackConversion: (value?: number) => void;
  trackEngagement: (action: string, value?: number) => void;
  trackEvent: (eventType: string, value?: number, metadata?: Record<string, unknown>) => void;
} {
  const trackConversion = useCallback(
    (value?: number) => {
      abTesting.trackConversion(experimentId, value);
    },
    [experimentId]
  );

  const trackEngagement = useCallback(
    (action: string, value?: number) => {
      abTesting.trackEngagement(experimentId, action, value);
    },
    [experimentId]
  );

  const trackEvent = useCallback(
    (eventType: string, value?: number, metadata?: Record<string, unknown>) => {
      abTesting.trackEvent(experimentId, eventType, value, metadata);
    },
    [experimentId]
  );

  return { trackConversion, trackEngagement, trackEvent };
}

// Hook for A/B testing management
export function useABTestingManager(): {
  experiments: Experiment[];
  assignments: ExperimentAssignment[];
  registerExperiment: (experiment: Experiment) => void;
  createAndRegister: (config: Parameters<typeof createExperiment>[0]) => Experiment;
  forceVariant: (experimentId: string, variantId: string) => void;
  resetAssignments: () => void;
  flushEvents: () => Promise<void>;
} {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [assignments, setAssignments] = useState<ExperimentAssignment[]>([]);

  useEffect(() => {
    setExperiments(abTesting.getActiveExperiments());
    setAssignments(abTesting.getCurrentAssignments());
  }, []);

  const registerExperiment = useCallback((experiment: Experiment) => {
    abTesting.registerExperiment(experiment);
    setExperiments(abTesting.getActiveExperiments());
  }, []);

  const createAndRegister = useCallback(
    (config: Parameters<typeof createExperiment>[0]) => {
      const experiment = createExperiment(config);
      experiment.status = 'running';
      abTesting.registerExperiment(experiment);
      setExperiments(abTesting.getActiveExperiments());
      return experiment;
    },
    []
  );

  const forceVariant = useCallback(
    (experimentId: string, variantId: string) => {
      abTesting.forceVariant(experimentId, variantId);
      setAssignments(abTesting.getCurrentAssignments());
    },
    []
  );

  const resetAssignments = useCallback(() => {
    abTesting.resetAssignments();
    setAssignments([]);
  }, []);

  const flushEvents = useCallback(async () => {
    await abTesting.flushEvents();
  }, []);

  return {
    experiments,
    assignments,
    registerExperiment,
    createAndRegister,
    forceVariant,
    resetAssignments,
    flushEvents,
  };
}

// Hook for simple A/B test (2 variants)
export function useSimpleABTest(
  testName: string,
  options: {
    controlWeight?: number;
    treatmentWeight?: number;
    autoRegister?: boolean;
  } = {}
): {
  isControl: boolean;
  isTreatment: boolean;
  variant: 'control' | 'treatment' | null;
  trackConversion: (value?: number) => void;
} {
  const { controlWeight = 50, treatmentWeight = 50, autoRegister = true } = options;

  const experimentId = `simple_ab_${testName}`;

  // Auto-register experiment
  useEffect(() => {
    if (autoRegister) {
      const experiment = createExperiment({
        id: experimentId,
        name: testName,
        description: `Simple A/B test: ${testName}`,
        variants: [
          { id: 'control', name: 'Control', weight: controlWeight, isControl: true },
          { id: 'treatment', name: 'Treatment', weight: treatmentWeight },
        ],
      });
      experiment.status = 'running';
      abTesting.registerExperiment(experiment);
    }
  }, [experimentId, testName, controlWeight, treatmentWeight, autoRegister]);

  const { variant, isLoading } = useExperiment(experimentId);
  const { trackConversion } = useConversionTracking(experimentId);

  const isControl = !isLoading && variant?.id === 'control';
  const isTreatment = !isLoading && variant?.id === 'treatment';

  return {
    isControl,
    isTreatment,
    variant: isControl ? 'control' : isTreatment ? 'treatment' : null,
    trackConversion,
  };
}

// Hook for multivariate testing
export function useMultivariateTest<T extends string>(
  testName: string,
  variants: Array<{ id: T; name: string; weight: number; config?: Record<string, unknown> }>
): {
  variantId: T | null;
  variantConfig: Record<string, unknown>;
  isLoading: boolean;
  trackConversion: (value?: number) => void;
} {
  const experimentId = `mv_${testName}`;

  // Auto-register experiment
  useEffect(() => {
    const experiment = createExperiment({
      id: experimentId,
      name: testName,
      description: `Multivariate test: ${testName}`,
      variants: variants.map((v, i) => ({
        ...v,
        isControl: i === 0,
      })),
    });
    experiment.status = 'running';
    abTesting.registerExperiment(experiment);
  }, [experimentId, testName, variants]);

  const { variant, isLoading, config } = useExperiment(experimentId);
  const { trackConversion } = useConversionTracking(experimentId);

  return {
    variantId: (variant?.id as T) ?? null,
    variantConfig: config,
    isLoading,
    trackConversion,
  };
}

export default useExperiment;
