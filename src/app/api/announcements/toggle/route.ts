/**
 * DUYURU TOGGLE API
 * 
 * Duyuruyu aktif/pasif yapar
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementsStore } from '@/lib/maintenanceStore';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Duyuru ID gerekli' },
        { status: 400 }
      );
    }

    const announcement = AnnouncementsStore.toggle(id);

    if (!announcement) {
      return NextResponse.json(
        { error: 'Duyuru bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: announcement.active ? 'Duyuru aktif edildi' : 'Duyuru devre dışı bırakıldı',
    });

  } catch (error: unknown) {
    console.error('[Announcements Toggle API] error:', error);
    return NextResponse.json(
      { error: 'Duyuru toggle edilemedi' },
      { status: 500 }
    );
  }
}
