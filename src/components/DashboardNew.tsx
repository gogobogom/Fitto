'use client';

/**
 * DashboardNew - Legacy dashboard kept only as a fallback.
 * The active dashboard is `EnhancedDashboard`. We re-export it here so that
 * any old call sites keep working without touching the legacy code paths
 * (MealTemplates / ExerciseList / daily_logs queries) that were referencing
 * dropped tables.
 */

import type { ComponentProps } from 'react';
import { EnhancedDashboard } from './EnhancedDashboard';

type LegacyProps = Omit<ComponentProps<typeof EnhancedDashboard>, 'onAddMeal' | 'onAddExercise' | 'onNavigate'> & {
  onMealClick?: () => void;
  onExerciseClick?: () => void;
};

export function DashboardNew(props: LegacyProps) {
  const { onMealClick, onExerciseClick, ...rest } = props;
  return (
    <EnhancedDashboard
      {...rest}
      onAddMeal={onMealClick ?? (() => {})}
      onAddExercise={onExerciseClick ?? (() => {})}
      onNavigate={() => {}}
    />
  );
}

export default DashboardNew;
