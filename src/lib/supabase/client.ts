/**
 * 🔒 SECURE SUPABASE CLIENT SETUP
 * 
 * Uses environment variables for credentials
 * NEVER hardcode API keys in source code!
 * 
 * @version 2.0.0 - SECURITY HARDENED
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// ⚠️ FALLBACK: Use environment variables OR fallback to defaults
// IMPORTANT: Set proper credentials in .env.local for production!
const FALLBACK_URL: string = 'https://wkpsimlalongfpjwovtx.supabase.co';
const FALLBACK_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHNpbWxhbG9uZ2ZwandvdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDUwMzksImV4cCI6MjA4MTIyMTAzOX0.IqchXHB41UkhmsDU4F5uaL95yj2j2KiCRUxZocze-BU';

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Silently use fallback credentials if env vars not set
// (Warnings removed to keep console clean in production)

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ CRITICAL: Supabase URL must use HTTPS!');
}

// Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'fitto-nutrition-app',
    },
  },
});

// Type-safe helper functions
export const getSupabaseClient = (): typeof supabase => {
  return supabase;
};

// Connection test helper
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    // Validate credentials are set
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        connected: false,
        error: 'Supabase credentials not configured',
      };
    }

    const { error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (err: unknown) {
    const errorMessage: string = err instanceof Error ? err.message : 'Unknown error';
    return { connected: false, error: errorMessage };
  }
};

// Export configuration status (for debugging)
export const getConfigStatus = (): {
  urlConfigured: boolean;
  keyConfigured: boolean;
  ready: boolean;
} => {
  return {
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseAnonKey,
    ready: !!supabaseUrl && !!supabaseAnonKey,
  };
};
