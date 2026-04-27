'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Scale, Plus, TrendingDown, TrendingUp, Calendar, Trophy, Target, Minus, Star } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { doodleCharacters } from '@/lib/doodleAssets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeightEntry {
  date: string;
  weight: number;
  note?: string;
}

interface WeightTrackerProps {
  userId: string;
}

interface Milestone {
  weight: number;
  achieved: boolean;
  date?: string;
}

export function WeightTracker({ userId }: WeightTrackerProps) {
  const { language } = useLanguage();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('chart');
  const [celebrateAchievement, setCelebrateAchievement] = useState<boolean>(false);

  // Load weight history and goal from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`weight_history_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WeightEntry[];
        setWeightHistory(parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } catch (error) {
        console.error('Kilo geçmişi yüklenirken hata:', error);
      }
    }

    const storedGoal = localStorage.getItem(`weight_goal_${userId}`);
    if (storedGoal) {
      setGoalWeight(parseFloat(storedGoal));
    }
  }, [userId]);

  const saveWeightHistory = (history: WeightEntry[]): void => {
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(history));
    setWeightHistory(history);
  };

  const saveGoalWeight = (goal: number): void => {
    localStorage.setItem(`weight_goal_${userId}`, goal.toString());
    setGoalWeight(goal);
  };

  const handleAddWeight = (): void => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Lütfen geçerli bir kilo girin');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newEntry: WeightEntry = {
      date: today,
      weight,
      note: newNote.trim() || undefined,
    };

    // Check for achievement
    if (goalWeight && weight <= goalWeight && currentWeight && currentWeight > goalWeight) {
      setCelebrateAchievement(true);
      setTimeout(() => setCelebrateAchievement(false), 3000);
    }

    // Remove any existing entry for today and add new one
    const filtered = weightHistory.filter((entry) => entry.date !== today);
    const updated = [...filtered, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    saveWeightHistory(updated);
    setShowAddDialog(false);
    setNewWeight('');
    setNewNote('');
  };

  const handleSetGoal = (): void => {
    const goal = parseFloat(goalInput);
    if (isNaN(goal) || goal <= 0) {
      alert('Lütfen geçerli bir hedef kilo girin');
      return;
    }
    saveGoalWeight(goal);
    setShowGoalDialog(false);
    setGoalInput('');
  };

  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;
  const previousWeight = weightHistory.length > 1 ? weightHistory[weightHistory.length - 2].weight : null;
  const weightChange = currentWeight !== null && previousWeight !== null ? currentWeight - previousWeight : 0;
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;

  // Calculate statistics
  const stats = useMemo(() => {
    if (weightHistory.length === 0) {
      return {
        totalChange: 0,
        averageWeeklyChange: 0,
        goalRemaining: 0,
        goalProgress: 0,
        daysTracking: 0,
        entriesCount: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const total = currentWeight! - startWeight!;
    const firstDate = new Date(weightHistory[0].date);
    const lastDate = new Date(weightHistory[weightHistory.length - 1].date);
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeklyAvg = (total / daysDiff) * 7;

    const goalRem = goalWeight ? currentWeight! - goalWeight : 0;
    const goalProg = goalWeight && startWeight !== goalWeight
      ? Math.min(100, Math.max(0, ((startWeight! - currentWeight!) / (startWeight! - goalWeight)) * 100))
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(total) > 0.5) {
      trend = total > 0 ? 'up' : 'down';
    }

    return {
      totalChange: total,
      averageWeeklyChange: weeklyAvg,
      goalRemaining: goalRem,
      goalProgress: goalProg,
      daysTracking: Math.floor(daysDiff),
      entriesCount: weightHistory.length,
      trend,
    };
  }, [weightHistory, currentWeight, startWeight, goalWeight]);

  // Calculate milestones
  const milestones = useMemo(() => {
    if (!startWeight || !goalWeight || !currentWeight) return [];

    const start = startWeight;
    const goal = goalWeight;
    const diff = Math.abs(start - goal);
    const milestonePoints: Milestone[] = [];

    // Create milestones every 5kg or 10% of total weight to lose
    const interval = Math.min(5, Math.max(2, diff / 5));
    
    if (start > goal) {
      // Losing weight
      for (let w = start - interval; w > goal; w -= interval) {
        const achieved = currentWeight <= w;
        const entry = weightHistory.find(e => achieved && e.weight <= w && e.weight > w - interval);
        milestonePoints.push({
          weight: parseFloat(w.toFixed(1)),
          achieved,
          date: entry?.date,
        });
      }
    } else {
      // Gaining weight
      for (let w = start + interval; w < goal; w += interval) {
        const achieved = currentWeight >= w;
        const entry = weightHistory.find(e => achieved && e.weight >= w && e.weight < w + interval);
        milestonePoints.push({
          weight: parseFloat(w.toFixed(1)),
          achieved,
          date: entry?.date,
        });
      }
    }

    return milestonePoints;
  }, [startWeight, goalWeight, currentWeight, weightHistory]);

  const chartData = weightHistory.slice(-30).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
    fullDate: entry.date,
  }));

  return (
    <>
      {/* Achievement Celebration */}
      {celebrateAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in shadow-2xl">
            <img 
              src={doodleCharacters.celebration} 
              alt="Kutlama" 
              className="w-24 h-24 object-contain mx-auto mb-4 animate-bounce"
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tebrikler! 🎉</h2>
            <p className="text-lg text-gray-600">Hedef kilonuza ulaştınız!</p>
          </div>
        </div>
      )}

      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={doodleCharacters.scale} 
                alt="Terazi" 
                className="w-8 h-8 object-contain"
              />
              <span>Kilo Takibi</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGoalDialog(true)}
                className="bg-white"
              >
                <Target className="h-4 w-4 mr-1" />
                Hedef
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ekle
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Current Weight Display */}
          {currentWeight !== null ? (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Güncel Kilonuz</p>
                  <p className="text-5xl font-bold text-gray-900 mb-2">{currentWeight.toFixed(1)}</p>
                  <p className="text-lg text-gray-600">kg</p>
                  
                  {weightChange !== 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {weightChange > 0 ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      )}
                      <span className={`text-base font-semibold ${weightChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                      </span>
                      <span className="text-sm text-gray-500">son ölçümden</span>
                    </div>
                  )}
                </div>
                <img 
                  src={doodleCharacters.scale} 
                  alt="Terazi" 
                  className="w-24 h-24 object-contain opacity-60"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2">
              <img 
                src={doodleCharacters.scale} 
                alt="Terazi" 
                className="w-20 h-20 object-contain mx-auto mb-4 animate-bounce"
              />
              <p className="text-lg text-gray-700 font-medium mb-2">Henüz kilo kaydı yok</p>
              <p className="text-sm text-gray-600 mb-4">İlk kaydınızı ekleyerek başlayın!</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Kaydı Ekle
              </Button>
            </div>
          )}

          {/* Statistics Cards */}
          {currentWeight !== null && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2">
                <p className="text-xs text-gray-600 mb-1">Toplam Değişim</p>
                <p className={`text-2xl font-bold ${stats.totalChange < 0 ? 'text-green-600' : stats.totalChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2">
                <p className="text-xs text-gray-600 mb-1">{language === 'tr' ? 'Haftalık Ort.' : 'Weekly Avg.'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageWeeklyChange.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">kg/hafta</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2">
                <p className="text-xs text-gray-600 mb-1">Takip Günü</p>
                <p className="text-2xl font-bold text-gray-900">{stats.daysTracking}</p>
                <p className="text-xs text-gray-500">gün</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2">
                <p className="text-xs text-gray-600 mb-1">Ölçüm Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.entriesCount}</p>
                <p className="text-xs text-gray-500">kayıt</p>
              </div>
            </div>
          )}

          {/* Goal Display */}
          {goalWeight && currentWeight !== null && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-gray-900">Hedef Kilonuz: {goalWeight} kg</span>
                </div>
                <span className="text-sm font-bold text-amber-600">{stats.goalProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-4 border-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                >
                  {stats.goalProgress > 10 && (
                    <Star className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {Math.abs(stats.goalRemaining).toFixed(1)} kg kaldı
              </p>
            </div>
          )}

          {/* Tabs */}
          {chartData.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="chart">Grafik</TabsTrigger>
                <TabsTrigger value="milestones">Hedefler</TabsTrigger>
                <TabsTrigger value="history">Geçmiş</TabsTrigger>
              </TabsList>

              {/* Chart Tab */}
              <TabsContent value="chart" className="mt-4">
                <div className="bg-white rounded-xl p-4 border-2">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <img 
                      src={doodleCharacters.chart} 
                      alt="Grafik" 
                      className="w-5 h-5 object-contain"
                    />
                    Son 30 Gün
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorWeightArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '13px',
                          padding: '8px 12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Kilo']}
                      />
                      
                      {/* Goal Line */}
                      {goalWeight && (
                        <ReferenceLine 
                          y={goalWeight} 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{ 
                            value: `Hedef`, 
                            position: 'right',
                            fill: '#f59e0b',
                            fontSize: 11,
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                      
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        fill="url(#colorWeightArea)"
                        stroke="none"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} 
                        activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones" className="mt-4">
                <div className="space-y-3">
                  {milestones.length > 0 ? (
                    milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                          milestone.achieved
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {milestone.achieved ? (
                            <Trophy className="h-6 w-6 text-green-600" />
                          ) : (
                            <Target className="h-6 w-6 text-gray-400" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{milestone.weight} kg</p>
                            {milestone.achieved && milestone.date && (
                              <p className="text-xs text-gray-600">
                                {new Date(milestone.date).toLocaleDateString('tr-TR')}
                              </p>
                            )}
                          </div>
                        </div>
                        {milestone.achieved && (
                          <span className="text-green-600 font-bold text-sm">✓ Başarıldı</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2">
                      <Target className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium">Hedef Belirlenmedi</p>
                      <p className="text-sm text-gray-600 mt-1">Hedef belirleyerek ara hedeflerinizi takip edin</p>
                      <Button
                        size="sm"
                        onClick={() => setShowGoalDialog(true)}
                        className="mt-3 bg-amber-600 hover:bg-amber-700"
                      >
                        Hedef Belirle
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                <div className="space-y-2">
                  {weightHistory.length > 0 ? (
                    weightHistory.slice(-10).reverse().map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 hover:border-purple-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 rounded-full p-2">
                            <Scale className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{entry.weight} kg</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{entry.note}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Henüz kayıt yok</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Motivational Message */}
          {currentWeight !== null && (
            <div className={`rounded-xl p-4 border-2 flex items-center gap-3 ${
              stats.trend === 'down' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : stats.trend === 'up' 
                ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' 
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
            }`}>
              <img 
                src={
                  stats.trend === 'down' 
                    ? doodleCharacters.celebration 
                    : stats.trend === 'up' 
                    ? doodleCharacters.dumbbell 
                    : doodleCharacters.heart
                } 
                alt="Karakter" 
                className="w-12 h-12 object-contain"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {stats.trend === 'down' && 'Harika gidiyorsun! 🎉'}
                  {stats.trend === 'up' && 'Devam et, sen yaparsın! 💪'}
                  {stats.trend === 'stable' && 'Süper bir denge! 👍'}
                </p>
                <p className="text-sm text-gray-600">
                  {stats.trend === 'down' && `${Math.abs(stats.totalChange).toFixed(1)} kg verdin!`}
                  {stats.trend === 'up' && 'Hedefine odaklan ve devam et!'}
                  {stats.trend === 'stable' && 'Kilonu koruyorsun!'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Weight Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img 
                src={doodleCharacters.scale} 
                alt="Terazi" 
                className="w-6 h-6 object-contain"
              />
              Yeni Kilo Kaydı
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="weight">Kilonuz (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Örn: 75.5"
                value={newWeight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWeight(e.target.value)}
                className="text-lg"
              />
            </div>
            <div>
              <Label htmlFor="note">Not (opsiyonel)</Label>
              <Input
                id="note"
                placeholder="Örn: Sabah açken ölçüldü"
                value={newNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAddWeight} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-amber-600" />
              Hedef Kilo Belirle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="goal">Hedef Kilonuz (kg)</Label>
              <Input
                id="goal"
                type="number"
                step="0.1"
                placeholder="Örn: 70"
                value={goalInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalInput(e.target.value)}
                className="text-lg"
              />
              {currentWeight && goalInput && (
                <p className="text-sm text-gray-600 mt-2">
                  Hedef: {Math.abs(currentWeight - parseFloat(goalInput)).toFixed(1)} kg {currentWeight > parseFloat(goalInput) ? 'vermek' : 'almak'}
                </p>
              )}
            </div>
            <Button 
              onClick={handleSetGoal} 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Hedefi Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
