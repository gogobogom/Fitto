'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface AddExerciseDialogProps {
  connection: SupabaseConnection;
  currentDate: string;
  onClose: () => void;
}

const commonExercises: Array<{ name: string; sets: number; reps: number; weightKg: number }> = [
  { name: 'Bench Press', sets: 3, reps: 10, weightKg: 60 },
  { name: 'Squat', sets: 3, reps: 10, weightKg: 80 },
  { name: 'Deadlift', sets: 3, reps: 8, weightKg: 100 },
  { name: 'Barbell Row', sets: 3, reps: 10, weightKg: 50 },
  { name: 'Overhead Press', sets: 3, reps: 10, weightKg: 40 },
  { name: 'Pull-ups', sets: 3, reps: 10, weightKg: 0 },
  { name: 'Dips', sets: 3, reps: 12, weightKg: 0 },
  { name: 'Lunges', sets: 3, reps: 12, weightKg: 0 },
];

export function AddExerciseDialog({ connection, currentDate, onClose }: AddExerciseDialogProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [customExercise, setCustomExercise] = useState<string>('');
  const [sets, setSets] = useState<string>('3');
  const [reps, setReps] = useState<string>('10');
  const [weight, setWeight] = useState<string>('0');

  const handleSelectExercise = (name: string, defaultSets: number, defaultReps: number, defaultWeight: number): void => {
    setSelectedExercise(name);
    setCustomExercise('');
    setSets(defaultSets.toString());
    setReps(defaultReps.toString());
    setWeight(defaultWeight.toString());
  };

  const handleAddExercise = async (): Promise<void> => {
    const exerciseName = customExercise || selectedExercise;
    if (!exerciseName) return;

    const setsNum = parseFloat(sets) || 0;
    const repsNum = parseFloat(reps) || 0;
    const weightNum = parseFloat(weight) || 0;

    if (setsNum <= 0 || repsNum <= 0) return;

    try {
      await connection.reducers.addExercise(exerciseName, setsNum, repsNum, weightNum);
      onClose();
    } catch (error) {
      console.error('Egzersiz eklenirken hata:', error);
      alert('Egzersiz eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Egzersiz Ekle</DialogTitle>
          <DialogDescription>Bugünkü antrenmanınızı kaydedin</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Yaygın Egzersizler</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonExercises.map((exercise) => (
                <button
                  key={exercise.name}
                  onClick={() => handleSelectExercise(exercise.name, exercise.sets, exercise.reps, exercise.weightKg)}
                  className={`p-3 border rounded-md hover:bg-gray-100 text-left ${
                    selectedExercise === exercise.name ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                >
                  <div className="font-medium text-sm">{exercise.name}</div>
                  <div className="text-xs text-gray-600">
                    {exercise.sets}x{exercise.reps} {exercise.weightKg > 0 ? `@ ${exercise.weightKg}kg` : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customExercise">Özel Egzersiz</Label>
            <Input
              id="customExercise"
              value={customExercise}
              onChange={(e) => {
                setCustomExercise(e.target.value);
                setSelectedExercise('');
              }}
              placeholder="Kendi egzersizin adını yaz..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="sets">Set</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reps">Tekrar</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Ağırlık (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              İptal
            </Button>
            <Button
              onClick={handleAddExercise}
              disabled={!selectedExercise && !customExercise}
              className="flex-1"
            >
              Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
