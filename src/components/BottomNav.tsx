'use client';

import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { DoodleImage } from './DoodleImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { VisuallyHidden } from './ui/visually-hidden';

interface BottomNavProps {
  activeTab: 'dashboard' | 'stats' | 'recipes' | 'more';
  onTabChange: (tab: 'dashboard' | 'stats' | 'recipes' | 'more') => void;
  onAddClick: () => void;
}

export function BottomNav({ activeTab, onTabChange, onAddClick }: BottomNavProps) {
  const { t } = useLanguage();

  const navItems: Array<{
    id: 'dashboard' | 'stats' | 'recipes' | 'more';
    label: string;
    image: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: t('nav.home'),
      image: <DoodleImage character="broccoli" alt="" size="sm" />,
    },
    {
      id: 'stats',
      label: t('nav.stats'),
      image: (
        <img 
          src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/372d19e3-e31d-4ae4-bd0f-622a0c2ee646-E7VM3k6H4KKNkYgojlOVdsVtnkohIe" 
          alt="" 
          className="w-full h-full object-contain" 
        />
      ),
    },
    {
      id: 'recipes',
      label: t('nav.recipes'),
      image: <DoodleImage character="chefNav" alt="" size="sm" />,
    },
    {
      id: 'more',
      label: t('nav.more'),
      image: <DoodleImage character="more" alt="" size="sm" />,
    },
  ];

  return (
    <nav 
      id="navigation"
      role="navigation"
      aria-label="Ana navigasyon"
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-2xl z-50 dark:bg-gray-900/95"
      style={{
        borderTop: '3px solid #000',
        boxShadow: '0 -4px 0px rgba(0,0,0,0.1)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
        paddingTop: '12px',
      }}
    >
      {/* Doodle decoration line */}
      <svg 
        className="absolute top-0 left-0 right-0 h-1" 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 10"
        aria-hidden="true"
        role="presentation"
      >
        <path d="M0,5 Q250,2 500,5 T1000,5" stroke="#FF8A65" strokeWidth="2" fill="none" />
      </svg>

      <div className="max-w-6xl mx-auto px-2">
        <div 
          className="flex items-center justify-around" 
          style={{ minHeight: '68px' }}
          role="tablist"
          aria-label="Sayfa navigasyonu"
        >
          {/* Dashboard Button */}
          <Button
            variant="ghost"
            size="lg"
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            aria-controls="main-content"
            tabIndex={activeTab === 'dashboard' ? 0 : -1}
            className={`flex flex-col items-center gap-0.5 min-h-[64px] min-w-[64px] font-doodle-alt transition-all p-1 ${
              activeTab === 'dashboard' ? 'text-orange-600 scale-105' : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => onTabChange('dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onTabChange('stats');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onTabChange('more');
              }
            }}
          >
            <div 
              className={`${activeTab === 'dashboard' ? 'wiggle' : ''} w-8 h-8 flex items-center justify-center`}
              aria-hidden="true"
            >
              {navItems[0].image}
            </div>
            <span className="text-[10px] font-medium leading-tight mt-0.5">
              {navItems[0].label}
            </span>
          </Button>

          {/* Stats Button */}
          <Button
            variant="ghost"
            size="lg"
            role="tab"
            aria-selected={activeTab === 'stats'}
            aria-controls="main-content"
            tabIndex={activeTab === 'stats' ? 0 : -1}
            className={`flex flex-col items-center gap-0.5 min-h-[64px] min-w-[64px] font-doodle-alt transition-all p-1 ${
              activeTab === 'stats' ? 'text-orange-600 scale-105' : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => onTabChange('stats')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                // Skip to recipes (add button is not in tab order)
                onTabChange('recipes');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onTabChange('dashboard');
              }
            }}
          >
            <div 
              className={`${activeTab === 'stats' ? 'wiggle' : ''} w-8 h-8 flex items-center justify-center`}
              aria-hidden="true"
            >
              {navItems[1].image}
            </div>
            <span className="text-[10px] font-medium leading-tight mt-0.5">
              {navItems[1].label}
            </span>
          </Button>

          {/* Center Add Button - Doodle Style */}
          <Button
            size="lg"
            className="h-14 w-14 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 -mt-6 doodle-button border-gray-900 bounce-soft shrink-0"
            onClick={onAddClick}
            aria-label="Yeni yemek veya egzersiz ekle"
          >
            <Plus className="h-7 w-7 text-white" strokeWidth={3} aria-hidden="true" />
            <VisuallyHidden>Yeni ekle</VisuallyHidden>
          </Button>

          {/* Recipes Button */}
          <Button
            variant="ghost"
            size="lg"
            role="tab"
            aria-selected={activeTab === 'recipes'}
            aria-controls="main-content"
            tabIndex={activeTab === 'recipes' ? 0 : -1}
            className={`flex flex-col items-center gap-0.5 min-h-[64px] min-w-[64px] font-doodle-alt transition-all p-1 ${
              activeTab === 'recipes' ? 'text-orange-600 scale-105' : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => onTabChange('recipes')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onTabChange('more');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onTabChange('stats');
              }
            }}
          >
            <div 
              className={`${activeTab === 'recipes' ? 'wiggle' : ''} w-8 h-8 flex items-center justify-center`}
              aria-hidden="true"
            >
              {navItems[2].image}
            </div>
            <span className="text-[10px] font-medium leading-tight mt-0.5">
              {navItems[2].label}
            </span>
          </Button>

          {/* More Button */}
          <Button
            variant="ghost"
            size="lg"
            role="tab"
            aria-selected={activeTab === 'more'}
            aria-controls="main-content"
            tabIndex={activeTab === 'more' ? 0 : -1}
            className={`flex flex-col items-center gap-0.5 min-h-[64px] min-w-[64px] font-doodle-alt transition-all p-1 ${
              activeTab === 'more' ? 'text-orange-600 scale-105' : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => onTabChange('more')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onTabChange('dashboard');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onTabChange('recipes');
              }
            }}
          >
            <div 
              className={`${activeTab === 'more' ? 'wiggle' : ''} w-8 h-8 flex items-center justify-center`}
              aria-hidden="true"
            >
              {navItems[3].image}
            </div>
            <span className="text-[10px] font-medium leading-tight mt-0.5">
              {navItems[3].label}
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
