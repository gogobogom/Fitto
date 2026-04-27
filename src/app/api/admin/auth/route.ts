import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkpsimlalongfpjwovtx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHNpbWxhbG9uZ2ZwandvdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDUwMzksImV4cCI6MjA4MTIyMTAzOX0.IqchXHB41UkhmsDU4F5uaL95yj2j2KiCRUxZocze-BU';

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // Check if user is admin in database
    const { data: adminData, error } = await supabaseAdmin
      .from('admin_users')
      .select('identity, role, status')
      .eq('identity', userId)
      .eq('status', 'active')
      .single();

    if (error || !adminData) {
      console.warn(`[SECURITY] Admin check failed for user: ${userId}`);
      return NextResponse.json(
        { error: 'Bu kullanıcı admin değil' },
        { status: 403 }
      );
    }

    console.log(`[SECURITY] Admin verified: ${userId}, Role: ${adminData.role}`);

    return NextResponse.json({
      success: true,
      admin: {
        identity: adminData.identity,
        role: adminData.role,
        status: adminData.status,
      },
    });
  } catch (error) {
    console.error('[SECURITY] Admin auth error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get user ID from header or query
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: adminData, error } = await supabaseAdmin
      .from('admin_users')
      .select('identity, role, status')
      .eq('identity', userId)
      .eq('status', 'active')
      .single();

    if (error || !adminData) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      role: adminData.role,
    });
  } catch (error) {
    console.error('[SECURITY] Admin check error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  // Logout - handled by Supabase client-side
  return NextResponse.json({ success: true });
}
