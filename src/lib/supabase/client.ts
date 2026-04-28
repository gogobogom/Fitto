/**
 * Supabase Browser Client
 * Reads strictly from environment variables (no hardcoded credentials).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment',
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'anon-key-missing',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    global: {
      headers: { 'X-Client-Info': 'fitto-nutrition-app' },
    },
  },
);

export const getSupabaseClient = (): typeof supabase => supabase;

export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { connected: false, error: 'Supabase credentials not configured' };
    }
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) return { connected: false, error: error.message };
    return { connected: true };
  } catch (err: unknown) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

export const getConfigStatus = () => ({
  urlConfigured: !!supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
  ready: !!supabaseUrl && !!supabaseAnonKey,
});
