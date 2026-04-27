import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Note: Session verification is handled client-side via localStorage
    // This API returns mock data for demo purposes

    // Mock data (will be replaced with Supabase)
    const stats = {
      totalMessages: 15234,
      messagesThisMonth: 4523,
      activeUsers: 342,
      averagePerUser: 13.2,
      topFeatures: [
        { name: 'Meal Planning', count: 3421 },
        { name: 'Nutrition Advice', count: 2856 },
        { name: 'Recipe Suggestions', count: 2134 },
        { name: 'Calorie Analysis', count: 1823 },
        { name: 'Diet Tips', count: 1456 },
      ],
      dailyUsage: [
        { date: '2025-01-24', count: 645 },
        { date: '2025-01-25', count: 712 },
        { date: '2025-01-26', count: 598 },
        { date: '2025-01-27', count: 834 },
        { date: '2025-01-28', count: 721 },
        { date: '2025-01-29', count: 689 },
        { date: '2025-01-30', count: 456 },
      ],
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Failed to fetch AI usage stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
