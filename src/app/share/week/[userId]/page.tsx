/**
 * Public landing page for a "Share my week" link.
 *
 * Renders a hero card showing the OG image and a CTA to open Fitto.
 * Sets Open Graph + Twitter + Farcaster Mini App metadata so the link
 * embeds nicely on Twitter/X, Farcaster (Warpcast), Discord, Slack, etc.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { loadWeekStats } from '@/lib/share/weekStats';

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
  const appUrl = `${origin}/?utm_source=share&utm_medium=week_card&utm_campaign=fitto_week`;

  const title = lang === 'tr' ? 'Fitto · Bu haftaki ilerlemem' : 'Fitto · My week of progress';
  const description =
    lang === 'tr'
      ? 'Bu hafta Fitto ile beslenme ve fitness ilerlememi takip ettim. Sen de katıl ve hedefine ulaş!'
      : 'Tracking my nutrition & fitness progress this week with Fitto. Join me and crush your goals!';

  // Farcaster Mini App / Frame metadata (v2 + legacy v1 fallback)
  const fcFrame = JSON.stringify({
    version: 'next',
    imageUrl,
    button: {
      title: lang === 'tr' ? "Fitto'yu aç" : 'Open Fitto',
      action: {
        type: 'launch_frame',
        name: 'Fitto',
        url: appUrl,
        splashImageUrl: imageUrl,
        splashBackgroundColor: '#F97316',
      },
    },
  });

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
    },
    other: {
      // Farcaster Frames v2 / Mini Apps
      'fc:frame': fcFrame,
      'fc:miniapp': fcFrame,
      // Frames v1 fallback
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': lang === 'tr' ? "Fitto'yu aç" : 'Open Fitto',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': appUrl,
    },
  };
}

export default async function ShareWeekPage({ params, searchParams }: PageProps) {
  const { userId } = await params;
  const { lang: rawLang } = await searchParams;
  const lang: 'tr' | 'en' = rawLang === 'en' ? 'en' : 'tr';
  const origin = await getOrigin();
  const imageUrl = `${origin}/share/week/${userId}/image?lang=${lang}`;
  const appUrl = `${origin}/?utm_source=share&utm_medium=week_card&utm_campaign=fitto_week`;

  const t = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  // Load stats so the page itself shows real data (not just the OG card).
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
            {t('Bu haftaki ilerlemem 👇', "My week of progress 👇")}
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
            <Stat
              label={t('Uyum', 'Adherence')}
              value={`${stats.adherencePct}%`}
            />
            <Stat
              label={t('Ort. net kalori', 'Avg net kcal')}
              value={`${stats.avgNet}`}
            />
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href={appUrl}
            className="flex-1 rounded-2xl border-4 border-black bg-orange-500 px-6 py-4 text-center text-lg font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-orange-600"
            data-testid="open-fitto-cta"
          >
            {t("🚀 Fitto'yu aç", '🚀 Open Fitto')}
          </Link>
          <Link
            href={`https://warpcast.com/~/compose?text=${encodeURIComponent(
              t('Bu haftaki Fitto ilerlemem 💪', 'My week of progress on Fitto 💪'),
            )}&embeds[]=${encodeURIComponent(`${origin}/share/week/${userId}?lang=${lang}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl border-4 border-black bg-purple-600 px-6 py-4 text-center text-lg font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-purple-700"
            data-testid="share-warpcast-cta"
          >
            {t("🟣 Warpcast'te paylaş", '🟣 Share on Warpcast')}
          </Link>
        </div>

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
