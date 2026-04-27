'use client';

import type { DoodleImageProps } from '@/lib/doodleAssets';
import { doodleCharacters, getDoodleSize } from '@/lib/doodleAssets';
import { useState } from 'react';

export function DoodleImage({ character, alt, size = 'md', className = '' }: DoodleImageProps) {
  const [hasError, setHasError] = useState<boolean>(false);
  const sizeClass = getDoodleSize(size);
  
  // Emoji fallback map for characters
  const emojiMap: Record<string, string> = {
    broccoli: '🥦',
    waterDrop: '💧',
    dumbbell: '🏋️',
    camera: '📷',
    chart: '📊',
    user: '👤',
    apple: '🍎',
    scale: '⚖️',
    trophy: '🏆',
    empty: '🤷',
    heart: '❤️',
    pill: '💊',
    calendar: '📅',
    lightning: '⚡',
    celebration: '🎉',
  };

  const fallbackEmoji = emojiMap[character] || '✨';
  
  // Get emoji size based on size prop
  const getEmojiSize = (): string => {
    switch (size) {
      case 'xl':
        return 'text-6xl';
      case 'lg':
        return 'text-4xl';
      case 'md':
        return 'text-3xl';
      case 'sm':
        return 'text-2xl';
      default:
        return 'text-3xl';
    }
  };
  
  if (hasError) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <span className={`${getEmojiSize()} leading-none`} role="img" aria-label={alt}>
          {fallbackEmoji}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`${sizeClass} ${className} flex items-center justify-center`}>
      <img
        src={doodleCharacters[character]}
        alt={alt}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
