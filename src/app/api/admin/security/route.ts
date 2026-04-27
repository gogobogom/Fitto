import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data
    const metrics = {
      totalAttempts: 1523,
      failedLogins: 42,
      blockedIPs: 7,
      suspiciousActivity: 12,
      recentEvents: [
        {
          id: '1',
          type: 'Brute Force Attempt',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          severity: 'high' as const,
          timestamp: Date.now() - 30 * 60 * 1000,
        },
        {
          id: '2',
          type: 'Suspicious API Access',
          description: 'Unusual API request pattern detected from user user123',
          severity: 'medium' as const,
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
          id: '3',
          type: 'IP Blocked',
          description: 'IP 10.0.0.50 blocked due to rate limit violation',
          severity: 'low' as const,
          timestamp: Date.now() - 4 * 60 * 60 * 1000,
        },
        {
          id: '4',
          type: 'Password Reset Request',
          description: 'Unusual number of password reset requests from same IP',
          severity: 'medium' as const,
          timestamp: Date.now() - 6 * 60 * 60 * 1000,
        },
      ],
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Failed to fetch security metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
