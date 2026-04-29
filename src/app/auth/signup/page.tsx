'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Gift } from 'lucide-react';
import Link from 'next/link';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REFERRAL_BONUS_REQUESTS = 70;

export default function SignupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);

  // Capture ?ref=<uuid> from the URL on first load and remember it
  useEffect(() => {
    const fromUrl = search?.get('ref');
    let validRef: string | null = null;
    if (fromUrl && UUID_RE.test(fromUrl)) {
      validRef = fromUrl;
      try {
        sessionStorage.setItem('fitto_ref', fromUrl);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const cached = sessionStorage.getItem('fitto_ref');
        if (cached && UUID_RE.test(cached)) validRef = cached;
      } catch {
        /* ignore */
      }
    }
    setReferrerId(validRef);
  }, [search]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      setLoading(false);
      return;
    }

    try {
      const metadata: Record<string, string> = { full_name: fullName };
      if (referrerId) metadata.referrer_user_id = referrerId;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess(true);
        try {
          sessionStorage.removeItem('fitto_ref');
        } catch {
          /* ignore */
        }
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Kayıt başarısız';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-20 md:py-16">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              Fitto&apos;ya Katıl 🚀
            </CardTitle>
            <CardDescription className="text-center">
              Hemen hesap oluştur ve fitness yolculuğuna başla
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrerId && (
              <div
                className="mb-4 flex items-start gap-3 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-3"
                data-testid="referral-banner"
              >
                <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900">
                    🎁 Davet edildin! / You&apos;ve been invited!
                  </p>
                  <p className="text-orange-800">
                    Kayıt olunca sen ve seni davet eden arkadaşın{' '}
                    <strong>{REFERRAL_BONUS_REQUESTS} ücretsiz AI Coach soru</strong> kazanır.
                    <br />
                    <span className="opacity-90">
                      Sign up and both you and your friend get{' '}
                      <strong>{REFERRAL_BONUS_REQUESTS} free AI Coach credits</strong>.
                    </span>
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" data-testid="signup-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm" data-testid="signup-success">
                  Kayıt başarılı! Giriş sayfasına yönlendiriliyorsun...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Ad Soyad
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full"
                  data-testid="signup-fullname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full"
                  data-testid="signup-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full"
                  minLength={6}
                  data-testid="signup-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Şifre Tekrar
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full"
                  minLength={6}
                  data-testid="signup-confirm-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading || success}
                data-testid="signup-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  'Kayıt Ol'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Zaten hesabın var mı?{' '}
                <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Giriş Yap
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
