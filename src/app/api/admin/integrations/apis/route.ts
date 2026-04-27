import { NextResponse, type NextRequest } from 'next/server';

const mockAPIs = [
  {
    id: '1',
    name: 'OpenFoodFacts API',
    description: 'Food database and nutritional information',
    status: 'active' as const,
    endpoint: 'https://world.openfoodfacts.org/api/v2',
    lastSync: Date.now() - 2 * 60 * 60 * 1000,
    requestsToday: 342,
  },
  {
    id: '2',
    name: 'USDA FoodData Central',
    description: 'US Department of Agriculture food database',
    status: 'active' as const,
    endpoint: 'https://api.nal.usda.gov/fdc/v1',
    lastSync: Date.now() - 1 * 60 * 60 * 1000,
    requestsToday: 156,
  },
  {
    id: '3',
    name: 'Gemini AI API',
    description: 'AI nutrition coach powered by Google Gemini',
    status: 'active' as const,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    lastSync: Date.now() - 30 * 60 * 1000,
    requestsToday: 823,
  },
  {
    id: '4',
    name: 'Spoonacular API',
    description: 'Recipe search and meal planning',
    status: 'inactive' as const,
    endpoint: 'https://api.spoonacular.com',
    lastSync: null,
    requestsToday: 0,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from database
    return NextResponse.json({ apis: mockAPIs });
  } catch (error: any) {
    console.error('Failed to fetch APIs:', error);
    return NextResponse.json({ error: 'Failed to fetch APIs' }, { status: 500 });
  }
}
