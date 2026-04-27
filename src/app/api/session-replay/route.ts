import { NextRequest, NextResponse } from 'next/server';

interface SessionRecording {
  sessionId: string;
  userId: string;
  startTime: Date | string;
  endTime: Date | string | null;
  duration: number;
  events: Array<{
    id: string;
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
  }>;
  metadata: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
    language: string;
    timezone: string;
    referrer: string;
    url: string;
    pageTitle: string;
  };
  snapshots: Array<{
    id: string;
    timestamp: number;
    html: string;
    styles: string[];
  }>;
}

// In-memory storage for demo (in production, use database)
const sessionStore: Map<string, SessionRecording> = new Map();
const MAX_SESSIONS = 100;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as SessionRecording;
    
    if (!body.sessionId || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'Session ID and User ID required' },
        { status: 400 }
      );
    }

    // Limit stored data size
    const limitedRecording: SessionRecording = {
      sessionId: body.sessionId,
      userId: body.userId,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : null,
      duration: body.duration,
      events: body.events.slice(0, 5000), // Limit events
      metadata: body.metadata,
      snapshots: body.snapshots.slice(0, 5), // Limit snapshots
    };

    // Store session
    sessionStore.set(body.sessionId, limitedRecording);

    // Remove old sessions if over limit
    if (sessionStore.size > MAX_SESSIONS) {
      const oldest = Array.from(sessionStore.entries())
        .sort((a, b) => {
          const timeA = new Date(a[1].startTime).getTime();
          const timeB = new Date(b[1].startTime).getTime();
          return timeA - timeB;
        })[0];
      if (oldest) {
        sessionStore.delete(oldest[0]);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: body.sessionId,
      eventCount: limitedRecording.events.length,
    });
  } catch (error) {
    console.error('[Session Replay] Save error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get specific session
    if (sessionId) {
      const session = sessionStore.get(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        session,
      });
    }

    // List sessions
    let sessions = Array.from(sessionStore.values());

    if (userId) {
      sessions = sessions.filter((s) => s.userId === userId);
    }

    // Sort by start time descending
    sessions.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeB - timeA;
    });

    // Limit and summarize
    const summaries = sessions.slice(0, limit).map((session) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      duration: session.duration,
      eventCount: session.events.length,
      metadata: {
        url: session.metadata.url,
        userAgent: session.metadata.userAgent,
        screenWidth: session.metadata.screenWidth,
        screenHeight: session.metadata.screenHeight,
      },
    }));

    // Calculate stats
    const stats = {
      totalSessions: sessionStore.size,
      uniqueUsers: new Set(sessions.map((s) => s.userId)).size,
      avgDuration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0,
      avgEventCount: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.events.length, 0) / sessions.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      sessions: summaries,
      stats,
    });
  } catch (error) {
    console.error('[Session Replay] Get error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const deleted = sessionStore.delete(sessionId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Session deleted' : 'Session not found',
      });
    }

    // Clear all sessions
    sessionStore.clear();
    return NextResponse.json({
      success: true,
      message: 'All sessions cleared',
    });
  } catch (error) {
    console.error('[Session Replay] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
