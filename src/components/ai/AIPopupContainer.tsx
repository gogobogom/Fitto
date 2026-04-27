'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface AIPopupContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function AIPopupContainer({ isOpen, onClose, children }: AIPopupContainerProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isOpen) {
      setMounted(true);
      setAnimationState('opening');
      timer = setTimeout(() => {
        setAnimationState('open');
      }, 50); // Quick transition
    } else if (mounted) {
      setAnimationState('closing');
      timer = setTimeout(() => {
        setAnimationState('closed');
        setMounted(false);
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, mounted]);

  if (!mounted && animationState === 'closed') return null;

  const isFullyOpen = animationState === 'open';
  const isOpening = animationState === 'opening';
  const isClosing = animationState === 'closing';
  
  const containerClasses = `
    fixed z-40 bg-white rounded-2xl shadow-2xl overflow-hidden
    right-5 top-[10vh] 
    w-[400px] max-w-[calc(100vw-40px)] h-[80vh]
    transition-all duration-300 ease-out
    ${
      isFullyOpen 
        ? 'opacity-100 scale-100 translate-y-0' 
        : isClosing 
        ? 'opacity-0 scale-95 translate-y-4'
        : 'opacity-0 scale-95 -translate-y-4'
    }
  `;

  const backdropClasses = `
    fixed inset-0 bg-black/20 backdrop-blur-sm z-30 
    transition-opacity duration-300
    ${isFullyOpen ? 'opacity-100' : 'opacity-0'}
  `;

  return (
    <>
      {/* Backdrop */}
      {mounted && (
        <div
          className={backdropClasses}
          onClick={onClose}
        />
      )}

      {/* Popup Container */}
      <div className={containerClasses}>
        {/* Close Button - Always visible when mounted */}
        {mounted && (
          <button
            onClick={onClose}
            className={`
              absolute top-3 right-3 z-50 
              w-8 h-8 rounded-full 
              bg-yellow-400 hover:bg-yellow-500 
              flex items-center justify-center 
              shadow-md transition-all duration-200 
              hover:scale-110 active:scale-95
              ${isFullyOpen ? 'opacity-100' : 'opacity-0'}
            `}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-black" strokeWidth={3} />
          </button>
        )}

        {/* Content - fade in after popup is fully open */}
        <div className={`
          h-full overflow-hidden transition-opacity duration-200 delay-100
          ${isFullyOpen ? 'opacity-100' : 'opacity-0'}
        `}>
          {children}
        </div>
      </div>
    </>
  );
}
