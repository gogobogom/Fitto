/**
 * GÜNLÜK BESLENME PLANI API
 * 
 * Kullanıcı hedeflerine göre özelleştirilmiş günlük menü oluşturur
 * Gemini API için hazır - şimdilik akıllı template sistemi
 */

import { NextRequest, NextResponse } from 'next/server';

interface MealPlanRequest {
  goal: 'weightLoss' | 'muscleGain' | 'maintain';
  activityLevel: 'sedentary' | 'moderate' | 'active';
  dietary: 'omnivore' | 'vegetarian' | 'vegan';
  meals: number; // 3 veya 5
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MealPlanRequest = await request.json();
    const { goal, activityLevel, dietary, meals } = body;

    console.log('[Meal Planner] Plan oluşturuluyor:', { goal, activityLevel, dietary, meals });

    // Kalori hesaplama
    const baseCalories = activityLevel === 'sedentary' ? 1800 : 
                        activityLevel === 'moderate' ? 2200 : 2600;
    
    const goalCalories = goal === 'weightLoss' ? baseCalories - 400 :
                        goal === 'muscleGain' ? baseCalories + 300 : baseCalories;

    // Örnek beslenme planı (akıllı template)
    const mealPlan = {
      success: true,
      dailyCalories: goalCalories,
      macros: {
        protein: goal === 'muscleGain' ? 180 : 120,
        carbs: goal === 'weightLoss' ? 150 : 200,
        fat: 60,
      },
      meals: meals === 5 ? [
        {
          time: '08:00',
          name: 'Kahvaltı',
          foods: ['3 yumurta (omlet)', 'Yulaf (50g)', 'Fındık (30g)', 'Yeşil çay'],
          calories: Math.round(goalCalories * 0.25),
          protein: 25,
          carbs: 45,
          fat: 18,
        },
        {
          time: '11:00',
          name: 'Ara Öğün 1',
          foods: ['Yoğurt (200g)', 'Meyve (elma/muz)', 'Badem (15g)'],
          calories: Math.round(goalCalories * 0.15),
          protein: 15,
          carbs: 30,
          fat: 8,
        },
        {
          time: '14:00',
          name: 'Öğle Yemeği',
          foods: ['Izgara tavuk (200g)', 'Bulgur pilavı (1 kase)', 'Salata', 'Zeytinyağı (1 yemek kaşığı)'],
          calories: Math.round(goalCalories * 0.30),
          protein: 45,
          carbs: 50,
          fat: 15,
        },
        {
          time: '17:00',
          name: 'Ara Öğün 2',
          foods: ['Protein tozu (1 scoop)', 'Muz', 'Fıstık ezmesi (1 yemek kaşığı)'],
          calories: Math.round(goalCalories * 0.15),
          protein: 30,
          carbs: 35,
          fat: 10,
        },
        {
          time: '20:00',
          name: 'Akşam Yemeği',
          foods: ['Somon (150g)', 'Brokoli (buharda)', 'Tatlı patates (150g)'],
          calories: Math.round(goalCalories * 0.25),
          protein: 35,
          carbs: 40,
          fat: 12,
        },
      ] : [
        {
          time: '08:00',
          name: 'Kahvaltı',
          foods: ['3 yumurta', 'Yulaf', 'Meyve', 'Fındık', 'Yeşil çay'],
          calories: Math.round(goalCalories * 0.30),
        },
        {
          time: '14:00',
          name: 'Öğle Yemeği',
          foods: ['Izgara tavuk/balık', 'Esmer pirinç', 'Bol salata'],
          calories: Math.round(goalCalories * 0.40),
        },
        {
          time: '20:00',
          name: 'Akşam Yemeği',
          foods: ['Protein kaynağı', 'Sebze yemeği', 'Yoğurt'],
          calories: Math.round(goalCalories * 0.30),
        },
      ],
      waterIntake: '2.5-3 litre/gün',
      tips: [
        goal === 'weightLoss' ? '💡 Her öğüne protein ekle, tokluk hissi sağlar' : 
        goal === 'muscleGain' ? '💡 Antrenman sonrası 30 dakika içinde protein al' :
        '💡 Düzenli öğünlerle metabolizmayı dengede tut',
        '💧 Bol su iç (açlık hissini azaltır)',
        '🥗 Sebze tüketimini artır',
        dietary === 'vegan' ? '🌱 B12 takviyesi almayı unutma' : '',
      ].filter(Boolean),
    };

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme

    return NextResponse.json(mealPlan);

  } catch (error: unknown) {
    console.error('[Meal Planner] Hata:', error);
    
    return NextResponse.json(
      { 
        error: 'Beslenme planı oluşturulurken bir hata oluştu',
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
    service: 'AI Meal Planner',
    version: '2.0.0',
    note: 'Akıllı template sistemi - Gemini API için hazır',
  });
}
