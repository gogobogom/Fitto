'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface AIQuickActionsProps {
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}

const quickQuestions = [
  { key: 'whatToEat', emoji: '🍽️', question: 'Bugün ne yesem?' },
  { key: 'calorieHelp', emoji: '🔥', question: 'Kalori hesabı nasıl yapılır?' },
  { key: 'proteinTip', emoji: '🥩', question: 'Protein kaynağı öner' },
  { key: 'motivate', emoji: '💪', question: 'Bana motivasyon ver!' },
];

export default function AIQuickActions({ onQuestionClick, disabled = false }: AIQuickActionsProps) {
  const { t } = useLanguage();

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-600 mb-3">
        {t('aiCoach.quickQuestions')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {quickQuestions.map((q) => (
          <button
            key={q.key}
            onClick={() => onQuestionClick(q.question)}
            disabled={disabled}
            className="flex items-center gap-2 bg-white hover:bg-teal-50 border border-gray-200 rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="text-lg">{q.emoji}</span>
            <span className="text-xs font-medium text-gray-700 truncate">
              {q.question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
