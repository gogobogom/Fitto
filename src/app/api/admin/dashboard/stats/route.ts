import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Note: Session verification is handled client-side via localStorage
    // This API returns mock data for demo purposes

    // TODO: Fetch real stats from Supabase
    // For now, return mock data
    const stats = {
      totalUsers: 1247,
      activeSubscriptions: 342,
      aiMessagesToday: 1523,
      revenueThisMonth: 12450,
      userGrowth: 23,
      systemHealth: 'healthy' as const,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
