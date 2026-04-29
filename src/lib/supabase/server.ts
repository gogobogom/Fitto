/**
 * Server-only Supabase client using the service role key.
 *
 * NEVER import this file from a client component.
 * Used by API routes / server components that legitimately need to bypass
 * Row Level Security (e.g. the public "Share my week" OG image).
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // eslint-disable-next-line no-console
  console.error('[supabase/server] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient<Database>(
  url ?? 'http://localhost',
  serviceKey ?? 'service-role-key-missing',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'fitto-server' },
    },
  },
);
