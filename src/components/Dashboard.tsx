'use client';

import { useState, useEffect } from 'react';
import { AddMealDialog } from './AddMealDialog';
import { AddExerciseDialog } from './AddExerciseDialog';
import { DashboardNew } from './DashboardNew';
import { EnhancedDashboard } from './EnhancedDashboard';
import { Profile } from './Profile';
import { StatsPage } from './StatsPage';
import { BottomNav } from './BottomNav';
import { MorePage } from './MorePage';
import { MealTrackingPage } from './MealTrackingPage';
import { ExerciseTrackingPage } from './ExerciseTrackingPage';
import { MiraChat } from './MiraChat';
import { WellnessDNACard } from './WellnessDNA';
import { WifiOff } from 'lucide-react';
import type { UserProfile, UserGoals, DailySummary, FoodItem } from '@/types/supabase';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface DashboardProps {
  identity: string;
  userProfile: UserProfile;
  userGoals: UserGoals | null;
  dailySummary: DailySummary | null;
  connection: SupabaseConnection;
  foodItems: ReadonlyMap<string, FoodItem>;
}

export function Dashboard({ identity, userProfile, userGoals, dailySummary, connection, foodItems }: DashboardProps) {
  const userId = identity; // identity is already a string (Supabase user.id)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'profile' | 'recipes' | 'more' | 'meals' | 'exercise'>('dashboard');
  const [useEnhancedDashboard, setUseEnhancedDashboard] = useState<boolean>(true);
  const [showAddMeal, setShowAddMeal] = useState<boolean>(false);
  const [showAddExercise, setShowAddExercise] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  // Offline / connectivity banner. We treat the device's network status as
  // the source of truth (Supabase is reachable iff we have network). The
  // dashboard still renders cached props (`userProfile`, `userGoals`,
  // `dailySummary`) under the banner instead of going blank.
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Set current date on mount
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    setCurrentDate(dateStr);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const update = (): void => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const handleAddClick = (): void => {
    setShowAddMeal(true);
  };

  const handleMealCardClick = (): void => {
    setActiveTab('meals');
  };

  const handleExerciseClick = (): void => {
    setActiveTab('exercise');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50">
      {isOffline && (
        <div
          data-testid="dashboard-offline-banner"
          className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-100 text-amber-900 text-sm font-medium px-4 py-2 border-b border-amber-200"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>Çevrimdışı görünüyorsun — son senkronlanmış verilerini gösteriyoruz.</span>
        </div>
      )}
      <div className="max-w-2xl mx-auto p-4 pt-6 pb-40">
        {/* Wellness DNA — compact summary at the top of every tab */}
        {activeTab === 'dashboard' && (
          <div className="mb-4">
            <WellnessDNACard userId={userId} />
          </div>
        )}

        {activeTab === 'dashboard' && (
          useEnhancedDashboard ? (
            <EnhancedDashboard
              identity={identity}
              userProfile={userProfile}
              userGoals={userGoals}
              dailySummary={dailySummary}
              connection={connection}
              onAddMeal={handleAddClick}
              onAddExercise={() => setShowAddExercise(true)}
              onNavigate={(tab: string) => setActiveTab(tab as typeof activeTab)}
            />
          ) : (
            <DashboardNew
              identity={identity}
              userProfile={userProfile}
              userGoals={userGoals}
              dailySummary={dailySummary}
              connection={connection}
              onMealClick={handleMealCardClick}
              onExerciseClick={handleExerciseClick}
            />
          )
        )}

        {activeTab === 'meals' && (
          <MealTrackingPage
            connection={connection}
            currentDate={currentDate}
            onBack={() => setActiveTab('dashboard')}
            foodItems={foodItems}
          />
        )}

        {activeTab === 'exercise' && (
          <ExerciseTrackingPage
            connection={connection}
            currentDate={currentDate}
            onAddExercise={() => setShowAddExercise(true)}
          />
        )}

        {activeTab === 'profile' && (
          <Profile 
            userProfile={userProfile} 
            userGoals={userGoals} 
            connection={connection}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'recipes' && (
          <div className="min-h-screen">
            <iframe 
              src="/tarifler" 
              className="w-full h-screen border-0"
              title="Tarifler"
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <StatsPage 
            userId={userId}
          />
        )}

        {activeTab === 'more' && (
          <MorePage 
            userId={userId}
          />
        )}
      </div>

      <BottomNav
        activeTab={activeTab as 'dashboard' | 'stats' | 'recipes' | 'more'}
        onTabChange={(tab) => setActiveTab(tab)}
        onAddClick={handleAddClick}
      />

      {showAddMeal && (
        <AddMealDialog
          connection={connection}
          currentDate={currentDate}
          onClose={() => setShowAddMeal(false)}
          foodItems={foodItems}
        />
      )}

      {showAddExercise && (
        <AddExerciseDialog
          connection={connection}
          currentDate={currentDate}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      {/* Mira AI chatbot — floating launcher, app-wide post-auth */}
      <MiraChat />
    </div>
  );
}
