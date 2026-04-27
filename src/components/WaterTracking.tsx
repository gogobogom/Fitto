'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

const MAX_GLASSES = 8;

export function WaterTracking() {
  const { t } = useLanguage();
  const [glasses, setGlasses] = useState<number>(0);
  const [animatingGlass, setAnimatingGlass] = useState<number | null>(null);

  // Load from localStorage (safe for SSR)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('fitto_water_glasses');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= MAX_GLASSES) {
          setGlasses(parsed);
        }
      }
    } catch (error) {
      console.error('[WaterTracking] Failed to load water glasses:', error);
    }
  }, []);

  // Save to localStorage (safe for SSR, skip initial render)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Skip saving on initial load to prevent overwriting with default value
    const isInitialRender = glasses === 0 && !localStorage.getItem('fitto_water_glasses');
    if (isInitialRender) return;
    
    try {
      localStorage.setItem('fitto_water_glasses', glasses.toString());
    } catch (error) {
      console.error('[WaterTracking] Failed to save water glasses:', error);
    }
  }, [glasses]);

  const handleGlassClick = (index: number) => {
    if (index < glasses) {
      // Deselect
      setGlasses(index);
    } else {
      // Select
      setAnimatingGlass(index);
      setTimeout(() => {
        setGlasses(index + 1);
        setAnimatingGlass(null);
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
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{t('water.title')}</h3>
          <p className="text-sm text-gray-600">{t('water.tip')}</p>
        </div>

        {/* Glasses Grid */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: MAX_GLASSES }).map((_, index) => {
            const isFilled = index < glasses;
            const isAnimating = index === animatingGlass;

            return (
              <button
                key={index}
                onClick={() => handleGlassClick(index)}
                className={`
                  relative flex flex-col items-center justify-center p-2
                  transition-all duration-300
                  ${isAnimating ? 'scale-110' : 'hover:scale-105'}
                `}
                aria-label={`${t('water.glasses')} ${index + 1}`}
              >
                {/* Glass Image */}
                <div className="relative w-12 h-12">
                  <Image 
                    src={isFilled 
                      ? "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/31268136-2d23-42be-bdd8-3ac0dd686ed2-yh0Ra4sHYIKalDDewKa9JLnywUnwSm"
                      : "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/eaedb681-90c7-43bb-8ffe-dcc22406c737-sEpR6WBUYxwNtjQecE5k4enTf3Pz2e"
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

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{glasses} / {MAX_GLASSES} {t('water.glasses')}</span>
            <span className="font-semibold text-blue-600">{Math.round((glasses / MAX_GLASSES) * 100)}%</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(glasses / MAX_GLASSES) * 100}%` }}
            />
          </div>
        </div>

        {/* Motivation Message */}
        <div className={`
          text-center p-3 rounded-lg border-2
          ${glasses >= MAX_GLASSES 
            ? 'bg-green-50 border-green-300 text-green-700' 
            : 'bg-blue-50 border-blue-200 text-blue-700'}
        `}>
          <p className="text-sm font-medium">{getMotivationMessage()}</p>
        </div>
      </div>
    </Card>
  );
}
