/**
 * Public landing page for a "Share my week" link.
 *
 * Optimized for X (Twitter) and Instagram. The card itself works perfectly as
 * an Instagram Story background (1200×630 → user can crop to 1080×1920 if
 * needed). For Twitter we expose a `https://twitter.com/intent/tweet` intent.
 * Native `navigator.share` on mobile surfaces the OS share sheet which already
 * includes Instagram.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { loadWeekStats } from '@/lib/share/weekStats';
import { ShareActions } from './share-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ lang?: string }>;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'https';
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const { lang: rawLang } = await searchParams;
  const lang: 'tr' | 'en' = rawLang === 'en' ? 'en' : 'tr';
  const origin = await getOrigin();

  const imageUrl = `${origin}/share/week/${userId}/image?lang=${lang}`;
  const pageUrl = `${origin}/share/week/${userId}?lang=${lang}`;

  const title = lang === 'tr' ? 'Fitto · Bu haftaki ilerlemem' : 'Fitto · My week of progress';
  const description =
    lang === 'tr'
      ? 'Bu hafta Fitto ile beslenme ve fitness ilerlememi takip ettim. Sen de katıl ve hedefine ulaş!'
      : 'Tracking my nutrition & fitness progress this week with Fitto. Join me and crush your goals!';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Fitto',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: lang === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@FittoApp',
      site: '@FittoApp',
    },
    other: {
      // Instagram & generic OG image hints
      'og:image:type': 'image/png',
      // Prevent SEO surface for personal share pages
      robots: 'noindex, nofollow',
    },
  };
}

export default async function ShareWeekPage({ params, searchParams }: PageProps) {
  const { userId } = await params;
  const { lang: rawLang } = await searchParams;
  const lang: 'tr' | 'en' = rawLang === 'en' ? 'en' : 'tr';
  const origin = await getOrigin();
  const imageUrl = `${origin}/share/week/${userId}/image?lang=${lang}`;
  const pageUrl = `${origin}/share/week/${userId}?lang=${lang}`;
  // Referral-aware deep link: when a friend opens the app, signup will pick
  // up `?ref=` and credit both users via the DB trigger.
  const appUrl = `${origin}/auth/signup?ref=${userId}&utm_source=share&utm_medium=week_card&utm_campaign=fitto_week`;

  const t = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  let stats: Awaited<ReturnType<typeof loadWeekStats>> | null = null;
  try {
    stats = await loadWeekStats(userId, lang);
  } catch {
    stats = null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {stats ? `@${stats.username}` : 'Fitto'}
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            {t('Bu haftaki ilerlemem 👇', 'My week of progress 👇')}
          </p>
        </div>

        {/* Card image */}
        <div
          className="w-full overflow-hidden rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0_rgba(0,0,0,0.18)]"
          data-testid="share-week-card"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={t('Bu haftaki Fitto kartım', 'My week on Fitto')}
            className="h-auto w-full"
            width={1200}
            height={630}
          />
        </div>

        {stats && (
          <div className="grid w-full grid-cols-3 gap-3">
            <Stat
              label={t('Hedefte gün', 'On-target days')}
              value={`${stats.daysOnTarget}/${Math.max(stats.daysLogged, 1)}`}
            />
            <Stat label={t('Uyum', 'Adherence')} value={`${stats.adherencePct}%`} />
            <Stat label={t('Ort. net kalori', 'Avg net kcal')} value={`${stats.avgNet}`} />
          </div>
        )}

        {/* Primary CTA */}
        <Link
          href={appUrl}
          className="w-full rounded-2xl border-4 border-black bg-orange-500 px-6 py-4 text-center text-lg font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-orange-600"
          data-testid="open-fitto-cta"
        >
          {t("🚀 Fitto'ya katıl", '🚀 Join Fitto')}
        </Link>

        {/* Social share buttons (client component) */}
        <ShareActions
          imageUrl={imageUrl}
          pageUrl={pageUrl}
          lang={lang}
          username={stats?.username ?? 'Fitto'}
        />

        <p className="text-center text-sm text-gray-600">
          {t(
            'Sen de Fitto ile beslenme ve fitness yolculuğuna başla.',
            'Start your own nutrition & fitness journey with Fitto.',
          )}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-black bg-white px-4 py-3 text-center shadow-[3px_3px_0_rgba(0,0,0,0.12)]">
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}
