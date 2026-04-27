/**
 * Erişilebilirlik Yardımcı Fonksiyonları
 */

/**
 * Klavye navigasyonu için key handler
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: (shiftKey: boolean) => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
): void {
  const { key, shiftKey } = event;

  switch (key) {
    case 'Enter':
      if (options.onEnter) {
        event.preventDefault();
        options.onEnter();
      }
      break;
    case ' ':
    case 'Spacebar':
      if (options.onSpace) {
        event.preventDefault();
        options.onSpace();
      }
      break;
    case 'Escape':
    case 'Esc':
      if (options.onEscape) {
        event.preventDefault();
        options.onEscape();
      }
      break;
    case 'ArrowUp':
    case 'Up':
      if (options.onArrowUp) {
        event.preventDefault();
        options.onArrowUp();
      }
      break;
    case 'ArrowDown':
    case 'Down':
      if (options.onArrowDown) {
        event.preventDefault();
        options.onArrowDown();
      }
      break;
    case 'ArrowLeft':
    case 'Left':
      if (options.onArrowLeft) {
        event.preventDefault();
        options.onArrowLeft();
      }
      break;
    case 'ArrowRight':
    case 'Right':
      if (options.onArrowRight) {
        event.preventDefault();
        options.onArrowRight();
      }
      break;
    case 'Tab':
      if (options.onTab) {
        options.onTab(shiftKey);
      }
      break;
    case 'Home':
      if (options.onHome) {
        event.preventDefault();
        options.onHome();
      }
      break;
    case 'End':
      if (options.onEnd) {
        event.preventDefault();
        options.onEnd();
      }
      break;
  }
}

/**
 * Focus yönetimi için yardımcı fonksiyonlar
 */
export const focusManager = {
  /**
   * Bir element'e focus ver
   */
  focusElement: (element: HTMLElement | null): void => {
    if (element) {
      element.focus();
    }
  },

  /**
   * İlk focuslanabilir element'i bul ve focus ver
   */
  focusFirstElement: (container: HTMLElement | null): void => {
    if (!container) return;
    
    const focusable = focusManager.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  },

  /**
   * Son focuslanabilir element'i bul ve focus ver
   */
  focusLastElement: (container: HTMLElement | null): void => {
    if (!container) return;
    
    const focusable = focusManager.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  },

  /**
   * Container içindeki tüm focuslanabilir elementleri getir
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    return Array.from(elements).filter((el) => {
      // Görünür olup olmadığını kontrol et
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  },

  /**
   * Focus trap oluştur (modal/dialog için)
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = focusManager.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // İlk elemente focus ver
    firstElement?.focus();

    // Cleanup fonksiyonu döndür
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
};

/**
 * ARIA attribute yardımcıları
 */
export const aria = {
  /**
   * aria-describedby için ID oluştur
   */
  descriptionId: (baseId: string): string => `${baseId}-description`,

  /**
   * aria-labelledby için ID oluştur
   */
  labelId: (baseId: string): string => `${baseId}-label`,

  /**
   * aria-errormessage için ID oluştur
   */
  errorId: (baseId: string): string => `${baseId}-error`,

  /**
   * Form field için ARIA attributes oluştur
   */
  formField: (options: {
    id: string;
    hasError?: boolean;
    hasDescription?: boolean;
    required?: boolean;
    disabled?: boolean;
  }): Record<string, string | boolean | undefined> => {
    const { id, hasError, hasDescription, required, disabled } = options;

    return {
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasDescription ? aria.descriptionId(id) : undefined,
      'aria-errormessage': hasError ? aria.errorId(id) : undefined,
      'aria-required': required || undefined,
      'aria-disabled': disabled || undefined,
    };
  },

  /**
   * Expandable element için ARIA attributes
   */
  expandable: (isExpanded: boolean, controlsId: string): Record<string, string | boolean> => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }),

  /**
   * Popup/menu için ARIA attributes
   */
  popup: (isOpen: boolean, popupId: string): Record<string, string | boolean> => ({
    'aria-haspopup': true,
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? popupId : '',
  }),
};

/**
 * Renk kontrastı kontrol yardımcıları
 */
export const colorContrast = {
  /**
   * Hex rengini RGB'ye çevir
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Relative luminance hesapla (WCAG formülü)
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * İki renk arasındaki kontrast oranını hesapla
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = colorContrast.hexToRgb(color1);
    const rgb2 = colorContrast.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const l1 = colorContrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = colorContrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * WCAG AA standardını karşılayıp karşılamadığını kontrol et
   */
  meetsWcagAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * WCAG AAA standardını karşılayıp karşılamadığını kontrol et
   */
  meetsWcagAAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Reduced Motion kontrolü
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Screen reader aktif mi kontrolü (tahmini)
 */
export function mightUseScreenReader(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Kesin bir yol yok, ama bazı ipuçları kontrol edilebilir
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const highContrast = window.matchMedia('(prefers-contrast: more)').matches;
  
  return prefersReducedMotion || highContrast;
}
