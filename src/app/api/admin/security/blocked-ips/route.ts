import { NextResponse, type NextRequest } from 'next/server';

const mockBlockedIPs = [
  {
    id: '1',
    ipAddress: '192.168.1.100',
    reason: 'Brute force attack',
    blockedAt: Date.now() - 48 * 60 * 60 * 1000,
    expiresAt: null,
  },
  {
    id: '2',
    ipAddress: '10.0.0.50',
    reason: 'Rate limit violation',
    blockedAt: Date.now() - 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  },
  {
    id: '3',
    ipAddress: '172.16.0.25',
    reason: 'Suspicious activity',
    blockedAt: Date.now() - 72 * 60 * 60 * 1000,
    expiresAt: null,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from database
    return NextResponse.json({ blockedIPs: mockBlockedIPs });
  } catch (error: any) {
    console.error('Failed to fetch blocked IPs:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked IPs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ipAddress, reason } = await req.json();

    // TODO: Save to database
    // TODO: Log admin action in audit log

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to block IP:', error);
    return NextResponse.json({ error: 'Failed to block IP' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // TODO: Delete from database
    // TODO: Log admin action in audit log

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to unblock IP:', error);
    return NextResponse.json({ error: 'Failed to unblock IP' }, { status: 500 });
  }
}
