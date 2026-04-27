'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X, Activity } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import type { Database } from '@/types/supabase';

type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row'];

interface ExerciseListProps {
  currentDate: Date;
  onExercisesChange?: () => void;
}

export function ExerciseList({ currentDate, onExercisesChange }: ExerciseListProps) {
  const { supabase } = useSupabase();
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);

  useEffect(() => {
    loadExercises();
    
    // Real-time subscription
    if (!supabase) return;

    const channel = supabase
      .channel('exercise_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_logs',
        },
        () => {
          loadExercises();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, supabase]);

  const loadExercises = async () => {
    if (!supabase) return;

    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('log_date', dateStr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Egzersizler alınırken hata:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh exercises
      await loadExercises();
      
      // Notify parent component
      if (onExercisesChange) {
        onExercisesChange();
      }
    } catch (error) {
      console.error('Egzersiz silinirken hata:', error);
      alert('Egzersiz silinirken bir hata oluştu.');
    }
  };

  if (exercises.length === 0) {
    return null;
  }

  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
  const totalMinutes = exercises.reduce((sum, ex) => sum + ex.duration_minutes, 0);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            <CardTitle className="text-xl">Egzersizlerim</CardTitle>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">{Math.round(totalCalories)} kcal</span>
            <span className="mx-1">·</span>
            <span>{Math.round(totalMinutes)} dk</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-start justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900 truncate">{exercise.exercise_name}</p>
                <span className="text-xs text-gray-500">({Math.round(exercise.duration_minutes)} dk)</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <span className="font-medium text-orange-600">
                  {Math.round(exercise.calories_burned)} kcal yakıldı
                </span>
              </div>
            </div>
            <Button
              onClick={() => handleDelete(exercise.id)}
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
