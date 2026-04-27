'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Smile, Meh, Frown, Battery, BatteryLow, BatteryMedium, BatteryFull, TrendingUp, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { DoodleImage } from '../DoodleImage';
import { DoodleHeader } from '../DoodleHeader';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedMoodTrackerProps {
  onBack: () => void;
}

interface MoodEntry {
  id: string;
  date: string;
  moodScore: number;
  energyScore: number;
  notes?: string;
  caloriesConsumed?: number;
}

const getMoodEmojis = (t: (key: string) => string) => [
  { value: 1, icon: Frown, label: t('mood.veryBad'), color: 'text-red-500', bg: 'bg-red-100', description: '😢 ' + t('mood.veryBad') },
  { value: 2, icon: Frown, label: t('mood.bad'), color: 'text-orange-500', bg: 'bg-orange-100', description: '😕 ' + t('mood.bad') },
  { value: 3, icon: Meh, label: t('mood.neutral'), color: 'text-yellow-500', bg: 'bg-yellow-100', description: '😐 ' + t('mood.neutral') },
  { value: 4, icon: Smile, label: t('mood.good'), color: 'text-lime-500', bg: 'bg-lime-100', description: '🙂 ' + t('mood.good') },
  { value: 5, icon: Smile, label: t('mood.excellent'), color: 'text-green-500', bg: 'bg-green-100', description: '😄 ' + t('mood.excellent') }
];

const getEnergyLevels = (t: (key: string) => string) => [
  { value: 1, icon: BatteryLow, label: t('mood.veryLow'), color: 'text-red-500', bg: 'bg-red-100' },
  { value: 2, icon: BatteryLow, label: t('mood.low'), color: 'text-orange-500', bg: 'bg-orange-100' },
  { value: 3, icon: BatteryMedium, label: t('mood.neutral'), color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { value: 4, icon: BatteryFull, label: t('mood.high'), color: 'text-lime-500', bg: 'bg-lime-100' },
  { value: 5, icon: BatteryFull, label: t('mood.veryHigh'), color: 'text-green-500', bg: 'bg-green-100' }
];

export default function EnhancedMoodTracker({ onBack }: EnhancedMoodTrackerProps) {
  const { t, language } = useLanguage();
  const MOOD_EMOJIS = getMoodEmojis(t);
  const ENERGY_LEVELS = getEnergyLevels(t);
  const [moodScore, setMoodScore] = useState<number>(3);
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('today');

  useEffect(() => {
    // 🛡️ SECURITY FIX: Safe JSON parse with error handling
    try {
      const saved = localStorage.getItem('moodEntries');
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('[Mood] Failed to parse mood entries:', error);
      localStorage.removeItem('moodEntries'); // Clear corrupted data
    }
  }, []);

  const handleSave = (): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = entries.findIndex((e: MoodEntry) => e.date === today);

    // Get today's calories from localStorage
    let dailyLogs: Array<{ date: string; totalCalories?: number }> = [];
    try {
      const saved = localStorage.getItem('dailyLogs');
      if (saved) {
        const parsed = JSON.parse(saved);
        dailyLogs = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('[Mood] Failed to parse daily logs:', error);
    }
    const todayLog = dailyLogs.find((log: { date: string }) => log.date === today);
    const caloriesConsumed = todayLog?.totalCalories || 0;

    let updated: MoodEntry[];
    if (existing >= 0) {
      updated = entries.map((e: MoodEntry, i: number) =>
        i === existing ? { ...e, moodScore, energyScore, notes: notes || undefined, caloriesConsumed } : e
      );
    } else {
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        date: today,
        moodScore,
        energyScore,
        notes: notes || undefined,
        caloriesConsumed,
      };
      updated = [newEntry, ...entries];
    }

    setEntries(updated);
    localStorage.setItem('moodEntries', JSON.stringify(updated));
    setNotes('');
  };

  // Statistics
  const last7Days = entries.slice(0, 7);
  const avgMood = last7Days.length > 0 
    ? (last7Days.reduce((sum, e) => sum + e.moodScore, 0) / last7Days.length).toFixed(1)
    : '0';
  const avgEnergy = last7Days.length > 0 
    ? (last7Days.reduce((sum, e) => sum + e.energyScore, 0) / last7Days.length).toFixed(1)
    : '0';
  
  // Mood-Calorie correlation
  const moodCalorieData = entries
    .filter(e => e.caloriesConsumed !== undefined)
    .slice(0, 14)
    .reverse()
    .map((entry: MoodEntry) => {
      const [year, month, day] = entry.date.split('-');
      return {
        date: `${day}/${month}`,
        mood: entry.moodScore,
        calories: Math.round((entry.caloriesConsumed || 0) / 100) // Scale down for better visualization
      };
    });

  const chartData = entries
    .slice(0, 14)
    .reverse()
    .map((entry: MoodEntry) => {
      const [year, month, day] = entry.date.split('-');
      return {
        date: `${day}/${month}`,
        mood: entry.moodScore,
        energy: entry.energyScore,
      };
    });

  // Get mood character
  const currentMoodData = MOOD_EMOJIS.find(m => m.value === moodScore);
  const currentEnergyData = ENERGY_LEVELS.find(e => e.value === energyScore);

  // Weekly summary
  const weeklyMoodCounts = last7Days.reduce((acc, entry) => {
    const moodLabel = MOOD_EMOJIS.find(m => m.value === entry.moodScore)?.label || 'Unknown';
    acc[moodLabel] = (acc[moodLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weeklyReport = Object.entries(weeklyMoodCounts).map(([mood, count]) => ({
    mood,
    count
  }));

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title={t('mood.title')} subtitle={t('mood.subtitle')} emoji="😊" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">{t('exercise.today')}</TabsTrigger>
          <TabsTrigger value="trends">{t('stats.nutrientTrends')}</TabsTrigger>
          <TabsTrigger value="history">{t('mood.history')}</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6">
          {/* Doodle Character based on mood */}
          <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 relative">
                  <DoodleImage 
                    character={moodScore >= 4 ? 'celebration' : moodScore >= 3 ? 'heart' : 'empty'}
                    alt={t('mood.yourMood')}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{currentMoodData?.description}</h3>
                  <p className="text-sm text-gray-600">
                    {t('mood.subtitle')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle>{t('mood.todayStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block text-base font-semibold">{t('mood.yourMood')}</Label>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_EMOJIS.map(({ value, icon: Icon, label, color, bg }) => (
                    <button
                      key={value}
                      onClick={() => setMoodScore(value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        moodScore === value
                          ? 'border-purple-500 bg-purple-100 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${moodScore === value ? color : 'text-gray-400'}`} />
                      <span className="text-xs text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-base font-semibold">{t('mood.yourEnergy')}</Label>
                <div className="grid grid-cols-5 gap-2">
                  {ENERGY_LEVELS.map(({ value, icon: Icon, label, color, bg }) => (
                    <button
                      key={value}
                      onClick={() => setEnergyScore(value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        energyScore === value
                          ? 'border-purple-500 bg-purple-100 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${energyScore === value ? color : 'text-gray-400'}`} />
                      <span className="text-xs text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t('mood.notesOptional')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder={t('mood.notesPlaceholder')}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                {t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{avgMood}</div>
                  <p className="text-sm text-gray-600 mt-1">{t('stats.average')} {t('mood.mood')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('stats.last7Days')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">{avgEnergy}</div>
                  <p className="text-sm text-gray-600 mt-1">{t('stats.average')} {t('mood.energy')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('stats.last7Days')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mood Trend Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t('mood.last14Days')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} name={t('mood.mood')} />
                    <Line type="monotone" dataKey="energy" stroke="#ec4899" strokeWidth={2} name={t('mood.energy')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Weekly Mood Distribution */}
          {weeklyReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {t('stats.weekly')} {t('mood.mood')} {t('stats.macroDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyReport}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mood" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Mood-Calorie Correlation */}
          {moodCalorieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('mood.mood')} - {t('stats.calorie')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {language === 'tr' ? 'Kalori alımınız ile ruh haliniz arasındaki ilişkiyi görün' : 'See the relationship between your calorie intake and mood'}
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodCalorieData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} name={t('mood.mood')} />
                    <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} name={t('stats.calorie') + ' (x100)'} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('mood.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries.slice(0, 30).map((entry: MoodEntry) => {
                  const moodEmoji = MOOD_EMOJIS.find((m) => m.value === entry.moodScore);
                  const energyIcon = ENERGY_LEVELS.find((e) => e.value === entry.energyScore);
                  const MoodIcon = moodEmoji?.icon || Meh;
                  const EnergyIcon = energyIcon?.icon || Battery;

                  return (
                    <div
                      key={entry.id}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-gray-800">
                          {new Date(entry.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <MoodIcon className={`w-5 h-5 ${moodEmoji?.color}`} />
                            <span className="text-sm">{moodEmoji?.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <EnergyIcon className={`w-5 h-5 ${energyIcon?.color}`} />
                            <span className="text-sm">{energyIcon?.label}</span>
                          </div>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded">
                          {entry.notes}
                        </p>
                      )}
                      {entry.caloriesConsumed !== undefined && (
                        <p className="text-xs text-gray-500 mt-2">
                          📊 {t('meals.calories')}: {entry.caloriesConsumed} kcal
                        </p>
                      )}
                    </div>
                  );
                })}
                {entries.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4">
                      <DoodleImage character="heart" alt={t('mood.noEntriesYet')} size="xl" className="w-full h-full" />
                    </div>
                    <p className="text-gray-500">{t('more.noRecords')}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('mood.noEntriesYet')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
