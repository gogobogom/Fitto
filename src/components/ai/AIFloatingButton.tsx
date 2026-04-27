'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AIFloatingButtonProps {
  onClick: () => void;
  isPremium: boolean;
  hasActiveTrial: boolean;
  showPulse?: boolean;
}

export default function AIFloatingButton({ 
  onClick, 
  isPremium, 
  hasActiveTrial,
  showPulse = false 
}: AIFloatingButtonProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Show button with animation after mount
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Custom pulse animation style when needed
  const pulseStyle = showPulse ? {
    animation: 'pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  } : undefined;

  return (
    <>
      <style>{`
        @keyframes pulse-gentle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.05);
          }
        }
      `}</style>
      <button
        onClick={onClick}
        style={pulseStyle}
        className={`
          fixed right-5 top-1/2 -translate-y-1/2 z-50
          w-14 h-14 rounded-full
          bg-teal-500 backdrop-blur-md
          shadow-lg shadow-teal-500/40
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 hover:bg-teal-600 hover:shadow-teal-500/50
          active:scale-95
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
        `}
        aria-label="AI Coach"
      >
        {/* Badge for premium or trial */}
        {isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-md">
            👑
          </div>
        )}
        {hasActiveTrial && !isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-xs shadow-md">
            🎁
          </div>
        )}

        {/* Icon */}
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    </>
  );
}
