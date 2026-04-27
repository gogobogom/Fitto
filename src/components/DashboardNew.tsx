'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CalorieCircle } from './CalorieCircle';
import { MealCard } from './MealCard';
import { MacroBar } from './MacroBar';
import { ExerciseList } from './ExerciseList';
import { Badge } from './ui/badge';
import { WaterTracking } from './WaterTracking';
import { MealTemplates } from './MealTemplates';
import { useSupabase } from '@/hooks/useSupabase';
import type { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserGoals = Database['public']['Tables']['user_goals']['Row'];
type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

interface DashboardNewProps {
  onMealClick: () => void;
  onExerciseClick: () => void;
}

export function DashboardNew({
  onMealClick,
  onExerciseClick,
}: DashboardNewProps) {
  const { supabase } = useSupabase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);
  const [dailySummary, setDailySummary] = useState<DailyLog | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    };

    loadUserProfile();

    // Real-time subscription for profile updates
    const profileChannel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
    };
  }, [supabase]);

  // Load user goals with real-time updates
  useEffect(() => {
    const loadUserGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goals) {
        setUserGoals(goals);
      }
    };

    loadUserGoals();

    // Real-time subscription for goals updates
    const goalsChannel = supabase
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_goals'
        },
        (payload) => {
          if (payload.new) {
            setUserGoals(payload.new as UserGoals);
          }
        }
      )
      .subscribe();

    return () => {
      goalsChannel.unsubscribe();
    };
  }, [supabase]);

  // Load daily summary
  useEffect(() => {
    const loadDailySummary = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = currentDate.toISOString().split('T')[0];

      const { data: log } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (log) {
        setDailySummary(log);
      }
    };

    loadDailySummary();

    // Real-time subscription for daily logs
    const logsChannel = supabase
      .channel('logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs'
        },
        (payload) => {
          if (payload.new) {
            const log = payload.new as DailyLog;
            const today = currentDate.toISOString().split('T')[0];
            if (log.log_date === today) {
              setDailySummary(log);
            }
          }
        }
      )
      .subscribe();

    return () => {
      logsChannel.unsubscribe();
    };
  }, [supabase, currentDate]);

  const caloriesConsumed = dailySummary?.total_calories || 0;
  const caloriesBurned = dailySummary?.exercise_calories || 0;
  const targetCalories = userGoals?.daily_calorie_target || 2000;

  const proteinConsumed = dailySummary?.total_protein || 0;
  const carbsConsumed = dailySummary?.total_carbs || 0;
  const fatConsumed = dailySummary?.total_fat || 0;

  const proteinTarget = userGoals?.protein_target_g || 150;
  const carbsTarget = userGoals?.carb_target_g || 200;
  const fatTarget = userGoals?.fat_target_g || 60;

  // Format date
  const formatDate = (): string => {
    const months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Doodle Character */}
      <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 p-6 relative overflow-hidden shadow-lg">
        {/* Waving Doodle mascot */}
        <div className="absolute top-2 right-2 w-20 h-20 wiggle">
          <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm border-2 border-white/50 p-2">
            <img 
              src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/c3acbdd8-2d8c-46bf-936b-f9a9cb1c66ba_cmhvrl84s0eo40bt3ee8284n5-Q8Cfmrxn64DSacIymCqLb0pnOKg20j.jpg?download=1"
              alt="El sallayan doodle karakter"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white drop-shadow-md font-doodle">Merhaba, {userProfile.username}!</h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-white/90 font-doodle-alt drop-shadow">{formatDate()}</p>
          <Badge variant="secondary" className="doodle-border bg-white/20 text-white border-white backdrop-blur-sm">
            Güncel
          </Badge>
        </div>
      </div>

      {/* Calorie Circle */}
      <Card className="doodle-card bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-0">
          <CalorieCircle
            consumed={caloriesConsumed}
            burned={caloriesBurned}
            target={targetCalories}
          />
        </CardContent>
      </Card>

      {/* Meals */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 px-1 font-doodle">Öğünlerim 🍽️</h2>
        <div className="space-y-3">
          <MealCard
            mealType="breakfast"
            currentDate={currentDate}
            onClick={onMealClick}
          />
          <MealCard
            mealType="lunch"
            currentDate={currentDate}
            onClick={onMealClick}
          />
          <MealCard
            mealType="dinner"
            currentDate={currentDate}
            onClick={onMealClick}
          />
          <MealCard
            mealType="snack"
            currentDate={currentDate}
            onClick={onMealClick}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div onClick={onExerciseClick} className="cursor-pointer hover:opacity-90 transition-opacity">
        <ExerciseList currentDate={currentDate} />
      </div>

      {/* Macros */}
      <Card className="doodle-card bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-2xl font-doodle">Makro Besinlerim 🥗</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MacroBar
            label="Protein"
            current={proteinConsumed}
            target={proteinTarget}
            color="green"
          />
          <MacroBar
            label="Karbonhidrat"
            current={carbsConsumed}
            target={carbsTarget}
            color="blue"
          />
          <MacroBar label="Yağ" current={fatConsumed} target={fatTarget} color="yellow" />
        </CardContent>
      </Card>

      {/* Water Tracking */}
      <WaterTracking />

      {/* Meal Templates */}
      <MealTemplates currentDate={currentDate} />
    </div>
  );
}
