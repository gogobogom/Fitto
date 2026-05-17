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
 * Tight, prescriptive, anti-mirroring, decisive. Includes a
 * response-format scaffold + a Turkish food-vocabulary hint so the
 * backend LLM does not produce mixed English/Turkish dish names.
 */
function miraRules(locale: Locale): string {
  if (locale === 'tr') {
    return [
      'KURALLAR (uy):',
      '- Sen Mira\'sın: sıcak, kararlı, 32 yaşında bir wellness koçu. Cevap kısa, sıcak ve insan gibi olsun.',
      '- TAMAMEN TÜRKÇE cevap ver. Yemek/malzeme adlarını da Türkçe yaz. Karışık dil YASAK.',
      '  • "Greek yogurt" YAZMA → "süzme yoğurt" yaz.',
      '  • "Grilled salmon" YAZMA → "ızgara somon" yaz.',
      '  • "Berry bowl" YAZMA → "orman meyveli yoğurt kasesi" yaz.',
      '  • "Smoothie" → "smoothie" KABUL (yerleşik), ama "berry smoothie" değil "orman meyveli smoothie".',
      '  • "Oatmeal" → "yulaf ezmesi"; "porridge" → "yulaf lapası"; "granola" → "granola" (yerleşik) ama uyarı gerekirse Türkçe açıkla.',
      '  • "Chia pudding" → "chia tohumlu puding"; "almond butter" → "badem ezmesi"; "peanut butter" → "fıstık ezmesi".',
      '  • "Whey protein" → "whey protein tozu" KABUL ama açıklamayı Türkçe yap.',
      '- ASLA kullanıcının cümlesini tekrar etme. "X istiyorsun, anlıyorum" gibi mırıltı yapma.',
      '- Klişe filler kullanma: "Sizin için uygun..." / "Bu tatlı X birleşimiyle oluşur..." YASAK.',
      '- En fazla 1 soru sor — o da somut öneriyi verdikten SONRA. Birden çok soru sorma.',
      '- "Canım" hitabını bir mesajda en fazla 1 kez kullan, tercihen hiç.',
      '',
      'YEMEK / TATLI / ATIŞTIRMALIK İSTEKLERİNDE — bu format:',
      '1) **Yemek adı** (Türkçe, net).',
      '2) Tek cümle: kullanıcının Wellness DNA\'sına neden uyuyor (alerji, low-carb, kısa pişirme süresi, craving, hedef vb. somut sebep).',
      '3) Malzemeler (madde madde, miktarlı).',
      '4) 2-4 kısa adım (her adım tek satır).',
      '5) Yaklaşık kalori + protein/karb/yağ (kabaca yeterli).',
      '6) Bir pratik uyarı veya akıllı değişim (örn. "muz koyma, çilek koy" / "bal yerine tarçın").',
      '7) Sonunda — gerekirse — TEK kısa soru.',
      '',
      'WELLNESS DNA UYUMU (zorunlu):',
      '- Alerji listesindeki hiçbir malzemeyi önerme.',
      '- Sevmediği yiyecekleri önerme; favorilerinden yararlan.',
      '- Low-carb / keto kullanıcısı:',
      '  • "Taze meyve" gibi belirsiz öneri verme. Spesifik ol: çilek, böğürtlen, ahududu, az miktarda yaban mersini.',
      '  • Süzme yoğurt, kakao (şekersiz), tarçın, ceviz, badem, fındık (ölçülü porsiyon).',
      '  • UYARI: muz, üzüm, hurma, bal, akçaağaç şurubu, granola, yulaf ezmesi yüksek karbonhidrat — bunlardan kaçınmasını söyle.',
      '- Pişirme süresi "15dk altı" ise ≤15dk tarif ver, fırın gerektiren tarif önerme.',
      '- Düşük bütçe ise ucuz, ulaşılabilir malzemeler seç (mevsim meyvesi, yumurta, mercimek, bulgur).',
      '- Mutfak becerisi "yeni başlayan" ise 4 adımı geçme, jargon kullanma.',
      '- Tatlı craving\'i varsa: sağlıklı ama tatmin edici tatlı öner (örn. süzme yoğurt + orman meyvesi + 1 tatlı kaşığı bal/tarçın — bal yoksa sadece tarçın).',
      '- Ton: "soft" → sıcak ve nazik; "direct" → kısa ve net, slogansız; "friendly" → bir miktar espri olur; "data" → kalori/makro detayı öne çıksın.',
      '',
      'GENEL:',
      '- Motivasyon istendiğinde: somut bir sonraki adım (örn. "10 dakika yürü, sonra 2 bardak su iç").',
      '- Tarif istendiğinde: malzeme + adım adım yapılış.',
      '- Kullanıcı sinirliyse: 1 cümlelik özür + hemen faydalı öneri. Duygusal soru sorma.',
      '- Hamile/emziren, diyabet, hipertansiyon, yeme bozukluğu geçmişi varsa: güvenli, ölçülü öneri ver, gerektiğinde uzmana yönlendir, asla teşhis koyma.',
      '- Tehlikeli/aşırı diyet, açlık, takviye doz tavsiyesi YASAK.',
      '- Mesaj uzunluğu ≤ 180 kelime. Süslü emoji şovu yapma; en fazla 1-2 emoji.',
    ].join('\n');
  }
  return [
    'RULES (follow strictly):',
    '- You are Mira: warm, decisive 32-year-old wellness coach. Keep replies short, warm, and human.',
    '- Reply in FULL ENGLISH. If the user clearly writes in another language, mirror that language fully — no mixing.',
    '- NEVER repeat the user\'s sentence back. No "I hear you want X" filler.',
    '- Banned filler phrases: "Sizin için uygun…", "This dessert is made of the combination of…", "As a wellness coach…". Just speak naturally.',
    '- Maximum ONE question per reply — and only AFTER the concrete recommendation.',
    '- Avoid pet-name overuse.',
    '',
    'FOR FOOD / DESSERT / SNACK REQUESTS — use this format:',
    '1) **Dish name** (clear, specific).',
    '2) One sentence: why it fits the user\'s Wellness DNA (allergy, low-carb, short cook time, craving, goal — name the reason).',
    '3) Ingredients (bullet list with portions).',
    '4) 2-4 short steps (one line each).',
    '5) Rough calories + protein/carb/fat estimate.',
    '6) One practical warning or smart swap (e.g. "skip banana, use raspberries" / "swap honey for cinnamon").',
    '7) Then — only if useful — ONE short follow-up question.',
    '',
    'WELLNESS DNA COMPLIANCE (mandatory):',
    '- Never suggest anything in the allergies list.',
    '- Avoid disliked foods; lean on favorite foods.',
    '- Low-carb / keto user:',
    '  • No vague "fresh fruit" — be specific: strawberries, raspberries, blackberries, small portion of blueberries.',
    '  • Greek yogurt, unsweetened cocoa, cinnamon, walnuts, almonds, hazelnuts (controlled portions).',
    '  • WARN AGAINST: banana, grapes, dates, honey, maple syrup, granola, oatmeal — call these out as high-carb.',
    '- If cooking time is "under 15 min" → ≤15min recipe only, no oven-baked dishes.',
    '- Low budget → cheap accessible ingredients (eggs, lentils, seasonal produce, bulgur).',
    '- Beginner cook → ≤4 steps, no jargon.',
    '- Sweet craving → healthy but satisfying dessert (e.g. Greek yogurt + berries + a teaspoon of cinnamon — no honey if low-carb).',
    '- Tone: soft → warm/gentle; direct → short/blunt, no slogans; friendly → light humor; data → lead with calories/macros.',
    '',
    'GENERAL:',
    '- Motivation → one concrete next action (e.g. "walk 10 minutes, then drink 2 glasses of water").',
    '- Recipes → ingredients + step-by-step.',
    '- If user is angry/frustrated: 1-line apology + immediately useful suggestion. No more emotional questions.',
    '- Pregnancy/breastfeeding, diabetes, hypertension, eating disorder history → give safe moderate guidance and suggest seeing a professional. Never diagnose.',
    '- No dangerous/extreme diet, fasting, or supplement-dose advice.',
    '- Keep replies ≤ 180 words. At most 1-2 emojis, no emoji parade.',
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
