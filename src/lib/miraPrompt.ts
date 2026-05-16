/**
 * miraPrompt.ts
 * ---------------------------------------------------------------
 * Compact "Coaching Context" + Mira behavior rules that the
 * MiraChat client prepends to every outbound message.
 *
 * The Mira backend (Railway /chat) treats the whole payload as a
 * user prompt, so this is currently the only safe way to enforce
 * Mira's personality and decisiveness without touching the
 * backend. The block is deliberately compact: locale + the DNA
 * summary + daily stats (if any) + behavior rules + the original
 * question. No huge raw JSON.
 *
 * Pure helper module — no React, no fetch, no side effects.
 */

import type { WellnessDNAFull } from './wellnessDNAShape';

export type Locale = 'tr' | 'en';

export interface DailyStatsSnapshot {
  caloriesConsumed?: number;
  caloriesTarget?: number;
  waterGlasses?: number;
  exerciseMinutes?: number;
}

/**
 * Build a one-line, human-readable summary of the Wellness DNA.
 * Skips empty fields. Localized.
 */
export function summarizeWellnessDNA(dna: WellnessDNAFull | null, locale: Locale): string {
  if (!dna) return locale === 'tr' ? '(henüz tamamlanmadı)' : '(not completed yet)';
  const parts: string[] = [];

  // Goal
  if (dna.goal?.primary) {
    const goalLabel = locale === 'tr' ? GOAL_LABELS_TR : GOAL_LABELS_EN;
    parts.push(goalLabel[dna.goal.primary] ?? dna.goal.primary);
  }
  if (dna.goal?.target_weight_kg) {
    parts.push((locale === 'tr' ? 'hedef ' : 'target ') + dna.goal.target_weight_kg + 'kg');
  }

  // Body
  if (dna.body?.age_range) parts.push(dna.body.age_range);
  if (dna.body?.gender && dna.body.gender !== 'prefer_not_to_say') {
    const g = locale === 'tr' ? GENDER_LABELS_TR : GENDER_LABELS_EN;
    parts.push(g[dna.body.gender] ?? dna.body.gender);
  }
  if (dna.body?.current_weight_kg) parts.push(dna.body.current_weight_kg + 'kg');
  if (dna.body?.activity_level) {
    const a = locale === 'tr' ? ACTIVITY_LABELS_TR : ACTIVITY_LABELS_EN;
    parts.push(a[dna.body.activity_level] ?? dna.body.activity_level);
  }
  if (dna.body?.sleep_quality && dna.body.sleep_quality !== 'good') {
    parts.push((locale === 'tr' ? 'uyku: ' : 'sleep: ') + dna.body.sleep_quality);
  }
  if (dna.body?.stress_level && dna.body.stress_level !== 'low') {
    parts.push((locale === 'tr' ? 'stres: ' : 'stress: ') + dna.body.stress_level);
  }

  // Nutrition
  if (dna.nutrition?.dietary_preference && dna.nutrition.dietary_preference !== 'none') {
    parts.push(dna.nutrition.dietary_preference);
  }
  if (dna.nutrition?.allergies?.length) {
    parts.push((locale === 'tr' ? 'alerji: ' : 'allergies: ') + dna.nutrition.allergies.join('/'));
  }
  if (dna.nutrition?.disliked_foods?.length) {
    parts.push((locale === 'tr' ? 'sevmedikleri: ' : 'dislikes: ') + dna.nutrition.disliked_foods.join('/'));
  }
  if (dna.nutrition?.favorite_foods?.length) {
    parts.push((locale === 'tr' ? 'sevdikleri: ' : 'likes: ') + dna.nutrition.favorite_foods.join('/'));
  }
  if (dna.nutrition?.cravings?.length) {
    parts.push((locale === 'tr' ? 'craving: ' : 'cravings: ') + dna.nutrition.cravings.join('/'));
  }
  if (dna.nutrition?.cooking_time) {
    parts.push((locale === 'tr' ? 'pişirme süresi: ' : 'cook time: ') + dna.nutrition.cooking_time);
  }
  if (dna.nutrition?.cooking_skill) {
    parts.push((locale === 'tr' ? 'mutfak: ' : 'cooking: ') + dna.nutrition.cooking_skill);
  }
  if (dna.nutrition?.budget && dna.nutrition.budget === 'tight') {
    parts.push(locale === 'tr' ? 'düşük bütçe' : 'low budget');
  }

  // Coaching style
  if (dna.coaching?.tone) {
    parts.push((locale === 'tr' ? 'ton: ' : 'tone: ') + dna.coaching.tone);
  }
  if (dna.coaching?.detail_level) {
    parts.push((locale === 'tr' ? 'detay: ' : 'detail: ') + dna.coaching.detail_level);
  }

  // Health flags (these matter most — surface explicitly)
  const flagBits: string[] = [];
  if (dna.health_flags?.pregnancy_breastfeeding) flagBits.push(locale === 'tr' ? 'hamile/emziren' : 'pregnant/breastfeeding');
  if (dna.health_flags?.diabetes) flagBits.push('diabetes');
  if (dna.health_flags?.hypertension) flagBits.push(locale === 'tr' ? 'hipertansiyon' : 'hypertension');
  if (dna.health_flags?.eating_disorder_history) flagBits.push(locale === 'tr' ? 'yeme bozukluğu geçmişi' : 'eating disorder history');
  if (dna.health_flags?.medical_diet) flagBits.push((locale === 'tr' ? 'tıbbi diyet: ' : 'medical diet: ') + dna.health_flags.medical_diet);
  if (flagBits.length) {
    parts.push((locale === 'tr' ? 'SAĞLIK: ' : 'HEALTH: ') + flagBits.join(','));
  }

  return parts.length ? parts.join(' · ') : (locale === 'tr' ? '(henüz tamamlanmadı)' : '(not completed yet)');
}

const GOAL_LABELS_TR: Record<string, string> = {
  lose_weight: 'kilo vermek istiyor',
  maintain: 'kilosunu korumak istiyor',
  gain_muscle: 'kas yapmak istiyor',
  energy: 'enerjisini artırmak istiyor',
  digestion: 'sindirimini iyileştirmek istiyor',
  habits: 'sağlıklı alışkanlıklar kazanmak istiyor',
  performance: 'sportif performans istiyor',
};
const GOAL_LABELS_EN: Record<string, string> = {
  lose_weight: 'wants to lose weight',
  maintain: 'wants to maintain weight',
  gain_muscle: 'wants to build muscle',
  energy: 'wants more energy',
  digestion: 'wants better digestion',
  habits: 'wants healthier habits',
  performance: 'wants athletic performance',
};
const GENDER_LABELS_TR: Record<string, string> = { male: 'erkek', female: 'kadın', other: 'diğer' };
const GENDER_LABELS_EN: Record<string, string> = { male: 'male', female: 'female', other: 'other' };
const ACTIVITY_LABELS_TR: Record<string, string> = {
  sedentary: 'hareketsiz',
  lightly_active: 'hafif aktif',
  moderate: 'orta aktif',
  very_active: 'çok aktif',
};
const ACTIVITY_LABELS_EN: Record<string, string> = {
  sedentary: 'sedentary',
  lightly_active: 'lightly active',
  moderate: 'moderately active',
  very_active: 'very active',
};

/**
 * The strict Mira behavior rules sent on every message. Localized.
 * Short, imperative, anti-mirroring, decisive.
 */
function miraRules(locale: Locale): string {
  if (locale === 'tr') {
    return [
      'KURALLAR:',
      '- Sen Mira\'sın: sıcak, kararlı, 32 yaşında bir wellness koçu.',
      '- Türkçe cevap ver. Kullanıcı başka dilde yazarsa o dilde cevap ver.',
      '- ASLA kullanıcının cümlesini tekrar etme.',
      '- En fazla 1 soru sor. Önce somut öneri ver, sonra (gerekirse) tek bir soru.',
      '- Yemek istendiğinde: hemen somut bir öneri (yemek adı + kısa "neden uyuyor" + malzemeler + basit adımlar).',
      '- Tarif istendiğinde: malzeme listesi + adım adım yapılış.',
      '- Tatlı/atıştırmalık istendiğinde: hemen bir öneri ver, anket yapma.',
      '- Motivasyon istendiğinde: somut bir sonraki adım söyle.',
      '- Kullanıcı sinirliyse: kısa özür + faydalı öneri. Daha duygusal soru sorma.',
      '- Wellness DNA\'yı kullan: alerji varsa o malzemeden kaçın; low-carb istiyorsa low-carb öner; az pişirme zamanı varsa ≤15dk tarifler; soft ton istiyorsa daha sıcak; direct ton istiyorsa kısa ve net.',
      '- "Canım" hitabını çok sık kullanma (en fazla 1 mesajda).',
      '- Tıbbi teşhis koyma. Ciddi durumlarda profesyonel destek öner.',
      '- Tehlikeli/aşırı diyet önerme.',
    ].join('\n');
  }
  return [
    'RULES:',
    '- You are Mira: warm, decisive 32-year-old wellness coach.',
    '- Reply in English by default. If the user writes in another language, mirror that language.',
    '- NEVER repeat the user\'s sentence back to them.',
    '- Maximum ONE question per reply. Give the concrete recommendation first.',
    '- For food requests: give a specific recommendation immediately (dish + short why-it-fits + ingredients + simple steps).',
    '- For recipes: provide ingredients list + step-by-step instructions.',
    '- For dessert/snack requests: give a concrete suggestion immediately, no survey.',
    '- For motivation: give a specific next action.',
    '- If the user is angry/frustrated: brief apology + immediately useful suggestion. No more emotional questions.',
    '- Use the Wellness DNA: avoid allergens; low-carb user → low-carb suggestion; limited cooking time → ≤15min recipes; soft tone → warmer; direct tone → concise.',
    '- Avoid pet-name overuse.',
    '- No medical diagnoses. Recommend professional help for serious conditions.',
    '- No dangerous/extreme diet advice.',
  ].join('\n');
}

/**
 * Build the final payload string sent to Mira's backend as
 * `{ question: <returned string> }`. Compact, deterministic.
 */
export function buildMiraQuestion(params: {
  userQuestion: string;
  locale: Locale;
  dna: WellnessDNAFull | null;
  stats?: DailyStatsSnapshot;
}): string {
  const { userQuestion, locale, dna, stats } = params;
  const ctx = summarizeWellnessDNA(dna, locale);
  const statsLine = stats && (stats.caloriesConsumed != null || stats.caloriesTarget != null)
    ? (locale === 'tr' ? 'Bugün: ' : 'Today: ') +
      [
        stats.caloriesConsumed != null && stats.caloriesTarget != null
          ? `${stats.caloriesConsumed}/${stats.caloriesTarget} kcal`
          : stats.caloriesConsumed != null
            ? `${stats.caloriesConsumed} kcal`
            : null,
        stats.waterGlasses != null ? `${stats.waterGlasses} ${locale === 'tr' ? 'bardak su' : 'glasses water'}` : null,
        stats.exerciseMinutes != null ? `${stats.exerciseMinutes} ${locale === 'tr' ? 'dk egzersiz' : 'min exercise'}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const header = locale === 'tr' ? '[FITTO KOÇLUK BAĞLAMI]' : '[FITTO COACHING CONTEXT]';
  const localeLine = `Locale: ${locale.toUpperCase()}`;
  const dnaLine = (locale === 'tr' ? 'Kullanıcı: ' : 'User: ') + ctx;
  const blockLines = [header, localeLine, dnaLine];
  if (statsLine) blockLines.push(statsLine);
  blockLines.push('');
  blockLines.push(miraRules(locale));
  blockLines.push('');
  blockLines.push(locale === 'tr' ? '[KULLANICI SORUSU]' : '[USER QUESTION]');
  blockLines.push(userQuestion.trim());

  return blockLines.join('\n');
}
