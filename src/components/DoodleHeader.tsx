'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { DoodleImage } from './DoodleImage';
import { doodleCharacters } from '../lib/doodleAssets';

interface DoodleHeaderProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  emoji?: string;
  rightIcon?: keyof typeof doodleCharacters;
}

export function DoodleHeader({ onBack, title, subtitle, emoji, rightIcon }: DoodleHeaderProps) {
  return (
    <div className="relative mb-6">
      {/* Back Button - Top Left */}
      {onBack && (
        <div className="absolute left-4 top-4 z-10">
          <Button
            onClick={onBack}
            variant="ghost"
            size="lg"
            className="h-12 w-12 rounded-full doodle-button bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 border-4 border-white shadow-2xl hover:scale-110 transition-transform"
            aria-label="Geri"
          >
            <ArrowLeft className="h-6 w-6 text-white" strokeWidth={4} />
          </Button>
        </div>
      )}

      {/* Right Icon - Custom image without container */}
      {rightIcon && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
          <img 
            src={doodleCharacters[rightIcon]} 
            alt="Chef" 
            className="h-20 w-auto object-contain"
          />
        </div>
      )}

      {/* Header Content */}
      {(title || subtitle || emoji) && (
        <div className="doodle-card bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 rounded-2xl shadow-sm p-6 pt-6" style={{ paddingLeft: onBack ? '100px' : '24px', paddingRight: rightIcon ? '110px' : '24px' }}>
          {emoji && <div className="text-4xl mb-2">{emoji}</div>}
          {title && <h1 className="text-2xl md:text-3xl font-doodle font-bold text-gray-900 mb-2">{title}</h1>}
          {subtitle && <p className="text-sm md:text-base font-doodle-alt text-gray-600">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
