/**
 * 🍽️ RECIPE SEARCH API
 * 
 * Production-ready recipe search with:
 * - Input validation & sanitization
 * - Rate limiting
 * - Error handling
 * - Caching
 * - Security best practices
 * 
 * @author Fitto API Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateRecipeName, translateCategory, translateArea, translateSearchQuery } from '@/services/recipeTranslationService';
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
import { 
  turkishToEnglishCache,
  cachedTranslation,
  generateCacheKey 
} from '@/lib/translationCache';
import { env } from '@/lib/env';

// Translation helper moved to recipeTranslationService.ts
// Now using translateSearchQuery() function for search queries

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract request info
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'tr'; // Default to Turkish
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

    // Translate Turkish queries to English for API (with caching)
    const cacheKey = generateCacheKey('recipe-search', sanitizedQuery);
    const translatedQuery = env.ENABLE_CACHING
      ? cachedTranslation(turkishToEnglishCache, cacheKey, () => translateSearchQuery(sanitizedQuery))
      : translateSearchQuery(sanitizedQuery);
    
    // Log in development only
    if (env.IS_DEVELOPMENT) {
      console.log(`[Recipe Search] Query: "${sanitizedQuery}" → "${translatedQuery}"`);
    }

    // Timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      VALIDATION_RULES.TIMEOUT.DEFAULT
    );

    let response: Response;
    try {
      // TheMealDB API - search by name
      response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(translatedQuery)}`,
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

    // Only translate to Turkish if lang=tr
    if (data.meals && Array.isArray(data.meals)) {
      // Translate all meals in parallel only for Turkish
      if (lang === 'tr') {
        data.meals = await Promise.all(
          data.meals.map(async (meal: any) => ({
            ...meal,
            strMeal: await translateRecipeName(meal.strMeal),
            strCategory: await translateCategory(meal.strCategory || ''),
            strArea: await translateArea(meal.strArea || ''),
          }))
        );
      }
      // For English (lang=en), use original data directly

      // Log in development
      if (env.IS_DEVELOPMENT) {
        console.log(`[Recipe Search] ✅ Found ${data.meals.length} recipes (lang: ${lang})`);
      }

      const message = lang === 'tr' ? `${data.meals.length} tarif bulundu` : `Found ${data.meals.length} recipes`;
      return successResponse(data, message);
    }

    // No results found
    if (env.IS_DEVELOPMENT) {
      console.log('[Recipe Search] No results found');
    }
    
    const noResultsMessage = lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found';
    return successResponse(data, noResultsMessage);
  } catch (error: unknown) {
    // Centralized error handling
    return handleUnknownError(error);
  }
}
