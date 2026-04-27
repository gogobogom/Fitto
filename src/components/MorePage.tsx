'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { RecipeManager } from './RecipeManager';
import { MealHistory } from './MealHistory';
import { CustomFoodManager } from './CustomFoodManager';
import { WeightTracker } from './WeightTracker';
import { MealPhotosGallery } from './MealPhotosGallery';
import { MealReminders } from './MealReminders';
import { HealthCalculators } from './HealthCalculators';
import { IntermittentFasting } from './intermittent-fasting';
import { EnhancedMealPlanner } from './EnhancedMealPlanner';
import { DetailedNutrition } from './detailed-nutrition';
import { ThemeSwitcher } from './theme-switcher';
import { DataExport } from './data-export';
import { BodyMeasurements } from './BodyMeasurements';
import { ProgressPhotos } from './ProgressPhotos';
import { FavoriteFoods } from './FavoriteFoods';
import EnhancedMoodTracker from './more/EnhancedMoodTracker';
import EnhancedSupplementTracker from './more/EnhancedSupplementTracker';
import HabitTracker from './more/HabitTracker';
import { EnhancedHabitTracker } from './EnhancedHabitTracker';
import StepTracker from './more/StepTracker';
import RestaurantFood from './more/RestaurantFood';
import GamificationHub from './more/GamificationHub';
import { SettingsPage } from './SettingsPage';
import { ChefHat, History, Apple, Settings, Bell, Calculator, Clock, Calendar, Microscope, Palette, Download, Ruler, Star, Smile, Target, Footprints, UtensilsCrossed, Lightbulb, Flame, ChevronRight } from 'lucide-react';
import { DoodleImage } from './DoodleImage';
import { DoodleHeader } from './DoodleHeader';
import { useLanguage } from '@/contexts/LanguageContext';
interface MorePageProps {
  userId: string;
}

type MoreView = 'menu' | 'recipes' | 'tips' | 'history' | 'foods' | 'weight' | 'photos' | 'reminders' | 'calculators' | 'fasting' | 'planner' | 'nutrition' | 'theme' | 'export' | 'measurements' | 'progress-photos' | 'favorites' | 'mood' | 'supplements' | 'habits' | 'steps' | 'restaurants' | 'gamification' | 'settings';

export function MorePage({ userId }: MorePageProps) {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<MoreView>('menu');
  const [showCustomFood, setShowCustomFood] = useState<boolean>(false);

  if (currentView === 'recipes') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.myRecipes')} subtitle={t('more.myRecipesDesc')} emoji="👨‍🍳" />
        <RecipeManager connection={null as any} userId={userId} />
      </div>
    );
  }

  if (currentView === 'tips') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.tipsGuide')} subtitle={t('more.tipsGuideDesc')} emoji="💡" />
        <div className="space-y-4">
          <Card className="doodle-card bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                {t('more.healthyNutrition')}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{t('more.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{t('more.tip2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{t('more.tip3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{t('more.tip4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{t('more.tip5')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="doodle-card bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {t('more.weightLossStrategies')}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t('more.strategy1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t('more.strategy2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t('more.strategy3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t('more.strategy4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t('more.strategy5')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="doodle-card bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                {t('more.metabolismBoost')}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{t('more.metabolism1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{t('more.metabolism2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{t('more.metabolism3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{t('more.metabolism4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{t('more.metabolism5')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="doodle-card bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Apple className="h-5 w-5 text-purple-600" />
                {t('more.healthySnacks')}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{t('more.snack1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{t('more.snack2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{t('more.snack3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{t('more.snack4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{t('more.snack5')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'history') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.mealHistory')} subtitle={t('more.mealHistoryDesc')} emoji="📜" />
        <MealHistory connection={null as any} currentDate={{year: 2025, month: 1, day: 1}} />
      </div>
    );
  }

  if (currentView === 'weight') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.weightTracking')} subtitle={t('more.weightTrackingDesc')} emoji="⚖️" />
        <WeightTracker userId={userId} />
      </div>
    );
  }

  if (currentView === 'photos') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.mealPhotos')} subtitle={t('more.mealPhotosDesc')} emoji="📸" />
        <MealPhotosGallery />
      </div>
    );
  }

  if (currentView === 'reminders') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.reminders')} subtitle={t('more.remindersDesc')} emoji="🔔" />
        <MealReminders />
      </div>
    );
  }

  if (currentView === 'calculators') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.calculators')} subtitle={t('more.calculatorsDesc')} emoji="🧮" />
        <HealthCalculators />
      </div>
    );
  }

  if (currentView === 'fasting') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.fasting')} subtitle={t('more.fastingDesc')} emoji="⏰" />
        <IntermittentFasting />
      </div>
    );
  }

  if (currentView === 'planner') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.mealPlanner')} subtitle={t('more.mealPlannerDesc')} emoji="📅" />
        <EnhancedMealPlanner />
      </div>
    );
  }

  if (currentView === 'nutrition') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.nutrition')} subtitle={t('more.nutritionDesc')} emoji="🔬" />
        <DetailedNutrition />
      </div>
    );
  }

  if (currentView === 'theme') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.theme')} subtitle={t('more.themeDesc')} emoji="🎨" />
        <ThemeSwitcher />
      </div>
    );
  }

  if (currentView === 'export') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.export')} subtitle={t('more.exportDesc')} emoji="📥" />
        <DataExport />
      </div>
    );
  }

  if (currentView === 'measurements') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.bodyMeasurements')} subtitle={t('more.bodyMeasurementsDesc')} emoji="📏" />
        <BodyMeasurements connection={null as any} />
      </div>
    );
  }

  if (currentView === 'progress-photos') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.progressPhotos')} subtitle={t('more.progressPhotosDesc')} emoji="📷" />
        <ProgressPhotos connection={null as any} />
      </div>
    );
  }

  if (currentView === 'favorites') {
    return (
      <div className="space-y-6 pb-40">
        <DoodleHeader onBack={() => setCurrentView('menu')} title={t('more.favoriteFoods')} subtitle={t('more.favoriteFoodsDesc')} emoji="⭐" />
        <FavoriteFoods connection={null as any} />
      </div>
    );
  }

  if (currentView === 'mood') {
    return (
      <div className="space-y-6 pb-40">
        <EnhancedMoodTracker onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'supplements') {
    return (
      <div className="space-y-6 pb-40">
        <EnhancedSupplementTracker onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'habits') {
    return (
      <div className="space-y-6 pb-40">
        <EnhancedHabitTracker onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'steps') {
    return (
      <div className="space-y-6 pb-40">
        <StepTracker onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'restaurants') {
    return (
      <div className="space-y-6 pb-40">
        <RestaurantFood onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'gamification') {
    return (
      <div className="space-y-6 pb-40">
        <GamificationHub onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="space-y-6 pb-40">
        <SettingsPage connection={null as any} onBack={() => setCurrentView('menu')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* Header */}
      <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md mb-2">{t('more.title')}</h1>
            <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('more.description')}</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <img src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/24e51862-7f77-414f-b431-820364610390-Fio5MCoUkJEXcsVz238Jx1IxobKoRj" alt="Daha Fazla" className="w-16 h-16 object-contain" />
          </div>
        </div>
      </div>

      {/* Menu Cards - Clean & Organized (YAZIO Style) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Featured - Full Width */}
        <Card
          className="doodle-card cursor-pointer hover:shadow-xl transition-all bg-gradient-to-br from-yellow-50 to-orange-50 col-span-2 border-2 border-orange-200"
          onClick={() => setCurrentView('tips')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shrink-0 shadow-md">
                <Lightbulb className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 font-doodle mb-0.5">{t('more.tipsGuide')}</h3>
                <p className="text-sm text-gray-600 font-doodle-alt">{t('more.tipsGuideDesc')}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Essential Features - Clean 2 Column Grid */}
        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200"
          onClick={() => setCurrentView('history')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-md">
                <History className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.history')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.historyDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200"
          onClick={() => setShowCustomFood(true)}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-md">
                <Apple className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.customFood')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.customFoodDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200"
          onClick={() => setCurrentView('measurements')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl shadow-md">
                <Ruler className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.measurements')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.measurementsDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200"
          onClick={() => setCurrentView('progress-photos')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl shadow-md">
                <img 
                  src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/126ab544-3cb2-41db-b9d3-7d6c706beacc-8e6wLZxuZYGwG29AYUNBdGNSm357zU" 
                  alt="Progress" 
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.progress')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.progressDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200"
          onClick={() => setCurrentView('favorites')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-md">
                <Star className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.favorites')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.favoritesDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-teal-50 to-green-50 border-2 border-teal-200"
          onClick={() => setCurrentView('mood')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-400 to-green-500 rounded-2xl shadow-md">
                <Smile className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.mood')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.moodDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200"
          onClick={() => setCurrentView('habits')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-md">
                <Target className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.habits')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.habitsDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="doodle-card cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-300"
          onClick={() => setCurrentView('settings')}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-gray-400 to-slate-500 rounded-2xl shadow-md">
                <Settings className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-doodle mb-0.5">{t('more.settings')}</h3>
                <p className="text-xs text-gray-600 font-doodle-alt">{t('more.settingsDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Food Dialog */}
      {showCustomFood && (
        <CustomFoodManager
          connection={null as any}
          onClose={() => setShowCustomFood(false)}
        />
      )}
    </div>
  );
}
