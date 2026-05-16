'use client';

/**
 * WellnessDNA
 * ---------------------------------------------------------------
 * Expanded multi-step Wellness DNA questionnaire and summary card.
 *
 * Persists to `public.user_profiles`:
 *   - wellness_dna      (JSONB, the full structured profile)
 *   - wellness_goal     (TEXT, mirror of goal.primary)
 *   - dietary_preference (TEXT, mirror of nutrition.dietary_preference)
 *   - allergies         (TEXT[], mirror of nutrition.allergies)
 *
 * Public exports kept for backwards compatibility with existing
 * consumers (Dashboard, future Mira hooks):
 *   - useWellnessDNA(userId)      → legacy 3-field snapshot
 *   - useWellnessDNAFull(userId)  → full structured profile
 *   - WellnessDNACard({ userId })
 *
 * Locale-aware (uses `useLanguage`). Partial progress auto-saves
 * to localStorage so users can resume the questionnaire later.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Sparkles, Pencil, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  EMPTY_DNA_FULL,
  WELLNESS_DNA_VERSION,
  type WellnessDNAFull,
  type PrimaryGoal,
  type DietaryPreference,
  type ActivityLevel,
  type Craving,
  type CookingTime,
  type CookingSkill,
  type CoachTone,
  type DetailLevel,
  type SleepQuality,
  type StressLevel,
  type AgeRange,
  type Gender,
} from '@/lib/wellnessDNAShape';

// ----------------------------------------------------------------
// Legacy shape (kept for existing imports)
// ----------------------------------------------------------------
export interface WellnessDNAData {
  wellness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[];
}
const EMPTY_LEGACY: WellnessDNAData = {
  wellness_goal: null,
  dietary_preference: null,
  allergies: [],
};

// ----------------------------------------------------------------
// Legacy hook — keeps any existing consumer working
// ----------------------------------------------------------------
export function useWellnessDNA(userId: string | null | undefined): {
  data: WellnessDNAData;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<WellnessDNAData>(EMPTY_LEGACY);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setData(EMPTY_LEGACY);
      return;
    }
    setLoading(true);
    try {
      const { data: row, error } = await supabase
        .from('user_profiles')
        .select('wellness_goal,dietary_preference,allergies')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && row) {
        setData({
          wellness_goal: (row.wellness_goal as string | null) ?? null,
          dietary_preference: (row.dietary_preference as string | null) ?? null,
          allergies: Array.isArray(row.allergies) ? (row.allergies as string[]) : [],
        });
      }
    } catch (err) {
      console.error('[WellnessDNA] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

// ----------------------------------------------------------------
// Full hook — returns the structured `wellness_dna` JSONB
// ----------------------------------------------------------------
export function useWellnessDNAFull(userId: string | null | undefined): {
  dna: WellnessDNAFull | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [dna, setDna] = useState<WellnessDNAFull | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setDna(null);
      return;
    }
    setLoading(true);
    try {
      const { data: row, error } = await supabase
        .from('user_profiles')
        .select('wellness_dna,wellness_goal,dietary_preference,allergies')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('[WellnessDNA] full fetch error:', error);
        setDna(null);
        return;
      }
      // Prefer the JSONB; fall back to legacy columns to bootstrap.
      const raw = (row?.wellness_dna ?? null) as Record<string, unknown> | null;
      if (raw && typeof raw === 'object' && 'v' in raw) {
        setDna(raw as unknown as WellnessDNAFull);
      } else {
        // Compose a tiny shim from legacy columns so Mira still has hints
        // before the user completes the new questionnaire.
        setDna({
          v: WELLNESS_DNA_VERSION,
          goal: row?.wellness_goal ? { primary: legacyGoalToPrimary(row.wellness_goal as string) } : undefined,
          nutrition: {
            dietary_preference: legacyDietToEnum(row?.dietary_preference as string | null),
            allergies: Array.isArray(row?.allergies) ? (row?.allergies as string[]) : undefined,
          },
        });
      }
    } catch (err) {
      console.error('[WellnessDNA] full fetch failed:', err);
      setDna(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dna, loading, refresh };
}

function legacyGoalToPrimary(g: string | null): PrimaryGoal | undefined {
  if (!g) return undefined;
  const low = g.toLowerCase();
  if (low.includes('lose') || low.includes('ver')) return 'lose_weight';
  if (low.includes('maint') || low.includes('koru')) return 'maintain';
  if (low.includes('muscle') || low.includes('kas')) return 'gain_muscle';
  if (low.includes('energy') || low.includes('enerji')) return 'energy';
  return undefined;
}
function legacyDietToEnum(d: string | null | undefined): DietaryPreference | undefined {
  if (!d) return undefined;
  const v = d.toLowerCase();
  if (v.includes('vegan')) return 'vegan';
  if (v.includes('veget')) return 'vegetarian';
  if (v.includes('pesc')) return 'pescatarian';
  if (v.includes('keto') || v.includes('low')) return 'low_carb';
  if (v.includes('medit') || v.includes('akdeniz')) return 'mediterranean';
  if (v.includes('halal') || v.includes('helal')) return 'halal';
  return 'omnivore';
}

// ----------------------------------------------------------------
// Localized labels (single source of truth for the questionnaire)
// ----------------------------------------------------------------
type Lang = 'tr' | 'en';
function L(lang: Lang, tr: string, en: string): string {
  return lang === 'tr' ? tr : en;
}

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

function goalOptions(lang: Lang): ChoiceOption<PrimaryGoal>[] {
  return [
    { value: 'lose_weight', label: L(lang, 'Kilo vermek', 'Lose weight') },
    { value: 'maintain', label: L(lang, 'Kiloyu korumak', 'Maintain weight') },
    { value: 'gain_muscle', label: L(lang, 'Kas yapmak', 'Build muscle') },
    { value: 'energy', label: L(lang, 'Daha çok enerji', 'More energy') },
    { value: 'digestion', label: L(lang, 'Daha iyi sindirim', 'Better digestion') },
    { value: 'habits', label: L(lang, 'Sağlıklı alışkanlıklar', 'Healthier habits') },
    { value: 'performance', label: L(lang, 'Sportif performans', 'Sports performance') },
  ];
}

function ageOptions(): ChoiceOption<AgeRange>[] {
  return (['18-25', '26-35', '36-45', '46-55', '55+'] as AgeRange[]).map((v) => ({ value: v, label: v }));
}

function genderOptions(lang: Lang): ChoiceOption<Gender>[] {
  return [
    { value: 'female', label: L(lang, 'Kadın', 'Female') },
    { value: 'male', label: L(lang, 'Erkek', 'Male') },
    { value: 'other', label: L(lang, 'Diğer', 'Other') },
    { value: 'prefer_not_to_say', label: L(lang, 'Belirtmek istemiyorum', 'Prefer not to say') },
  ];
}

function activityOptions(lang: Lang): ChoiceOption<ActivityLevel>[] {
  return [
    { value: 'sedentary', label: L(lang, 'Hareketsiz', 'Sedentary') },
    { value: 'lightly_active', label: L(lang, 'Hafif aktif', 'Lightly active') },
    { value: 'moderate', label: L(lang, 'Orta aktif', 'Moderately active') },
    { value: 'very_active', label: L(lang, 'Çok aktif', 'Very active') },
  ];
}

function sleepOptions(lang: Lang): ChoiceOption<SleepQuality>[] {
  return [
    { value: 'poor', label: L(lang, 'Kötü', 'Poor') },
    { value: 'ok', label: L(lang, 'İdare eder', 'OK') },
    { value: 'good', label: L(lang, 'İyi', 'Good') },
    { value: 'great', label: L(lang, 'Harika', 'Great') },
  ];
}

function stressOptions(lang: Lang): ChoiceOption<StressLevel>[] {
  return [
    { value: 'low', label: L(lang, 'Düşük', 'Low') },
    { value: 'medium', label: L(lang, 'Orta', 'Medium') },
    { value: 'high', label: L(lang, 'Yüksek', 'High') },
  ];
}

function dietOptions(lang: Lang): ChoiceOption<DietaryPreference>[] {
  return [
    { value: 'omnivore', label: L(lang, 'Her şeyi yerim', 'Omnivore') },
    { value: 'vegetarian', label: L(lang, 'Vejetaryen', 'Vegetarian') },
    { value: 'vegan', label: L(lang, 'Vegan', 'Vegan') },
    { value: 'pescatarian', label: L(lang, 'Pescetaryen', 'Pescatarian') },
    { value: 'low_carb', label: L(lang, 'Low-carb / Keto', 'Low-carb / Keto') },
    { value: 'mediterranean', label: L(lang, 'Akdeniz', 'Mediterranean') },
    { value: 'halal', label: L(lang, 'Helal hassas', 'Halal-sensitive') },
    { value: 'none', label: L(lang, 'Tercih yok', 'No preference') },
  ];
}

function cravingOptions(lang: Lang): ChoiceOption<Craving>[] {
  return [
    { value: 'sweet', label: L(lang, 'Tatlı', 'Sweet') },
    { value: 'salty', label: L(lang, 'Tuzlu', 'Salty') },
    { value: 'fast_food', label: L(lang, 'Fast food', 'Fast food') },
    { value: 'bakery', label: L(lang, 'Hamur işi', 'Bakery') },
    { value: 'late_night', label: L(lang, 'Gece atıştırması', 'Late-night snacks') },
  ];
}

function cookTimeOptions(lang: Lang): ChoiceOption<CookingTime>[] {
  return [
    { value: 'under_15', label: L(lang, '15 dk altı', 'Under 15 min') },
    { value: '15_30', label: L(lang, '15-30 dk', '15-30 min') },
    { value: '30_60', label: L(lang, '30-60 dk', '30-60 min') },
    { value: 'over_60', label: L(lang, '60 dk üzeri', 'Over 60 min') },
  ];
}

function cookSkillOptions(lang: Lang): ChoiceOption<CookingSkill>[] {
  return [
    { value: 'beginner', label: L(lang, 'Yeni başlayan', 'Beginner') },
    { value: 'home_cook', label: L(lang, 'Ev yemekçisi', 'Home cook') },
    { value: 'confident', label: L(lang, 'Deneyimli', 'Confident') },
    { value: 'pro', label: L(lang, 'Profesyonel', 'Pro') },
  ];
}

function toneOptions(lang: Lang): ChoiceOption<CoachTone>[] {
  return [
    { value: 'soft', label: L(lang, 'Yumuşak / destekleyici', 'Soft / supportive') },
    { value: 'direct', label: L(lang, 'Doğrudan / disiplinli', 'Direct / disciplined') },
    { value: 'friendly', label: L(lang, 'Arkadaşça / esprili', 'Friendly / funny') },
    { value: 'data', label: L(lang, 'Veri odaklı', 'Data-focused') },
  ];
}

function detailOptions(lang: Lang): ChoiceOption<DetailLevel>[] {
  return [
    { value: 'simple', label: L(lang, 'Basit yönlendirme', 'Simple guidance') },
    { value: 'numbers', label: L(lang, 'Kalori / sayı detayı', 'Calorie & numbers detail') },
  ];
}

// ----------------------------------------------------------------
// Draft persistence keys
// ----------------------------------------------------------------
const draftKey = (userId: string): string => `fitto_wellness_dna_draft_${userId}`;

function loadDraft(userId: string): WellnessDNAFull | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WellnessDNAFull;
    if (parsed && typeof parsed === 'object' && parsed.v === WELLNESS_DNA_VERSION) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveDraft(userId: string, dna: WellnessDNAFull): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(draftKey(userId), JSON.stringify(dna));
  } catch {
    /* ignore quota errors */
  }
}

function clearDraft(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftKey(userId));
  } catch {
    /* noop */
  }
}

// ----------------------------------------------------------------
// Summary card
// ----------------------------------------------------------------
interface WellnessDNACardProps {
  userId: string;
}

export function WellnessDNACard({ userId }: WellnessDNACardProps) {
  const { language } = useLanguage();
  const lang: Lang = language;
  const { dna, loading, refresh } = useWellnessDNAFull(userId);
  const [open, setOpen] = useState<boolean>(false);

  const completed = useMemo(() => isMeaningful(dna), [dna]);
  const highlights = useMemo(() => summaryHighlights(dna, lang), [dna, lang]);

  return (
    <>
      <Card
        data-testid="wellness-dna-card"
        className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-md"
      >
        <CardContent className="py-4 px-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow shrink-0">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700">
              Wellness DNA
            </div>
            {loading ? (
              <div className="text-sm text-emerald-900/70 mt-0.5">
                {L(lang, 'Yükleniyor…', 'Loading…')}
              </div>
            ) : !completed ? (
              <div className="text-sm text-emerald-900/80 mt-0.5">
                {L(
                  lang,
                  "Mira'yı kişiselleştirmek için profilini tamamla.",
                  'Complete your profile to personalize Mira.',
                )}
              </div>
            ) : (
              <div className="text-sm text-emerald-900 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {highlights.map((h, i) => (
                  <span key={i} data-testid={`wellness-dna-highlight-${i}`}>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!completed ? (
            <Button
              data-testid="wellness-dna-complete-btn"
              onClick={() => setOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              {L(lang, 'Profili Tamamla', 'Complete Profile')}
            </Button>
          ) : (
            <Button
              data-testid="wellness-dna-edit-btn"
              onClick={() => setOpen(true)}
              size="sm"
              variant="outline"
              className="shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {L(lang, 'Düzenle', 'Edit')}
            </Button>
          )}
        </CardContent>
      </Card>

      <WellnessDNAQuestionnaire
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        initial={dna}
        lang={lang}
        onSaved={() => {
          setOpen(false);
          void refresh();
        }}
      />
    </>
  );
}

function isMeaningful(dna: WellnessDNAFull | null): boolean {
  if (!dna) return false;
  return Boolean(
    dna.goal?.primary ||
      dna.nutrition?.dietary_preference ||
      (dna.nutrition?.allergies && dna.nutrition.allergies.length > 0) ||
      dna.coaching?.tone ||
      dna.body?.activity_level,
  );
}

function summaryHighlights(dna: WellnessDNAFull | null, lang: Lang): string[] {
  if (!dna) return [];
  const out: string[] = [];
  if (dna.goal?.primary) {
    const opt = goalOptions(lang).find((o) => o.value === dna.goal!.primary);
    if (opt) out.push(`🎯 ${opt.label}`);
  }
  if (dna.nutrition?.dietary_preference && dna.nutrition.dietary_preference !== 'none') {
    const opt = dietOptions(lang).find((o) => o.value === dna.nutrition!.dietary_preference);
    if (opt) out.push(`🥗 ${opt.label}`);
  }
  if (dna.nutrition?.allergies && dna.nutrition.allergies.length > 0) {
    out.push(`⚠️ ${L(lang, 'Alerji', 'Allergy')}: ${dna.nutrition.allergies.slice(0, 2).join(', ')}`);
  }
  if (dna.coaching?.tone) {
    const opt = toneOptions(lang).find((o) => o.value === dna.coaching!.tone);
    if (opt) out.push(`💬 ${opt.label}`);
  }
  return out;
}

// ----------------------------------------------------------------
// Questionnaire dialog (5 steps)
// ----------------------------------------------------------------
interface QuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initial: WellnessDNAFull | null;
  lang: Lang;
  onSaved: () => void;
}

const TOTAL_STEPS = 5 as const;

function WellnessDNAQuestionnaire({
  open,
  onOpenChange,
  userId,
  initial,
  lang,
  onSaved,
}: QuestionnaireProps) {
  const [step, setStep] = useState<number>(0);
  const [dna, setDna] = useState<WellnessDNAFull>(initial ?? EMPTY_DNA_FULL);
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [dislikedText, setDislikedText] = useState<string>('');
  const [favoritesText, setFavoritesText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from draft or initial when modal opens
  useEffect(() => {
    if (!open) return;
    const draft = loadDraft(userId);
    const base = draft ?? initial ?? EMPTY_DNA_FULL;
    setDna(base);
    setAllergiesText((base.nutrition?.allergies ?? []).join(', '));
    setDislikedText((base.nutrition?.disliked_foods ?? []).join(', '));
    setFavoritesText((base.nutrition?.favorite_foods ?? []).join(', '));
    setStep(0);
    setError(null);
  }, [open, userId, initial]);

  // Auto-save draft on every change
  useEffect(() => {
    if (!open) return;
    saveDraft(userId, dna);
  }, [open, userId, dna]);

  const setSection = useCallback(
    <K extends keyof WellnessDNAFull>(key: K, value: WellnessDNAFull[K]): void => {
      setDna((prev) => ({ ...prev, [key]: value, v: WELLNESS_DNA_VERSION }));
    },
    [],
  );

  const goNext = useCallback(() => {
    setError(null);
    // commit free-text lists at boundaries
    setDna((prev) => ({
      ...prev,
      nutrition: {
        ...(prev.nutrition ?? {}),
        allergies: splitCsv(allergiesText),
        disliked_foods: splitCsv(dislikedText),
        favorite_foods: splitCsv(favoritesText),
      },
    }));
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [allergiesText, dislikedText, favoritesText]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const finalDna: WellnessDNAFull = {
        ...dna,
        v: WELLNESS_DNA_VERSION,
        nutrition: {
          ...(dna.nutrition ?? {}),
          allergies: splitCsv(allergiesText),
          disliked_foods: splitCsv(dislikedText),
          favorite_foods: splitCsv(favoritesText),
        },
        updated_at: new Date().toISOString(),
      };

      // Mirror headline values to legacy columns so existing card / hooks
      // and any older readers keep working.
      const legacyGoalLabel = finalDna.goal?.primary
        ? goalOptions(lang).find((o) => o.value === finalDna.goal!.primary)?.label ?? null
        : null;
      const legacyDiet = finalDna.nutrition?.dietary_preference ?? null;
      const legacyAllergies = finalDna.nutrition?.allergies ?? [];

      // Upsert: works whether or not the user already has a row.
      // ON CONFLICT key is `user_id` (UNIQUE in user_profiles).
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            wellness_dna: finalDna as unknown as Record<string, unknown>,
            wellness_goal: legacyGoalLabel,
            dietary_preference: legacyDiet,
            allergies: legacyAllergies,
          },
          { onConflict: 'user_id' },
        );
      if (upsertError) {
        const e = upsertError as { message?: string; code?: string; details?: string; hint?: string };
        console.error('[WellnessDNA] save failed:', {
          message: e?.message,
          code: e?.code,
          details: e?.details,
          hint: e?.hint,
          raw: upsertError,
        });
        throw upsertError;
      }
      clearDraft(userId);
      onSaved();
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? L(lang, 'Kaydedilemedi', 'Save failed'));
    } finally {
      setSaving(false);
    }
  }, [userId, dna, allergiesText, dislikedText, favoritesText, lang, onSaved]);

  const isLast = step === TOTAL_STEPS - 1;
  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="wellness-dna-modal"
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            {L(lang, 'Wellness DNA', 'Wellness DNA')}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {L(lang, 'Adım', 'Step')} {step + 1} / {TOTAL_STEPS}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
              data-testid="wellness-dna-progress"
            />
          </div>
        </div>

        <div className="space-y-4 py-2">
          {step === 0 && <StepGoal lang={lang} dna={dna} setSection={setSection} />}
          {step === 1 && <StepBody lang={lang} dna={dna} setSection={setSection} />}
          {step === 2 && (
            <StepNutrition
              lang={lang}
              dna={dna}
              setSection={setSection}
              allergiesText={allergiesText}
              setAllergiesText={setAllergiesText}
              dislikedText={dislikedText}
              setDislikedText={setDislikedText}
              favoritesText={favoritesText}
              setFavoritesText={setFavoritesText}
            />
          )}
          {step === 3 && <StepCoaching lang={lang} dna={dna} setSection={setSection} />}
          {step === 4 && <StepHealth lang={lang} dna={dna} setSection={setSection} />}

          {error && (
            <p
              data-testid="wellness-dna-error"
              className="text-xs text-red-600"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between gap-2">
          <Button
            data-testid="wellness-dna-back-btn"
            variant="ghost"
            onClick={step === 0 ? () => onOpenChange(false) : goBack}
            disabled={saving}
          >
            {step === 0 ? L(lang, 'İptal', 'Cancel') : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {L(lang, 'Geri', 'Back')}
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {!isLast && (
              <Button
                data-testid="wellness-dna-skip-btn"
                variant="outline"
                onClick={goNext}
                disabled={saving}
              >
                {L(lang, 'Atla', 'Skip')}
              </Button>
            )}
            {isLast ? (
              <Button
                data-testid="wellness-dna-save-btn"
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? L(lang, 'Kaydediliyor…', 'Saving…') : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {L(lang, 'Kaydet', 'Save')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                data-testid="wellness-dna-next-btn"
                onClick={goNext}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {L(lang, 'Devam', 'Continue')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Step components — small, focused, locale-aware
// ----------------------------------------------------------------
interface StepProps {
  lang: Lang;
  dna: WellnessDNAFull;
  setSection: <K extends keyof WellnessDNAFull>(key: K, value: WellnessDNAFull[K]) => void;
}

function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  testIdPrefix,
}: {
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testIdPrefix}-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors text-left ${
              active
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceChips<T extends string>({
  options,
  values,
  onToggle,
  testIdPrefix,
}: {
  options: ChoiceOption<T>[];
  values: T[];
  onToggle: (v: T) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testIdPrefix}-${opt.value}`}
            onClick={() => onToggle(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StepGoal({ lang, dna, setSection }: StepProps) {
  const goal = dna.goal ?? {};
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {L(lang, '1. Hedefin nedir?', '1. What is your main goal?')}
      </h3>
      <ChoiceGrid
        testIdPrefix="dna-goal-primary"
        options={goalOptions(lang)}
        value={goal.primary}
        onChange={(v) => setSection('goal', { ...goal, primary: v })}
      />
      {goal.primary === 'lose_weight' || goal.primary === 'gain_muscle' ? (
        <div>
          <Label htmlFor="dna-target-weight">
            {L(lang, 'Hedef kilo (kg, opsiyonel)', 'Target weight (kg, optional)')}
          </Label>
          <Input
            id="dna-target-weight"
            data-testid="dna-target-weight"
            type="number"
            inputMode="decimal"
            value={goal.target_weight_kg ?? ''}
            onChange={(e) =>
              setSection('goal', {
                ...goal,
                target_weight_kg: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function StepBody({ lang, dna, setSection }: StepProps) {
  const body = dna.body ?? {};
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {L(lang, '2. Vücut ve günlük rutin', '2. Body & routine')}
      </h3>
      <div>
        <Label className="text-xs">{L(lang, 'Yaş aralığı', 'Age range')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-age"
          options={ageOptions()}
          value={body.age_range}
          onChange={(v) => setSection('body', { ...body, age_range: v })}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Cinsiyet (opsiyonel)', 'Gender (optional)')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-gender"
          options={genderOptions(lang)}
          value={body.gender}
          onChange={(v) => setSection('body', { ...body, gender: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs" htmlFor="dna-height">
            {L(lang, 'Boy (cm)', 'Height (cm)')}
          </Label>
          <Input
            id="dna-height"
            data-testid="dna-height"
            type="number"
            value={body.height_cm ?? ''}
            onChange={(e) =>
              setSection('body', {
                ...body,
                height_cm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div>
          <Label className="text-xs" htmlFor="dna-current-weight">
            {L(lang, 'Mevcut kilo (kg)', 'Current weight (kg)')}
          </Label>
          <Input
            id="dna-current-weight"
            data-testid="dna-current-weight"
            type="number"
            value={body.current_weight_kg ?? ''}
            onChange={(e) =>
              setSection('body', {
                ...body,
                current_weight_kg: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Aktivite seviyesi', 'Activity level')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-activity"
          options={activityOptions(lang)}
          value={body.activity_level}
          onChange={(v) => setSection('body', { ...body, activity_level: v })}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Uyku kalitesi', 'Sleep quality')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-sleep"
          options={sleepOptions(lang)}
          value={body.sleep_quality}
          onChange={(v) => setSection('body', { ...body, sleep_quality: v })}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Stres seviyesi', 'Stress level')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-stress"
          options={stressOptions(lang)}
          value={body.stress_level}
          onChange={(v) => setSection('body', { ...body, stress_level: v })}
        />
      </div>
    </div>
  );
}

function StepNutrition({
  lang,
  dna,
  setSection,
  allergiesText,
  setAllergiesText,
  dislikedText,
  setDislikedText,
  favoritesText,
  setFavoritesText,
}: StepProps & {
  allergiesText: string;
  setAllergiesText: (s: string) => void;
  dislikedText: string;
  setDislikedText: (s: string) => void;
  favoritesText: string;
  setFavoritesText: (s: string) => void;
}) {
  const nutrition = dna.nutrition ?? {};
  const toggleCraving = (v: Craving) => {
    const current = nutrition.cravings ?? [];
    const next = current.includes(v) ? current.filter((c) => c !== v) : [...current, v];
    setSection('nutrition', { ...nutrition, cravings: next });
  };
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {L(lang, '3. Beslenme tercihleri', '3. Nutrition preferences')}
      </h3>
      <div>
        <Label className="text-xs">{L(lang, 'Beslenme tarzı', 'Dietary preference')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-diet"
          options={dietOptions(lang)}
          value={nutrition.dietary_preference}
          onChange={(v) => setSection('nutrition', { ...nutrition, dietary_preference: v })}
        />
      </div>
      <div>
        <Label className="text-xs" htmlFor="dna-allergies">
          {L(lang, 'Alerjiler (virgülle ayır)', 'Allergies (comma-separated)')}
        </Label>
        <Input
          id="dna-allergies"
          data-testid="dna-allergies"
          value={allergiesText}
          onChange={(e) => setAllergiesText(e.target.value)}
          placeholder={L(lang, 'fıstık, deniz mahsulü', 'peanuts, shellfish')}
        />
      </div>
      <div>
        <Label className="text-xs" htmlFor="dna-disliked">
          {L(lang, 'Sevmediğin yiyecekler', 'Foods you dislike')}
        </Label>
        <Input
          id="dna-disliked"
          data-testid="dna-disliked"
          value={dislikedText}
          onChange={(e) => setDislikedText(e.target.value)}
          placeholder={L(lang, 'mantar, brokoli', 'mushrooms, broccoli')}
        />
      </div>
      <div>
        <Label className="text-xs" htmlFor="dna-favorites">
          {L(lang, 'Favori yiyecekler', 'Favorite foods')}
        </Label>
        <Input
          id="dna-favorites"
          data-testid="dna-favorites"
          value={favoritesText}
          onChange={(e) => setFavoritesText(e.target.value)}
          placeholder={L(lang, 'tavuk, yoğurt, çilek', 'chicken, yogurt, strawberries')}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Canın ne çekiyor?', 'Cravings')}</Label>
        <ChoiceChips
          testIdPrefix="dna-craving"
          options={cravingOptions(lang)}
          values={nutrition.cravings ?? []}
          onToggle={toggleCraving}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Pişirmeye ne kadar vaktin var?', 'Available cooking time')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-cook-time"
          options={cookTimeOptions(lang)}
          value={nutrition.cooking_time}
          onChange={(v) => setSection('nutrition', { ...nutrition, cooking_time: v })}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Mutfak becerisi', 'Cooking skill')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-cook-skill"
          options={cookSkillOptions(lang)}
          value={nutrition.cooking_skill}
          onChange={(v) => setSection('nutrition', { ...nutrition, cooking_skill: v })}
        />
      </div>
    </div>
  );
}

function StepCoaching({ lang, dna, setSection }: StepProps) {
  const coaching = dna.coaching ?? {};
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {L(lang, '4. Koçluk tarzı', '4. Coaching style')}
      </h3>
      <div>
        <Label className="text-xs">{L(lang, 'Mira nasıl konuşsun?', "Mira's tone")}</Label>
        <ChoiceGrid
          testIdPrefix="dna-tone"
          options={toneOptions(lang)}
          value={coaching.tone}
          onChange={(v) => setSection('coaching', { ...coaching, tone: v })}
        />
      </div>
      <div>
        <Label className="text-xs">{L(lang, 'Detay seviyesi', 'Detail level')}</Label>
        <ChoiceGrid
          testIdPrefix="dna-detail"
          options={detailOptions(lang)}
          value={coaching.detail_level}
          onChange={(v) => setSection('coaching', { ...coaching, detail_level: v })}
        />
      </div>
    </div>
  );
}

function StepHealth({ lang, dna, setSection }: StepProps) {
  const flags = dna.health_flags ?? {};
  const toggle = (key: keyof typeof flags) => {
    setSection('health_flags', { ...flags, [key]: !flags[key] });
  };
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {L(lang, '5. Sağlık (opsiyonel, atlanabilir)', '5. Health (optional, can be skipped)')}
      </h3>
      <p className="text-xs text-gray-500">
        {L(
          lang,
          "Bu bilgiler teşhis için kullanılmaz. Mira sadece güvenli, genel öneriler verir ve gerektiğinde doktora danışmanı tavsiye eder.",
          'These are not used for diagnosis. Mira will only give safe general guidance and may suggest seeing a professional.',
        )}
      </p>
      <ToggleRow
        label={L(lang, 'Hamileyim / emziriyorum', 'Pregnant / breastfeeding')}
        active={!!flags.pregnancy_breastfeeding}
        onToggle={() => toggle('pregnancy_breastfeeding')}
        testId="dna-flag-pregnancy"
      />
      <ToggleRow
        label={L(lang, 'Diyabet', 'Diabetes')}
        active={!!flags.diabetes}
        onToggle={() => toggle('diabetes')}
        testId="dna-flag-diabetes"
      />
      <ToggleRow
        label={L(lang, 'Hipertansiyon', 'Hypertension')}
        active={!!flags.hypertension}
        onToggle={() => toggle('hypertension')}
        testId="dna-flag-hypertension"
      />
      <ToggleRow
        label={L(lang, 'Yeme bozukluğu geçmişi', 'Eating disorder history')}
        active={!!flags.eating_disorder_history}
        onToggle={() => toggle('eating_disorder_history')}
        testId="dna-flag-ed"
      />
      <div>
        <Label className="text-xs" htmlFor="dna-medical-diet">
          {L(lang, 'Tıbbi diyet notu (opsiyonel)', 'Medical diet note (optional)')}
        </Label>
        <Input
          id="dna-medical-diet"
          data-testid="dna-medical-diet"
          value={flags.medical_diet ?? ''}
          onChange={(e) => setSection('health_flags', { ...flags, medical_diet: e.target.value })}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  active,
  onToggle,
  testId,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onToggle}
      className={`w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg border transition-colors ${
        active
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400'
      }`}
    >
      <span>{label}</span>
      <span
        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
          active ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
        }`}
      >
        {active ? <Check className="h-3 w-3" /> : null}
      </span>
    </button>
  );
}

function splitCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}
