'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DoodleHeader } from '../DoodleHeader';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown, Battery, BatteryLow, BatteryMedium, BatteryFull, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MoodTrackerProps {
  onBack: () => void;
}

interface MoodEntry {
  id: string;
  date: string;
  moodScore: number;
  energyScore: number;
  notes?: string;
}

const getMoodEmojis = (t: (key: string) => string) => [
  { value: 1, icon: Frown, label: t('mood.veryBad'), color: 'text-red-500' },
  { value: 2, icon: Frown, label: t('mood.bad'), color: 'text-orange-500' },
  { value: 3, icon: Meh, label: t('mood.neutral'), color: 'text-yellow-500' },
  { value: 4, icon: Smile, label: t('mood.good'), color: 'text-lime-500' },
  { value: 5, icon: Smile, label: t('mood.excellent'), color: 'text-green-500' }
];

const getEnergyLevels = (t: (key: string) => string) => [
  { value: 1, icon: BatteryLow, label: t('mood.veryLow'), color: 'text-red-500' },
  { value: 2, icon: BatteryLow, label: t('mood.low'), color: 'text-orange-500' },
  { value: 3, icon: BatteryMedium, label: t('mood.neutral'), color: 'text-yellow-500' },
  { value: 4, icon: BatteryFull, label: t('mood.high'), color: 'text-lime-500' },
  { value: 5, icon: BatteryFull, label: t('mood.veryHigh'), color: 'text-green-500' }
];

export default function MoodTracker({ onBack }: MoodTrackerProps) {
  const { t, language } = useLanguage();
  const MOOD_EMOJIS = getMoodEmojis(t);
  const ENERGY_LEVELS = getEnergyLevels(t);
  const [moodScore, setMoodScore] = useState<number>(3);
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('moodEntries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  const handleSave = (): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = entries.findIndex((e: MoodEntry) => e.date === today);

    let updated: MoodEntry[];
    if (existing >= 0) {
      updated = entries.map((e: MoodEntry, i: number) =>
        i === existing ? { ...e, moodScore, energyScore, notes: notes || undefined } : e
      );
    } else {
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        date: today,
        moodScore,
        energyScore,
        notes: notes || undefined,
      };
      updated = [newEntry, ...entries];
    }

    setEntries(updated);
    localStorage.setItem('moodEntries', JSON.stringify(updated));
    setNotes('');
  };

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

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title={t('mood.title')} subtitle={t('mood.subtitle')} emoji="😊" />

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle>{t('mood.todayStatus')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block text-base font-semibold">{t('mood.yourMood')}</Label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_EMOJIS.map(({ value, icon: Icon, label, color }) => (
                <button
                  key={value}
                  onClick={() => setMoodScore(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    moodScore === value
                      ? 'border-purple-500 bg-purple-100'
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
              {ENERGY_LEVELS.map(({ value, icon: Icon, label, color }) => (
                <button
                  key={value}
                  onClick={() => setEnergyScore(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    energyScore === value
                      ? 'border-purple-500 bg-purple-100'
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
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            {t('common.save')}
          </Button>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>{t('mood.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry: MoodEntry) => {
              const moodEmoji = MOOD_EMOJIS.find((m) => m.value === entry.moodScore);
              const energyIcon = ENERGY_LEVELS.find((e) => e.value === entry.energyScore);
              const MoodIcon = moodEmoji?.icon || Meh;
              const EnergyIcon = energyIcon?.icon || Battery;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {new Date(entry.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <MoodIcon className={`w-5 h-5 ${moodEmoji?.color}`} />
                      <EnergyIcon className={`w-5 h-5 ${energyIcon?.color}`} />
                    </div>
                  </div>
                  {entry.notes && <p className="text-sm text-gray-600 max-w-md truncate">{entry.notes}</p>}
                </div>
              );
            })}
            {entries.length === 0 && (
              <p className="text-center text-gray-500 py-4">{t('mood.noEntriesYet')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
