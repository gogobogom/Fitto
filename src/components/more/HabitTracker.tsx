'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { DoodleHeader } from '../DoodleHeader';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Target, Flame, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HabitTrackerProps {
  onBack: () => void;
}

interface Habit {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly';
  targetValue: number;
  unit: string;
  icon: string;
  color: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
}

const HABIT_ICONS = ['💪', '🏃', '📚', '💧', '🧘', '🎯', '✍️', '🎨'];
const HABIT_COLORS = [
  'bg-red-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-pink-100',
];

export default function HabitTracker({ onBack }: HabitTrackerProps) {
  const { t } = useLanguage();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'Daily' as 'Daily' | 'Weekly',
    targetValue: 1,
    unit: t('habits.times'),
    icon: '🎯',
    color: 'bg-blue-100',
  });

  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    const savedLogs = localStorage.getItem('habitLogs');
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const handleAddHabit = (): void => {
    if (!newHabit.name.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      frequency: newHabit.frequency,
      targetValue: newHabit.targetValue,
      unit: newHabit.unit,
      icon: newHabit.icon,
      color: newHabit.color,
    };

    const updated = [...habits, habit];
    setHabits(updated);
    localStorage.setItem('habits', JSON.stringify(updated));

    setNewHabit({
      name: '',
      frequency: 'Daily',
      targetValue: 1,
      unit: t('habits.times'),
      icon: '🎯',
      color: 'bg-blue-100',
    });
    setIsDialogOpen(false);
  };

  const logHabit = (habitId: string, value: number): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = logs.findIndex(
      (log: HabitLog) => log.habitId === habitId && log.date === today
    );

    let updated: HabitLog[];
    if (existing >= 0) {
      updated = logs.map((log: HabitLog, i: number) => (i === existing ? { ...log, value } : log));
    } else {
      const newLog: HabitLog = {
        id: Date.now().toString(),
        habitId,
        date: today,
        value,
      };
      updated = [...logs, newLog];
    }

    setLogs(updated);
    localStorage.setItem('habitLogs', JSON.stringify(updated));
  };

  const getTodayLog = (habitId: string): HabitLog | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find((log: HabitLog) => log.habitId === habitId && log.date === today);
  };

  const getStreak = (habitId: string): number => {
    const habitLogs = logs
      .filter((log: HabitLog) => log.habitId === habitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < habitLogs.length; i++) {
      const logDate = new Date(habitLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === i && habitLogs[i].value > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title={t('habits.title')} subtitle={t('habits.subtitle')} emoji="🎯" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {t('habits.addNew')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('habits.newHabit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="habit-name">{t('habits.habitName')}</Label>
              <Input
                id="habit-name"
                value={newHabit.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewHabit((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t('habits.habitPlaceholder')}
              />
            </div>

            <div>
              <Label>{t('habits.frequency')}</Label>
              <Select
                value={newHabit.frequency}
                onValueChange={(value: string) =>
                  setNewHabit((prev) => ({ ...prev, frequency: value as 'Daily' | 'Weekly' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">{t('habits.daily')}</SelectItem>
                  <SelectItem value="Weekly">{t('habits.weekly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target">{t('habits.target')}</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={newHabit.targetValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewHabit((prev) => ({
                      ...prev,
                      targetValue: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="unit">{t('habits.unit')}</Label>
                <Input
                  id="unit"
                  value={newHabit.unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewHabit((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder={t('habits.times')}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('habits.icon')}</Label>
              <div className="flex gap-2">
                {HABIT_ICONS.map((icon: string) => (
                  <button
                    key={icon}
                    onClick={() => setNewHabit((prev) => ({ ...prev, icon }))}
                    className={`text-2xl p-2 rounded border-2 ${
                      newHabit.icon === icon ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('habits.color')}</Label>
              <div className="flex gap-2">
                {HABIT_COLORS.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setNewHabit((prev) => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-full border-2 ${color} ${
                      newHabit.color === color
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddHabit} className="w-full">
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {habits.map((habit: Habit) => {
          const todayLog = getTodayLog(habit.id);
          const streak = getStreak(habit.id);
          const currentValue = todayLog?.value || 0;
          const progress = (currentValue / habit.targetValue) * 100;

          return (
            <Card key={habit.id} className={habit.color}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{habit.name}</h3>
                        <p className="text-sm text-gray-600">
                          {t('habits.target')}: {habit.targetValue} {habit.unit} /{' '}
                          {habit.frequency === 'Daily' ? t('habits.day') : t('habits.week')}
                        </p>
                      </div>
                    </div>

                    {streak > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-lg">{streak}</span>
                          </div>
                          <p className="text-xs text-gray-500">{t('habits.streak')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {t('habits.today')}: {currentValue} / {habit.targetValue} {habit.unit}
                      </span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => logHabit(habit.id, Math.max(0, currentValue - 1))}
                      disabled={currentValue === 0}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={currentValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        logHabit(habit.id, parseInt(e.target.value) || 0)
                      }
                      className="text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => logHabit(habit.id, currentValue + 1)}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => logHabit(habit.id, habit.targetValue)}
                      disabled={currentValue >= habit.targetValue}
                    >
                      {t('habits.complete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {habits.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">{t('habits.noHabitsYet')}</p>
              <p className="text-sm text-gray-400">{t('habits.clickToStart')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
