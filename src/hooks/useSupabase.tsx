'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { devLog } from '@/lib/secureStorage';
import type {
  UserProfile,
  UserGoals,
  FoodItem,
  DailyLog,
  ExerciseLog,
  DailySummary,
} from '@/types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SupabaseConnection {
  supabase: typeof supabase;
  userId: string;
  reducers: {
    createOrUpdateUserProfile: (
      username: string,
      age: number,
      weightKg: number,
      heightCm: number,
      gender: string,
      activityLevel: string
    ) => Promise<void>;
    setUserGoals: (
      goalType: string,
      targetWeightKg: number,
      dailyCalorieTarget: number,
      proteinTarget: number,
      carbsTarget: number,
      fatTarget: number
    ) => Promise<void>;
    addFoodItem: (
      name: string,
      nameTr: string,
      calories: number,
      protein: number,
      carbs: number,
      fat: number,
      fiber: number,
      category: string,
      isCustom: boolean
    ) => Promise<void>;
    logMeal: (
      foodItemId: bigint | string,
      mealType: unknown,
      portionGrams: number,
      date: unknown
    ) => Promise<void>;
    addExercise: (
      exerciseName: string,
      sets: number,
      reps: number,
      weight: number
    ) => Promise<void>;
    getDailySummary: (date: unknown) => Promise<void>;

    // yardımcı: profil/goals yeniden çek
    refreshProfile: () => Promise<void>;
    refreshGoals: () => Promise<void>;
  };
  db: {
    foodItem: {
      iter: () => IterableIterator<FoodItem>;
    };
  };
}

export interface SupabaseState {
  connected: boolean;
  userId: string | null;
  identity: string | null;
  statusMessage: string;
  userProfile: UserProfile | null;
  userGoals: UserGoals | null;
  foodItems: ReadonlyMap<string, FoodItem>;
  dailyLogs: ReadonlyMap<string, DailyLog>;
  exerciseLogs: ReadonlyMap<string, ExerciseLog>;
  dailySummary: DailySummary | null;
  isConnecting: boolean;
  connectionError: string | null;
  connection: SupabaseConnection | null;
}

export function useSupabase(): SupabaseState {
  const [connected, setConnected] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Supabase'e bağlanıyor...");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);

  const [foodItems, setFoodItems] = useState<ReadonlyMap<string, FoodItem>>(new Map());
  const [dailyLogs, setDailyLogs] = useState<ReadonlyMap<string, DailyLog>>(new Map());
  const [exerciseLogs, setExerciseLogs] = useState<ReadonlyMap<string, ExerciseLog>>(new Map());
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const authUnsubRef = useRef<null | (() => void)>(null);

  const clearRealtime = () => {
    if (channelsRef.current.length > 0) {
      devLog.log('Supabase abonelikleri temizleniyor...');
    }
    channelsRef.current.forEach((ch) => {
      supabase.removeChannel(ch);
    });
    channelsRef.current = [];
  };

  const loadProfile = async (currentUserId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (error) {
      devLog.error('Profil yükleme hatası:', error);
      return;
    }

    setUserProfile(data ?? null);

    if (data) {
      setStatusMessage(`Hoş geldin, ${data.username || data.full_name || 'kullanıcı'}!`);
    }
  };

  const loadGoals = async (currentUserId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (error) {
      devLog.error('Hedefler yükleme hatası:', error);
      return;
    }

    setUserGoals(data ?? null);
  };

  const loadOtherData = async (currentUserId: string): Promise<void> => {
    try {
      // daily summary (varsa)
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: summaryData, error: summaryError } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('date', today)
          .maybeSingle();

        if (summaryError) {
          if (!String(summaryError.message || '').includes('does not exist')) {
            devLog.error('Özet yükleme hatası:', summaryError);
          }
        } else {
          setDailySummary(summaryData ?? null);
        }
      } catch {
        // tablo yoksa sorun değil
      }

      // meals (FoodItem gibi kullanıyorsun)
      const { data: foodsData, error: foodsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', currentUserId);

      if (foodsError) {
        devLog.error('Yiyecekler yükleme hatası:', foodsError);
      } else if (foodsData) {
        const foodsMap = new Map<string, FoodItem>();
        foodsData.forEach((food: FoodItem) => foodsMap.set(food.id, food));
        setFoodItems(foodsMap);
      }

      // exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', currentUserId);

      if (exercisesError) {
        devLog.error('Egzersiz kayıtları yükleme hatası:', exercisesError);
      } else if (exercisesData) {
        const exercisesMap = new Map<string, ExerciseLog>();
        exercisesData.forEach((exercise: ExerciseLog) => exercisesMap.set(exercise.id, exercise));
        setExerciseLogs(exercisesMap);
      }

      // daily_logs placeholder
      setDailyLogs(new Map<string, DailyLog>());
    } catch (e) {
      devLog.error('Diğer veriler yüklenirken hata:', e);
    }
  };

  const subscribeToTables = (currentUserId: string): void => {
    clearRealtime();

    devLog.log('Supabase Realtime abonelikleri başlatılıyor...');

    const profileChannel = supabase
      .channel(`user_profiles_changes_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          devLog.log('Profil güncellemesi:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setUserProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(profileChannel);

    const goalsChannel = supabase
      .channel(`user_goals_changes_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_goals',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          devLog.log('Hedefler güncellemesi:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setUserGoals(payload.new as UserGoals);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(goalsChannel);

    const mealsChannel = supabase
      .channel(`meals_changes_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          devLog.log('Öğün güncellemesi:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const meal = payload.new as FoodItem;
            setFoodItems((prev) => new Map(prev).set(meal.id, meal));
          } else if (payload.eventType === 'DELETE') {
            const oldMeal = payload.old as FoodItem;
            setFoodItems((prev) => {
              const next = new Map(prev);
              next.delete(oldMeal.id);
              return next;
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(mealsChannel);

    const exercisesChannel = supabase
      .channel(`exercises_changes_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          devLog.log('Egzersiz güncellemesi:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const ex = payload.new as ExerciseLog;
            setExerciseLogs((prev) => new Map(prev).set(ex.id, ex));
          } else if (payload.eventType === 'DELETE') {
            const oldEx = payload.old as ExerciseLog;
            setExerciseLogs((prev) => {
              const next = new Map(prev);
              next.delete(oldEx.id);
              return next;
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(exercisesChannel);

    const summaryChannel = supabase
      .channel(`daily_summaries_changes_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_summaries',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          devLog.log('Günlük özet güncellemesi:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setDailySummary(payload.new as DailySummary);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(summaryChannel);

    devLog.log('Supabase Realtime abonelikleri başarılı');
  };

  const connectForUser = async (currentUserId: string, emailPreview?: string | null) => {
    setUserId(currentUserId);
    setConnected(true);
    setIsConnecting(false);
    setConnectionError(null);
    setStatusMessage(`Bağlandı: ${(emailPreview || 'kullanıcı').toString().substring(0, 8)}...`);

    await loadProfile(currentUserId);
    await loadGoals(currentUserId);
    await loadOtherData(currentUserId);

    subscribeToTables(currentUserId);
  };

  const resetToLoggedOut = () => {
    clearRealtime();
    setConnected(false);
    setUserId(null);
    setUserProfile(null);
    setUserGoals(null);
    setFoodItems(new Map());
    setDailyLogs(new Map());
    setExerciseLogs(new Map());
    setDailySummary(null);
    setIsConnecting(false);
    setConnectionError(null);
    setStatusMessage('Giriş yapmanız gerekiyor');
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        devLog.log('Supabase bağlantısı başlatılıyor...');

        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          devLog.error('[Supabase] getSession error:', error);
          resetToLoggedOut();
          return;
        }

        const sessionUser = data.session?.user;
        if (!sessionUser) {
          devLog.log('[Supabase] No active user session - user needs to login');
          resetToLoggedOut();
          return;
        }

        devLog.log('[Supabase] User session found:', sessionUser.id);
        await connectForUser(sessionUser.id, sessionUser.email ?? null);

        // Auth state değişirse yakala
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const u = session?.user;
          if (!u) {
            devLog.log('[Supabase] Auth state changed -> logged out');
            resetToLoggedOut();
            return;
          }
          devLog.log('[Supabase] Auth state changed -> user:', u.id);
          await connectForUser(u.id, u.email ?? null);
        });

        authUnsubRef.current = () => {
          sub.subscription.unsubscribe();
        };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
        devLog.error('[Supabase] Critical initialization error:', msg);
        resetToLoggedOut();
      }
    };

    void init();

    return () => {
      cancelled = true;
      clearRealtime();
      if (authUnsubRef.current) {
        authUnsubRef.current();
        authUnsubRef.current = null;
      }
    };
  }, []);

  const memoizedConnection = useMemo<SupabaseConnection | null>(() => {
    if (!userId || !connected) return null;

    return {
      supabase,
      userId,
      reducers: {
        createOrUpdateUserProfile: async (
          username: string,
          age: number,
          weightKg: number,
          heightCm: number,
          gender: string,
          activityLevel: string
        ): Promise<void> => {
          const { data: sessionData } = await supabase.auth.getSession();
          const email = sessionData.session?.user?.email ?? '';

          const { error } = await supabase
            .from('user_profiles')
            .upsert(
              {
                user_id: userId,
                full_name: username,
                username,
                email,
                age,
                weight_kg: weightKg,
                height_cm: heightCm,
                gender,
                activity_level: activityLevel,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) {
            devLog.error('Profil güncelleme hatası:', error);
            throw error;
          }

          // UI guard'ların hemen profile'ı görmesi için:
          await loadProfile(userId);
        },

        setUserGoals: async (
          goalType: string,
          targetWeightKg: number,
          dailyCalorieTarget: number,
          proteinTarget: number,
          carbsTarget: number,
          fatTarget: number
        ): Promise<void> => {
          const { error } = await supabase
            .from('user_goals')
            .upsert(
              {
                user_id: userId,
                goal_type: goalType,
                target_weight_kg: targetWeightKg,
                daily_calorie_target: dailyCalorieTarget,
                protein_target_g: proteinTarget,
                carbs_target_g: carbsTarget,
                fat_target_g: fatTarget,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) {
            devLog.error('Hedefler güncelleme hatası:', error);
            throw error;
          }

          await loadGoals(userId);
        },

        addFoodItem: async (
          _name: string,
          nameTr: string,
          calories: number,
          protein: number,
          carbs: number,
          fat: number,
          _fiber: number,
          category: string,
          _isCustom: boolean
        ): Promise<void> => {
          const { error } = await supabase.from('meals').insert({
            user_id: userId,
            meal_name: nameTr,
            calories,
            protein,
            carbs,
            fats: fat,
            notes: category,
            date: new Date().toISOString().split('T')[0],
          });

          if (error) {
            devLog.error('Yiyecek ekleme hatası:', error);
            throw error;
          }
        },

        logMeal: async (foodItemId, mealType, portionGrams, date): Promise<void> => {
          devLog.log('Meal logged:', { foodItemId, mealType, portionGrams, date });
        },

        addExercise: async (
          exerciseName: string,
          sets: number,
          reps: number,
          weight: number
        ): Promise<void> => {
          const { error } = await supabase.from('exercises').insert({
            user_id: userId,
            exercise_name: exerciseName,
            sets,
            reps,
            weight,
            date: new Date().toISOString().split('T')[0],
          });

          if (error) {
            devLog.error('Egzersiz ekleme hatası:', error);
            throw error;
          }
        },

        getDailySummary: async (date: unknown): Promise<void> => {
          devLog.log('Loading daily summary for date:', date);
        },

        refreshProfile: async (): Promise<void> => {
          await loadProfile(userId);
        },

        refreshGoals: async (): Promise<void> => {
          await loadGoals(userId);
        },
      },

      db: {
        foodItem: {
          iter: function* (): IterableIterator<FoodItem> {
            for (const item of foodItems.values()) yield item;
          },
        },
      },
    };
  }, [userId, connected, foodItems]);

  return {
    connected,
    userId,
    identity: userId,
    statusMessage,
    userProfile,
    userGoals,
    foodItems,
    dailyLogs,
    exerciseLogs,
    dailySummary,
    isConnecting,
    connectionError,
    connection: memoizedConnection,
  };
}
