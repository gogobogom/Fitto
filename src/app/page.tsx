'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../hooks/useSupabase';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { Onboarding } from '../components/Onboarding';
import { Dashboard } from '../components/Dashboard';

import { Card, CardContent } from '../components/ui/card';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAddMiniApp } from '@/hooks/useAddMiniApp';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { useIsInFarcaster } from '@/hooks/useIsInFarcaster';
import { useLanguage } from '@/contexts/LanguageContext';
import AICoachOrchestrator from '@/components/ai/AICoachOrchestrator';
import type { Gender, ActivityLevel, GoalType } from '@/types/supabase';
import { supabase } from '@/lib/supabase/client';

type SessionUser = { id: string; email?: string | null };

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return !localStorage.getItem('fitto_welcomed');
    return true;
  });

  // --- Farcaster (only run when inside Farcaster)
  const { addMiniApp } = useAddMiniApp();
  const isInFarcaster = useIsInFarcaster();
  useQuickAuth(isInFarcaster);

  // --- Your existing hook (may depend on SpacetimeDB)
  const {
    connected,
    identity,
    statusMessage,
    userProfile,
    userGoals,
    dailySummary,
    connection,
    foodItems,
    isConnecting,
  } = useSupabase();

  // --- Supabase session fallback (this is what unblocks the "stuck on teal" issue)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [supabaseChecked, setSupabaseChecked] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (!mounted) return;

        setSessionUser(u ? { id: u.id, email: u.email } : null);
        setSupabaseChecked(true);

        // If we already have a session, don't let "isConnecting" trap the UI forever
        if (u) setForceReady(true);
      } catch {
        if (!mounted) return;
        setSupabaseChecked(true);
      }
    };

    void load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setSessionUser(u ? { id: u.id, email: u.email } : null);
      setSupabaseChecked(true);
      if (u) setForceReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // If hook isConnecting never resolves, break out after a short delay (but only if Supabase already checked)
  useEffect(() => {
    if (!supabaseChecked) return;
    if (forceReady) return;

    const timer = setTimeout(() => {
      // After 2.5s, if Supabase says we have a session, stop waiting on hook flags
      if (sessionUser) setForceReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [supabaseChecked, forceReady, sessionUser]);

  const effectiveIdentity = useMemo(() => {
    // Prefer hook identity; fallback to Supabase user id
    return identity ?? sessionUser?.id ?? null;
  }, [identity, sessionUser]);

  const effectiveConnected = useMemo(() => {
    // Prefer hook connected; fallback to "session exists"
    return connected || !!sessionUser;
  }, [connected, sessionUser]);

  const effectiveIsConnecting = useMemo(() => {
    // If we forced ready due to Supabase session, do NOT show endless loading
    return isConnecting && !forceReady;
  }, [isConnecting, forceReady]);

  // --- Farcaster init (guarded)
  useEffect(() => {
    if (!isInFarcaster) return;

    let isMounted = true;

    const initializeFarcaster = async (): Promise<void> => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!isMounted) return;

        if (document.readyState !== 'complete') {
          await new Promise<void>((resolve) => {
            if (document.readyState === 'complete') resolve();
            else window.addEventListener('load', () => resolve(), { once: true });
          });
        }

        if (!isMounted) return;

        await sdk.actions.ready();

        if (isMounted) {
          try {
            await addMiniApp();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (!msg.includes('RejectedByUser')) console.error('Failed to add mini app:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    void initializeFarcaster();

    return () => {
      isMounted = false;
    };
  }, [addMiniApp, isInFarcaster]);

  // Central redirect logic (based on effective flags)
  useEffect(() => {
    if (showWelcome) return;
    if (effectiveIsConnecting) return;
    if (effectiveConnected) return;

    const timer = setTimeout(() => {
      if (effectiveConnected || effectiveIsConnecting) return;
      router.push('/auth/login');
    }, 300);

    return () => clearTimeout(timer);
  }, [showWelcome, effectiveIsConnecting, effectiveConnected, router]);

  const handleWelcomeComplete = (): void => {
    if (typeof window !== 'undefined') localStorage.setItem('fitto_welcomed', 'true');
    setShowWelcome(false);
  };

  const handleOnboardingComplete = async (
    username: string,
    age: number,
    weightKg: number,
    heightCm: number,
    gender: Gender,
    activityLevel: ActivityLevel,
    goalType: GoalType,
    targetWeightKg: number,
    dailyCalorieTarget: number
  ): Promise<void> => {
    const uid = effectiveIdentity;
    if (!uid) {
      alert('Oturum bulunamadı. Lütfen tekrar giriş yap.');
      router.push('/auth/login');
      return;
    }

    try {
      // Prefer old connection reducers if available, otherwise do Supabase-only upserts
      if (connection?.reducers) {
        await connection.reducers.createOrUpdateUserProfile(
          username,
          age,
          weightKg,
          heightCm,
          gender,
          activityLevel
        );

        const proteinTarget = weightKg * 2;
        const carbsTarget = (dailyCalorieTarget * 0.5) / 4;
        const fatTarget = (dailyCalorieTarget * 0.3) / 9;

        await connection.reducers.setUserGoals(
          goalType,
          targetWeightKg,
          dailyCalorieTarget,
          proteinTarget,
          carbsTarget,
          fatTarget
        );

        window.location.reload();
        return;
      }

      // --- Supabase-only path (SpacetimeDB-free)
      const proteinTarget = weightKg * 2;
      const carbsTarget = (dailyCalorieTarget * 0.5) / 4;
      const fatTarget = (dailyCalorieTarget * 0.3) / 9;

      // 1) user_profiles upsert
      const { error: profileErr } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: uid,
            username,
            email: sessionUser?.email ?? null,
            age,
            weight_kg: weightKg,
            height_cm: heightCm,
            gender,
            activity_level: activityLevel,
          },
          { onConflict: 'user_id' }
        );

      if (profileErr) throw profileErr;

      // 2) user_goals upsert
      const { error: goalsErr } = await supabase
        .from('user_goals')
        .upsert(
          {
            user_id: uid,
            goal_type: goalType,
            target_weight_kg: targetWeightKg,
            daily_calorie_target: dailyCalorieTarget,
            protein_target_g: proteinTarget,
            carbs_target_g: carbsTarget,
            fat_target_g: fatTarget,
          },
          { onConflict: 'user_id' }
        );

      if (goalsErr) throw goalsErr;

      // Refresh to re-fetch data
      window.location.reload();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Profil oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // --- RENDER FLOW

  if (showWelcome) {
    return (
      <div className="relative">
        <WelcomeScreen onGetStarted={handleWelcomeComplete} />
      </div>
    );
  }

  // Loading (now guarded so it won't trap you forever if session exists)
  if (effectiveIsConnecting) {
    return (
      <div className="h-screen bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            <div className="text-4xl font-bold text-teal-600">F</div>
          </div>
          <h1 className="text-3xl font-bold text-white">Fitto</h1>
          <p className="text-white/80 text-sm">{statusMessage || 'Bağlanıyor…'}</p>
        </div>
      </div>
    );
  }

  // Not connected -> redirect effect will push to /auth/login
  if (!effectiveConnected) return null;

  // Connected but identity not ready (rare) -> small verifying screen
  if (!effectiveIdentity) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-20 md:py-16">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{t('connection.verifying')}</h2>
                <p className="text-gray-600">{t('connection.pleaseWait')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If profile missing -> onboarding (now works with Supabase-only)
  if (!userProfile) {
    return <Onboarding identity={effectiveIdentity} onComplete={handleOnboardingComplete} />;
  }

  // If old code still requires "connection" for dashboard, show a clear error instead of trapping
  if (!connection) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-20 md:py-16">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{t('connection.connectionError')}</h2>
                <p className="text-gray-600">
                  Şu an oturum var ama uygulama “connection” katmanını bekliyor. Bu katmanı Supabase-only
                  hale getirince Dashboard açılacak.
                </p>
                <button
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                  onClick={() => router.push('/auth/login')}
                >
                  Çıkış / Yeniden Giriş
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        identity={effectiveIdentity}
        userProfile={userProfile}
        userGoals={userGoals}
        dailySummary={dailySummary}
        connection={connection}
        foodItems={foodItems}
      />
      <AICoachOrchestrator identity={effectiveIdentity} />
    </>
  );
}
