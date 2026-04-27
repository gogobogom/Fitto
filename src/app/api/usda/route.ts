/**
 * 🥗 USDA FOOD DATA API
 * 
 * Production-ready USDA food search with:
 * - Input validation & sanitization
 * - Rate limiting
 * - Secure API key management
 * - Error handling
 * - Performance optimization
 * 
 * @author Fitto API Team
 * @version 2.0.0
 */

import { NextResponse } from 'next/server';
import { 
  validateSearchQuery,
  apiRateLimiter,
  VALIDATION_RULES 
} from '@/lib/validation';
import { 
  errorToResponse, 
  handleUnknownError,
  successResponse,
  ERRORS 
} from '@/lib/errorHandler';
import { env } from '@/lib/env';

// SECURITY: API key from environment variables
const USDA_API_KEY = env.USDA_API_KEY;

export interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  foodNutrients: USDAFoodNutrient[];
  foodCategory?: string;
}

export interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface NormalizedUSDAFood {
  id: string;
  name: string;
  nameTr: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string;
  source: 'USDA';
}

/**
 * Get nutrient value from food nutrients array
 */
function getNutrientValue(nutrients: USDAFoodNutrient[], nutrientId: number): number {
  const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
  return nutrient?.value || 0;
}

/**
 * Bidirectional translation map
 */
const TRANSLATION_MAP: Record<string, string> = {
  // Turkish to English
  'tavuk': 'chicken',
  'sığır eti': 'beef',
  'sığır': 'beef',
  'et': 'meat',
  'domuz eti': 'pork',
  'balık': 'fish',
  'somon': 'salmon',
  'ton balığı': 'tuna',
  'ton': 'tuna',
  'yumurta': 'egg',
  'süt': 'milk',
  'peynir': 'cheese',
  'yoğurt': 'yogurt',
  'ekmek': 'bread',
  'pirinç': 'rice',
  'makarna': 'pasta',
  'patates': 'potato',
  'domates': 'tomato',
  'soğan': 'onion',
  'havuç': 'carrot',
  'elma': 'apple',
  'muz': 'banana',
  'portakal': 'orange',
  'çilek': 'strawberry',
  'üzüm': 'grapes',
  'karpuz': 'watermelon',
  'kavun': 'melon',
  'şeftali': 'peach',
  'armut': 'pear',
  'salatalık': 'cucumber',
  'marul': 'lettuce',
  'ıspanak': 'spinach',
  'brokoli': 'broccoli',
  'biber': 'pepper',
  'sarımsak': 'garlic',
  'zeytin': 'olive',
  'zeytinyağı': 'olive oil',
  'yağ': 'oil',
  'tereyağı': 'butter',
  'şeker': 'sugar',
  'tuz': 'salt',
  'kahve': 'coffee',
  'çay': 'tea',
  'su': 'water',
  'limon': 'lemon',
  'avokado': 'avocado',
  'fasulye': 'beans',
  'mercimek': 'lentils',
  'nohut': 'chickpeas',
  'fındık': 'nuts',
  'badem': 'almonds',
  'ceviz': 'walnuts',
  'yer fıstığı': 'peanuts',
  'biftek': 'beef steak',
  'kıyma': 'ground beef',
  // English to Turkish (reverse mapping)
  'chicken': 'tavuk',
  'beef': 'sığır eti',
  'pork': 'domuz eti',
  'fish': 'balık',
  'salmon': 'somon',
  'tuna': 'ton balığı',
  'egg': 'yumurta',
  'milk': 'süt',
  'cheese': 'peynir',
  'yogurt': 'yoğurt',
  'bread': 'ekmek',
  'rice': 'pirinç',
  'pasta': 'makarna',
  'potato': 'patates',
  'tomato': 'domates',
  'cucumber': 'salatalık',
  'carrot': 'havuç',
  'onion': 'soğan',
  'garlic': 'sarımsak',
  'apple': 'elma',
  'banana': 'muz',
  'orange': 'portakal',
  'grape': 'üzüm',
  'strawberry': 'çilek',
  'lemon': 'limon',
  'avocado': 'avokado',
  'broccoli': 'brokoli',
  'spinach': 'ıspanak',
  'lettuce': 'marul',
  'beans': 'fasulye',
  'lentils': 'mercimek',
  'chickpeas': 'nohut',
  'nuts': 'fındık',
  'almonds': 'badem',
  'walnuts': 'ceviz',
  'peanuts': 'yer fıstığı',
  'butter': 'tereyağı',
  'oil': 'yağ',
  'olive oil': 'zeytinyağı',
  'sugar': 'şeker',
  'salt': 'tuz',
  'pepper': 'biber',
  'beef steak': 'biftek',
  'ground beef': 'kıyma',
};

/**
 * Translate Turkish to English for API queries
 */
function translateToEnglish(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check direct translation first
  if (TRANSLATION_MAP[lowerQuery]) {
    return TRANSLATION_MAP[lowerQuery];
  }
  
  // Check if any Turkish word is in the query
  let translated = lowerQuery;
  for (const [tr, eng] of Object.entries(TRANSLATION_MAP)) {
    // Only translate Turkish to English (not reverse)
    if (tr.length > 2 && !eng.includes(' ')) {
      translated = translated.replace(new RegExp(tr, 'gi'), eng);
    }
  }
  
  return translated !== lowerQuery ? translated : query;
}

/**
 * Translate English food names to Turkish (basic translation)
 */
function translateToTurkish(name: string): string {
  let translated = name.toLowerCase();
  
  // Apply English to Turkish translations
  for (const [eng, tr] of Object.entries(TRANSLATION_MAP)) {
    // Only apply common translations
    if (eng === 'chicken' || eng === 'beef' || eng === 'fish' || eng === 'banana' || 
        eng === 'apple' || eng === 'egg' || eng === 'milk' || eng === 'cheese') {
      translated = translated.replace(new RegExp(eng, 'gi'), tr);
    }
  }
  
  // If translation didn't change much, return original
  if (translated === name.toLowerCase()) {
    return name;
  }
  
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

/**
 * Determine category from food description
 */
function determineCategory(description: string, foodCategory?: string): string {
  const desc = description.toLowerCase();
  const cat = foodCategory?.toLowerCase() || '';
  
  if (desc.includes('chicken') || desc.includes('beef') || desc.includes('pork') || 
      desc.includes('meat') || desc.includes('steak') || cat.includes('meat')) {
    return 'Et';
  } else if (desc.includes('fish') || desc.includes('salmon') || desc.includes('tuna') || 
             cat.includes('fish') || cat.includes('seafood')) {
    return 'Balık';
  } else if (desc.includes('milk') || desc.includes('cheese') || desc.includes('yogurt') || 
             desc.includes('dairy') || cat.includes('dairy')) {
    return 'Süt Ürünü';
  } else if (desc.includes('fruit') || desc.includes('apple') || desc.includes('banana') || 
             desc.includes('orange') || cat.includes('fruit')) {
    return 'Meyve';
  } else if (desc.includes('vegetable') || desc.includes('tomato') || desc.includes('carrot') || 
             desc.includes('broccoli') || cat.includes('vegetable')) {
    return 'Sebze';
  } else if (desc.includes('bread') || desc.includes('rice') || desc.includes('pasta') || 
             desc.includes('grain') || cat.includes('grain')) {
    return 'Tahıl';
  } else if (desc.includes('egg')) {
    return 'Yumurta';
  } else if (desc.includes('nut') || desc.includes('seed')) {
    return 'Kuruyemiş';
  } else if (desc.includes('oil') || desc.includes('butter') || desc.includes('fat')) {
    return 'Yağ';
  }
  
  return 'Diğer';
}

/**
 * Normalize USDA food to our standard format
 */
function normalizeUSDAFood(food: USDAFood): NormalizedUSDAFood {
  // USDA Nutrient IDs:
  // 1008 = Energy (kcal)
  // 1003 = Protein
  // 1005 = Carbohydrate
  // 1004 = Total lipid (fat)
  // 1079 = Fiber
  
  const calories = Math.round(getNutrientValue(food.foodNutrients, 1008));
  const protein = parseFloat(getNutrientValue(food.foodNutrients, 1003).toFixed(1));
  const carbs = parseFloat(getNutrientValue(food.foodNutrients, 1005).toFixed(1));
  const fat = parseFloat(getNutrientValue(food.foodNutrients, 1004).toFixed(1));
  const fiber = parseFloat(getNutrientValue(food.foodNutrients, 1079).toFixed(1));
  
  const category = determineCategory(food.description, food.foodCategory);
  const translatedName = translateToTurkish(food.description);
  
  return {
    id: `usda_${food.fdcId}`,
    name: food.description,
    nameTr: translatedName,
    brand: food.brandOwner || food.brandName,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    category,
    source: 'USDA',
  };
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: Request) {
  try {
    // Extract request info
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting (if enabled)
    if (env.ENABLE_RATE_LIMITING && !apiRateLimiter.isAllowed(clientIp)) {
      return errorToResponse(ERRORS.RATE_LIMIT.EXCEEDED());
    }

    // Validate query
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return errorToResponse(ERRORS.VALIDATION.INVALID_QUERY());
    }

    const sanitizedQuery = validation.query;

    // Translate Turkish to English for API query
    const englishQuery = translateToEnglish(sanitizedQuery);
    
    // Log in development only
    if (env.IS_DEVELOPMENT) {
      console.log(`[USDA] Query: "${sanitizedQuery}" → "${englishQuery}"`);
    }

    // Timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      VALIDATION_RULES.TIMEOUT.DEFAULT
    );

    let response: Response;
    try {
      response = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': USDA_API_KEY,
        },
        body: JSON.stringify({
          query: englishQuery,
          pageSize: 10,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
        }),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return errorToResponse(ERRORS.EXTERNAL_API.TIMEOUT('USDA'));
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (env.IS_DEVELOPMENT) {
        const errorText = await response.text();
        console.error('[USDA] API error:', response.status, errorText);
      }
      return errorToResponse(
        ERRORS.EXTERNAL_API.FAILED('USDA', response.status)
      );
    }

    const data: USDASearchResult = await response.json();

    // Check for empty results
    if (!data.foods || data.foods.length === 0) {
      if (env.IS_DEVELOPMENT) {
        console.log('[USDA] No results found');
      }
      return successResponse({ foods: [] }, 'Sonuç bulunamadı');
    }

    // Filter foods with minimal nutrient data and normalize
    const normalized = data.foods
      .filter(food => {
        // Must have at least calories or protein
        const hasCalories = getNutrientValue(food.foodNutrients, 1008) > 0;
        const hasProtein = getNutrientValue(food.foodNutrients, 1003) > 0;
        return hasCalories || hasProtein;
      })
      .map(normalizeUSDAFood);

    // Log in development
    if (env.IS_DEVELOPMENT) {
      console.log(`[USDA] ✅ Found ${normalized.length} foods`);
    }

    return successResponse(
      { foods: normalized },
      `${normalized.length} besin bulundu`
    );
  } catch (error: unknown) {
    // Centralized error handling
    return handleUnknownError(error);
  }
}
