'use client';

import { useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Sparkles, TrendingUp, Target, Heart, Zap } from 'lucide-react';

interface MotivationCardProps {
  streak: number;
  totalMeals: number;
  caloriesPercentage: number;
}

const motivationMessages = [
  {
    condition: (streak: number) => streak >= 7,
    icon: Sparkles,
    color: 'from-yellow-50 to-amber-50',
    iconColor: 'text-yellow-600',
    title: '🔥 Harika Bir Seri!',
    message: `${0} gündür devam ediyorsun! Muhteşemsin!`,
  },
  {
    condition: (streak: number, totalMeals: number) => totalMeals >= 50,
    icon: TrendingUp,
    color: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600',
    title: '📈 İnanılmaz İlerleme!',
    message: `${0} yemek kaydı! Disiplinin takdire şayan!`,
  },
  {
    condition: (streak: number, totalMeals: number, caloriesPercentage: number) => 
      caloriesPercentage >= 95 && caloriesPercentage <= 105,
    icon: Target,
    color: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600',
    title: '🎯 Tam Hedeftesin!',
    message: 'Kalori hedefini mükemmel takip ediyorsun!',
  },
  {
    condition: () => new Date().getDay() === 1,
    icon: Zap,
    color: 'from-purple-50 to-pink-50',
    iconColor: 'text-purple-600',
    title: '⚡ Yeni Hafta, Yeni Enerji!',
    message: 'Bu hafta da hedeflerine ulaşacaksın!',
  },
  {
    condition: (streak: number) => streak >= 3,
    icon: Heart,
    color: 'from-red-50 to-pink-50',
    iconColor: 'text-red-600',
    title: '❤️ Kendine İyi Bakıyorsun!',
    message: 'Sağlığına verdiğin önem harika!',
  },
];

const defaultMessage = {
  icon: Sparkles,
  color: 'from-indigo-50 to-purple-50',
  iconColor: 'text-indigo-600',
  title: '💪 Devam Et!',
  message: 'Her gün yeni bir başlangıç!',
};

export function MotivationCard({ streak, totalMeals, caloriesPercentage }: MotivationCardProps) {
  const selectedMessage = useMemo(() => {
    for (const msg of motivationMessages) {
      if (msg.condition(streak, totalMeals, caloriesPercentage)) {
        return {
          ...msg,
          message: msg.message.replace('${0}', streak > 0 ? streak.toString() : totalMeals.toString()),
        };
      }
    }
    return defaultMessage;
  }, [streak, totalMeals, caloriesPercentage]);

  const Icon = selectedMessage.icon;

  return (
    <Card className={`border-2 shadow-md bg-gradient-to-br ${selectedMessage.color}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Icon className={`h-8 w-8 ${selectedMessage.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{selectedMessage.title}</h3>
            <p className="text-sm text-gray-700">{selectedMessage.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
