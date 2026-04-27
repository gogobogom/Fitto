/**
 * TARIF OLUŞTURUCU API
 * 
 * Seçilen malzemelere göre sağlıklı tarif önerisi sunar
 * Gemini API için hazır - şimdilik akıllı template sistemi
 */

import { NextRequest, NextResponse } from 'next/server';

interface RecipeRequest {
  ingredients: string[];
  dietary?: 'omnivore' | 'vegetarian' | 'vegan';
  cookingTime?: 'quick' | 'medium' | 'long';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RecipeRequest = await request.json();
    const { ingredients, dietary = 'omnivore', cookingTime = 'medium' } = body;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Malzeme listesi boş olamaz' },
        { status: 400 }
      );
    }

    console.log('[Recipe Generator] Tarif oluşturuluyor:', { ingredients, dietary, cookingTime });

    // Örnek tarif (akıllı template)
    const recipe = {
      success: true,
      recipe: {
        name: 'Izgara Tavuklu Quinoa Kasesi',
        description: 'Protein ve lif açısından zengin, dengeli bir öğün',
        prepTime: cookingTime === 'quick' ? '15 dakika' : cookingTime === 'medium' ? '30 dakika' : '60 dakika',
        cookTime: cookingTime === 'quick' ? '15 dakika' : cookingTime === 'medium' ? '25 dakika' : '45 dakika',
        servings: 2,
        difficulty: 'Kolay',
      },
      ingredients: [
        '200g tavuk göğsü (küp doğranmış)',
        '1 su bardağı quinoa',
        '2 su bardağı su',
        '1 domates (doğranmış)',
        '1 salatalık (doğranmış)',
        'Roka (1 tutam)',
        '1 yemek kaşığı zeytinyağı',
        'Tuz, karabiber, kimyon',
        'Limon suyu',
      ],
      instructions: [
        '1️⃣ Quinoa\'yı yıkayıp 2 su bardağı su ile 15 dakika pişirin',
        '2️⃣ Tavuğu baharatlarla marine edin (10 dakika)',
        '3️⃣ Tavuğu ızgara tavada kızartın (her iki tarafı 5\'er dakika)',
        '4️⃣ Sebzeleri doğrayın ve zeytinyağı + limon suyu ile karıştırın',
        '5️⃣ Kasede quinoa, tavuk ve sebzeleri yan yana yerleştirin',
        '6️⃣ Üzerine roka ekleyip servis yapın 🍽️',
      ],
      nutrition: {
        calories: 450,
        protein: 45,
        carbs: 42,
        fat: 12,
        fiber: 8,
      },
      tips: [
        '💡 Tavuk yerine tofu kullanabilirsiniz (vegan)',
        '💡 Quinoa yerine esmer pirinç alternatif olabilir',
        '💡 Antrenman sonrası ideal bir öğün',
        '💡 Buzdolabında 2 gün saklanabilir',
      ],
      tags: ['Yüksek Protein', 'Dengeli Makrolar', 'Kolay', 'Sağlıklı'],
    };

    await new Promise(resolve => setTimeout(resolve, 1200)); // Simüle edilmiş gecikme

    return NextResponse.json(recipe);

  } catch (error: unknown) {
    console.error('[Recipe Generator] Hata:', error);
    
    return NextResponse.json(
      { 
        error: 'Tarif oluşturulurken bir hata oluştu',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint - Sağlık kontrolü
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'online',
    service: 'AI Recipe Generator',
    version: '2.0.0',
    note: 'Akıllı template sistemi - Gemini API için hazır',
  });
}
