/**
 * Server-side helper that loads the last 7 days of a user's meals + exercises +
 * goal + profile and returns a tidy summary used by both the OG image route
 * and the /share/week landing page.
 *
 * Uses the service-role Supabase client so it works for any user_id (the
 * sharing user has explicitly opted-in by sharing their link).
 */

import { supabaseAdmin } from '@/lib/supabase/server';

export interface DayPoint {
  date: string; // YYYY-MM-DD
  consumed: number;
  burned: number;
  net: number;
  onTarget: boolean;
}

export interface WeekStats {
  username: string;
  language: 'tr' | 'en';
  targetCalories: number;
  goalType: string | null;
  totalConsumed: number;
  totalBurned: number;
  avgNet: number;
  daysOnTarget: number;
  daysLogged: number;
  adherencePct: number;
  days: DayPoint[]; // length 7, oldest first
  rangeLabel: string;
}

export interface ProfileBundle {
  found: boolean;
  username: string;
  targetCalories: number;
  goalType: string | null;
}

const DEFAULT_TARGET = 2000;
const ON_TARGET_LOWER = 0.8; // 80%
const ON_TARGET_UPPER = 1.2; // 120%

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

export async function loadProfileBundle(userId: string): Promise<ProfileBundle> {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('username, full_name')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: goal } = await supabaseAdmin
    .from('user_goals')
    .select('daily_calorie_target, goal_type')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    found: !!profile,
    username: profile?.username || profile?.full_name || 'Fitto User',
    targetCalories: goal?.daily_calorie_target ?? DEFAULT_TARGET,
    goalType: goal?.goal_type ?? null,
  };
}

export async function loadWeekStats(
  userId: string,
  language: 'tr' | 'en' = 'tr',
): Promise<WeekStats> {
  const today = new Date();
  // Build the 7 day frame (oldest -> newest)
  const frame: DayPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    frame.push({
      date: fmtDate(d),
      consumed: 0,
      burned: 0,
      net: 0,
      onTarget: false,
    });
  }
  const startDate = frame[0].date;
  const endDate = frame[frame.length - 1].date;

  const profile = await loadProfileBundle(userId);

  const [{ data: meals }, { data: exercises }] = await Promise.all([
    supabaseAdmin
      .from('meals')
      .select('date, calories')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabaseAdmin
      .from('exercises')
      .select('date, calories_burned')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
  ]);

  const byDate: Record<string, DayPoint> = {};
  frame.forEach((d) => {
    byDate[d.date] = d;
  });

  (meals ?? []).forEach((m) => {
    const k = m.date as string;
    if (k && byDate[k]) byDate[k].consumed += Number(m.calories) || 0;
  });

  // exercises.calories_burned may not exist on the legacy schema; skip silently if so
  (exercises ?? []).forEach((e) => {
    const k = e.date as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const burned = Number((e as any).calories_burned) || 0;
    if (k && byDate[k]) byDate[k].burned += burned;
  });

  let totalConsumed = 0;
  let totalBurned = 0;
  let daysLogged = 0;
  let daysOnTarget = 0;

  frame.forEach((d) => {
    d.net = d.consumed - d.burned;
    totalConsumed += d.consumed;
    totalBurned += d.burned;
    if (d.consumed > 0) {
      daysLogged += 1;
      const ratio = d.net / profile.targetCalories;
      if (ratio >= ON_TARGET_LOWER && ratio <= ON_TARGET_UPPER) {
        d.onTarget = true;
        daysOnTarget += 1;
      }
    }
  });

  const avgNet = daysLogged > 0 ? Math.round((totalConsumed - totalBurned) / daysLogged) : 0;
  const adherencePct = daysLogged > 0 ? Math.round((daysOnTarget / daysLogged) * 100) : 0;

  const startLabel = new Date(startDate).toLocaleDateString(
    language === 'tr' ? 'tr-TR' : 'en-US',
    { day: 'numeric', month: 'short' },
  );
  const endLabel = new Date(endDate).toLocaleDateString(
    language === 'tr' ? 'tr-TR' : 'en-US',
    { day: 'numeric', month: 'short' },
  );

  return {
    username: profile.username,
    language,
    targetCalories: profile.targetCalories,
    goalType: profile.goalType,
    totalConsumed: Math.round(totalConsumed),
    totalBurned: Math.round(totalBurned),
    avgNet,
    daysOnTarget,
    daysLogged,
    adherencePct,
    days: frame,
    rangeLabel: `${startLabel} – ${endLabel}`,
  };
}

export const T = (lang: 'tr' | 'en', tr: string, en: string) => (lang === 'tr' ? tr : en);
