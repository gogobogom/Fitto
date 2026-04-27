'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Plus, 
  Target, 
  Flame, 
  Award, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  Bell,
  Trash2,
  Edit2
} from 'lucide-react';
import { DoodleImage } from './DoodleImage';
import { DoodleHeader } from './DoodleHeader';
import { doodleCharacters } from '@/lib/doodleAssets';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedHabitTrackerProps {
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
  createdAt: string;
  reminder?: boolean;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
}

const HABIT_ICONS = ['💪', '🏃', '📚', '💧', '🧘', '🎯', '✍️', '🎨', '🍎', '😴', '🚶', '🏋️'];
const HABIT_COLORS = [
  'bg-red-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-orange-100',
  'bg-cyan-100',
];

export function EnhancedHabitTracker({ onBack }: EnhancedHabitTrackerProps) {
  const { t } = useLanguage();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeTab, setActiveTab] = useState<string>('today');

  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'Daily' as 'Daily' | 'Weekly',
    targetValue: 1,
    unit: t('habits.times'),
    icon: '🎯',
    color: 'bg-blue-100',
    reminder: false,
  });

  useEffect(() => {
    // 🛡️ SECURITY FIX: Safe JSON parse with error handling
    try {
      const savedHabits = localStorage.getItem('enhancedHabits');
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        setHabits(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('[Habits] Failed to parse saved habits:', error);
      localStorage.removeItem('enhancedHabits'); // Clear corrupted data
    }

    try {
      const savedLogs = localStorage.getItem('enhancedHabitLogs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        setLogs(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('[Habits] Failed to parse saved logs:', error);
      localStorage.removeItem('enhancedHabitLogs'); // Clear corrupted data
    }
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
      reminder: newHabit.reminder,
      createdAt: new Date().toISOString(),
    };

    const updated = [...habits, habit];
    setHabits(updated);
    localStorage.setItem('enhancedHabits', JSON.stringify(updated));

    setNewHabit({
      name: '',
      frequency: 'Daily',
      targetValue: 1,
      unit: t('habits.times'),
      icon: '🎯',
      color: 'bg-blue-100',
      reminder: false,
    });
    setIsDialogOpen(false);
  };

  const handleEditHabit = (): void => {
    if (!editingHabit || !newHabit.name.trim()) return;

    const updated = habits.map((h) =>
      h.id === editingHabit.id
        ? {
            ...h,
            name: newHabit.name,
            frequency: newHabit.frequency,
            targetValue: newHabit.targetValue,
            unit: newHabit.unit,
            icon: newHabit.icon,
            color: newHabit.color,
            reminder: newHabit.reminder,
          }
        : h
    );
    setHabits(updated);
    localStorage.setItem('enhancedHabits', JSON.stringify(updated));
    setEditingHabit(null);
    setIsDialogOpen(false);
  };

  const handleDeleteHabit = (habitId: string): void => {
    if (!confirm(t('habits.confirmDelete'))) return;
    
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    localStorage.setItem('enhancedHabits', JSON.stringify(updated));

    const updatedLogs = logs.filter((l) => l.habitId !== habitId);
    setLogs(updatedLogs);
    localStorage.setItem('enhancedHabitLogs', JSON.stringify(updatedLogs));
  };

  const openEditDialog = (habit: Habit): void => {
    setEditingHabit(habit);
    setNewHabit({
      name: habit.name,
      frequency: habit.frequency,
      targetValue: habit.targetValue,
      unit: habit.unit,
      icon: habit.icon,
      color: habit.color,
      reminder: habit.reminder || false,
    });
    setIsDialogOpen(true);
  };

  const logHabit = (habitId: string, value: number): void => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const existing = logs.findIndex(
      (log: HabitLog) => log.habitId === habitId && log.date === today
    );

    const completed = value >= habit.targetValue;
    let updated: HabitLog[];

    if (existing >= 0) {
      updated = logs.map((log: HabitLog, i: number) =>
        i === existing ? { ...log, value, completed } : log
      );
    } else {
      const newLog: HabitLog = {
        id: Date.now().toString(),
        habitId,
        date: today,
        value,
        completed,
      };
      updated = [...logs, newLog];
    }

    setLogs(updated);
    localStorage.setItem('enhancedHabitLogs', JSON.stringify(updated));
  };

  const getTodayLog = (habitId: string): HabitLog | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find((log: HabitLog) => log.habitId === habitId && log.date === today);
  };

  const getStreak = (habitId: string): number => {
    const habitLogs = logs
      .filter((log: HabitLog) => log.habitId === habitId && log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < habitLogs.length; i++) {
      const logDate = new Date(habitLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeeklyProgress = (habitId: string): number[] => {
    const weekLogs: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = logs.find((l) => l.habitId === habitId && l.date === dateStr);
      weekLogs.push(log?.completed ? 1 : 0);
    }
    return weekLogs;
  };

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = logs.filter((l) => l.date === today && l.completed).length;
    const totalHabits = habits.length;
    const longestStreak = Math.max(...habits.map((h) => getStreak(h.id)), 0);
    const totalCompletions = logs.filter((l) => l.completed).length;

    return {
      todayCompleted,
      totalHabits,
      todayProgress: totalHabits > 0 ? (todayCompleted / totalHabits) * 100 : 0,
      longestStreak,
      totalCompletions,
    };
  }, [habits, logs]);

  // Get weekDays array from translations
  const weekDays = t('habits.weekDays') as unknown as string[];

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title={t('habits.title')} subtitle={t('habits.subtitle')} emoji="🎯" />

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-2 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{stats.todayCompleted}</div>
            <div className="text-xs text-gray-600">{t('habits.today')}</div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6 text-center">
            <Flame className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-700">{stats.longestStreak}</div>
            <div className="text-xs text-gray-600">{t('habits.longestStreak')}</div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6 text-center">
            <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{stats.totalCompletions}</div>
            <div className="text-xs text-gray-600">{t('habits.total')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card className="border-2 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">{t('habits.dailyProgress')}</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {stats.todayCompleted} / {stats.totalHabits}
            </Badge>
          </div>
          <Progress value={stats.todayProgress} className="h-3" />
          <p className="text-xs text-gray-600 mt-2">
            {stats.todayProgress === 100
              ? t('habits.congratulations')
              : `${stats.totalHabits - stats.todayCompleted} ${t('habits.habitsRemaining')}`}
          </p>
        </CardContent>
      </Card>

      {/* Add Habit Button */}
      <Button onClick={() => { setEditingHabit(null); setIsDialogOpen(true); }} className="w-full bg-blue-600 hover:bg-blue-700">
        <Plus className="w-4 h-4 mr-2" />
        {t('habits.addNewHabit')}
      </Button>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">{t('habits.today')}</TabsTrigger>
          <TabsTrigger value="all">{t('habits.all')}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4 mt-4">
          {habits.length > 0 ? (
            habits.map((habit: Habit) => {
              const todayLog = getTodayLog(habit.id);
              const streak = getStreak(habit.id);
              const currentValue = todayLog?.value || 0;
              const progress = (currentValue / habit.targetValue) * 100;
              const isCompleted = todayLog?.completed || false;

              return (
                <Card
                  key={habit.id}
                  className={`border-2 ${habit.color} ${isCompleted ? 'opacity-75' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">{habit.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{habit.name}</h3>
                              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            </div>
                            <p className="text-sm text-gray-600">
                              {t('habits.target')}: {habit.targetValue} {habit.unit} /{' '}
                              {habit.frequency === 'Daily' ? t('habits.day') : t('habits.week')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {streak > 0 && (
                            <div className="text-center">
                              <div className="flex items-center gap-1">
                                <Flame className="w-5 h-5 text-orange-500" />
                                <span className="font-bold text-lg">{streak}</span>
                              </div>
                              <p className="text-xs text-gray-500">{t('habits.streak')}</p>
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(habit)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {t('habits.todayLabel')}: {currentValue} / {habit.targetValue} {habit.unit}
                          </span>
                          <span className="font-semibold">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
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
                          className="ml-auto bg-green-600 hover:bg-green-700"
                          onClick={() => logHabit(habit.id, habit.targetValue)}
                          disabled={isCompleted}
                        >
                          ✓ {t('habits.complete')}
                        </Button>
                      </div>

                      {/* Weekly Calendar */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        {weekDays.map((day: string, index: number) => {
                          const weekProgress = getWeeklyProgress(habit.id);
                          const completed = weekProgress[index];
                          return (
                            <div key={index} className="text-center">
                              <div className="text-xs text-gray-500 mb-1">{day}</div>
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {completed ? '✓' : '○'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="py-12 text-center">
                <DoodleImage character="empty" alt={t('habits.noHabitsYet')} size="xl" />
                <p className="text-gray-500 mt-4">{t('habits.noHabitsYet')}</p>
                <p className="text-sm text-gray-400">{t('habits.clickToStart')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {habits.map((habit: Habit) => {
            const streak = getStreak(habit.id);
            const completionRate =
              logs.filter((l) => l.habitId === habit.id && l.completed).length /
              Math.max(logs.filter((l) => l.habitId === habit.id).length, 1);

            return (
              <Card key={habit.id} className={`border-2 ${habit.color}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{habit.name}</h3>
                        <p className="text-sm text-gray-600">
                          {habit.frequency === 'Daily' ? t('habits.daily') : t('habits.weekly')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <div className="font-bold text-lg">{streak}</div>
                      <div className="text-xs text-gray-600">{t('habits.dailyStreak')}</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <div className="font-bold text-lg">{Math.round(completionRate * 100)}%</div>
                      <div className="text-xs text-gray-600">{t('habits.successRate')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingHabit(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHabit ? t('habits.editHabit') : t('habits.newHabit')}</DialogTitle>
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
                <Label htmlFor="target">{t('habits.targetValue')}</Label>
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
                  placeholder={t('habits.unitPlaceholder')}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('habits.icon')}</Label>
              <div className="grid grid-cols-6 gap-2">
                {HABIT_ICONS.map((icon: string) => (
                  <button
                    key={icon}
                    onClick={() => setNewHabit((prev) => ({ ...prev, icon }))}
                    className={`text-2xl p-2 rounded border-2 ${
                      newHabit.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('habits.color')}</Label>
              <div className="flex gap-2 flex-wrap">
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

            <Button 
              onClick={editingHabit ? handleEditHabit : handleAddHabit} 
              className="w-full"
            >
              {editingHabit ? t('habits.update') : t('habits.add')}
            </Button>

            {editingHabit && (
              <Button 
                onClick={() => handleDeleteHabit(editingHabit.id)} 
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('habits.deleteHabit')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
