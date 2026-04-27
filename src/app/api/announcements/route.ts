/**
 * DUYURU YÖNETİMİ API
 * 
 * Admin panelinden duyuruları yönetir
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementsStore, type Announcement } from '@/lib/maintenanceStore';

// GET - Tüm duyuruları getir veya sadece aktif olanları
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const announcements = activeOnly 
      ? AnnouncementsStore.getActive()
      : AnnouncementsStore.getAll();

    return NextResponse.json({
      success: true,
      announcements,
      count: announcements.length,
    });

  } catch (error: unknown) {
    console.error('[Announcements API] GET error:', error);
    return NextResponse.json(
      { error: 'Duyurular alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni duyuru oluştur
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: Omit<Announcement, 'id' | 'createdAt'> = await request.json();

    // Validation
    if (!body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Eksik alanlar: title, message, type zorunludur' },
        { status: 400 }
      );
    }

    const newAnnouncement = AnnouncementsStore.create(body);

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      message: 'Duyuru başarıyla oluşturuldu',
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('[Announcements API] POST error:', error);
    return NextResponse.json(
      { error: 'Duyuru oluşturulamadı' },
      { status: 500 }
    );
  }
}

// PUT - Duyuru güncelle
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Duyuru ID gerekli' },
        { status: 400 }
      );
    }

    const updatedAnnouncement = AnnouncementsStore.update(id, updates);

    if (!updatedAnnouncement) {
      return NextResponse.json(
        { error: 'Duyuru bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement: updatedAnnouncement,
      message: 'Duyuru başarıyla güncellendi',
    });

  } catch (error: unknown) {
    console.error('[Announcements API] PUT error:', error);
    return NextResponse.json(
      { error: 'Duyuru güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Duyuru sil
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Duyuru ID gerekli' },
        { status: 400 }
      );
    }

    const deleted = AnnouncementsStore.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Duyuru bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Duyuru başarıyla silindi',
    });

  } catch (error: unknown) {
    console.error('[Announcements API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Duyuru silinemedi' },
      { status: 500 }
    );
  }
}
