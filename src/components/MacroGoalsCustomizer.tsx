'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Settings, RotateCcw } from 'lucide-react';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { UserGoals } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface MacroGoalsCustomizerProps {
  connection: SupabaseConnection;
  userGoals: UserGoals | null;
}

interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

const PRESET_MACROS: Record<string, MacroPercentages> = {
  balanced: { protein: 30, carbs: 40, fat: 30 },
  highProtein: { protein: 40, carbs: 30, fat: 30 },
  lowCarb: { protein: 35, carbs: 20, fat: 45 },
  keto: { protein: 25, carbs: 5, fat: 70 },
  vegan: { protein: 20, carbs: 50, fat: 30 },
};

export function MacroGoalsCustomizer({ connection, userGoals }: MacroGoalsCustomizerProps) {
  const { language } = useLanguage();
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [macros, setMacros] = useState<MacroPercentages>(PRESET_MACROS.balanced);
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');

  useEffect(() => {
    if (userGoals) {
      const totalCalories = userGoals.daily_calorie_target || 2000;
      const proteinCals = (userGoals.protein_target_g || 0) * 4;
      const carbsCals = (userGoals.carbs_target_g || 0) * 4;
      const fatCals = (userGoals.fat_target_g || 0) * 9;
      const total = proteinCals + carbsCals + fatCals;

      if (total > 0) {
        setMacros({
          protein: Math.round((proteinCals / total) * 100),
          carbs: Math.round((carbsCals / total) * 100),
          fat: Math.round((fatCals / total) * 100),
        });
      }
    }
  }, [userGoals]);

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    setMacros(PRESET_MACROS[preset]);
  };

  const handleSliderChange = (macro: keyof MacroPercentages, value: number[]) => {
    const newValue = value[0];
    const others = Object.keys(macros).filter(k => k !== macro) as Array<keyof MacroPercentages>;
    
    const remaining = 100 - newValue;
    const otherTotal = others.reduce((sum, key) => sum + macros[key], 0);
    
    const newMacros = { ...macros, [macro]: newValue };
    
    if (otherTotal > 0) {
      others.forEach(key => {
        newMacros[key] = Math.round((macros[key] / otherTotal) * remaining);
      });
    } else {
      const split = remaining / others.length;
      others.forEach(key => {
        newMacros[key] = Math.round(split);
      });
    }
    
    // Adjust to ensure total is exactly 100
    const total = newMacros.protein + newMacros.carbs + newMacros.fat;
    if (total !== 100) {
      newMacros[others[0]] += (100 - total);
    }
    
    setMacros(newMacros);
    setSelectedPreset('custom');
  };

  const calculateGrams = (percentage: number): number => {
    if (!userGoals) return 0;
    
    const calories = ((userGoals.daily_calorie_target || 2000) * percentage) / 100;
    
    // Protein & Carbs: 4 cal/g, Fat: 9 cal/g
    if (percentage === macros.fat) {
      return Math.round(calories / 9);
    }
    return Math.round(calories / 4);
  };

  const saveMacros = async () => {
    if (!userGoals) return;

    const proteinG = calculateGrams(macros.protein);
    const carbsG = calculateGrams(macros.carbs);
    const fatG = calculateGrams(macros.fat);

    try {
      await connection.reducers.setUserGoals(
        userGoals.goal_type || 'maintainWeight',
        userGoals.target_weight_kg || 70,
        userGoals.daily_calorie_target || 2000,
        proteinG,
        carbsG,
        fatG
      );

      setShowDialog(false);
      alert('Makro hedefleri güncellendi! ✅');
    } catch (error) {
      console.error('Makrolar kaydedilirken hata:', error);
      alert('Makrolar kaydedilirken bir hata oluştu.');
    }
  };

  if (!userGoals) return null;

  const getPresetName = (key: string): string => {
    const names: Record<string, string> = {
      balanced: 'Dengeli',
      highProtein: 'Yüksek Protein',
      lowCarb: 'Düşük Karbonhidrat',
      keto: 'Ketojenik',
      vegan: 'Vegan',
      custom: 'Özel',
    };
    return names[key] || key;
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="w-full"
      >
        <Settings className="h-4 w-4 mr-2" />
        Makro Hedeflerini Özelleştir
      </Button>

      {showDialog && (
        <Dialog open onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Makro Hedeflerini Özelleştir</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Preset Templates */}
              <div>
                <Label className="mb-2 block">Hazır Şablonlar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(PRESET_MACROS).map((preset) => (
                    <Button
                      key={preset}
                      variant={selectedPreset === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className="text-xs"
                    >
                      {getPresetName(preset)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Current Distribution */}
              <Card className="border-2">
                <CardContent className="pt-4">
                  <div className="text-center mb-2">
                    <div className="text-sm text-gray-600 mb-2">{language === 'tr' ? 'Günlük Kalori' : 'Daily Calories'}: {userGoals.daily_calorie_target || 2000} kcal</div>
                    <div className="flex justify-center gap-4 text-xs">
                      <span className="text-green-600">🟢 Protein: {macros.protein}%</span>
                      <span className="text-blue-600">🔵 Karb: {macros.carbs}%</span>
                      <span className="text-yellow-600">🟡 Yağ: {macros.fat}%</span>
                    </div>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{ width: `${macros.protein}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${macros.carbs}%` }}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${macros.fat}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Protein Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Protein</Label>
                  <span className="text-sm font-bold text-green-600">
                    {macros.protein}% ({calculateGrams(macros.protein)}g)
                  </span>
                </div>
                <Slider
                  value={[macros.protein]}
                  onValueChange={(value) => handleSliderChange('protein', value)}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Carbs Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Karbonhidrat</Label>
                  <span className="text-sm font-bold text-blue-600">
                    {macros.carbs}% ({calculateGrams(macros.carbs)}g)
                  </span>
                </div>
                <Slider
                  value={[macros.carbs]}
                  onValueChange={(value) => handleSliderChange('carbs', value)}
                  min={5}
                  max={65}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Fat Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Yağ</Label>
                  <span className="text-sm font-bold text-yellow-600">
                    {macros.fat}% ({calculateGrams(macros.fat)}g)
                  </span>
                </div>
                <Slider
                  value={[macros.fat]}
                  onValueChange={(value) => handleSliderChange('fat', value)}
                  min={15}
                  max={75}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handlePresetSelect('balanced')}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Sıfırla
                </Button>
                <Button onClick={saveMacros} className="flex-1">
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
