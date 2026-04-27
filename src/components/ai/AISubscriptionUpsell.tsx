'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, Play } from 'lucide-react';

interface AISubscriptionUpsellProps {
  onStartTrial: () => void;
  onWatchAd: () => void;
  onClose: () => void;
}

export default function AISubscriptionUpsell({ onStartTrial, onWatchAd, onClose }: AISubscriptionUpsellProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/subscription');
    onClose();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-teal-50 to-orange-50 p-6">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="inline-block p-3 bg-teal-500 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t('aiCoach.title')}
        </h2>
        <p className="text-gray-600">
          {t('aiCoach.subtitle')}
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8">
        <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xl">✅</div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">Kişiselleştirilmiş öneriler</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xl">✅</div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">24/7 soru-cevap desteği</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xl">✅</div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">Besin analizi ve alternatifler</p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 mt-auto">
        {/* Free Trial */}
        <button
          onClick={onStartTrial}
          className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl">🎁</span>
            <span className="font-bold">{t('aiCoach.startTrial')}</span>
          </div>
          <p className="text-xs text-white/90">{t('aiCoach.startTrialDesc')}</p>
        </button>

        {/* Watch Ad */}
        <button
          onClick={onWatchAd}
          className="w-full bg-white border-2 border-teal-500 text-teal-700 rounded-xl p-4 shadow-md transition-all duration-200 hover:scale-105 hover:bg-teal-50"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Play className="w-5 h-5" />
            <span className="font-bold">{t('aiCoach.watchAd')}</span>
          </div>
          <p className="text-xs text-teal-600">{t('aiCoach.watchAdDesc')}</p>
        </button>

        {/* Premium Upgrade */}
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-800 rounded-xl p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-5 h-5" />
            <span className="font-bold">{t('aiCoach.upgradePremium')}</span>
          </div>
          <p className="text-xs text-gray-700">{t('aiCoach.upgradePremiumDesc')}</p>
        </button>

        {/* Maybe Later */}
        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm font-medium transition-colors"
        >
          {t('subscription.trial.laterButton')}
        </button>
      </div>
    </div>
  );
}
