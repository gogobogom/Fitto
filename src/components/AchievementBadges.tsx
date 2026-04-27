'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Award, Flame, TrendingUp, Calendar, Trophy, Star, Zap, Target } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
}

interface AchievementBadgesProps {
  streak: number;
  totalMeals: number;
  totalExercises: number;
}

export function AchievementBadges({ streak, totalMeals, totalExercises }: AchievementBadgesProps) {
  const achievements: Achievement[] = [
    {
      id: 'first-meal',
      title: 'İlk Adım',
      description: 'İlk yemeğini kaydet',
      icon: <Star className="h-6 w-6" />,
      unlocked: totalMeals >= 1,
      color: 'from-yellow-400 to-orange-400',
    },
    {
      id: 'week-streak',
      title: 'Kararlı',
      description: '7 gün üst üste kayıt yap',
      icon: <Flame className="h-6 w-6" />,
      unlocked: streak >= 7,
      color: 'from-red-400 to-pink-400',
    },
    {
      id: 'month-streak',
      title: 'Disiplinli',
      description: '30 gün üst üste kayıt yap',
      icon: <Calendar className="h-6 w-6" />,
      unlocked: streak >= 30,
      color: 'from-purple-400 to-indigo-400',
    },
    {
      id: 'meals-50',
      title: 'Takipçi',
      description: '50 yemek kaydet',
      icon: <Target className="h-6 w-6" />,
      unlocked: totalMeals >= 50,
      color: 'from-green-400 to-emerald-400',
    },
    {
      id: 'meals-100',
      title: 'Uzman',
      description: '100 yemek kaydet',
      icon: <TrendingUp className="h-6 w-6" />,
      unlocked: totalMeals >= 100,
      color: 'from-blue-400 to-cyan-400',
    },
    {
      id: 'exercise-10',
      title: 'Aktif',
      description: '10 egzersiz kaydet',
      icon: <Zap className="h-6 w-6" />,
      unlocked: totalExercises >= 10,
      color: 'from-amber-400 to-yellow-400',
    },
    {
      id: 'exercise-50',
      title: 'Sporcu',
      description: '50 egzersiz kaydet',
      icon: <Award className="h-6 w-6" />,
      unlocked: totalExercises >= 50,
      color: 'from-orange-400 to-red-400',
    },
    {
      id: 'master',
      title: 'Süper Kahraman',
      description: '100 yemek + 50 egzersiz',
      icon: <Trophy className="h-6 w-6" />,
      unlocked: totalMeals >= 100 && totalExercises >= 50,
      color: 'from-yellow-300 to-amber-400',
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Başarılar
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? `bg-gradient-to-br ${achievement.color} border-transparent text-white shadow-md`
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={achievement.unlocked ? 'text-white' : 'text-gray-400'}>
                  {achievement.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{achievement.title}</h4>
                  <p className={`text-xs mt-1 ${achievement.unlocked ? 'text-white/90' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                </div>
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-white rounded-full p-1">
                      <Award className="h-3 w-3 text-yellow-600" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {unlockedCount === achievements.length && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-200 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-bold text-gray-900">🎉 Tüm Başarıları Kazandınız!</p>
            <p className="text-sm text-gray-600 mt-1">Harika bir iş çıkardınız!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
