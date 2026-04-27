/**
 * OpenFoodFacts API Integration (calls our API route)
 * Free food database with 2.9M+ products
 */

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
 * Search for food products by name (via our API route)
 */
export async function searchFoodProducts(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { products: [], count: 0, page: 1, page_size: pageSize };
  }

  try {
    // Searching OpenFoodFacts
    
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await fetch(`/api/openfoodfacts?${params.toString()}`);

    if (!response.ok) {
      console.error('OpenFoodFacts Client: API failed:', response.status);
      return { products: [], count: 0, page: 1, page_size: pageSize };
    }

    const data = await response.json();

    // Show translation debug info if available
    if (data.debug) {
      // Translation debug info available in response
    }

    if (!data.products || data.products.length === 0) {
      // No results found
      return { products: [], count: 0, page: 1, page_size: pageSize };
    }

    // Products found
    
    return {
      products: data.products,
      count: data.products.length,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error('OpenFoodFacts Client: Search error:', error);
    return { products: [], count: 0, page: 1, page_size: pageSize };
  }
}

/**
 * Get product by barcode (via proxy endpoint for backward compatibility)
 */
export async function getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocol: 'https',
        origin: 'world.openfoodfacts.org',
        path: `/api/v2/product/${barcode}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FittoApp/1.0'
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenFoodFacts API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return data.product as OpenFoodFactsProduct;
    }

    return null;
  } catch (error) {
    console.error('OpenFoodFacts barcode lookup error:', error);
    throw error;
  }
}

/**
 * Normalize OpenFoodFacts product to our food format
 */
export function normalizeProduct(product: NormalizedFood | OpenFoodFactsProduct): NormalizedFood {
  // Products are already normalized by the API route
  // Type guard to ensure we have the right shape
  if ('nameTr' in product && 'calories' in product) {
    return product as NormalizedFood;
  }
  
  // Fallback: shouldn't reach here if API is working correctly
  throw new Error('Invalid product format received from API');
}

/**
 * Search and normalize results (via our API route)
 */
export async function searchAndNormalize(query: string, page: number = 1): Promise<NormalizedFood[]> {
  const results = await searchFoodProducts(query, page);
  // Results are already normalized by the API route
  return results.products;
}
