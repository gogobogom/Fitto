/**
 * 🍽️ RECIPE DETAIL API
 * 
 * Production-ready recipe detail fetching with:
 * - Input validation (Recipe ID)
 * - Rate limiting
 * - Caching
 * - Error handling
 * - Security best practices
 * 
 * @author Fitto API Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateRecipe } from '@/services/recipeTranslationService';
import { 
  apiRateLimiter,
  VALIDATION_RULES 
} from '@/lib/validation';
import { 
  errorToResponse, 
  handleUnknownError,
  successResponse,
  ERRORS 
} from '@/lib/errorHandler';
import { 
  recipeCache,
  generateCacheKey 
} from '@/lib/translationCache';
import { env } from '@/lib/env';

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract request info
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const lang = searchParams.get('lang') || 'tr'; // Default to Turkish
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting (if enabled)
    if (env.ENABLE_RATE_LIMITING && !apiRateLimiter.isAllowed(clientIp)) {
      return errorToResponse(ERRORS.RATE_LIMIT.EXCEEDED());
    }

    // Validate recipe ID
    if (!id || id.length < 5) {
      return errorToResponse(ERRORS.VALIDATION.MISSING_PARAMETER('Recipe ID'));
    }

    // Check cache first (if enabled)
    if (env.ENABLE_CACHING) {
      const cacheKey = generateCacheKey('recipe', `${id}-${lang}`);
      const cached = recipeCache.get(cacheKey);
      
      if (cached) {
        if (env.IS_DEVELOPMENT) {
          console.log(`[Recipe Detail] Cache hit for ${id} (${lang})`);
        }
        const cacheMessage = lang === 'tr' ? 'Tarif detayları (cache)' : 'Recipe details (cache)';
        return successResponse(cached, cacheMessage);
      }
    }

    // Log in development only
    if (env.IS_DEVELOPMENT) {
      console.log(`[Recipe Detail] Fetching recipe ${id} (lang: ${lang})...`);
    }

    // Timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      VALIDATION_RULES.TIMEOUT.DEFAULT
    );

    let response: Response;
    try {
      // TheMealDB API - lookup by ID
      response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return errorToResponse(ERRORS.EXTERNAL_API.TIMEOUT('TheMealDB'));
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return errorToResponse(
        ERRORS.EXTERNAL_API.FAILED('TheMealDB', response.status)
      );
    }

    const data = await response.json();

    // Check if recipe exists
    if (!data.meals || !data.meals[0]) {
      if (env.IS_DEVELOPMENT) {
        console.log('[Recipe Detail] Recipe not found');
      }
      return errorToResponse(ERRORS.EXTERNAL_API.NO_RESULTS());
    }

    let result;
    
    // Only translate to Turkish if lang=tr
    if (lang === 'tr') {
      // Translate the recipe to Turkish before sending to client
      const translatedRecipe = await translateRecipe(data.meals[0]);
      
      // Prepare response with translated data
      result = {
        meals: [{
          ...data.meals[0], // Keep all original fields
          strMeal: translatedRecipe.strMeal,
          strCategory: translatedRecipe.strCategory,
          strArea: translatedRecipe.strArea,
          strInstructions: translatedRecipe.strInstructions,
          // Add pre-translated ingredients array
          translatedIngredients: translatedRecipe.ingredients
        }]
      };
      
      if (env.IS_DEVELOPMENT) {
        console.log(`[Recipe Detail] ✅ ${translatedRecipe.strMeal} (Turkish)`);
      }
    } else {
      // For English, use original data directly
      result = data;
      
      if (env.IS_DEVELOPMENT) {
        console.log(`[Recipe Detail] ✅ ${data.meals[0].strMeal} (English - original)`);
      }
    }

    // Cache the result (if enabled)
    if (env.ENABLE_CACHING) {
      const cacheKey = generateCacheKey('recipe', `${id}-${lang}`);
      recipeCache.set(cacheKey, result);
    }

    const successMessage = lang === 'tr' ? 'Tarif detayları başarıyla alındı' : 'Recipe details loaded successfully';
    return successResponse(result, successMessage);
  } catch (error: unknown) {
    // Centralized error handling
    return handleUnknownError(error);
  }
}
