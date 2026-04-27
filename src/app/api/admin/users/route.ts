import { NextResponse, type NextRequest } from 'next/server';

// Mock data (will be replaced with Supabase)
const mockUsers = [
  {
    id: '1',
    email: 'user1@example.com',
    username: 'john_doe',
    subscriptionType: 'premium' as const,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 2 * 60 * 60 * 1000,
    isActive: true,
  },
  {
    id: '2',
    email: 'user2@example.com',
    username: 'jane_smith',
    subscriptionType: 'trial' as const,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 5 * 60 * 60 * 1000,
    isActive: true,
  },
  {
    id: '3',
    email: 'user3@example.com',
    username: 'alex_wilson',
    subscriptionType: 'free' as const,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 24 * 60 * 60 * 1000,
    isActive: true,
  },
  {
    id: '4',
    email: 'user4@example.com',
    username: 'sarah_johnson',
    subscriptionType: 'premium' as const,
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 1 * 60 * 60 * 1000,
    isActive: true,
  },
  {
    id: '5',
    email: 'banned@example.com',
    username: 'banned_user',
    subscriptionType: 'free' as const,
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 72 * 60 * 60 * 1000,
    isActive: false,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from Supabase
    return NextResponse.json({ users: mockUsers });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, isActive } = await req.json();

    // TODO: Update in Supabase
    // TODO: Log admin action in audit log

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
