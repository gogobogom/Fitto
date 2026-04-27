'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Zap } from 'lucide-react';

interface AITrialBannerProps {
  daysLeft: number;
  messagesLeft: number;
  dailyLimit: number;
  adCredits?: number;
}

export default function AITrialBanner({ daysLeft, messagesLeft, dailyLimit, adCredits = 0 }: AITrialBannerProps) {
  const { t } = useLanguage();

  return (
    <div className="border-b border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">
            {t('aiCoach.trialActive')}
          </span>
        </div>
        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-medium">
          {daysLeft} {t('aiCoach.daysLeft')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Messages Left */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-orange-200">
          <p className="text-xs text-gray-600 mb-1">{t('aiCoach.messagesLeft')}</p>
          <div className="flex items-center gap-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(messagesLeft / 9) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-orange-700 whitespace-nowrap">
              {messagesLeft}/9
            </span>
          </div>
        </div>

        {/* Daily Limit */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-orange-200">
          <p className="text-xs text-gray-600 mb-1">{t('aiCoach.dailyLimit')}</p>
          <div className="flex items-center gap-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(dailyLimit / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-teal-700 whitespace-nowrap">
              {dailyLimit}/3
            </span>
          </div>
        </div>
      </div>

      {/* Ad Credits */}
      {adCredits > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-teal-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-500" />
          <p className="text-xs text-gray-700">
            <span className="font-bold text-teal-700">{adCredits}</span> {t('aiCoach.adCredits')}
          </p>
        </div>
      )}
    </div>
  );
}
