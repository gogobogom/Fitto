/**
 * AI BESLENME KOÇU API
 * 
 * Detaylı senaryo tabanlı AI koç sistemi
 * Gemini API için hazır - şimdilik kendi bilgi bankası kullanıyor
 */

import { NextRequest, NextResponse } from 'next/server';
import NutritionCoachEngine from '@/lib/aiNutritionCoach';
import { secureApiRoute, createErrorResponse, validateString, addSecurityHeaders } from '@/lib/apiSecurity';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 🔒 SECURITY: Comprehensive security checks
    const securityCheck = await secureApiRoute(request, {
      rateLimitType: 'AI_COACH',
      maxSize: 1024 * 100, // 100KB max for text
      requiredFields: ['message'],
    });

    if (!securityCheck.allowed) {
      return securityCheck.response!;
    }

    const body = securityCheck.body as Record<string, unknown>;
    const { message, userProfile } = body;

    // Validate and sanitize message
    const messageValidation = validateString(message, {
      minLength: 1,
      maxLength: 2000,
      fieldName: 'Message',
    });

    if (!messageValidation.valid) {
      return NextResponse.json(
        { error: messageValidation.error },
        { status: 400 }
      );
    }

    console.log('[AI Coach] Kullanıcı mesajı:', messageValidation.sanitized.substring(0, 50));

    // AI koç yanıtı oluştur
    const response = await NutritionCoachEngine.generatePersonalizedResponse(
      messageValidation.sanitized,
      userProfile as Record<string, unknown> | undefined
    );

    const successResponse = NextResponse.json({
      success: true,
      response,
      coach: {
        name: 'Dr. Ayşe Yılmaz',
        title: 'Uzman Diyetisyen',
      },
      timestamp: new Date().toISOString(),
    });

    return addSecurityHeaders(successResponse);

  } catch (error: unknown) {
    // 🔒 SECURITY: Sanitized error response (no internal details exposed)
    return createErrorResponse(error, 'AI koç yanıt verirken bir hata oluştu');
  }
}

// GET endpoint - Sağlık kontrolü
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'online',
    service: 'AI Nutrition Coach',
    version: '2.0.0',
    features: [
      'Senaryo tabanlı akıllı cevaplar',
      'Kişiselleştirilmiş beslenme tavsiyeleri',
      'Gemini API için hazır yapı',
    ],
  });
}
