'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Bell, Plus, X, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealReminder {
  id: string;
  mealType: string;
  time: string;
  enabled: boolean;
}

const getDefaultReminders = (language: string): MealReminder[] => [
  { id: '1', mealType: language === 'tr' ? 'Kahvaltı' : 'Breakfast', time: '08:00', enabled: true },
  { id: '2', mealType: language === 'tr' ? 'Öğle' : 'Lunch', time: '12:30', enabled: true },
  { id: '3', mealType: language === 'tr' ? 'Akşam' : 'Dinner', time: '19:00', enabled: true },
];

export function MealReminders() {
  const { language } = useLanguage();
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newMealType, setNewMealType] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('meal_reminders');
    if (stored) {
      try {
        setReminders(JSON.parse(stored) as MealReminder[]);
      } catch (error) {
        console.error('Error loading reminders:', error);
        setReminders(getDefaultReminders(language));
      }
    } else {
      setReminders(getDefaultReminders(language));
      localStorage.setItem('meal_reminders', JSON.stringify(getDefaultReminders(language)));
    }
  }, []);

  const saveReminders = (updated: MealReminder[]): void => {
    localStorage.setItem('meal_reminders', JSON.stringify(updated));
    setReminders(updated);
  };

  const toggleReminder = (id: string): void => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveReminders(updated);
  };

  const deleteReminder = (id: string): void => {
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);
  };

  const addReminder = (): void => {
    if (!newMealType.trim() || !newTime) {
      alert(language === 'tr' ? 'Lütfen öğün tipi ve saat girin' : 'Please enter meal type and time');
      return;
    }

    const newReminder: MealReminder = {
      id: `reminder_${Date.now()}`,
      mealType: newMealType.trim(),
      time: newTime,
      enabled: true,
    };

    saveReminders([...reminders, newReminder]);
    setShowAddForm(false);
    setNewMealType('');
    setNewTime('');
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            {language === 'tr' ? 'Öğün Hatırlatıcıları' : 'Meal Reminders'}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            ℹ️ {language === 'tr' ? 'Hatırlatıcılar tarayıcınıza kaydedilir. Tarayıcı bildirimlerini aktifleştirmeyi unutmayın!' : 'Reminders are saved to your browser. Don\'t forget to enable browser notifications!'}
          </p>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-2">
            <div>
              <Label htmlFor="meal-type">{language === 'tr' ? 'Öğün Tipi' : 'Meal Type'}</Label>
              <Input
                id="meal-type"
                placeholder={language === 'tr' ? 'Örn: Ara Öğün' : 'e.g., Snack'}
                value={newMealType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMealType(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reminder-time">{language === 'tr' ? 'Saat' : 'Time'}</Label>
              <Input
                id="reminder-time"
                type="time"
                value={newTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addReminder} className="flex-1">{language === 'tr' ? 'Ekle' : 'Add'}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewMealType('');
                  setNewTime('');
                }}
              >
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border-2"
            >
              <div className="flex items-center gap-3 flex-1">
                <Clock className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{reminder.mealType}</p>
                  <p className="text-sm text-gray-600">{reminder.time}</p>
                </div>
                <Badge
                  variant={reminder.enabled ? 'default' : 'secondary'}
                  className={reminder.enabled ? 'bg-green-100 text-green-700' : ''}
                >
                  {reminder.enabled ? (language === 'tr' ? 'Aktif' : 'Active') : (language === 'tr' ? 'Kapalı' : 'Off')}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {reminders.length === 0 && !showAddForm && (
          <div className="text-center py-6 text-gray-600">
            {language === 'tr' ? 'Henüz hatırlatıcı yok' : 'No reminders yet'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
