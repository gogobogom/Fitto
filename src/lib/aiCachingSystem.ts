/**
 * 🎯 AI CACHING SYSTEM
 * 
 * Caches frequently asked questions to reduce GLM API calls by 20-30%
 * Smart cache invalidation and multi-language support.
 * 
 * @author Fitto AI Team
 * @version 1.0.0
 */

interface CachedResponse {
  question: string;
  answer: string;
  language: 'tr' | 'en';
  hits: number;
  lastAccessed: number;
  createdAt: number;
}

interface CacheStats {
  totalHits: number;
  cacheHitRate: number;
  totalQuestions: number;
  savedApiCalls: number;
}

/**
 * In-memory cache storage
 * In production, use Redis or similar for distributed caching
 */
class AICache {
  private cache: Map<string, CachedResponse>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 24 * 60 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // 24 hours default
  }

  /**
   * Normalizes question for cache lookup (lowercase, trim, remove extra spaces)
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[?.!,]/g, ''); // Remove punctuation
  }

  /**
   * Generates cache key from question and language
   */
  private getCacheKey(question: string, language: 'tr' | 'en'): string {
    return `${language}:${this.normalizeQuestion(question)}`;
  }

  /**
   * Gets cached response if available
   */
  get(question: string, language: 'tr' | 'en'): string | null {
    const key = this.getCacheKey(question, language);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - cached.createdAt > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update stats
    cached.hits++;
    cached.lastAccessed = now;
    this.cache.set(key, cached);

    return cached.answer;
  }

  /**
   * Sets cached response
   */
  set(question: string, answer: string, language: 'tr' | 'en'): void {
    const key = this.getCacheKey(question, language);

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      question,
      answer,
      language,
      hits: 1,
      lastAccessed: now,
      createdAt: now,
    });
  }

  /**
   * Evicts least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    let totalHits = 0;
    let totalQuestions = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalQuestions++;
    }

    const savedApiCalls = Math.max(0, totalHits - totalQuestions); // Hits beyond first access
    const cacheHitRate = totalHits > 0 ? (savedApiCalls / totalHits) * 100 : 0;

    return {
      totalHits,
      cacheHitRate,
      totalQuestions,
      savedApiCalls,
    };
  }

  /**
   * Clears all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const aiCache = new AICache();

/**
 * Pre-populated common questions (TR)
 */
export const COMMON_QUESTIONS_TR: Record<string, string> = {
  'ne yesem': 'Hedeflerinize göre şunları önerebilirim:\n\n• Protein için: Tavuk göğsü, balık, yumurta\n• Karbonhidrat için: Tam tahıl ekmek, kahverengi pirinç, kinoa\n• Sağlıklı yağ için: Avokado, zeytinyağı, kuruyemişler\n\nGünlük kalorinizi aşmamaya dikkat ederek dengeli bir öğün hazırlayabilirsiniz. 🥗',
  
  'protein kaynağı öner': 'En iyi protein kaynakları:\n\n1. 🍗 Tavuk göğsü (100g = 31g protein, 165 kcal)\n2. 🐟 Somon balığı (100g = 25g protein, 208 kcal)\n3. 🥚 Yumurta (1 adet = 6g protein, 78 kcal)\n4. 🥛 Yoğurt (100g = 10g protein, 59 kcal)\n5. 🥜 Badem (28g = 6g protein, 161 kcal)\n\nGünlük protein hedefinize göre porsiyon ayarlayın! 💪',
  
  'kilo vermek için ipucu': 'Kilo vermek için kanıtlanmış ipuçları:\n\n1. ✅ Kalori açığı oluşturun (300-500 kcal)\n2. 💧 Bol su için (günde 2-3 litre)\n3. 🏋️ Düzenli egzersiz yapın\n4. 😴 Kaliteli uyku (7-8 saat)\n5. 🍽️ Küçük porsiyonlar, sık öğün\n6. 🥗 Protein ve lif oranını artırın\n\nSabırlı olun, haftada 0.5-1 kg ideal! 🎯',
  
  'kalori hesaplama': 'Kalori hesaplama:\n\n📊 Günlük kalori hedef belirleme:\n• Önce BMR (Bazal Metabolizma) hesaplayın\n• Aktivite seviyenize göre çarpın\n• Hedefinize göre ayarlayın:\n  - Kilo vermek: -300-500 kcal\n  - Korumak: Eşit kalori\n  - Almak: +300-500 kcal\n\nFitto otomatik hesaplıyor, profilinizi güncel tutun! 📈',
  
  'motivasyon': 'Harika gidiyorsun! 🎉\n\nHatırla:\n• Her gün bir adım, büyük hedeflere götürür\n• Mükemmel değil, tutarlı olmak önemli\n• Küçük kazançları kutlayın\n• Hedeflerinizi görselleştirin\n• Sen yapabilirsin! 💪\n\nFitto ailesi her zaman yanında! 🥗✨',
};

/**
 * Pre-populated common questions (EN)
 */
export const COMMON_QUESTIONS_EN: Record<string, string> = {
  'what should i eat': 'Based on your goals, I recommend:\n\n• For protein: Chicken breast, fish, eggs\n• For carbs: Whole grain bread, brown rice, quinoa\n• For healthy fats: Avocado, olive oil, nuts\n\nPrepare a balanced meal while staying within your daily calorie goal. 🥗',
  
  'protein source': 'Best protein sources:\n\n1. 🍗 Chicken breast (100g = 31g protein, 165 kcal)\n2. 🐟 Salmon (100g = 25g protein, 208 kcal)\n3. 🥚 Egg (1 = 6g protein, 78 kcal)\n4. 🥛 Yogurt (100g = 10g protein, 59 kcal)\n5. 🥜 Almonds (28g = 6g protein, 161 kcal)\n\nAdjust portions based on your daily protein goal! 💪',
  
  'weight loss tips': 'Proven weight loss tips:\n\n1. ✅ Create calorie deficit (300-500 kcal)\n2. 💧 Drink plenty of water (2-3 liters/day)\n3. 🏋️ Exercise regularly\n4. 😴 Quality sleep (7-8 hours)\n5. 🍽️ Small portions, frequent meals\n6. 🥗 Increase protein and fiber\n\nBe patient, 0.5-1 kg/week is ideal! 🎯',
  
  'calorie calculation': 'Calorie calculation:\n\n📊 Setting daily calorie target:\n• First calculate BMR (Basal Metabolic Rate)\n• Multiply by activity level\n• Adjust for your goal:\n  - Lose weight: -300-500 kcal\n  - Maintain: Equal calories\n  - Gain weight: +300-500 kcal\n\nFitto calculates automatically, keep your profile updated! 📈',
  
  'motivation': 'You\'re doing amazing! 🎉\n\nRemember:\n• Every day is a step toward big goals\n• Progress, not perfection\n• Celebrate small wins\n• Visualize your goals\n• You can do this! 💪\n\nThe Fitto family is always with you! 🥗✨',
};

/**
 * Pre-populates cache with common questions
 */
export function prePopulateCache(): void {
  // Turkish
  for (const [question, answer] of Object.entries(COMMON_QUESTIONS_TR)) {
    aiCache.set(question, answer, 'tr');
  }

  // English
  for (const [question, answer] of Object.entries(COMMON_QUESTIONS_EN)) {
    aiCache.set(question, answer, 'en');
  }

  console.log('[AICache] ✅ Pre-populated with common questions');
}

/**
 * Example Usage:
 * 
 * // Pre-populate on app startup
 * prePopulateCache();
 * 
 * // Check cache before API call
 * const cached = aiCache.get('ne yesem', 'tr');
 * if (cached) {
 *   return cached; // Cache hit! No API call needed
 * }
 * 
 * // Make API call and cache result
 * const response = await callGLMAPI(message);
 * aiCache.set(message, response, 'tr');
 * 
 * // Get stats
 * const stats = aiCache.getStats();
 * console.log(`Cache hit rate: ${stats.cacheHitRate.toFixed(1)}%`);
 * console.log(`Saved API calls: ${stats.savedApiCalls}`);
 */
