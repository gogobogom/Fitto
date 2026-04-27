'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { focusManager, prefersReducedMotion } from '@/lib/accessibility';

/**
 * Reduced Motion tercihini dinleyen hook
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // İlk değeri ayarla
    setReducedMotion(prefersReducedMotion());

    // Media query değişikliklerini dinle
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent): void => {
      setReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return reducedMotion;
}

/**
 * Focus trap hook - Modal/Dialog içinde focus'u tutmak için
 */
export function useFocusTrap(isActive: boolean): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Mevcut focus'u kaydet
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus trap'i başlat
    const cleanup = focusManager.trapFocus(containerRef.current);

    return () => {
      cleanup();
      // Önceki elemente focus'u geri ver
      previousActiveElement.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Escape tuşunu dinleyen hook
 */
export function useEscapeKey(callback: () => void, isEnabled = true): void {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, isEnabled]);
}

/**
 * Klavye kullanıcısı olup olmadığını tespit eden hook
 */
export function useKeyboardUser(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = (): void => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

/**
 * Focus visible yönetimi için hook
 * Sadece klavye navigasyonunda focus ring göster
 */
export function useFocusVisible(): {
  isFocusVisible: boolean;
  focusProps: {
    onFocus: () => void;
    onBlur: () => void;
    onMouseDown: () => void;
  };
} {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const isKeyboardNavigation = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        isKeyboardNavigation.current = true;
      }
    };

    const handleMouseDown = (): void => {
      isKeyboardNavigation.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const onFocus = useCallback(() => {
    if (isKeyboardNavigation.current) {
      setIsFocusVisible(true);
    }
  }, []);

  const onBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  const onMouseDown = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  return {
    isFocusVisible,
    focusProps: {
      onFocus,
      onBlur,
      onMouseDown,
    },
  };
}

/**
 * Aria live region için hook
 * Ekran okuyuculara dinamik içerik değişikliklerini duyurmak için
 */
export function useAnnounce(): (message: string, priority?: 'polite' | 'assertive') => void {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Live region containerlarını oluştur
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    politeRegion.id = 'aria-live-polite';

    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'aria-live-assertive';

    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);

    politeRef.current = politeRegion;
    assertiveRef.current = assertiveRegion;

    return () => {
      document.body.removeChild(politeRegion);
      document.body.removeChild(assertiveRegion);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    
    if (region) {
      // Önce temizle
      region.textContent = '';
      
      // Kısa bir gecikme ile yeni mesajı ekle (ekran okuyucunun fark etmesi için)
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    }
  }, []);

  return announce;
}

/**
 * Roving tabindex hook - Tab listesi veya toolbar için
 */
export function useRovingTabindex<T extends HTMLElement>(
  itemCount: number,
  initialIndex = 0
): {
  currentIndex: number;
  getTabIndex: (index: number) => 0 | -1;
  handleKeyDown: (event: React.KeyboardEvent, index: number) => void;
  setCurrentIndex: (index: number) => void;
  itemRefs: React.MutableRefObject<(T | null)[]>;
} {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const itemRefs = useRef<(T | null)[]>([]);

  const getTabIndex = useCallback((index: number): 0 | -1 => {
    return index === currentIndex ? 0 : -1;
  }, [currentIndex]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (index + 1) % itemCount;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (index - 1 + itemCount) % itemCount;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = itemCount - 1;
        break;
      default:
        return;
    }

    setCurrentIndex(newIndex);
    itemRefs.current[newIndex]?.focus();
  }, [itemCount]);

  return {
    currentIndex,
    getTabIndex,
    handleKeyDown,
    setCurrentIndex,
    itemRefs,
  };
}

/**
 * High contrast mode kontrolü
 */
export function useHighContrast(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setIsHighContrast(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isHighContrast;
}
