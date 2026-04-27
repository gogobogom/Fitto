'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DoodleHeader } from '../DoodleHeader';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Footprints, TrendingUp, Calendar, Award, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StepEntry {
  id: string;
  date: string;
  steps: number;
  distance: number;
  calories: number;
  activeMinutes: number;
}

interface StepTrackerProps {
  onBack: () => void;
}

export default function StepTracker({ onBack }: StepTrackerProps) {
  const [entries, setEntries] = useState<StepEntry[]>([]);
  const [steps, setSteps] = useState<string>('');
  const [activeMinutes, setActiveMinutes] = useState<string>('');
  const dailyGoal = 10000;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stepEntries');
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    }
  }, []);

  const saveEntry = (): void => {
    if (!steps || parseInt(steps) <= 0) return;

    const stepsNum = parseInt(steps);
    const minutesNum = parseInt(activeMinutes) || 0;
    const distance = (stepsNum * 0.762) / 1000; // Average: 0.762m per step
    const calories = Math.round(stepsNum * 0.04); // Approx 0.04 cal per step

    const newEntry: StepEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      steps: stepsNum,
      distance: parseFloat(distance.toFixed(2)),
      calories: calories,
      activeMinutes: minutesNum,
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stepEntries', JSON.stringify(updated));
    }
    setSteps('');
    setActiveMinutes('');
  };

  const deleteEntry = (id: string): void => {
    const updated = entries.filter((e: StepEntry) => e.id !== id);
    setEntries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stepEntries', JSON.stringify(updated));
    }
  };

  const todayEntry = entries.find(
    (e: StepEntry) => e.date === new Date().toISOString().split('T')[0]
  );
  const todaySteps = todayEntry?.steps || 0;
  const progressPercent = Math.min((todaySteps / dailyGoal) * 100, 100);

  const weekData = entries
    .slice(0, 7)
    .reverse()
    .map((e: StepEntry) => ({
      date: new Date(e.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
      steps: e.steps,
    }));

  const totalSteps = entries.reduce((sum: number, e: StepEntry) => sum + e.steps, 0);
  const totalDistance = entries.reduce((sum: number, e: StepEntry) => sum + e.distance, 0);
  const totalCalories = entries.reduce((sum: number, e: StepEntry) => sum + e.calories, 0);
  const avgSteps = entries.length > 0 ? Math.round(totalSteps / entries.length) : 0;

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title="Adım Sayacı" subtitle="Günlük adım ve aktivite takibi" emoji="🚶" />

      {/* Stats Card */}
      <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {todaySteps.toLocaleString('tr-TR')}
            </div>
            <p className="text-gray-600 mb-4">Bugünkü Adımlar</p>
            <Progress value={progressPercent} className="h-3 mb-2" />
            <p className="text-sm text-gray-500">
              Hedef: {dailyGoal.toLocaleString('tr-TR')} adım ({progressPercent.toFixed(0)}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{avgSteps.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">Ortalama Adım</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalDistance.toFixed(1)} km</p>
            <p className="text-xs text-gray-600">Toplam Mesafe</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalCalories.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">Toplam Kalori</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            <p className="text-xs text-gray-600">Aktif Gün</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      {weekData.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Haftalık İlerleme</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Adım Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="steps">Adım Sayısı *</Label>
            <Input
              id="steps"
              type="number"
              placeholder="Örn: 8500"
              value={steps}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSteps(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="minutes">Aktif Dakika (Opsiyonel)</Label>
            <Input
              id="minutes"
              type="number"
              placeholder="Örn: 45"
              value={activeMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActiveMinutes(e.target.value)}
            />
          </div>

          <Button onClick={saveEntry} className="w-full" disabled={!steps}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Geçmiş</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Henüz kayıt yok</p>
          ) : (
            entries.map((entry: StepEntry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">
                      {entry.steps.toLocaleString('tr-TR')} adım
                    </p>
                    {entry.steps >= dailyGoal && (
                      <Badge className="bg-green-500">Hedef!</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(entry.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.distance} km • {entry.calories} kal
                    {entry.activeMinutes > 0 && ` • ${entry.activeMinutes} dk`}
                  </p>
                </div>
                <Button
                  onClick={() => deleteEntry(entry.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                >
                  Sil
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
