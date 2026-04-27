/**
 * BAKIM MODU YÖNETİMİ API
 * 
 * Admin panelinden bakım modunu kontrol eder
 */

import { NextRequest, NextResponse } from 'next/server';
import { MaintenanceStore } from '@/lib/maintenanceStore';

// GET - Bakım modu durumunu getir
export async function GET(): Promise<NextResponse> {
  try {
    const maintenanceMode = MaintenanceStore.get();
    return NextResponse.json({
      success: true,
      maintenance: maintenanceMode,
    });
  } catch (error: unknown) {
    console.error('[Maintenance API] GET error:', error);
    return NextResponse.json(
      { error: 'Bakım modu bilgisi alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Bakım modunu güncelle
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { enabled, message, estimatedEnd, features, affectedSections } = body;

    if (enabled === true) {
      MaintenanceStore.enable(message, estimatedEnd, features);
    } else if (enabled === false) {
      MaintenanceStore.disable();
    } else {
      MaintenanceStore.set({ message, estimatedEnd, features, affectedSections });
    }

    const updatedMode = MaintenanceStore.get();

    return NextResponse.json({
      success: true,
      maintenance: updatedMode,
      message: enabled ? 'Bakım modu aktif edildi' : 'Bakım modu devre dışı bırakıldı',
    });

  } catch (error: unknown) {
    console.error('[Maintenance API] POST error:', error);
    return NextResponse.json(
      { error: 'Bakım modu güncellenemedi' },
      { status: 500 }
    );
  }
}
