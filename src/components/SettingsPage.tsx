'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { ChevronLeft, User, Bell, Ruler, Trash2, Info, Save, AlertTriangle, Crown, Languages, Edit } from 'lucide-react';
import type { Gender, ActivityLevel, GoalType } from '@/types/supabase';
import type { SupabaseConnection } from '../hooks/useSupabase';
import { toast } from 'sonner';
import { SubscriptionManager } from './SubscriptionManager';
import { useLanguage } from '@/contexts/LanguageContext';
import { EditProfileDialog } from './EditProfileDialog';
import { EditGoalsDialog } from './EditGoalsDialog';
import { supabase } from '@/lib/supabase/client';

interface SettingsPageProps {
  connection: SupabaseConnection | null;
  onBack: () => void;
}

type UnitSystem = 'metric' | 'imperial';

interface NotificationSettings {
  breakfastEnabled: boolean;
  breakfastTime: string;
  lunchEnabled: boolean;
  lunchTime: string;
  dinnerEnabled: boolean;
  dinnerTime: string;
  waterEnabled: boolean;
  waterInterval: number;
}

export function SettingsPage({ connection, onBack }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'units' | 'data' | 'subscription' | 'language' | 'about'>('account');
  const { language, setLanguage, t } = useLanguage();
  
  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);
  const [editGoalsOpen, setEditGoalsOpen] = useState<boolean>(false);
  
  // Current user ID
  const [userId, setUserId] = useState<string>('');
  
  // Account settings
  const [username, setUsername] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [targetWeightKg, setTargetWeightKg] = useState<string>('');
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState<string>('');
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    breakfastEnabled: false,
    breakfastTime: '08:00',
    lunchEnabled: false,
    lunchTime: '12:00',
    dinnerEnabled: false,
    dinnerTime: '19:00',
    waterEnabled: false,
    waterInterval: 60,
  });

  // Unit preferences
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Load user profile
  useEffect(() => {
    void loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      // Get current user from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return;
      }

      setUserId(user.id);

      // Load profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile load error:', profileError);
      } else if (profileData) {
        setUsername(profileData.username || profileData.full_name || '');
        setAge(profileData.age?.toString() || '');
        setWeightKg(profileData.weight_kg?.toString() || '');
        setHeightCm(profileData.height_cm?.toString() || '');
      }

      // Load goals from Supabase
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalsError && goalsError.code !== 'PGRST116') {
        console.error('Goals load error:', goalsError);
      } else if (goalsData) {
        setTargetWeightKg(goalsData.target_weight_kg?.toString() || '');
        setDailyCalorieTarget(goalsData.daily_calorie_target?.toString() || '');
      }

      // Load notification settings from localStorage (with safety checks)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedNotifications = localStorage.getItem('fitto_notifications');
        if (savedNotifications) {
          try {
            setNotifications(JSON.parse(savedNotifications));
          } catch (parseError: unknown) {
            console.error('Failed to parse notifications:', parseError);
          }
        }

        // Load unit preferences from localStorage
        const savedUnits = localStorage.getItem('fitto_unit_system');
        if (savedUnits) {
          setUnitSystem(savedUnits as UnitSystem);
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Settings load error:', errorMsg);
    }
  };

  const handleSaveNotifications = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('fitto_notifications', JSON.stringify(notifications));
        toast.success(t('settings.notificationsSaved'));
      } else {
        toast.error(t('settings.localStorageUnavailable'));
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Bildirim ayarları kaydedilemedi:', errorMsg);
      toast.error(t('settings.notificationsSaveError'));
    }
  };

  const handleSaveUnits = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('fitto_unit_system', unitSystem);
        toast.success(t('settings.unitsSaved'));
      } else {
        toast.error(t('settings.localStorageUnavailable'));
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Birim tercihleri kaydedilemedi:', errorMsg);
      toast.error(t('settings.unitsSaveError'));
    }
  };

  const handleClearData = () => {
    try {
      if (typeof window !== 'undefined') {
        if (window.confirm(t('settings.confirmClearData'))) {
          if (window.localStorage) {
            localStorage.clear();
            toast.success(t('settings.localDataCleared'));
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            toast.error(t('settings.localStorageUnavailable'));
          }
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Veri temizleme hatası:', errorMsg);
      toast.error(t('settings.dataClearError'));
    }
  };

  const convertWeight = (kg: number): string => {
    if (unitSystem === 'metric') {
      return `${kg.toFixed(1)} kg`;
    }
    return `${(kg * 2.20462).toFixed(1)} lbs`;
  };

  const convertHeight = (cm: number): string => {
    if (unitSystem === 'metric') {
      return `${cm} cm`;
    }
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black">
        <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md mb-2">{t('settings.title')}</h1>
        <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('settings.description')}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeSection === 'account' ? 'default' : 'outline'}
          onClick={() => setActiveSection('account')}
          className="font-doodle whitespace-nowrap"
        >
          <User className="mr-2 h-4 w-4" />
          {t('settings.account')}
        </Button>
        <Button
          variant={activeSection === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveSection('notifications')}
          className="font-doodle whitespace-nowrap"
        >
          <Bell className="mr-2 h-4 w-4" />
          {t('settings.notifications')}
        </Button>
        <Button
          variant={activeSection === 'units' ? 'default' : 'outline'}
          onClick={() => setActiveSection('units')}
          className="font-doodle whitespace-nowrap"
        >
          <Ruler className="mr-2 h-4 w-4" />
          {t('settings.units')}
        </Button>
        <Button
          variant={activeSection === 'data' ? 'default' : 'outline'}
          onClick={() => setActiveSection('data')}
          className="font-doodle whitespace-nowrap"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('settings.data')}
        </Button>
        <Button
          variant={activeSection === 'subscription' ? 'default' : 'outline'}
          onClick={() => setActiveSection('subscription')}
          className="font-doodle whitespace-nowrap"
        >
          <Crown className="mr-2 h-4 w-4" />
          {t('settings.subscription')}
        </Button>
        <Button
          variant={activeSection === 'language' ? 'default' : 'outline'}
          onClick={() => setActiveSection('language')}
          className="font-doodle whitespace-nowrap"
        >
          <Languages className="mr-2 h-4 w-4" />
          {t('settings.language')}
        </Button>
        <Button
          variant={activeSection === 'about' ? 'default' : 'outline'}
          onClick={() => setActiveSection('about')}
          className="font-doodle whitespace-nowrap"
        >
          <Info className="mr-2 h-4 w-4" />
          {t('settings.about')}
        </Button>
      </div>

      {/* Account Settings */}
      {activeSection === 'account' && (
        <div className="space-y-4">
          {/* Profile Information */}
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/34f91c1e-3781-4dbd-b224-711cec832916-EVRJX2Oe1AX7bZHTUOStNXB7vBfR66" alt="Profil" className="w-6 h-6 object-contain" />
                  Profil Bilgileri
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditProfileOpen(true)}
                  className="font-doodle"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </CardTitle>
              <CardDescription className="font-doodle-alt">
                Kişisel bilgilerinizi görüntüleyin ve güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-doodle text-gray-500">İsim</p>
                  <p className="font-doodle-alt font-semibold">{username || '—'}</p>
                </div>
                <div>
                  <p className="font-doodle text-gray-500">Yaş</p>
                  <p className="font-doodle-alt font-semibold">{age || '—'}</p>
                </div>
                <div>
                  <p className="font-doodle text-gray-500">Kilo</p>
                  <p className="font-doodle-alt font-semibold">{weightKg ? `${weightKg} kg` : '—'}</p>
                </div>
                <div>
                  <p className="font-doodle text-gray-500">Boy</p>
                  <p className="font-doodle-alt font-semibold">{heightCm ? `${heightCm} cm` : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  🎯 Hedefler
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditGoalsOpen(true)}
                  className="font-doodle"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </CardTitle>
              <CardDescription className="font-doodle-alt">
                Kilo ve kalori hedeflerinizi yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-doodle text-gray-500">Hedef Kilo</p>
                  <p className="font-doodle-alt font-semibold">{targetWeightKg ? `${targetWeightKg} kg` : '—'}</p>
                </div>
                <div>
                  <p className="font-doodle text-gray-500">Günlük Kalori</p>
                  <p className="font-doodle-alt font-semibold">{dailyCalorieTarget ? `${dailyCalorieTarget} kcal` : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Settings */}
      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle">🔔 {t('settings.mealReminders')}</CardTitle>
              <CardDescription className="font-doodle-alt">{t('settings.mealRemindersDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Breakfast */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="breakfast" className="font-doodle text-base">{t('settings.breakfast')}</Label>
                  <Switch
                    id="breakfast"
                    checked={notifications.breakfastEnabled}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, breakfastEnabled: checked })
                    }
                  />
                </div>
                {notifications.breakfastEnabled && (
                  <Input
                    type="time"
                    value={notifications.breakfastTime}
                    onChange={(e) =>
                      setNotifications({ ...notifications, breakfastTime: e.target.value })
                    }
                    className="font-doodle-alt"
                  />
                )}
              </div>

              <Separator />

              {/* Lunch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lunch" className="font-doodle text-base">{t('settings.lunch')}</Label>
                  <Switch
                    id="lunch"
                    checked={notifications.lunchEnabled}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, lunchEnabled: checked })
                    }
                  />
                </div>
                {notifications.lunchEnabled && (
                  <Input
                    type="time"
                    value={notifications.lunchTime}
                    onChange={(e) =>
                      setNotifications({ ...notifications, lunchTime: e.target.value })
                    }
                    className="font-doodle-alt"
                  />
                )}
              </div>

              <Separator />

              {/* Dinner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dinner" className="font-doodle text-base">{t('settings.dinner')}</Label>
                  <Switch
                    id="dinner"
                    checked={notifications.dinnerEnabled}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, dinnerEnabled: checked })
                    }
                  />
                </div>
                {notifications.dinnerEnabled && (
                  <Input
                    type="time"
                    value={notifications.dinnerTime}
                    onChange={(e) =>
                      setNotifications({ ...notifications, dinnerTime: e.target.value })
                    }
                    className="font-doodle-alt"
                  />
                )}
              </div>

              <Separator />

              {/* Water Reminder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="water" className="font-doodle text-base">{t('settings.waterReminder')}</Label>
                  <Switch
                    id="water"
                    checked={notifications.waterEnabled}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, waterEnabled: checked })
                    }
                  />
                </div>
                {notifications.waterEnabled && (
                  <div className="space-y-2">
                    <Label className="font-doodle-alt text-sm">{t('settings.interval')}</Label>
                    <Select
                      value={notifications.waterInterval.toString()}
                      onValueChange={(value: string) =>
                        setNotifications({ ...notifications, waterInterval: parseInt(value, 10) })
                      }
                    >
                      <SelectTrigger className="font-doodle-alt">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">{t('settings.minutes30')}</SelectItem>
                        <SelectItem value="60">{t('settings.hour1')}</SelectItem>
                        <SelectItem value="90">{t('settings.hours1_5')}</SelectItem>
                        <SelectItem value="120">{t('settings.hours2')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveNotifications} className="w-full font-doodle">
                <Save className="mr-2 h-4 w-4" />
                {t('settings.saveNotifications')}
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="font-doodle-alt text-sm">
              {t('settings.notificationPermission')}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Unit Preferences */}
      {activeSection === 'units' && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="font-doodle">📏 {t('settings.unitPreferences')}</CardTitle>
            <CardDescription className="font-doodle-alt">{t('settings.unitPreferencesDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="font-doodle text-base">{t('settings.measurementSystem')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={unitSystem === 'metric' ? 'default' : 'outline'}
                  onClick={() => setUnitSystem('metric')}
                  className="font-doodle h-20 flex-col"
                >
                  <span className="text-lg mb-1">📐</span>
                  <span>{t('settings.metric')}</span>
                  <span className="text-xs opacity-70">kg, cm</span>
                </Button>
                <Button
                  variant={unitSystem === 'imperial' ? 'default' : 'outline'}
                  onClick={() => setUnitSystem('imperial')}
                  className="font-doodle h-20 flex-col"
                >
                  <span className="text-lg mb-1">📏</span>
                  <span>{t('settings.imperial')}</span>
                  <span className="text-xs opacity-70">lbs, ft/in</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-doodle text-base font-semibold">{t('settings.preview')}</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 font-doodle-alt">
                <p>{t('settings.weight')}: {weightKg ? convertWeight(parseFloat(weightKg)) : '—'}</p>
                <p>{t('settings.height')}: {heightCm ? convertHeight(parseFloat(heightCm)) : '—'}</p>
              </div>
            </div>

            <Button onClick={handleSaveUnits} className="w-full font-doodle">
              <Save className="mr-2 h-4 w-4" />
              {t('settings.saveUnits')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      {activeSection === 'data' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle">🗄️ {t('settings.dataManagement')}</CardTitle>
              <CardDescription className="font-doodle-alt">{t('settings.dataManagementDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-doodle font-semibold mb-2">{t('settings.dataExport')}</h3>
                <p className="text-sm mb-3 font-doodle-alt">
                  {t('settings.dataExportDesc')}
                </p>
                <Button variant="outline" className="font-doodle" onClick={() => {
                  const data = {
                    profile: { username, age, weightKg, heightCm },
                    goals: { targetWeightKg, dailyCalorieTarget },
                    notifications,
                    unitSystem,
                    exportDate: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fitto-export-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  toast.success(t('settings.dataExported'));
                }}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.downloadJSON')}
                </Button>
              </div>

              <Separator />

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-doodle font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('settings.clearLocalData')}
                </h3>
                <p className="text-sm mb-3 font-doodle-alt">
                  {t('settings.clearLocalDataDesc')}
                </p>
                <Button variant="outline" onClick={handleClearData} className="font-doodle">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('settings.clearLocalData')}
                </Button>
              </div>

              <Separator />

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-doodle font-semibold mb-2 text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('settings.dangerZone')}
                </h3>
                <p className="text-sm mb-3 font-doodle-alt text-red-600 dark:text-red-300">
                  {t('settings.dangerZoneDesc')}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="font-doodle"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('settings.deleteAccountPermanently')}
                </Button>

                {showDeleteConfirm && (
                  <Alert className="mt-4 border-red-500">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="font-doodle-alt">
                      {t('settings.confirmDelete')}
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            toast.error(t('settings.deleteAccountNotAvailable'));
                            setShowDeleteConfirm(false);
                          }}
                          className="font-doodle"
                        >
                          {t('settings.yesDelete')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="font-doodle"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Section */}
      {activeSection === 'subscription' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {t('subscription.title')}
              </CardTitle>
              <CardDescription className="font-doodle-alt">
                {t('subscription.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionManager connection={connection} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Language Settings */}
      {activeSection === 'language' && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="font-doodle">{t('settings.languageSettings')}</CardTitle>
            <CardDescription className="font-doodle-alt">{t('settings.languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="font-doodle text-base">{t('settings.language')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={language === 'tr' ? 'default' : 'outline'}
                  onClick={() => {
                    setLanguage('tr');
                    toast.success(t('settings.languageChangedTR'));
                  }}
                  className="font-doodle h-20 flex-col"
                >
                  <span className="text-lg mb-1">🇹🇷</span>
                  <span>{t('settings.turkish')}</span>
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => {
                    setLanguage('en');
                    toast.success(t('settings.languageChangedEN'));
                  }}
                  className="font-doodle h-20 flex-col"
                >
                  <span className="text-lg mb-1">🇬🇧</span>
                  <span>{t('settings.english')}</span>
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="font-doodle-alt text-sm">
                {language === 'tr' 
                  ? t('settings.languagePreferenceSaved')
                  : 'Your language preference has been saved on your device.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* About */}
      {activeSection === 'about' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="font-doodle">ℹ️ {t('settings.aboutTitle')}</CardTitle>
              <CardDescription className="font-doodle-alt">{t('settings.aboutDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🥗</div>
                <h2 className="text-2xl font-bold mb-2 font-doodle">Fitto</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-doodle-alt">{t('settings.version')}</p>
              </div>

              <Separator />

              <div className="space-y-3 font-doodle-alt">
                <p className="text-sm">
                  {t('settings.appDescription')}
                </p>
                <p className="text-sm">
                  {t('settings.features')}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full font-doodle" asChild>
                  <a href="mailto:support@fitto.app">
                    📧 {t('settings.contact')}: support@fitto.app
                  </a>
                </Button>
                <Button variant="outline" className="w-full font-doodle" asChild>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    🔒 {t('settings.privacyPolicy')}
                  </a>
                </Button>
                <Button variant="outline" className="w-full font-doodle" asChild>
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    📜 {t('settings.termsOfService')}
                  </a>
                </Button>
              </div>

              <Separator />

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-doodle-alt">
                <p>Made with ❤️ by Fitto Team</p>
                <p className="mt-1">© 2024 Fitto. {t('settings.allRightsReserved')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        userId={userId}
        onProfileUpdated={() => void loadUserData()}
      />

      {/* Edit Goals Dialog */}
      <EditGoalsDialog
        open={editGoalsOpen}
        onOpenChange={setEditGoalsOpen}
        userId={userId}
        currentWeight={parseFloat(weightKg) || undefined}
        onGoalsUpdated={() => void loadUserData()}
      />
    </div>
  );
}
