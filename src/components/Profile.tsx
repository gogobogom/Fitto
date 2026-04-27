'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Target, Activity, Calendar, TrendingUp } from 'lucide-react';
import { MacroGoalsCustomizer } from './MacroGoalsCustomizer';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserProfile, UserGoals, ActivityLevel, GoalType } from '../types/supabase';
import type { SupabaseConnection } from '../hooks/useSupabase';

interface ProfileProps {
  userProfile: any; // Using any temporarily - will come from Supabase profiles table
  userGoals: any | null; // Using any temporarily - will come from Supabase user_goals table
  connection: SupabaseConnection;
  onBack?: () => void;
}

export function Profile({ userProfile, userGoals, connection, onBack }: ProfileProps) {
  const { t, language, setLanguage } = useLanguage();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityLevelText = (level: string): string => {
    const levels: Record<string, string> = {
      sedentary: t('onboarding.sedentary'),
      lightlyActive: t('onboarding.lightlyActive'),
      moderatelyActive: t('onboarding.moderatelyActive'),
      veryActive: t('onboarding.veryActive'),
      extraActive: t('onboarding.extraActive'),
    };
    return levels[level] || level;
  };

  const getGoalText = (goal: string): string => {
    const goals: Record<string, string> = {
      loseWeight: t('onboarding.lose'),
      maintainWeight: t('onboarding.maintain'),
      gainWeight: t('onboarding.gain'),
      buildMuscle: 'Kas Yap',
    };
    return goals[goal] || goal;
  };

  const getGenderText = (gender: string): string => {
    const genderMap: Record<string, string> = {
      male: t('onboarding.male'),
      female: t('onboarding.female'),
      other: t('onboarding.other'),
    };
    return genderMap[gender] || gender;
  };

  const calculateBMI = (): number => {
    if (!userProfile?.height_cm || !userProfile?.weight_kg) return 0;
    const heightM = userProfile.height_cm / 100;
    return userProfile.weight_kg / (heightM * heightM);
  };

  const getBMICategory = (bmi: number): { text: string; color: string } => {
    if (bmi < 18.5) return { text: t('profile.underweight'), color: 'text-blue-600' };
    if (bmi < 25) return { text: t('profile.normal'), color: 'text-green-600' };
    if (bmi < 30) return { text: t('profile.overweight'), color: 'text-yellow-600' };
    return { text: t('profile.obese'), color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  // Safety check for profile data
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* Header */}
      <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black">
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md">{t('profile.title')}</h1>
          <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('profile.description')}</p>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="doodle-card bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/4905c366-9fb4-400d-b27a-96d99dcd4962-EJQnQtIltvBhlWjEaws3os1fpUGaHi" alt="Profile" />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-pink-600 text-white">
                {getInitials(userProfile.username)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl md:text-3xl font-doodle font-bold mt-4 text-gray-900">{userProfile.username || 'Kullanıcı'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {userProfile.age} {t('profile.age')}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {getGenderText(userProfile.gender)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="doodle-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-doodle font-bold text-gray-900">{userProfile.weight_kg || '-'}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1">{t('profile.currentWeight')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-doodle font-bold text-gray-900">{userProfile.height_cm || '-'}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1">{t('profile.height')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-doodle font-bold ${bmiCategory.color}`}>{bmi > 0 ? bmi.toFixed(1) : '-'}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1">{t('profile.bmi')} - {bmiCategory.text}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-doodle font-bold text-orange-600">
                {userGoals?.target_weight_kg || userProfile.weight_kg}
              </div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1">{t('profile.targetWeight')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Card */}
      {userGoals && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-doodle">
              <Target className="h-5 w-5 text-orange-600" />
              {t('profile.myGoals')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-gray-600" />
                <span className="text-sm md:text-base font-doodle-alt font-medium text-gray-700">{t('profile.activityLevel')}</span>
              </div>
              <Badge variant="secondary">{getActivityLevelText(userProfile.activity_level)}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <span className="text-sm md:text-base font-doodle-alt font-medium text-gray-700">{t('profile.goalType')}</span>
              </div>
              <Badge className="bg-orange-100 text-orange-700">
                {getGoalText(userGoals.goal_type)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-sm md:text-base font-doodle-alt font-medium text-gray-700">{t('profile.dailyCalorie')}</span>
              </div>
              <span className="text-lg md:text-xl font-doodle font-bold text-gray-900">
                {userGoals.daily_calorie_target} kcal
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Macros Card */}
      {userGoals && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-doodle">{t('profile.macroGoals')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="font-doodle-alt font-medium text-gray-700">{t('profile.protein')}</span>
              <span className="text-lg md:text-xl font-doodle font-bold text-orange-700">
                {Math.round(userGoals.protein_target_g)}g
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-doodle-alt font-medium text-gray-700">{t('profile.carbs')}</span>
              <span className="text-lg md:text-xl font-doodle font-bold text-blue-700">
                {Math.round(userGoals.carbs_target_g)}g
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-doodle-alt font-medium text-gray-700">{t('profile.fat')}</span>
              <span className="text-lg md:text-xl font-doodle font-bold text-yellow-700">
                {Math.round(userGoals.fat_target_g)}g
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Macro Customizer */}
      {userGoals && (
        <div className="px-4">
          <MacroGoalsCustomizer connection={connection} userGoals={userGoals} />
        </div>
      )}
    </div>
  );
}
