import { NextResponse, type NextRequest } from 'next/server';

// Mock announcements (replace with Supabase)
let announcements: any[] = [];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
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

    const { title, message, type, targetAudience } = await req.json();

    const newAnnouncement = {
      id: `ann_${Date.now()}`,
      title,
      message,
      type,
      targetAudience,
      isActive: true,
      createdAt: Date.now(),
    };

    announcements.push(newAnnouncement);

    // TODO: Save to Supabase
    // TODO: Log admin action

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
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

    announcements = announcements.filter((a) => a.id !== id);

    // TODO: Save to Supabase
    // TODO: Log admin action

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
