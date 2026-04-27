import { NextResponse, type NextRequest } from 'next/server';

const mockBugs = [
  {
    id: '1',
    title: 'AI Coach not responding to meal queries',
    description: 'Users report that AI coach stops responding when asking about meal recommendations',
    severity: 'high' as const,
    status: 'open' as const,
    reportedBy: 'user@example.com',
    reportedAt: Date.now() - 2 * 60 * 60 * 1000,
    resolvedAt: null,
  },
  {
    id: '2',
    title: 'Calorie tracking incorrect for custom foods',
    description: 'Custom food items show wrong calorie calculations',
    severity: 'medium' as const,
    status: 'in-progress' as const,
    reportedBy: 'admin',
    reportedAt: Date.now() - 24 * 60 * 60 * 1000,
    resolvedAt: null,
  },
  {
    id: '3',
    title: 'Login button unresponsive on mobile',
    description: 'Login button does not respond to clicks on iOS Safari',
    severity: 'critical' as const,
    status: 'open' as const,
    reportedBy: 'test@example.com',
    reportedAt: Date.now() - 4 * 60 * 60 * 1000,
    resolvedAt: null,
  },
  {
    id: '4',
    title: 'Recipe images not loading',
    description: 'Recipe detail page shows broken image placeholders',
    severity: 'low' as const,
    status: 'resolved' as const,
    reportedBy: 'support@fitto.com',
    reportedAt: Date.now() - 48 * 60 * 60 * 1000,
    resolvedAt: Date.now() - 12 * 60 * 60 * 1000,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from database
    return NextResponse.json({ bugs: mockBugs });
  } catch (error: any) {
    console.error('Failed to fetch bugs:', error);
    return NextResponse.json({ error: 'Failed to fetch bugs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bugId, status } = await req.json();

    // TODO: Update in database
    // TODO: Log admin action in audit log

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update bug:', error);
    return NextResponse.json({ error: 'Failed to update bug' }, { status: 500 });
  }
}
