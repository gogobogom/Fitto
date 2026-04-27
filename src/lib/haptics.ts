/**
 * Haptic Feedback Utility
 * Mobil cihazlarda titreşim geri bildirimi sağlar
 */

// Haptic pattern türleri
export type HapticPattern = 
  | 'light'      // Hafif dokunuş
  | 'medium'     // Orta şiddette
  | 'heavy'      // Güçlü titreşim
  | 'success'    // Başarı pattern'i
  | 'warning'    // Uyarı pattern'i
  | 'error'      // Hata pattern'i
  | 'selection'  // Seçim değişikliği
  | 'impact';    // Darbe efekti

// Vibration pattern değerleri (ms cinsinden)
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],      // Kısa-boşluk-uzun
  warning: [30, 30, 30],      // Eşit aralıklı
  error: [50, 100, 50, 100],  // Uzun pattern
  selection: 5,
  impact: 15,
};

// Cihazın haptic desteği var mı kontrol et
const supportsHaptics = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'vibrate' in navigator;
};

// Haptic feedback tetikle
export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if (!supportsHaptics()) return;
  
  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    // Sessizce başarısız ol - haptic kritik değil
    console.debug('Haptic feedback not available');
  }
};

// Haptic'i durdur
export const stopHaptic = (): void => {
  if (!supportsHaptics()) return;
  
  try {
    navigator.vibrate(0);
  } catch (error) {
    // Sessizce başarısız ol
  }
};

// Özel pattern ile titreşim
export const customHaptic = (pattern: number | number[]): void => {
  if (!supportsHaptics()) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Sessizce başarısız ol
  }
};

// Haptic desteği kontrolü
export const isHapticSupported = (): boolean => supportsHaptics();

// Belirli aksiyonlar için hazır haptic fonksiyonları
export const haptics = {
  // UI etkileşimleri
  tap: () => triggerHaptic('light'),
  press: () => triggerHaptic('medium'),
  longPress: () => triggerHaptic('heavy'),
  
  // Geri bildirimler
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  
  // Navigasyon
  selection: () => triggerHaptic('selection'),
  impact: () => triggerHaptic('impact'),
  
  // Özel
  custom: customHaptic,
  stop: stopHaptic,
  isSupported: isHapticSupported,
};

export default haptics;
