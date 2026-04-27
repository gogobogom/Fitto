import { NextResponse, type NextRequest } from 'next/server';

// In-memory store (replace with Supabase later)
let maintenanceState = {
  isActive: false,
  message: "Platform is under maintenance. We'll be back soon!",
  estimatedMinutes: 60,
  startedAt: null as number | null,
};

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(maintenanceState);
  } catch (error: any) {
    console.error('Failed to fetch maintenance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
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

    const { isActive, message, estimatedMinutes } = await req.json();

    maintenanceState = {
      isActive,
      message,
      estimatedMinutes,
      startedAt: isActive ? Date.now() : null,
    };

    // TODO: Save to Supabase
    // TODO: Log admin action in audit log

    return NextResponse.json({ success: true, ...maintenanceState });
  } catch (error: any) {
    console.error('Failed to update maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}
