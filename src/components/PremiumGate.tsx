'use client';

/**
 * PremiumGate
 *
 * Lightweight wrapper that hides its children behind a "Premium Feature"
 * paywall card unless `useSubscription()` reports `isPremium === true`.
 *
 * Usage:
 *   <PremiumGate featureName="Detaylı Kilo Takibi" onUpgradeClick={...}>
 *     <WeightProgressChart ... />
 *   </PremiumGate>
 */

import type { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Crown, Lock } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PremiumGateProps {
  children: ReactNode;
  featureName?: string;
  description?: string;
  onUpgradeClick?: () => void;
}

export function PremiumGate({ children, featureName, description, onUpgradeClick }: PremiumGateProps) {
  const { isPremium } = useSubscription();
  const { language } = useLanguage();

  if (isPremium) return <>{children}</>;

  const title = language === 'tr' ? 'Premium Özellik' : 'Premium Feature';
  const subtitle =
    description ??
    (language === 'tr'
      ? `${featureName ?? 'Bu özellik'} Premium üyelikle açılır.`
      : `${featureName ?? 'This feature'} is available with Premium.`);
  const ctaLabel = language === 'tr' ? "Premium'a Geç" : 'Upgrade to Premium';

  return (
    <Card
      data-testid="premium-gate"
      className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-md"
    >
      <CardContent className="flex flex-col items-center text-center gap-3 py-8 px-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border border-amber-300 flex items-center justify-center">
            <Lock className="h-3 w-3 text-amber-600" aria-hidden="true" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-amber-900">{title}</h3>
        <p className="text-sm text-amber-800/90 max-w-xs">{subtitle}</p>
        {onUpgradeClick && (
          <Button
            data-testid="premium-gate-upgrade-btn"
            onClick={onUpgradeClick}
            className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md"
          >
            {ctaLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
