'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DoodleHeader } from '../DoodleHeader';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trophy, Target, Zap, Award, Flame, Star, Crown, TrendingUp } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  target?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  endDate: string;
  reward: string;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

interface GamificationHubProps {
  onBack: () => void;
}

export default function GamificationHub({ onBack }: GamificationHubProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    // Load from localStorage
    const savedAchievements = localStorage.getItem('achievements');
    const savedChallenges = localStorage.getItem('challenges');
    const savedTasks = localStorage.getItem('dailyTasks');
    const savedPoints = localStorage.getItem('totalPoints');

    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
    else setAchievements(initialAchievements);

    if (savedChallenges) setChallenges(JSON.parse(savedChallenges));
    else setChallenges(initialChallenges);

    if (savedTasks) setDailyTasks(JSON.parse(savedTasks));
    else setDailyTasks(generateDailyTasks());

    if (savedPoints) setTotalPoints(parseInt(savedPoints));
  }, []);

  const completeTask = (taskId: string): void => {
    const updated = dailyTasks.map((task: DailyTask) =>
      task.id === taskId ? { ...task, completed: true } : task
    );
    setDailyTasks(updated);
    localStorage.setItem('dailyTasks', JSON.stringify(updated));

    const task = dailyTasks.find((t: DailyTask) => t.id === taskId);
    if (task && !task.completed) {
      const newTotal = totalPoints + task.points;
      setTotalPoints(newTotal);
      localStorage.setItem('totalPoints', newTotal.toString());
    }
  };

  const earnedCount = achievements.filter((a: Achievement) => a.earned).length;
  const completedTasks = dailyTasks.filter((t: DailyTask) => t.completed).length;
  const level = Math.floor(totalPoints / 100) + 1;
  const nextLevelPoints = level * 100;
  const levelProgress = ((totalPoints % 100) / 100) * 100;

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title="Başarılar & Meydan Okumalar" subtitle="Rozet, görev ve meydan okumalar" emoji="🏆" />

      {/* Stats Card */}
      <Card className="border-2 bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-8 w-8 text-yellow-600" />
              <span className="text-4xl font-bold text-gray-900">Seviye {level}</span>
            </div>
            <Progress value={levelProgress} className="h-3 mb-2" />
            <p className="text-sm text-gray-600">
              {totalPoints} / {nextLevelPoints} puan
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{earnedCount}</p>
              <p className="text-xs text-gray-600">Başarı</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{challenges.length}</p>
              <p className="text-xs text-gray-600">Meydan Okuma</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Zap className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{completedTasks}</p>
              <p className="text-xs text-gray-600">Günlük Görev</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Günlük Görevler</TabsTrigger>
          <TabsTrigger value="achievements">Başarılar</TabsTrigger>
          <TabsTrigger value="challenges">Meydan Okumalar</TabsTrigger>
        </TabsList>

        {/* Daily Tasks */}
        <TabsContent value="tasks" className="space-y-3 mt-4">
          {dailyTasks.map((task: DailyTask) => (
            <Card
              key={task.id}
              className={`border-2 ${task.completed ? 'bg-green-50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <Badge variant="secondary">+{task.points} puan</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => completeTask(task.id)}
                    disabled={task.completed}
                    className="ml-2"
                  >
                    {task.completed ? '✓ Tamamlandı' : 'Tamamla'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-3 mt-4">
          {achievements.map((achievement: Achievement) => (
            <Card
              key={achievement.id}
              className={`border-2 ${
                achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-amber-50' : 'bg-gray-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    {achievement.earned ? (
                      <Badge className="bg-green-500">
                        Kazanıldı{' '}
                        {achievement.earnedDate &&
                          `• ${new Date(achievement.earnedDate).toLocaleDateString('tr-TR')}`}
                      </Badge>
                    ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                      <div>
                        <Progress
                          value={(achievement.progress / achievement.target) * 100}
                          className="h-2 mb-1"
                        />
                        <p className="text-xs text-gray-500">
                          {achievement.progress} / {achievement.target}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">Kilitli</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Challenges */}
        <TabsContent value="challenges" className="space-y-3 mt-4">
          {challenges.map((challenge: Challenge) => (
            <Card key={challenge.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                  <Target className="h-6 w-6 text-blue-600" />
                </div>

                <Progress value={(challenge.current / challenge.target) * 100} className="mb-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {challenge.current} / {challenge.target}
                  </span>
                  <Badge variant="outline">{challenge.reward}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bitiş: {new Date(challenge.endDate).toLocaleDateString('tr-TR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Initial data
const initialAchievements: Achievement[] = [
  {
    id: '1',
    title: 'İlk Adım',
    description: 'İlk öğünü kaydet',
    icon: '🎯',
    earned: false,
    progress: 0,
    target: 1,
  },
  {
    id: '2',
    title: '7 Günlük Seri',
    description: '7 gün üst üste kayıt yap',
    icon: '🔥',
    earned: false,
    progress: 0,
    target: 7,
  },
  {
    id: '3',
    title: 'Protein Ustası',
    description: '30 gün protein hedefini tut',
    icon: '💪',
    earned: false,
    progress: 0,
    target: 30,
  },
  {
    id: '4',
    title: 'Su İçme Kahramanı',
    description: '50 gün su hedefini tamamla',
    icon: '💧',
    earned: false,
    progress: 0,
    target: 50,
  },
  {
    id: '5',
    title: 'Tartı Ustası',
    description: '10 kilo kaybı ölçümü',
    icon: '⚖️',
    earned: false,
    progress: 0,
    target: 10,
  },
  {
    id: '6',
    title: 'Egzersiz Düşkünü',
    description: '100 egzersiz kaydı',
    icon: '🏃',
    earned: false,
    progress: 0,
    target: 100,
  },
];

const initialChallenges: Challenge[] = [
  {
    id: '1',
    title: '30 Günlük Kalori Kontrolü',
    description: '30 gün üst üste kalori hedefinde kal',
    target: 30,
    current: 0,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    reward: '+500 puan',
  },
  {
    id: '2',
    title: 'Haftalık Su Meydan Okuması',
    description: '7 gün su hedefini tamamla',
    target: 7,
    current: 0,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reward: '+200 puan',
  },
  {
    id: '3',
    title: 'Adım Savaşı',
    description: '10.000 adım 14 gün boyunca',
    target: 14,
    current: 0,
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    reward: '+300 puan',
  },
];

const generateDailyTasks = (): DailyTask[] => {
  return [
    {
      id: '1',
      title: 'Kahvaltı Kaydı',
      description: 'Kahvaltını kaydet',
      points: 10,
      completed: false,
    },
    {
      id: '2',
      title: 'Su Hedefinı Tamamla',
      description: 'Günlük su hedefine ulaş',
      points: 15,
      completed: false,
    },
    {
      id: '3',
      title: 'Egzersiz Yap',
      description: 'Bir egzersiz kaydı ekle',
      points: 20,
      completed: false,
    },
    {
      id: '4',
      title: 'Kalori Hedefinde Kal',
      description: 'Günlük kalori hedefini aşma',
      points: 25,
      completed: false,
    },
    {
      id: '5',
      title: 'Kilonu Kaydet',
      description: 'Bugünkü kilonu ölç ve kaydet',
      points: 10,
      completed: false,
    },
  ];
};
