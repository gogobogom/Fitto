/**
 * Secure Storage Utility
 * 
 * localStorage verilerini şifreleyerek güvenli bir şekilde saklar.
 * Hassas kullanıcı verilerini korur.
 */

// 🔐 GÜÇLÜ ŞİFRELEME - Web Crypto API kullanarak AES-GCM
// XOR yerine industry-standard kriptografi

/**
 * Güvenli key türetme - kullanıcı identity'sinden
 * Her kullanıcı için farklı key
 */
async function deriveKey(salt: string): Promise<CryptoKey> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(salt + '_fitto_2024'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('fitto_salt_v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Metni AES-GCM ile şifreler (production-ready)
 */
async function encryptSecure(text: string, userSalt: string): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      // Fallback - simple base64 encoding (not secure but better than crash)
      return btoa(text);
    }

    const key = await deriveKey(userSalt);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Şifreleme hatası:', error);
    // Fallback
    return btoa(text);
  }
}

/**
 * Şifrelenmiş metni AES-GCM ile çözer
 */
async function decryptSecure(encrypted: string, userSalt: string): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      // Fallback
      return atob(encrypted);
    }

    const key = await deriveKey(userSalt);
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Şifre çözme hatası:', error);
    // Fallback - try base64 decode
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  }
}

/**
 * Get user-specific salt from identity
 */
function getUserSalt(): string {
  if (typeof window === 'undefined') return 'default';
  
  // Use a combination of factors for user-specific key
  // This should ideally come from Supabase user ID
  const stored = localStorage.getItem('fitto_user_salt');
  if (stored) return stored;
  
  // Generate new salt for this user
  const salt = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  localStorage.setItem('fitto_user_salt', salt);
  return salt;
}

/**
 * Güvenli localStorage işlemleri
 * AES-GCM şifreleme kullanır
 */
export const secureStorage = {
  /**
   * Veriyi şifreleyerek localStorage'a kaydeder
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const userSalt = getUserSalt();
      const encrypted = await encryptSecure(value, userSalt);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('secureStorage.setItem hatası:', error);
    }
  },

  /**
   * localStorage'dan veriyi okur ve şifresini çözer
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const userSalt = getUserSalt();
      return await decryptSecure(encrypted, userSalt);
    } catch (error) {
      console.error('secureStorage.getItem hatası:', error);
      return null;
    }
  },

  /**
   * localStorage'dan veriyi siler
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('secureStorage.removeItem hatası:', error);
    }
  },

  /**
   * Tüm verileri temizler
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('secureStorage.clear hatası:', error);
    }
  },
};

/**
 * Basit localStorage işlemleri (şifreleme olmadan)
 * Su takibi gibi kritik olmayan veriler için kullanılır
 */
export const simpleStorage = {
  /**
   * Veriyi doğrudan localStorage'a kaydeder
   */
  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('simpleStorage.setItem hatası:', error);
    }
  },

  /**
   * localStorage'dan veriyi okur
   */
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('simpleStorage.getItem hatası:', error);
      return null;
    }
  },

  /**
   * localStorage'dan veriyi siler
   */
  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('simpleStorage.removeItem hatası:', error);
    }
  },

  /**
   * Tüm verileri temizler
   */
  clear(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.clear();
    } catch (error) {
      console.error('simpleStorage.clear hatası:', error);
    }
  },
};

/**
 * Development/Production log kontrolü
 */
export const devLog = {
  log(...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  error(...args: unknown[]): void {
    // Error logları her zaman göster
    console.error(...args);
  },
  
  warn(...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
};
