'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // Supabase v2: if the URL contains a "code", exchange it for a session
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // If URL contains hash tokens (older flow), Supabase client will usually pick it up automatically.
        // We just ensure session exists before redirecting.
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          // If this was a password recovery flow, send user to reset screen
          const type = url.searchParams.get('type');
          if (type === 'recovery') {
            router.replace('/auth/reset');
            return;
          }

          // Otherwise go home
          router.replace('/');
          return;
        }

        // No session -> go login
        router.replace('/auth/login');
      } catch (e) {
        console.error('Auth callback error:', e);
        router.replace('/auth/login');
      }
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-600">Oturum doğrulanıyor…</div>
    </div>
  );
}
