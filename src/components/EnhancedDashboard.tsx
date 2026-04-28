'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { 
  TrendingUp, 
  Flame, 
  Activity, 
  Droplets, 
  Scale, 
  Calendar,
  Clock,
  Target,
  Award,
  Zap,
  Plus,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { DoodleImage } from './DoodleImage';
import { WaterTracking } from './WaterTracking';
import { simpleStorage } from '@/lib/secureStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserProfile, UserGoals, DailySummary } from '../types/supabase';
import type { SupabaseConnection } from '../hooks/useSupabase';

interface EnhancedDashboardProps {
  identity: string;
  userProfile: UserProfile;
  userGoals: UserGoals | null;
  dailySummary: DailySummary | null;
  connection: SupabaseConnection;
  onAddMeal: () => void;
  onAddExercise: () => void;
  onNavigate: (tab: string) => void;
}

interface QuickStat {
  label: string;
  value: string;
  target: string;
  progress: number;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  action: () => void;
}

interface WeeklyData {
  day: string;
  calories: number;
  exercise: number;
  water: number;
  date: string;
}

interface Achievement {
  id: number;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

// Memoized Quick Stat Card Component
const QuickStatCard = memo(function QuickStatCard({ 
  stat, 
  index 
}: { 
  stat: QuickStat; 
  index: number;
}) {
  return (
    <Card 
      className={`border-4 border-black bg-gradient-to-br ${stat.bgGradient} hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={stat.action}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`${stat.color}`}>{stat.icon}</div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">{stat.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            <span className="text-sm text-gray-500">/ {stat.target}</span>
          </div>
          <Progress value={Math.min(stat.progress, 100)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized Achievement Card Component
const AchievementCard = memo(function AchievementCard({ 
  achievement 
}: { 
  achievement: Achievement;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
        achievement.earned
          ? 'bg-white border-yellow-300 shadow-sm'
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 flex items-center gap-2">
          {achievement.name}
          {achievement.earned && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </p>
        <p className="text-xs text-gray-600">{achievement.description}</p>
      </div>
    </div>
  );
});

// Memoized Weekly Progress Bar Component
const WeeklyProgressBar = memo(function WeeklyProgressBar({ 
  day, 
  maxCalories,
  language
}: { 
  day: WeeklyData; 
  maxCalories: number;
  language: string;
}) {
  const percentage = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 w-12">{day.day}</span>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-gray-600">{Math.round(day.calories)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-green-500" />
            <span className="text-gray-600">{Math.round(day.exercise)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600">{day.water}</span>
          </div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

// Loading Skeleton Component
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 p-6 rounded-2xl border-4 border-black">
        <Skeleton className="h-8 w-48 bg-white/30" />
        <Skeleton className="h-4 w-32 mt-2 bg-white/30" />
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-4 border-black">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-5 mb-3" />
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Actions Skeleton */}
      <Card className="border-4 border-black">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export function EnhancedDashboard({
  identity,
  userProfile,
  userGoals,
  dailySummary,
  connection,
  onAddMeal,
  onAddExercise,
  onNavigate,
}: EnhancedDashboardProps) {
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [weeklyCaloriesData, setWeeklyCaloriesData] = useState<Map<string, number>>(new Map());

  // Initialize data
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setCurrentDate(dateStr);

    // Load water from simpleStorage
    const savedWater = simpleStorage.getItem(`water_${dateStr}`);
    if (savedWater) {
      const glassCount = parseInt(savedWater, 10);
      if (!isNaN(glassCount)) {
        setWaterGlasses(glassCount);
      }
    }

    // Set weight from profile
    if (userProfile?.weight_kg != null) {
      setCurrentWeight(userProfile.weight_kg);
    }

    // Load weekly calories from storage (cached data)
    const weeklyData = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const savedCalories = simpleStorage.getItem(`calories_${dateKey}`);
      if (savedCalories) {
        weeklyData.set(dateKey, parseInt(savedCalories, 10) || 0);
      }
    }
    setWeeklyCaloriesData(weeklyData);

    // Mark loading as complete after initial setup
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [userProfile?.weight_kg]);

  // Calculate calories consumed - optimized with stable dependency
  const caloriesConsumed = useMemo((): number => {
    let total = 0;
    const today = new Date().toISOString().split('T')[0];
    if (connection?.db?.foodItem) {
      for (const food of connection.db.foodItem.iter()) {
        if (food.date === today) {
          total += food.calories || 0;
        }
      }
    }
    // Save to storage for weekly chart
    if (total > 0 && currentDate) {
      simpleStorage.setItem(`calories_${currentDate}`, total.toString());
    }
    return total;
  }, [connection?.db?.foodItem, currentDate]);

  // Calories burned today - prefer the server-aggregated daily_summaries value,
  // but fall back to summing today's exercises client-side so the dashboard
  // reflects activity even before the DB aggregation trigger runs.
  const [todayBurned, setTodayBurned] = useState<number>(0);
  useEffect(() => {
    if (!currentDate || !connection?.userId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await connection.supabase
        .from('exercises')
        .select('calories_burned')
        .eq('user_id', connection.userId)
        .eq('date', currentDate);
      if (cancelled) return;
      if (error) {
        // Column may not exist on old schema; treat as zero rather than crashing
        setTodayBurned(0);
        return;
      }
      const sum = (data ?? []).reduce(
        (acc: number, row: { calories_burned: number | null }) =>
          acc + (Number(row.calories_burned) || 0),
        0,
      );
      setTodayBurned(sum);
      if (sum > 0) simpleStorage.setItem(`exercise_${currentDate}`, sum.toString());
    })();
    return () => {
      cancelled = true;
    };
  }, [connection?.userId, connection?.supabase, currentDate]);

  // Stable calculations
  const targetCalories = userGoals?.daily_calorie_target || 2000;
  const caloriesBurned = (dailySummary?.exercise_calories ?? 0) || todayBurned;
  const netCalories = caloriesConsumed - caloriesBurned;
  const calorieProgress = (netCalories / targetCalories) * 100;

  // Day names - memoized
  const dayNames = useMemo(() => 
    language === 'tr' 
      ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    [language]
  );

  // Weekly data - optimized without random generation
  const weeklyData = useMemo((): WeeklyData[] => {
    const days: WeeklyData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      // Get saved water for that day
      const savedWaterStr = simpleStorage.getItem(`water_${dateStr}`);
      const savedWater = savedWaterStr ? parseInt(savedWaterStr, 10) : 0;
      
      // Get saved calories from storage or use current day's value
      let dayCalories = 0;
      if (i === 0) {
        dayCalories = caloriesConsumed;
      } else {
        const savedCalories = weeklyCaloriesData.get(dateStr);
        dayCalories = savedCalories || 0;
      }
      
      // Get saved exercise calories
      const savedExercise = simpleStorage.getItem(`exercise_${dateStr}`);
      const exerciseCalories = savedExercise ? parseInt(savedExercise, 10) : (i === 0 ? caloriesBurned : 0);
      
      days.push({
        day: dayName,
        calories: dayCalories,
        exercise: exerciseCalories,
        water: i === 0 ? waterGlasses : savedWater,
        date: dateStr,
      });
    }
    return days;
  }, [caloriesConsumed, caloriesBurned, waterGlasses, dayNames, weeklyCaloriesData]);

  const weeklyCaloriesAvg = useMemo(() => {
    const validDays = weeklyData.filter(d => d.calories > 0);
    if (validDays.length === 0) return 0;
    return validDays.reduce((sum, day) => sum + day.calories, 0) / validDays.length;
  }, [weeklyData]);

  const weeklyExerciseTotal = useMemo(() => 
    weeklyData.reduce((sum, day) => sum + day.exercise, 0),
    [weeklyData]
  );

  const maxCaloriesInWeek = useMemo(() => 
    Math.max(...weeklyData.map((d) => d.calories), 1),
    [weeklyData]
  );

  // Navigation handlers - memoized
  const handleCalorieClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/nutrition';
    }
  }, []);

  const handleExerciseClick = useCallback(() => {
    onNavigate('exercise');
  }, [onNavigate]);

  const handleWaterClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/hydration';
    }
  }, []);

  const handleWeightClick = useCallback(() => {
    onNavigate('profile');
  }, [onNavigate]);

  // Quick stats - memoized
  const quickStats = useMemo((): QuickStat[] => [
    {
      label: language === 'tr' ? 'Kalori' : 'Calories',
      value: Math.round(netCalories).toString(),
      target: Math.round(targetCalories).toString(),
      progress: Math.min(calorieProgress, 100),
      icon: <Flame className="h-5 w-5" />,
      color: 'text-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      action: handleCalorieClick,
    },
    {
      label: language === 'tr' ? 'Egzersiz' : 'Exercise',
      value: Math.round(caloriesBurned).toString(),
      target: '500',
      progress: (caloriesBurned / 500) * 100,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100',
      action: handleExerciseClick,
    },
    {
      label: language === 'tr' ? 'Su' : 'Water',
      value: waterGlasses.toString(),
      target: '8',
      progress: (waterGlasses / 8) * 100,
      icon: <Droplets className="h-5 w-5" />,
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      action: handleWaterClick,
    },
    {
      label: language === 'tr' ? 'Kilo' : 'Weight',
      value: currentWeight > 0 ? currentWeight.toFixed(1) : (userProfile?.weight_kg ? userProfile.weight_kg.toFixed(1) : '-'),
      target: (userGoals?.target_weight_kg || userProfile?.weight_kg || 0).toString(),
      progress: currentWeight > 0 && userGoals?.target_weight_kg 
        ? ((userGoals.target_weight_kg / currentWeight) * 100)
        : 0,
      icon: <Scale className="h-5 w-5" />,
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      action: handleWeightClick,
    },
  ], [language, netCalories, targetCalories, calorieProgress, caloriesBurned, waterGlasses, currentWeight, userProfile?.weight_kg, userGoals?.target_weight_kg, handleCalorieClick, handleExerciseClick, handleWaterClick, handleWeightClick]);

  // Motivational message - memoized
  const activeMotivation = useMemo(() => {
    const messages = [
      { text: language === 'tr' ? 'Harika gidiyorsun! 💪' : 'You\'re doing great! 💪', condition: calorieProgress >= 80 && calorieProgress <= 110 },
      { text: language === 'tr' ? 'Bugün çok aktifsin! 🔥' : 'Very active today! 🔥', condition: caloriesBurned > 400 },
      { text: language === 'tr' ? 'Su tüketimini artır! 💧' : 'Increase water intake! 💧', condition: waterGlasses < 4 },
      { text: language === 'tr' ? 'Hedefe yaklaşıyorsun! 🎯' : 'Getting close to goal! 🎯', condition: calorieProgress > 50 },
      { text: language === 'tr' ? 'Mükemmel başlangıç! ⭐' : 'Perfect start! ⭐', condition: true },
    ];
    return messages.find((m) => m.condition) || messages[messages.length - 1];
  }, [language, calorieProgress, caloriesBurned, waterGlasses]);

  // Achievements - memoized
  const achievements = useMemo((): Achievement[] => [
    { 
      id: 1, 
      name: language === 'tr' ? '7 Gün Sürekliliği' : '7 Day Streak', 
      icon: '🔥', 
      earned: true,
      description: language === 'tr' ? '7 gün üst üste kayıt yaptın!' : 'You logged for 7 consecutive days!'
    },
    { 
      id: 2, 
      name: language === 'tr' ? 'İlk 1000 Kcal' : 'First 1000 Kcal', 
      icon: '💪', 
      earned: weeklyExerciseTotal > 1000,
      description: language === 'tr' ? 'Bu hafta 1000 kcal yaktın!' : 'You burned 1000 kcal this week!'
    },
    { 
      id: 3, 
      name: language === 'tr' ? 'Su Şampiyonu' : 'Water Champion', 
      icon: '💧', 
      earned: waterGlasses >= 8,
      description: language === 'tr' ? 'Günlük su hedefine ulaştın!' : 'You reached your daily water goal!'
    },
  ], [language, weeklyExerciseTotal, waterGlasses]);

  // Water update handler - memoized
  const handleWaterUpdate = useCallback((glasses: number) => {
    setWaterGlasses(glasses);
    if (currentDate) {
      simpleStorage.setItem(`water_${currentDate}`, glasses.toString());
    }
  }, [currentDate]);

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 p-6 rounded-2xl relative overflow-hidden shadow-lg border-4 border-black">
        {/* Language Switcher */}
        <Button
          onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
          className="absolute top-4 right-28 bg-white/20 hover:bg-white/30 border-2 border-white text-white font-bold px-3 py-2 rounded-lg backdrop-blur-sm shadow-lg transition-all z-10"
          size="sm"
        >
          {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </Button>

        {/* Profile Button */}
        <Button
          onClick={() => onNavigate('profile')}
          className="absolute top-2 right-2 h-24 w-24 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-3 border-white/40 shadow-lg transition-all z-10 p-0 flex items-center justify-center overflow-hidden"
        >
          <img 
            src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/1739457a-67a1-4819-8615-4ba20e3f9f65-jvk9Ugr87p8ryieykTFyRNMyUOg1iZ" 
            alt={language === 'tr' ? 'Profil' : 'Profile'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </Button>
        
        <div className="mb-2 pr-32">
          <h1 className="text-3xl font-bold text-white drop-shadow-md font-doodle">
            {language === 'tr' ? 'Merhaba' : 'Hello'}, {userProfile.username}!
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-white/80" />
          <p className="text-white/90 font-doodle-alt drop-shadow">
            {new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="border-4 border-black bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <DoodleImage character="lightning" alt={language === 'tr' ? 'Motivasyon' : 'Motivation'} size="md" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">{activeMotivation.text}</p>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'tr' 
                  ? `Bugün ${Math.round(netCalories)} / ${Math.round(targetCalories)} kcal tükettin`
                  : `Today you consumed ${Math.round(netCalories)} / ${Math.round(targetCalories)} kcal`
                }
              </p>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
              {calorieProgress >= 80 && calorieProgress <= 110 
                ? (language === 'tr' ? 'Hedefte!' : 'On Target!') 
                : (language === 'tr' ? 'Devam Et' : 'Keep Going')
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <QuickStatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-4 border-black">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            {language === 'tr' ? 'Hızlı İşlemler' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={onAddMeal} 
              className="bg-orange-500 hover:bg-orange-600 h-auto py-4 flex flex-col items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">{language === 'tr' ? 'Öğün Ekle' : 'Add Meal'}</span>
            </Button>
            <Button 
              onClick={onAddExercise} 
              className="bg-green-500 hover:bg-green-600 h-auto py-4 flex flex-col items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">{language === 'tr' ? 'Egzersiz Ekle' : 'Add Exercise'}</span>
            </Button>
            <Button 
              onClick={() => onNavigate('stats')} 
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-2"
            >
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm">{language === 'tr' ? 'İstatistikler' : 'Statistics'}</span>
            </Button>
            <Button 
              onClick={() => onNavigate('more')} 
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-2"
            >
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-sm">{language === 'tr' ? 'Daha Fazla' : 'More'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart */}
      <Card className="border-4 border-black">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {language === 'tr' ? 'Haftalık İlerleme' : 'Weekly Progress'}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {language === 'tr' ? 'Ort' : 'Avg'}: {Math.round(weeklyCaloriesAvg)} kcal
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((day, index) => (
              <WeeklyProgressBar 
                key={day.date} 
                day={day} 
                maxCalories={maxCaloriesInWeek}
                language={language}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-4 border-black bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            {language === 'tr' ? 'Başarılarım' : 'My Achievements'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Water Tracking */}
      <WaterTracking 
        initialGlasses={waterGlasses}
        onUpdate={handleWaterUpdate}
      />

      {/* Today's Summary */}
      <Card className="border-4 border-black bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {language === 'tr' ? 'Günün Özeti' : "Today's Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">{language === 'tr' ? 'Kalori Alımı' : 'Calorie Intake'}</span>
              <span className="font-semibold text-gray-900">{Math.round(caloriesConsumed)} kcal</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">{language === 'tr' ? 'Yakılan Kalori' : 'Calories Burned'}</span>
              <span className="font-semibold text-green-600">-{Math.round(caloriesBurned)} kcal</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">{language === 'tr' ? 'Net Kalori' : 'Net Calories'}</span>
              <span className="font-semibold text-blue-600">{Math.round(netCalories)} kcal</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">{language === 'tr' ? 'Hedefe Kalan' : 'Remaining to Goal'}</span>
              <span className={`font-semibold ${
                targetCalories - netCalories > 0 ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {Math.abs(Math.round(targetCalories - netCalories))} kcal
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
