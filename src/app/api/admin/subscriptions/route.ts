import { NextResponse, type NextRequest } from 'next/server';

// Mock data
const mockSubscriptions = [
  {
    id: '1',
    userId: '1',
    username: 'john_doe',
    email: 'user1@example.com',
    plan: 'premium' as const,
    status: 'active' as const,
    startDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    revenue: 29.99,
  },
  {
    id: '2',
    userId: '2',
    username: 'jane_smith',
    email: 'user2@example.com',
    plan: 'trial' as const,
    status: 'active' as const,
    startDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 9 * 24 * 60 * 60 * 1000,
    revenue: 0,
  },
  {
    id: '3',
    userId: '4',
    username: 'sarah_johnson',
    email: 'user4@example.com',
    plan: 'premium' as const,
    status: 'active' as const,
    startDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    revenue: 89.97,
  },
  {
    id: '4',
    userId: '5',
    username: 'mike_brown',
    email: 'user5@example.com',
    plan: 'premium' as const,
    status: 'cancelled' as const,
    startDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    revenue: 29.99,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from Supabase
    return NextResponse.json({ subscriptions: mockSubscriptions });
  } catch (error: any) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
