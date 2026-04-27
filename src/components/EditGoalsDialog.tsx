'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentWeight?: number;
  onGoalsUpdated?: () => void;
}

interface GoalsData {
  goal_type: string;
  target_weight_kg: number;
  daily_calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

export function EditGoalsDialog({ open, onOpenChange, userId, currentWeight, onGoalsUpdated }: EditGoalsDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Form fields
  const [goalType, setGoalType] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [dailyCalories, setDailyCalories] = useState<string>('');
  const [proteinTarget, setProteinTarget] = useState<string>('');
  const [carbsTarget, setCarbsTarget] = useState<string>('');
  const [fatTarget, setFatTarget] = useState<string>('');

  // Load current goals
  useEffect(() => {
    if (open && userId) {
      void loadGoals();
    }
  }, [open, userId]);

  const loadGoals = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Hedefler yükleme hatası:', error);
        toast.error('Hedefler yüklenemedi');
        return;
      }

      if (data) {
        setGoalType(data.goal_type || '');
        setTargetWeight(data.target_weight_kg?.toString() || '');
        setDailyCalories(data.daily_calorie_target?.toString() || '');
        setProteinTarget(data.protein_target_g?.toString() || '');
        setCarbsTarget(data.carbs_target_g?.toString() || '');
        setFatTarget(data.fat_target_g?.toString() || '');
      } else {
        // Set defaults if no goals exist
        if (currentWeight) {
          setTargetWeight(currentWeight.toString());
          // Default protein: 2g per kg body weight
          setProteinTarget((currentWeight * 2).toFixed(1));
        }
        setDailyCalories('2000');
        setCarbsTarget('250');
        setFatTarget('65');
      }
    } catch (err) {
      console.error('Hedefler yükleme hatası:', err);
      toast.error('Hedefler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);

      // Validation
      if (!goalType) {
        toast.error('Hedef tipi seçiniz');
        return;
      }

      if (!targetWeight || parseFloat(targetWeight) < 1 || parseFloat(targetWeight) > 500) {
        toast.error('Geçerli bir hedef kilo giriniz (1-500 kg)');
        return;
      }

      if (!dailyCalories || parseInt(dailyCalories, 10) < 500 || parseInt(dailyCalories, 10) > 10000) {
        toast.error('Geçerli bir kalori hedefi giriniz (500-10000 kcal)');
        return;
      }

      const goalsData: Partial<GoalsData> = {
        goal_type: goalType,
        target_weight_kg: parseFloat(targetWeight),
        daily_calorie_target: parseInt(dailyCalories, 10),
        protein_target_g: parseFloat(proteinTarget) || 0,
        carbs_target_g: parseFloat(carbsTarget) || 0,
        fat_target_g: parseFloat(fatTarget) || 0,
      };

      const { error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          ...goalsData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Hedefler güncelleme hatası:', error);
        toast.error('Hedefler güncellenemedi: ' + error.message);
        return;
      }

      toast.success('✅ Hedefler başarıyla güncellendi!');
      onOpenChange(false);
      
      if (onGoalsUpdated) {
        onGoalsUpdated();
      }
    } catch (err) {
      console.error('Hedefler kaydetme hatası:', err);
      toast.error('Hedefler kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-doodle text-xl">
            🎯 Hedeflerini Düzenle
          </DialogTitle>
          <DialogDescription className="font-doodle-alt">
            Kilo ve beslenme hedeflerinizi güncelleyin
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Goal Type */}
            <div className="space-y-2">
              <Label htmlFor="goalType" className="font-doodle">
                Hedef Tipi *
              </Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger id="goalType" className="font-doodle-alt">
                  <SelectValue placeholder="Hedef seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loseWeight">Kilo Vermek</SelectItem>
                  <SelectItem value="maintainWeight">Kilomu Korumak</SelectItem>
                  <SelectItem value="gainWeight">Kilo Almak</SelectItem>
                  <SelectItem value="buildMuscle">Kas Yapmak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Weight */}
            <div className="space-y-2">
              <Label htmlFor="targetWeight" className="font-doodle">
                Hedef Kilo (kg) *
              </Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                min="1"
                max="500"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="70.0"
                className="font-doodle-alt"
              />
            </div>

            {/* Daily Calories */}
            <div className="space-y-2">
              <Label htmlFor="dailyCalories" className="font-doodle">
                Günlük Kalori Hedefi (kcal) *
              </Label>
              <Input
                id="dailyCalories"
                type="number"
                min="500"
                max="10000"
                value={dailyCalories}
                onChange={(e) => setDailyCalories(e.target.value)}
                placeholder="2000"
                className="font-doodle-alt"
              />
            </div>

            {/* Macros */}
            <div className="space-y-3">
              <h3 className="font-doodle font-semibold text-sm">Makro Hedefleri (opsiyonel)</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="font-doodle text-xs">
                    Protein (g)
                  </Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    min="0"
                    value={proteinTarget}
                    onChange={(e) => setProteinTarget(e.target.value)}
                    placeholder="150"
                    className="font-doodle-alt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs" className="font-doodle text-xs">
                    Karbonhidrat (g)
                  </Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbsTarget}
                    onChange={(e) => setCarbsTarget(e.target.value)}
                    placeholder="250"
                    className="font-doodle-alt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat" className="font-doodle text-xs">
                    Yağ (g)
                  </Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    min="0"
                    value={fatTarget}
                    onChange={(e) => setFatTarget(e.target.value)}
                    placeholder="65"
                    className="font-doodle-alt"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="font-doodle"
          >
            İptal
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={loading || saving}
            className="font-doodle"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
