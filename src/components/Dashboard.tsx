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

  // Set current date on mount
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    setCurrentDate(dateStr);
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
      <div className="max-w-2xl mx-auto p-4 pt-6 pb-40">
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
              onNavigate={setActiveTab}
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
    </div>
  );
}
