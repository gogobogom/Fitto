/**
 * USDA FoodData Central API Integration (calls our API route)
 * Official US government database with 800,000+ foods
 */

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
 * Search for food products in USDA FoodData Central (via our API route)
 */
export async function searchUSDAFoods(query: string): Promise<USDASearchResult> {
  if (!query || query.length < 2) {
    return { foods: [], totalHits: 0, currentPage: 1, totalPages: 0 };
  }

  try {
    // Searching USDA

    const response = await fetch(`/api/usda?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      console.error(`USDA Client: API failed: ${response.status}`);
      return { foods: [], totalHits: 0, currentPage: 1, totalPages: 0 };
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      // No results found
      return { foods: [], totalHits: 0, currentPage: 1, totalPages: 0 };
    }

    // Foods found
    
    return {
      foods: data.foods,
      totalHits: data.foods.length,
      currentPage: 1,
      totalPages: 1,
    };
  } catch (error) {
    console.error('USDA Client: Search error:', error);
    return { foods: [], totalHits: 0, currentPage: 1, totalPages: 0 };
  }
}

/**
 * Search and normalize USDA foods (via our API route)
 */
export async function searchAndNormalizeUSDA(query: string): Promise<NormalizedUSDAFood[]> {
  try {
    const response = await fetch(`/api/usda?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      console.error(`USDA Client: API failed: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      return [];
    }

    // Results are already normalized by the API route
    return data.foods;
  } catch (error) {
    console.error('USDA Client: Search error:', error);
    return [];
  }
}
