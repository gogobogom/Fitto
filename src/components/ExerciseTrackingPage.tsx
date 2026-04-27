'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { X, Activity, TrendingUp, Clock, Flame, Star, Calendar, BarChart3, Plus, Award } from 'lucide-react';
import { DoodleImage } from './DoodleImage';
import type { ExerciseLog } from '@/types/supabase';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface ExerciseTrackingPageProps {
  connection: SupabaseConnection;
  currentDate: string;
  onAddExercise: () => void;
}

interface ExerciseStats {
  totalCalories: number;
  totalMinutes: number;
  exerciseCount: number;
  avgCaloriesPerSession: number;
  mostFrequentExercise: string;
}

interface DailyExerciseData {
  date: string;
  calories: number;
  minutes: number;
}

export function ExerciseTrackingPage({ connection, currentDate, onAddExercise }: ExerciseTrackingPageProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseLog[]>([]);

  // Load favorite exercises from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoriteExercises');
    if (saved) {
      setFavoriteExercises(JSON.parse(saved));
    }
  }, []);

  // Load exercises from Supabase
  useEffect(() => {
    const loadExercises = async (): Promise<void> => {
      if (!connection) return;
      
      try {
        const { data, error } = await connection.supabase
          .from('exercises')
          .select('*')
          .eq('user_id', connection.userId)
          .order('date', { ascending: false });

        if (error) {
          console.error('Error loading exercises:', error);
          return;
        }

        if (data) {
          setAllExercises(data as ExerciseLog[]);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };

    loadExercises();
  }, [connection]);

  // Today's exercises
  const todayExercises = useMemo(() => {
    return allExercises.filter((exercise: ExerciseLog) => exercise.date === currentDate);
  }, [allExercises, currentDate]);

  // Calculate period stats
  const periodStats = useMemo((): ExerciseStats => {
    let filteredExercises = allExercises;
    
    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filteredExercises = allExercises.filter((ex: ExerciseLog) => ex.date && ex.date >= weekAgoStr);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      filteredExercises = allExercises.filter((ex: ExerciseLog) => ex.date && ex.date >= monthAgoStr);
    }

    // Mock calorie calculation - would need proper calculation based on exercise type
    const totalCalories = filteredExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * (ex.reps || 0) * 5), 0);
    const totalMinutes = filteredExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * 3), 0);
    const exerciseCount = filteredExercises.length;

    // Find most frequent exercise
    const exerciseFrequency: Record<string, number> = {};
    filteredExercises.forEach((ex: ExerciseLog) => {
      exerciseFrequency[ex.exercise_name] = (exerciseFrequency[ex.exercise_name] || 0) + 1;
    });
    const mostFrequent = Object.entries(exerciseFrequency).sort((a, b) => b[1] - a[1])[0];

    return {
      totalCalories,
      totalMinutes,
      exerciseCount,
      avgCaloriesPerSession: exerciseCount > 0 ? totalCalories / exerciseCount : 0,
      mostFrequentExercise: mostFrequent ? mostFrequent[0] : '-',
    };
  }, [allExercises, selectedPeriod]);

  // Chart data for last 7 days
  const chartData = useMemo((): DailyExerciseData[] => {
    const days: DailyExerciseData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      const isoDateStr = date.toISOString().split('T')[0];
      
      const dayExercises = allExercises.filter((ex: ExerciseLog) => ex.date === isoDateStr);

      days.push({
        date: dateStr,
        calories: dayExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * (ex.reps || 0) * 5), 0),
        minutes: dayExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * 3), 0),
      });
    }
    return days;
  }, [allExercises]);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const { error } = await connection.supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting exercise:', error);
        alert('Egzersiz silinirken bir hata oluştu.');
        return;
      }

      // Remove from local state
      setAllExercises((prev: ExerciseLog[]) => prev.filter((ex: ExerciseLog) => ex.id !== id));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Egzersiz silinirken bir hata oluştu.');
    }
  };

  const toggleFavorite = (exerciseName: string): void => {
    const updated = favoriteExercises.includes(exerciseName)
      ? favoriteExercises.filter((name: string) => name !== exerciseName)
      : [...favoriteExercises, exerciseName];
    setFavoriteExercises(updated);
    localStorage.setItem('favoriteExercises', JSON.stringify(updated));
  };

  const maxCaloriesInChart = Math.max(...chartData.map((d: DailyExerciseData) => d.calories), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24 pt-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md mb-2">{t('exercise.title')}</h1>
              <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('exercise.description')}</p>
            </div>
            <Button onClick={onAddExercise} className="bg-white text-orange-600 hover:bg-gray-100 shadow-lg font-bold">
              <Plus className="h-4 w-4 mr-1" />
              {t('exercise.add')}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur">
          <TabsTrigger value="today">{t('exercise.today')}</TabsTrigger>
          <TabsTrigger value="stats">{t('exercise.stats')}</TabsTrigger>
          <TabsTrigger value="history">{t('exercise.history')}</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-4">
          {/* Today's Summary */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                {t('exercise.todaySummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                  <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(todayExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * (ex.reps || 0) * 5), 0))}
                  </div>
                  <div className="text-xs text-gray-600">{t('exercise.caloriesBurned')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                  <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(todayExercises.reduce((sum: number, ex: ExerciseLog) => sum + ((ex.sets || 0) * 3), 0))}
                  </div>
                  <div className="text-xs text-gray-600">{t('exercise.minutes')}</div>
                </div>
              </div>

              {/* Weekly Goal Progress */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t('exercise.weeklyGoal')}</span>
                  <span className="text-xs text-gray-600">
                    {Math.round(periodStats.totalMinutes)} / 150 dk
                  </span>
                </div>
                <Progress value={(periodStats.totalMinutes / 150) * 100} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">
                  {t('exercise.weeklyGoalDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Today's Exercises */}
          {todayExercises.length > 0 ? (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">{t('exercise.todayExercises')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayExercises.map((exercise: ExerciseLog) => (
                  <div
                    key={exercise.id}
                    className="flex items-start justify-between p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-3 flex-1">
                      <div className="mt-1">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{exercise.exercise_name}</p>
                          <button
                            onClick={() => toggleFavorite(exercise.exercise_name)}
                            className="ml-auto"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                favoriteExercises.includes(exercise.exercise_name)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {exercise.sets} x {exercise.reps}
                          </Badge>
                          {exercise.weight && (
                            <Badge variant="secondary" className="text-xs">
                              {exercise.weight} kg
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(exercise.id)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DoodleImage character="empty" alt="Henüz egzersiz yok" size="xl" />
                <p className="text-gray-500 mt-4 text-center">
                  {t('exercise.noExerciseToday')}
                  <br />
                  {t('exercise.letsGetMoving')}
                </p>
                <Button onClick={onAddExercise} className="mt-4 bg-orange-500 hover:bg-orange-600">
                  {t('exercise.addFirstExercise')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Favorite Exercises */}
          {favoriteExercises.length > 0 && (
            <Card className="border-2 bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {t('exercise.favoriteExercises')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {favoriteExercises.map((name: string) => (
                    <Badge key={name} variant="outline" className="py-2 px-3 bg-white border-yellow-300">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((period: 'week' | 'month' | 'all') => (
              <Button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                className={selectedPeriod === period ? 'bg-orange-500' : ''}
              >
                {period === 'week' ? t('exercise.thisWeek') : period === 'month' ? t('exercise.thisMonth') : t('exercise.all')}
              </Button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-2 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.round(periodStats.totalCalories)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{t('exercise.totalCalories')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(periodStats.totalMinutes)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{t('exercise.totalMinutes')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-600">{periodStats.exerciseCount}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('exercise.exerciseCount')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(periodStats.avgCaloriesPerSession)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{t('exercise.avgPerSession')}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Frequent Exercise */}
          <Card className="border-2 bg-gradient-to-br from-yellow-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                {t('exercise.mostFrequent')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <DoodleImage character="trophy" alt="Şampiyon" size="lg" className="mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-3">
                  {periodStats.mostFrequentExercise}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {t('exercise.last7Days')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chartData.map((day: DailyExerciseData, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{day.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-600">{Math.round(day.minutes)} dk</span>
                        <span className="text-xs text-orange-600 font-semibold">
                          {Math.round(day.calories)} kcal
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${(day.calories / maxCaloriesInChart) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {allExercises.length > 0 ? (
            <div className="space-y-4">
              {/* Group by date */}
              {Object.entries(
                allExercises.reduce((groups: Record<string, ExerciseLog[]>, exercise: ExerciseLog) => {
                  const dateKey = exercise.date || 'No Date';
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(exercise);
                  return groups;
                }, {})
              ).map(([dateKey, exercises]: [string, ExerciseLog[]]) => (
                <Card key={dateKey} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="text-gray-700">{dateKey}</span>
                      <div className="flex items-center gap-2 text-sm font-normal">
                        <Badge variant="secondary" className="text-xs">
                          {exercises.length} {t('exercise.exercises')}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {exercises.map((exercise: ExerciseLog) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{exercise.exercise_name}</p>
                          <div className="flex gap-3 mt-1 text-xs text-gray-600">
                            <span>{exercise.sets} x {exercise.reps}</span>
                            {exercise.weight && <span>{exercise.weight} kg</span>}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete(exercise.id)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DoodleImage character="empty" alt="Henüz egzersiz yok" size="xl" />
                <p className="text-gray-500 mt-4 text-center">
                  {t('exercise.noExerciseHistory')}
                  <br />
                  {t('exercise.startFirst')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Motivational Tip */}
      <Card className="mt-6 border-2 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DoodleImage character="lightning" alt="İpucu" size="md" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">{t('exercise.tip')}</p>
              <p className="text-sm text-gray-700">
                {t('exercise.tipText')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
