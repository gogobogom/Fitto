'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Activity, Heart, Target, TrendingUp, Flame, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const { t } = useLanguage();

  const slides = [
    {
      icon: <Flame className="w-16 h-16 md:w-20 md:h-20" />,
      title: t('welcome.slide1Title'),
      description: t('welcome.slide1Desc'),
      gradient: "from-orange-400 via-red-400 to-pink-500",
      iconGradient: "from-orange-500 to-red-500",
      image: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/c3acbdd8-2d8c-46bf-936b-f9a9cb1c66ba_cmhtlxh1u002t0bt3co2cgn91-diXEGVC9ZiH1Rml9wSDMtfj7GHw69Y.jpg?download=1"
    },
    {
      icon: <Target className="w-16 h-16 md:w-20 md:h-20" />,
      title: t('welcome.slide2Title'),
      description: t('welcome.slide2Desc'),
      gradient: "from-purple-400 via-pink-400 to-red-400",
      iconGradient: "from-purple-500 to-pink-500",
      image: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/c3acbdd8-2d8c-46bf-936b-f9a9cb1c66ba_cmhtlxgbh002s0bt3gje531mv-8YPiLzLabeZhfMdsD9Nb688nQ42uK2.jpg?download=1"
    },
    {
      icon: <Heart className="w-16 h-16 md:w-20 md:h-20" />,
      title: t('welcome.slide3Title'),
      description: t('welcome.slide3Desc'),
      gradient: "from-pink-400 via-rose-400 to-orange-400",
      iconGradient: "from-pink-500 to-rose-500",
      image: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/c3acbdd8-2d8c-46bf-936b-f9a9cb1c66ba_cmhtlxn5z002u0bt376tg042r-CihhIehhxyNhNk3weT3atfIfbdtfVh.jpg?download=1"
    },
    {
      icon: <TrendingUp className="w-16 h-16 md:w-20 md:h-20" />,
      title: t('welcome.slide4Title'),
      description: t('welcome.slide4Desc'),
      gradient: "from-yellow-400 via-orange-400 to-red-400",
      iconGradient: "from-yellow-500 to-orange-500",
      image: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/c3acbdd8-2d8c-46bf-936b-f9a9cb1c66ba_cmhtlxh1u002t0bt3co2cgn91-diXEGVC9ZiH1Rml9wSDMtfj7GHw69Y.jpg?download=1"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
      }, 300);
    } else {
      onGetStarted();
    }
  };

  const handleSkip = () => {
    onGetStarted();
  };

  const handleDotClick = (index: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
    }, 300);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`bg-gradient-to-br ${currentSlideData.gradient} relative transition-all duration-700 overflow-y-auto overscroll-contain`} style={{ minHeight: '100dvh', height: '100dvh' }}>
      {/* Doodle Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse wiggle"></div>
        <div className="absolute bottom-32 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000 bounce-soft"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse delay-500 rotate-tilt"></div>
        {/* Hand-drawn doodles */}
        <svg className="absolute top-10 right-20 w-20 h-20 text-white/20 wiggle" viewBox="0 0 100 100">
          <path d="M20,50 Q30,20 50,30 T80,50" stroke="currentColor" fill="none" strokeWidth="3" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-20 left-20 w-16 h-16 text-white/20 bounce-soft" viewBox="0 0 100 100">
          <path d="M10,50 L50,10 L90,50 L50,90 Z" stroke="currentColor" fill="none" strokeWidth="3" />
        </svg>
      </div>

      <div className="relative flex flex-col items-center justify-between px-4 py-6" style={{ minHeight: '100dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)', paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)' }}>
        {/* Content */}
        <div className={`flex-1 flex flex-col items-center justify-center text-center px-4 py-4 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {/* Doodle Illustration - Removed to fix layout */}

          {/* Logo/Brand - Only show icon on slides after first */}
          {currentSlide !== 0 && (
            <div className="mb-8 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.iconGradient} rounded-3xl blur-2xl opacity-50 animate-pulse`}></div>
              <div className={`relative doodle-card bg-gradient-to-br ${currentSlideData.iconGradient} p-6 shadow-2xl text-white border-white`}>
                {currentSlideData.icon}
              </div>
            </div>
          )}

          {/* App Logo - Only visible on first slide */}
          {currentSlide === 0 && (
            <div className="mb-8 flex flex-col items-center">
              <img 
                src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/a9f6dd6c-4e49-46c6-b407-f583f47d2347-1T8EoToJYQ3J3dYc6PvAKyKEElaax9" 
                alt="Fitto Logo" 
                className="w-64 h-64 md:w-72 md:h-72 object-contain drop-shadow-2xl animate-bounce-gentle"
              />
            </div>
          )}

          {/* Slide Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-md font-doodle">
            {currentSlideData.title}
          </h2>

          {/* Slide Description */}
          <p className="text-lg md:text-xl text-white/90 max-w-md leading-relaxed drop-shadow">
            {currentSlideData.description}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="w-full space-y-4 flex flex-col items-center pb-4">
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`transition-all duration-300 doodle-border border-white ${
                  index === currentSlide
                    ? 'w-8 h-4 bg-white'
                    : 'w-4 h-4 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full max-w-md h-16 text-2xl font-black bg-white text-gray-900 hover:bg-gray-100 shadow-2xl doodle-button border-gray-900"
          >
            {currentSlide < slides.length - 1 ? t('welcome.continue') : t('welcome.getStarted')}
          </Button>
        </div>
      </div>
    </div>
  );
}
