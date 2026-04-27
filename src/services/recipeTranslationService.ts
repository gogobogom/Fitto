/**
 * 🌐 RECIPE TRANSLATION SERVICE
 * 
 * Enterprise-grade translation system using Google Translate Free API
 * - Full text translation (not word-by-word!)
 * - Smart caching to minimize API calls
 * - Rate limiting and error handling
 * - Fallback to original text on errors
 * - Production-ready with security best practices
 * 
 * @author Fitto Translation Team
 * @version 4.0.0 - Google Translate Integration
 */

import { env } from '@/lib/env';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Google Translate Free Endpoint
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const TRANSLATION_TIMEOUT = 15000; // 15 seconds (Google needs more time)
const MAX_TEXT_LENGTH = 50000; // Google Translate supports up to 50K+ characters per request

// In-memory translation cache (prevents redundant API calls)
const translationCache = new Map<string, string>();

// Rate limiter for translation API
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 200, // Max 200 requests per minute (Google is more generous)
  windowMs: 60000, // 1 minute
  
  isAllowed(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter((time: number) => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
};

// ============================================================================
// TURKISH TO ENGLISH SEARCH QUERY TRANSLATION
// ============================================================================

// For search queries: Turkish → English (to search TheMealDB)
const TURKISH_TO_ENGLISH_SEARCH: Record<string, string> = {
  // Proteins
  'tavuk': 'chicken',
  'et': 'beef',
  'kuzu': 'lamb',
  'koyun': 'lamb',
  'balık': 'fish',
  'somon': 'salmon',
  'ton': 'tuna',
  'karides': 'shrimp',
  'hindi': 'turkey',
  
  // Dishes
  'kebap': 'kebab',
  'kebab': 'kebab',
  'köfte': 'meatball',
  'çorba': 'soup',
  'salata': 'salad',
  'pilav': 'rice',
  'makarna': 'pasta',
  'börek': 'pastry',
  'dolma': 'stuffed',
  'sarma': 'wrapped',
  'pide': 'flatbread',
  'lahmacun': 'flatbread',
  'manti': 'dumpling',
  'pizza': 'pizza',
  'burger': 'burger',
  'sandviç': 'sandwich',
  
  // Cooking methods
  'fırın': 'baked',
  'ızgara': 'grilled',
  'haşlama': 'boiled',
  'kızartma': 'fried',
  
  // General
  'yemek': 'meal',
  'tarif': 'recipe',
  'tatlı': 'dessert',
  'kahvaltı': 'breakfast',
  'öğle': 'lunch',
  'akşam': 'dinner',
};

/**
 * Translates Turkish search queries to English for API search
 * This is a simple dictionary lookup for search terms only
 */
export function translateSearchQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check if the entire query matches
  if (TURKISH_TO_ENGLISH_SEARCH[lowerQuery]) {
    return TURKISH_TO_ENGLISH_SEARCH[lowerQuery];
  }
  
  // Check if any word in the query matches
  const words = lowerQuery.split(' ');
  const translatedWords = words.map((word: string) => 
    TURKISH_TO_ENGLISH_SEARCH[word] || word
  );
  
  return translatedWords.join(' ');
}

// ============================================================================
// GOOGLE TRANSLATE API INTEGRATION
// ============================================================================

/**
 * Translates text using Google Translate Free API
 * - Uses caching to minimize API calls
 * - Rate limiting to prevent abuse
 * - Timeout protection
 * - Fallback to original text on errors
 */
async function translateWithGoogleAPI(
  text: string,
  fromLang: string = 'en',
  toLang: string = 'tr'
): Promise<string> {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }
  
  // Check length limit
  if (trimmed.length > MAX_TEXT_LENGTH) {
    if (env.IS_DEVELOPMENT) {
      console.log(`[Translation] Text too long (${trimmed.length} chars), splitting...`);
    }
    return await translateLongText(trimmed, fromLang, toLang);
  }
  
  // Check cache first
  const cacheKey = `${fromLang}:${toLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    if (env.IS_DEVELOPMENT) {
      console.log('[Translation] ✅ Cache hit');
    }
    return translationCache.get(cacheKey)!;
  }
  
  // Check rate limit
  if (!rateLimiter.isAllowed()) {
    console.warn('[Translation] ⚠️ Rate limit exceeded, using original text');
    return trimmed;
  }
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT);
    
    // Build Google Translate URL
    // Parameters explained:
    // - client=gtx: Free API client
    // - sl: source language
    // - tl: target language
    // - dt=t: return translation
    // - q: query text
    const params = new URLSearchParams({
      client: 'gtx',
      sl: fromLang,
      tl: toLang,
      dt: 't',
      q: trimmed,
    });
    
    const url = `${GOOGLE_TRANSLATE_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`[Translation] ❌ Google API error: ${response.status}`);
      return trimmed; // Fallback to original
    }
    
    const data = await response.json();
    
    // Google Translate returns: [[["translated text", "original text", null, null, 10]], null, "en", null, null, null, 1]
    // We need the first element of the first array
    if (!Array.isArray(data) || !data[0] || !Array.isArray(data[0])) {
      console.error('[Translation] ❌ Invalid response format from Google');
      return trimmed; // Fallback to original
    }
    
    // Extract translated text from all segments
    const translatedSegments: string[] = [];
    for (const segment of data[0]) {
      if (Array.isArray(segment) && segment[0]) {
        translatedSegments.push(segment[0]);
      }
    }
    
    if (translatedSegments.length === 0) {
      console.error('[Translation] ❌ No translation found in response');
      return trimmed; // Fallback to original
    }
    
    const translated = translatedSegments.join('');
    
    // Cache the result
    translationCache.set(cacheKey, translated);
    
    if (env.IS_DEVELOPMENT) {
      console.log(`[Translation] ✅ "${trimmed.substring(0, 60)}..." → "${translated.substring(0, 60)}..."`);
    }
    
    return translated;
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Translation] ⏱️ Timeout');
      } else {
        console.error(`[Translation] ❌ Error: ${error.message}`);
      }
    }
    return trimmed; // Fallback to original
  }
}

/**
 * Translates long text by splitting into chunks
 */
async function translateLongText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  // Split by sentences (period, exclamation, question mark followed by space)
  const sentences = text.split(/(?<=[.!?])\s+/);
  const translatedSentences: string[] = [];
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    // If adding this sentence exceeds limit, translate current chunk
    if (currentChunk.length + sentence.length > MAX_TEXT_LENGTH) {
      if (currentChunk) {
        const translated = await translateWithGoogleAPI(currentChunk, fromLang, toLang);
        translatedSentences.push(translated);
        currentChunk = '';
        
        // Small delay to avoid rate limiting (with proper promise typing)
        await new Promise<void>((resolve: () => void) => {
          setTimeout(() => resolve(), 500);
        });
      }
    }
    
    currentChunk += (currentChunk ? ' ' : '') + sentence;
  }
  
  // Translate remaining chunk
  if (currentChunk) {
    const translated = await translateWithGoogleAPI(currentChunk, fromLang, toLang);
    translatedSentences.push(translated);
  }
  
  return translatedSentences.join(' ');
}

// ============================================================================
// PUBLIC TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Translates recipe name to Turkish
 */
export async function translateRecipeName(name: string): Promise<string> {
  return await translateWithGoogleAPI(name, 'en', 'tr');
}

/**
 * Translates category to Turkish
 */
export async function translateCategory(category: string): Promise<string> {
  return await translateWithGoogleAPI(category, 'en', 'tr');
}

/**
 * Translates area/cuisine to Turkish
 */
export async function translateArea(area: string): Promise<string> {
  return await translateWithGoogleAPI(area, 'en', 'tr');
}

/**
 * Translates ingredient name to Turkish
 */
export async function translateIngredient(ingredient: string): Promise<string> {
  return await translateWithGoogleAPI(ingredient, 'en', 'tr');
}

/**
 * Translates measure/quantity to Turkish
 */
export async function translateMeasure(measure: string): Promise<string> {
  return await translateWithGoogleAPI(measure, 'en', 'tr');
}

/**
 * Translates cooking instructions to Turkish
 * Handles long text by splitting into manageable chunks
 */
export async function translateInstructions(instructions: string): Promise<string> {
  if (!instructions) return instructions;
  
  return await translateWithGoogleAPI(instructions, 'en', 'tr');
}

// ============================================================================
// FULL RECIPE TRANSLATION
// ============================================================================

export interface TranslatedRecipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube?: string;
  ingredients: Array<{
    name: string;
    measure: string;
  }>;
}

/**
 * Translates a complete TheMealDB recipe object to Turkish
 * Uses Google Translate API for high-quality full-text translation
 */
export async function translateRecipe(meal: any): Promise<TranslatedRecipe> {
  if (env.IS_DEVELOPMENT) {
    console.log(`[Translation] 🔄 Translating recipe: ${meal.strMeal}`);
  }
  
  // Extract and translate ingredients (TheMealDB has strIngredient1-20 and strMeasure1-20)
  const ingredientPromises: Promise<{ name: string; measure: string }>[] = [];
  
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredientPromises.push(
        (async () => {
          // Add small delay between ingredient translations to avoid rate limit
          await new Promise<void>((resolve: () => void) => {
            setTimeout(() => resolve(), i * 50);
          });
          
          return {
            name: await translateIngredient(ingredient),
            measure: measure ? await translateMeasure(measure) : '',
          };
        })()
      );
    }
  }
  
  // Translate all fields in parallel for better performance
  const [
    translatedName,
    translatedCategory,
    translatedArea,
    translatedInstructions,
    ...translatedIngredients
  ] = await Promise.all([
    translateRecipeName(meal.strMeal || ''),
    translateCategory(meal.strCategory || ''),
    translateArea(meal.strArea || ''),
    translateInstructions(meal.strInstructions || ''),
    ...ingredientPromises,
  ]);
  
  if (env.IS_DEVELOPMENT) {
    console.log(`[Translation] ✅ Recipe translated: ${translatedName}`);
  }
  
  return {
    idMeal: meal.idMeal,
    strMeal: translatedName,
    strCategory: translatedCategory,
    strArea: translatedArea,
    strInstructions: translatedInstructions,
    strMealThumb: meal.strMealThumb || '',
    strYoutube: meal.strYoutube || '',
    ingredients: translatedIngredients,
  };
}

/**
 * Clears translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  if (env.IS_DEVELOPMENT) {
    console.log('[Translation] 🗑️ Cache cleared');
  }
}

/**
 * Gets cache statistics (useful for monitoring)
 */
export function getTranslationStats(): { cacheSize: number; rateLimit: number } {
  return {
    cacheSize: translationCache.size,
    rateLimit: rateLimiter.requests.length,
  };
}
