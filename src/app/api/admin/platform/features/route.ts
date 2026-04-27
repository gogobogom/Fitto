import { NextResponse, type NextRequest } from 'next/server';

// Mock feature flags (replace with Supabase)
let features = [
  {
    key: 'meal_logging',
    name: 'Meal Logging',
    description: 'Basic meal tracking and calorie counting',
    enabled: true,
    rolloutPercentage: 100,
    category: 'core' as const,
  },
  {
    key: 'exercise_tracking',
    name: 'Exercise Tracking',
    description: 'Track workouts and physical activities',
    enabled: true,
    rolloutPercentage: 100,
    category: 'core' as const,
  },
  {
    key: 'barcode_scanner',
    name: 'Barcode Scanner',
    description: 'Scan food barcodes for quick logging',
    enabled: true,
    rolloutPercentage: 100,
    category: 'core' as const,
  },
  {
    key: 'ai_coach',
    name: 'AI Coach',
    description: 'Gemini-powered nutrition and fitness coaching',
    enabled: true,
    rolloutPercentage: 100,
    category: 'ai' as const,
  },
  {
    key: 'ai_meal_planner',
    name: 'AI Meal Planner',
    description: 'Generate personalized meal plans with AI',
    enabled: false,
    rolloutPercentage: 0,
    category: 'ai' as const,
  },
  {
    key: 'recipe_suggestions',
    name: 'Recipe Suggestions',
    description: 'AI-powered recipe recommendations',
    enabled: true,
    rolloutPercentage: 50,
    category: 'ai' as const,
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed nutrition and progress analytics',
    enabled: true,
    rolloutPercentage: 100,
    category: 'premium' as const,
  },
  {
    key: 'custom_meal_plans',
    name: 'Custom Meal Plans',
    description: 'Create and save custom meal planning templates',
    enabled: false,
    rolloutPercentage: 10,
    category: 'premium' as const,
  },
  {
    key: 'social_features',
    name: 'Social Features',
    description: 'Share progress and connect with other users',
    enabled: false,
    rolloutPercentage: 0,
    category: 'beta' as const,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ features });
  } catch (error: any) {
    console.error('Failed to fetch features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, enabled, rolloutPercentage } = await req.json();

    features = features.map((f) =>
      f.key === key
        ? {
            ...f,
            ...(enabled !== undefined && { enabled }),
            ...(rolloutPercentage !== undefined && { rolloutPercentage }),
          }
        : f
    );

    // TODO: Save to Supabase
    // TODO: Log admin action

    return NextResponse.json({ success: true, features });
  } catch (error: any) {
    console.error('Failed to update feature:', error);
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}
