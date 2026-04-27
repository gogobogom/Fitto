'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Apple, Pill, Droplet } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface NutritionData {
  // Vitamins
  vitaminA: number // µg
  vitaminC: number // mg
  vitaminD: number // µg
  vitaminE: number // mg
  vitaminK: number // µg
  vitaminB6: number // mg
  vitaminB12: number // µg
  folate: number // µg
  
  // Minerals
  calcium: number // mg
  iron: number // mg
  magnesium: number // mg
  potassium: number // mg
  sodium: number // mg
  zinc: number // mg
  
  // Others
  fiber: number // g
  cholesterol: number // mg
  omega3: number // g
  omega6: number // g
}

interface DailyGoals {
  vitaminA: number
  vitaminC: number
  vitaminD: number
  vitaminE: number
  vitaminK: number
  vitaminB6: number
  vitaminB12: number
  folate: number
  calcium: number
  iron: number
  magnesium: number
  potassium: number
  sodium: number
  zinc: number
  fiber: number
  cholesterol: number
  omega3: number
  omega6: number
}

const defaultGoals: DailyGoals = {
  vitaminA: 900, // µg
  vitaminC: 90, // mg
  vitaminD: 20, // µg
  vitaminE: 15, // mg
  vitaminK: 120, // µg
  vitaminB6: 1.3, // mg
  vitaminB12: 2.4, // µg
  folate: 400, // µg
  calcium: 1000, // mg
  iron: 18, // mg
  magnesium: 420, // mg
  potassium: 3500, // mg
  sodium: 2300, // mg (max)
  zinc: 11, // mg
  fiber: 30, // g
  cholesterol: 300, // mg (max)
  omega3: 1.6, // g
  omega6: 17, // g
}

export function DetailedNutrition() {
  const { language } = useLanguage();
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    vitaminA: 450,
    vitaminC: 60,
    vitaminD: 12,
    vitaminE: 8,
    vitaminK: 80,
    vitaminB6: 0.9,
    vitaminB12: 1.8,
    folate: 250,
    calcium: 650,
    iron: 12,
    magnesium: 280,
    potassium: 2200,
    sodium: 1800,
    zinc: 7,
    fiber: 18,
    cholesterol: 180,
    omega3: 1.2,
    omega6: 12,
  })

  useEffect(() => {
    const saved = localStorage.getItem('detailedNutrition')
    if (saved) {
      setNutritionData(JSON.parse(saved))
    }
  }, [])

  const calculatePercentage = (current: number, goal: number): number => {
    return Math.min((current / goal) * 100, 100)
  }

  const getStatusColor = (percentage: number): string => {
    if (percentage < 50) return 'text-red-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  const NutrientBar = ({ name, current, goal, unit }: { name: string; current: number; goal: number; unit: string }) => {
    const percentage = calculatePercentage(current, goal)
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{name}</span>
          <span className={`text-sm font-bold ${getStatusColor(percentage)}`}>
            {current.toFixed(1)} / {goal} {unit}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === 'tr' ? 'Detaylı Besin Değerleri' : 'Detailed Nutrition Values'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vitamins" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vitamins">
              <Apple className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Vitaminler' : 'Vitamins'}
            </TabsTrigger>
            <TabsTrigger value="minerals">
              <Pill className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Mineraller' : 'Minerals'}
            </TabsTrigger>
            <TabsTrigger value="others">
              <Droplet className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Diğer' : 'Others'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitamins" className="space-y-4 pt-4">
            <NutrientBar
              name="Vitamin A"
              current={nutritionData.vitaminA}
              goal={defaultGoals.vitaminA}
              unit="µg"
            />
            <NutrientBar
              name="Vitamin C"
              current={nutritionData.vitaminC}
              goal={defaultGoals.vitaminC}
              unit="mg"
            />
            <NutrientBar
              name="Vitamin D"
              current={nutritionData.vitaminD}
              goal={defaultGoals.vitaminD}
              unit="µg"
            />
            <NutrientBar
              name="Vitamin E"
              current={nutritionData.vitaminE}
              goal={defaultGoals.vitaminE}
              unit="mg"
            />
            <NutrientBar
              name="Vitamin K"
              current={nutritionData.vitaminK}
              goal={defaultGoals.vitaminK}
              unit="µg"
            />
            <NutrientBar
              name="Vitamin B6"
              current={nutritionData.vitaminB6}
              goal={defaultGoals.vitaminB6}
              unit="mg"
            />
            <NutrientBar
              name="Vitamin B12"
              current={nutritionData.vitaminB12}
              goal={defaultGoals.vitaminB12}
              unit="µg"
            />
            <NutrientBar
              name="Folat (B9)"
              current={nutritionData.folate}
              goal={defaultGoals.folate}
              unit="µg"
            />
          </TabsContent>

          <TabsContent value="minerals" className="space-y-4 pt-4">
            <NutrientBar
              name={language === 'tr' ? 'Kalsiyum' : 'Calcium'}
              current={nutritionData.calcium}
              goal={defaultGoals.calcium}
              unit="mg"
            />
            <NutrientBar
              name={language === 'tr' ? 'Demir' : 'Iron'}
              current={nutritionData.iron}
              goal={defaultGoals.iron}
              unit="mg"
            />
            <NutrientBar
              name={language === 'tr' ? 'Magnezyum' : 'Magnesium'}
              current={nutritionData.magnesium}
              goal={defaultGoals.magnesium}
              unit="mg"
            />
            <NutrientBar
              name={language === 'tr' ? 'Potasyum' : 'Potassium'}
              current={nutritionData.potassium}
              goal={defaultGoals.potassium}
              unit="mg"
            />
            <NutrientBar
              name={language === 'tr' ? 'Sodyum' : 'Sodium'}
              current={nutritionData.sodium}
              goal={defaultGoals.sodium}
              unit="mg"
            />
            <NutrientBar
              name={language === 'tr' ? 'Çinko' : 'Zinc'}
              current={nutritionData.zinc}
              goal={defaultGoals.zinc}
              unit="mg"
            />
          </TabsContent>

          <TabsContent value="others" className="space-y-4 pt-4">
            <NutrientBar
              name={language === 'tr' ? 'Lif' : 'Fiber'}
              current={nutritionData.fiber}
              goal={defaultGoals.fiber}
              unit="g"
            />
            <NutrientBar
              name={language === 'tr' ? 'Kolesterol (Max)' : 'Cholesterol (Max)'}
              current={nutritionData.cholesterol}
              goal={defaultGoals.cholesterol}
              unit="mg"
            />
            <NutrientBar
              name="Omega-3"
              current={nutritionData.omega3}
              goal={defaultGoals.omega3}
              unit="g"
            />
            <NutrientBar
              name="Omega-6"
              current={nutritionData.omega6}
              goal={defaultGoals.omega6}
              unit="g"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>{language === 'tr' ? 'Not:' : 'Note:'}</strong> {language === 'tr' ? 'Bu değerler örnek verilerdir. Gerçek uygulamada yiyecek veritabanından otomatik hesaplanacaktır.' : 'These are sample values. In the real app, they will be automatically calculated from the food database.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
