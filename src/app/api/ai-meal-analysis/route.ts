/**
 * YEMEK ANALİZİ API (Görüntü Tabanlı)
 * 
 * Yemek fotoğrafını analiz edip besin değerlerini tahmin eder
 * Şimdilik mock data - Gemini Vision API için hazır yapı
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createErrorResponse, addSecurityHeaders, validateRequestSize, REQUEST_SIZE_LIMITS } from '@/lib/apiSecurity';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 🔒 SECURITY: Rate limiting for AI endpoints
    const rateLimitCheck = checkRateLimit(request, 'AI_ANALYSIS');
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    // 🔒 SECURITY: Check file upload size (10MB max)
    const sizeCheck = await validateRequestSize(request, REQUEST_SIZE_LIMITS.FORM_DATA);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: sizeCheck.error },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json(
        { error: 'Fotoğraf yüklenmedi' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Validate image file
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Sadece JPEG, PNG ve WebP formatı destekleniyor' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Check file size (5MB max per file)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'tan küçük olmalı' },
        { status: 400 }
      );
    }

    console.log('[Meal Analysis] Fotoğraf alındı, analiz başlıyor...');

    // TODO: Gemini Vision API entegrasyonu
    // Şimdilik mock analiz sonucu dönüyoruz
    
    const mockAnalysis = {
      success: true,
      meal: {
        name: 'Tavuklu Salata',
        description: 'Izgara tavuk göğsü, yeşillik, domates, salatalık',
        confidence: 0.85,
      },
      nutrition: {
        calories: 350,
        protein: 42,
        carbs: 18,
        fat: 12,
        fiber: 6,
      },
      healthScore: 8.5,
      recommendations: [
        '✅ Harika bir protein kaynağı',
        '✅ Düşük kalorili ve doyurucu',
        '💡 Yanına 1 dilim tam buğday ekmeği ekleyebilirsin',
        '💡 Zeytinyağı ile lezzet katabilirsin',
      ],
      portionSize: 'Orta porsiyon (~300g)',
    };

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simüle edilmiş gecikme

    const successResponse = NextResponse.json(mockAnalysis);
    return addSecurityHeaders(successResponse);

  } catch (error: unknown) {
    // 🔒 SECURITY: Sanitized error response (no internal details exposed)
    return createErrorResponse(error, 'Yemek analizi yapılırken bir hata oluştu');
  }
}

// GET endpoint - Sağlık kontrolü
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'online',
    service: 'AI Meal Analysis',
    version: '2.0.0',
    note: 'Mock data kullanılıyor - Gemini Vision API için hazır',
  });
}
