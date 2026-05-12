/**
 * Shared calorie / BMR / TDEE math.
 *
 * Single source of truth for both `Onboarding.tsx` and `HealthCalculators.tsx`.
 * Enums for Gender and ActivityLevel are re-exported from `@/types/supabase`
 * so the whole app speaks the same language.
 */

import type { ActivityLevel, Gender, GoalType } from '@/types/supabase';

export type { ActivityLevel, Gender, GoalType };

/** Mifflin-St Jeor activity multipliers, keyed by the canonical ActivityLevel. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
};

export interface CalorieInput {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

/**
 * Basal Metabolic Rate (Mifflin-St Jeor).
 * `other` falls back to the female formula (more conservative).
 */
export function calculateBMR({ age, weightKg, heightCm, gender }: Omit<CalorieInput, 'activityLevel'>): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure = BMR × activity multiplier. */
export function calculateTDEE(input: CalorieInput): number {
  const bmr = calculateBMR(input);
  return bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
}

/**
 * Daily calorie target adjusted for the user's goal.
 * - loseWeight:           −500 kcal
 * - gainWeight/buildMuscle: +500 kcal
 * - maintainWeight:         0
 */
export function calculateDailyCalorieTarget(input: CalorieInput, goal: GoalType): number {
  const tdee = calculateTDEE(input);
  let calories = Math.round(tdee);
  if (goal === 'loseWeight') {
    calories -= 500;
  } else if (goal === 'gainWeight' || goal === 'buildMuscle') {
    calories += 500;
  }
  return calories;
}
