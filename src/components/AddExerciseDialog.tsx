'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Flame, Clock } from 'lucide-react';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddExerciseDialogProps {
  connection: SupabaseConnection;
  currentDate: string;
  onClose: () => void;
}

interface PresetExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  durationMin: number;
  met: number; // Metabolic Equivalent — used for kcal-burn estimation
}

/**
 * Compendium-of-Physical-Activities derived MET values.
 * https://en.wikipedia.org/wiki/Metabolic_equivalent_of_task
 *
 * Calories burned ≈ MET × user_weight_kg × duration_hours
 */
const PRESETS: PresetExercise[] = [
  // Strength training (compound lifts) — MET ≈ 6 for vigorous, 3.5 for light
  { name: 'Bench Press',     sets: 3, reps: 10, weightKg: 60,  durationMin: 15, met: 6.0 },
  { name: 'Squat',           sets: 3, reps: 10, weightKg: 80,  durationMin: 15, met: 6.0 },
  { name: 'Deadlift',        sets: 3, reps: 8,  weightKg: 100, durationMin: 15, met: 6.0 },
  { name: 'Barbell Row',     sets: 3, reps: 10, weightKg: 50,  durationMin: 12, met: 5.5 },
  { name: 'Overhead Press',  sets: 3, reps: 10, weightKg: 40,  durationMin: 10, met: 5.0 },
  { name: 'Pull-ups',        sets: 3, reps: 10, weightKg: 0,   durationMin: 10, met: 8.0 },
  { name: 'Dips',            sets: 3, reps: 12, weightKg: 0,   durationMin: 10, met: 6.0 },
  { name: 'Lunges',          sets: 3, reps: 12, weightKg: 0,   durationMin: 12, met: 5.0 },
  // Cardio (no sets/reps)
  { name: 'Running (8 km/h)',  sets: 0, reps: 0, weightKg: 0, durationMin: 30, met: 8.3 },
  { name: 'Cycling (moderate)', sets: 0, reps: 0, weightKg: 0, durationMin: 30, met: 7.5 },
  { name: 'Walking (brisk)',   sets: 0, reps: 0, weightKg: 0, durationMin: 30, met: 4.3 },
  { name: 'HIIT',              sets: 0, reps: 0, weightKg: 0, durationMin: 20, met: 9.0 },
];

const DEFAULT_USER_WEIGHT = 70;

/** kcal = MET × weight(kg) × duration(min) / 60 */
const estimateKcal = (met: number, userWeightKg: number, durationMin: number): number =>
  Math.round(met * userWeightKg * (durationMin / 60));

export function AddExerciseDialog({ connection, currentDate: _currentDate, onClose }: AddExerciseDialogProps) {
  const { language } = useLanguage();
  const { userProfile } = useSupabase();
  const t = (tr: string, en: string): string => (language === 'tr' ? tr : en);

  const userWeight = Number(userProfile?.weight_kg ?? DEFAULT_USER_WEIGHT);

  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [customExercise, setCustomExercise] = useState<string>('');
  const [sets, setSets] = useState<string>('3');
  const [reps, setReps] = useState<string>('10');
  const [weight, setWeight] = useState<string>('0');
  const [duration, setDuration] = useState<string>('15');
  const [met, setMet] = useState<number>(6.0);
  // When the user manually edits kcal we stop auto-recomputing
  const [calories, setCalories] = useState<string>('');
  const [caloriesTouched, setCaloriesTouched] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Auto-recompute kcal whenever inputs that drive the estimate change
  const autoKcal = useMemo<number>(() => {
    const dur = parseFloat(duration) || 0;
    return estimateKcal(met, userWeight, dur);
  }, [met, userWeight, duration]);

  useEffect(() => {
    if (!caloriesTouched) {
      setCalories(autoKcal > 0 ? String(autoKcal) : '');
    }
  }, [autoKcal, caloriesTouched]);

  const handleSelectExercise = (preset: PresetExercise): void => {
    setSelectedExercise(preset.name);
    setCustomExercise('');
    setSets(String(preset.sets));
    setReps(String(preset.reps));
    setWeight(String(preset.weightKg));
    setDuration(String(preset.durationMin));
    setMet(preset.met);
    setCaloriesTouched(false); // re-enable auto-calc on preset switch
  };

  const handleCaloriesChange = (val: string): void => {
    setCalories(val);
    setCaloriesTouched(val !== '');
  };

  const handleAdd = async (): Promise<void> => {
    const exerciseName = customExercise.trim() || selectedExercise;
    if (!exerciseName) return;

    const setsNum = parseInt(sets, 10) || 0;
    const repsNum = parseInt(reps, 10) || 0;
    const weightNum = parseFloat(weight) || 0;
    const durationNum = parseInt(duration, 10) || 0;
    const caloriesNum = parseFloat(calories) || 0;

    setSubmitting(true);
    try {
      await connection.reducers.addExercise(
        exerciseName,
        setsNum,
        repsNum,
        weightNum,
        durationNum > 0 ? durationNum : undefined,
        caloriesNum > 0 ? caloriesNum : undefined,
      );
      onClose();
    } catch (err) {
      console.error('Egzersiz eklenirken hata:', err);
      alert(t('Egzersiz eklenirken bir hata oluştu.', 'Failed to add exercise.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="add-exercise-dialog">
        <DialogHeader>
          <DialogTitle>{t('Egzersiz Ekle', 'Add Exercise')}</DialogTitle>
          <DialogDescription>
            {t('Bugünkü antrenmanınızı kaydedin', 'Record your workout for today')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Yaygın Egzersizler', 'Common Exercises')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectExercise(p)}
                  data-testid={`preset-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`p-3 border rounded-md hover:bg-gray-100 text-left ${
                    selectedExercise === p.name ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                >
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-gray-600">
                    {p.sets > 0
                      ? `${p.sets}×${p.reps}${p.weightKg > 0 ? ` @ ${p.weightKg}kg` : ''}`
                      : `${p.durationMin} ${t('dk', 'min')}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customExercise">{t('Özel Egzersiz', 'Custom Exercise')}</Label>
            <Input
              id="customExercise"
              data-testid="custom-exercise-input"
              value={customExercise}
              onChange={(e) => {
                setCustomExercise(e.target.value);
                setSelectedExercise('');
              }}
              placeholder={t('Kendi egzersizin adını yaz...', 'Type your own exercise...')}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="sets">{t('Set', 'Sets')}</Label>
              <Input
                id="sets"
                data-testid="sets-input"
                type="number"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">{t('Tekrar', 'Reps')}</Label>
              <Input
                id="reps"
                data-testid="reps-input"
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">{t('Ağırlık (kg)', 'Weight (kg)')}</Label>
              <Input
                id="weight"
                data-testid="weight-input"
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t('Süre (dk)', 'Duration (min)')}
              </Label>
              <Input
                id="duration"
                data-testid="duration-input"
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories" className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {t('Yakılan kcal', 'Calories burned')}
              </Label>
              <Input
                id="calories"
                data-testid="calories-burned-input"
                type="number"
                inputMode="numeric"
                value={calories}
                placeholder={autoKcal > 0 ? `~${autoKcal}` : '0'}
                onChange={(e) => handleCaloriesChange(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                {caloriesTouched
                  ? t('(elle düzenlendi)', '(manually edited)')
                  : t(
                      `Otomatik (MET ${met.toFixed(1)} × ${userWeight.toFixed(0)} kg × ${duration || 0} dk)`,
                      `Auto (MET ${met.toFixed(1)} × ${userWeight.toFixed(0)} kg × ${duration || 0} min)`,
                    )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1" data-testid="cancel-exercise-btn">
              {t('İptal', 'Cancel')}
            </Button>
            <Button
              onClick={() => void handleAdd()}
              disabled={(!selectedExercise && !customExercise.trim()) || submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              data-testid="add-exercise-submit-btn"
            >
              {submitting ? t('Ekleniyor...', 'Adding...') : t('Ekle', 'Add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
