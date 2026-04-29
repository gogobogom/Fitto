'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

const MAX_GLASSES = 8;
const ML_PER_GLASS = 250;
const STORAGE_KEY = 'fitto_water_glasses';

const todayStr = (): string => new Date().toISOString().split('T')[0];

export function WaterTracking() {
  const { t } = useLanguage();
  const [glasses, setGlasses] = useState<number>(0);
  const [animatingGlass, setAnimatingGlass] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Read auth + load today's water row from Supabase (or fall back to localStorage)
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      if (user?.id) {
        const { data, error } = await supabase
          .from('water_logs')
          .select('glasses')
          .eq('user_id', user.id)
          .eq('date', todayStr())
          .maybeSingle();
        if (!cancelled && !error && data) {
          setGlasses(data.glasses ?? 0);
        } else if (!cancelled) {
          // No row yet — keep 0 (or migrate from localStorage if present)
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            const parsed = cached ? parseInt(cached, 10) : 0;
            if (!Number.isNaN(parsed) && parsed > 0 && parsed <= MAX_GLASSES) {
              setGlasses(parsed);
              // Migrate to DB
              await supabase.from('water_logs').upsert(
                {
                  user_id: user.id,
                  date: todayStr(),
                  glasses: parsed,
                  ml: parsed * ML_PER_GLASS,
                },
                { onConflict: 'user_id,date' },
              );
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            /* ignore */
          }
        }
      } else {
        // Logged-out fallback (shouldn't normally happen on the dashboard)
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = parseInt(cached, 10);
            if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= MAX_GLASSES) {
              setGlasses(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setHydrated(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to realtime updates so multi-device users stay in sync
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`water_logs_${userId}_${todayStr()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'water_logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { date?: string; glasses?: number } | null;
          if (row?.date === todayStr() && typeof row.glasses === 'number') {
            setGlasses(row.glasses);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Persist (debounced) on every change
  const persist = useCallback(
    (next: number): void => {
      if (!hydrated) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (userId) {
          await supabase.from('water_logs').upsert(
            {
              user_id: userId,
              date: todayStr(),
              glasses: next,
              ml: next * ML_PER_GLASS,
            },
            { onConflict: 'user_id,date' },
          );
        } else {
          try {
            localStorage.setItem(STORAGE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }
      }, 350);
    },
    [hydrated, userId],
  );

  const handleGlassClick = (index: number): void => {
    if (index < glasses) {
      const next = index;
      setGlasses(next);
      persist(next);
    } else {
      setAnimatingGlass(index);
      setTimeout(() => {
        const next = index + 1;
        setGlasses(next);
        setAnimatingGlass(null);
        persist(next);
      }, 300);
    }
  };

  const getMotivationMessage = (): string => {
    if (glasses === 0) return t('water.clickToStart');
    if (glasses >= MAX_GLASSES) return t('water.goalCompleted');
    if (glasses >= MAX_GLASSES / 2) return t('water.halfway');
    return t('water.greatStart');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50" data-testid="water-tracking-card">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{t('water.title')}</h3>
          <p className="text-sm text-gray-600">{t('water.tip')}</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: MAX_GLASSES }).map((_, index) => {
            const isFilled = index < glasses;
            const isAnimating = index === animatingGlass;

            return (
              <button
                key={index}
                onClick={() => handleGlassClick(index)}
                data-testid={`water-glass-${index}`}
                className={`
                  relative flex flex-col items-center justify-center p-2
                  transition-all duration-300
                  ${isAnimating ? 'scale-110' : 'hover:scale-105'}
                `}
                aria-label={`${t('water.glasses')} ${index + 1}`}
              >
                <div className="relative w-12 h-12">
                  <Image
                    src={
                      isFilled
                        ? 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/31268136-2d23-42be-bdd8-3ac0dd686ed2-yh0Ra4sHYIKalDDewKa9JLnywUnwSm'
                        : 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/eaedb681-90c7-43bb-8ffe-dcc22406c737-sEpR6WBUYxwNtjQecE5k4enTf3Pz2e'
                    }
                    alt="Glass"
                    width={48}
                    height={48}
                    className={`
                      transition-all duration-300
                      ${isFilled ? 'opacity-100 brightness-110' : 'opacity-50 grayscale'}
                    `}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600" data-testid="water-glass-count">
              {glasses} / {MAX_GLASSES} {t('water.glasses')} ({glasses * ML_PER_GLASS} ml)
            </span>
            <span className="font-semibold text-blue-600">
              {Math.round((glasses / MAX_GLASSES) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(glasses / MAX_GLASSES) * 100}%` }}
            />
          </div>
        </div>

        <div
          className={`
          text-center p-3 rounded-lg border-2
          ${
            glasses >= MAX_GLASSES
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }
        `}
        >
          <p className="text-sm font-medium">{getMotivationMessage()}</p>
        </div>
      </div>
    </Card>
  );
}
