import { NextResponse } from 'next/server';
import { translateFoodQuery } from '@/lib/food-translation';

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_tr?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
}

export interface SearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

export interface NormalizedFood {
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
  imageUrl?: string;
  barcode?: string;
}

/**
 * Normalize OpenFoodFacts product to our food format
 */
function normalizeProduct(product: OpenFoodFactsProduct): NormalizedFood {
  const nutriments = product.nutriments || {};
  
  // Determine category
  let category = 'Diğer';
  const categories = product.categories?.toLowerCase() || '';
  
  if (categories.includes('meat') || categories.includes('et') || categories.includes('chicken') || categories.includes('beef')) {
    category = 'Et';
  } else if (categories.includes('dairy') || categories.includes('süt') || categories.includes('cheese') || categories.includes('milk')) {
    category = 'Süt Ürünü';
  } else if (categories.includes('fruit') || categories.includes('meyve')) {
    category = 'Meyve';
  } else if (categories.includes('vegetable') || categories.includes('sebze')) {
    category = 'Sebze';
  } else if (categories.includes('bread') || categories.includes('grain') || categories.includes('tahıl') || categories.includes('cereal')) {
    category = 'Tahıl';
  } else if (categories.includes('beverage') || categories.includes('içecek') || categories.includes('drink')) {
    category = 'İçecek';
  } else if (categories.includes('snack') || categories.includes('atıştırmalık')) {
    category = 'Atıştırmalık';
  }

  return {
    id: product.code,
    name: product.product_name || 'Unknown Product',
    nameTr: product.product_name_tr || product.product_name || 'Bilinmeyen Ürün',
    brand: product.brands || undefined,
    calories: Math.round(nutriments['energy-kcal_100g'] || 0),
    protein: parseFloat((nutriments.proteins_100g || 0).toFixed(1)),
    carbs: parseFloat((nutriments.carbohydrates_100g || 0).toFixed(1)),
    fat: parseFloat((nutriments.fat_100g || 0).toFixed(1)),
    fiber: parseFloat((nutriments.fiber_100g || 0).toFixed(1)),
    category,
    imageUrl: product.image_url,
    barcode: product.code,
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    // ALWAYS clear timeout, whether success or error
    clearTimeout(timeoutId);
  }
}

/**
 * Search OpenFoodFacts with a specific term
 */
async function searchOpenFoodFacts(searchTerm: string, pageSize: string): Promise<OpenFoodFactsProduct[]> {
  const params = new URLSearchParams({
    search_terms: searchTerm,
    search_simple: '1',
    action: 'process',
    json: '1',
    page: '1',
    page_size: pageSize,
    fields: 'code,product_name,product_name_tr,brands,categories,image_url,nutriments',
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'turkey',
  });

  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
  // Searching OpenFoodFacts

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FittoApp/1.0 (https://fitto.app)',
      },
    },
    15000
  );

  if (!response.ok) {
    console.error(`OpenFoodFacts API: ❌ Search failed for "${searchTerm}": ${response.status}`);
    return [];
  }

  const data: SearchResult = await response.json();

  if (!data.products || data.products.length === 0) {
    // No results for this term
    return [];
  }

  // Filter products with nutriment data
  const validProducts = data.products.filter(p => {
    if (!p.product_name && !p.product_name_tr) return false;
    if (!p.nutriments) return false;
    const hasAnyNutrients = 
      p.nutriments['energy-kcal_100g'] !== undefined ||
      p.nutriments.proteins_100g !== undefined ||
      p.nutriments.carbohydrates_100g !== undefined ||
      p.nutriments.fat_100g !== undefined;
    return hasAnyNutrients;
  });

  // Found valid results
  return validProducts;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const pageSize = searchParams.get('pageSize') || '10';

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [] });
    }

    // Starting OpenFoodFacts search

    // 🎯 Use centralized translation system
    const searchTerms = translateFoodQuery(query);
    // Translated query to search terms

    // Try each search term until we find results
    const allProducts: OpenFoodFactsProduct[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < Math.min(searchTerms.length, 5); i++) {
      const term = searchTerms[i];
      
      try {
        const products = await searchOpenFoodFacts(term, pageSize);
        
        // Add unique products to results
        for (const product of products) {
          if (!seenIds.has(product.code)) {
            seenIds.add(product.code);
            allProducts.push(product);
          }
        }
        
        // If we have enough results, stop searching
        if (allProducts.length >= 15) {
          // Collected enough results
          break;
        }
      } catch (searchError: unknown) {
        const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
        console.error(`OpenFoodFacts API: Error searching "${term}":`, errorMessage);
        // Continue to next search term
      }
    }

    if (allProducts.length === 0) {
      // No results found
      return NextResponse.json({ 
        products: [],
        debug: {
          originalQuery: query,
          translatedTerms: searchTerms,
          termsSearched: searchTerms.slice(0, 5),
          message: `No results found for "${query}". Tried ${searchTerms.length} English translations: ${searchTerms.slice(0, 5).join(', ')}`
        }
      });
    }

    // Normalize results
    const normalized = allProducts.map(normalizeProduct);

    return NextResponse.json({ 
      products: normalized,
      debug: {
        originalQuery: query,
        translatedTerms: searchTerms,
        termsSearched: searchTerms.slice(0, 5),
        resultsCount: allProducts.length
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('OpenFoodFacts API: Search error:', errorMessage);
    return NextResponse.json({ 
      products: [], 
      error: `Server error: ${errorMessage}` 
    }, { status: 500 });
  }
}
