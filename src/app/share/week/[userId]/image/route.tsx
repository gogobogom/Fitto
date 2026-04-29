/**
 * OG image: `My Week on Fitto`
 *
 * GET /share/week/[userId]/image?lang=tr|en
 *
 * Returns a 1200×630 PNG suitable for Twitter / Open Graph / Farcaster Frames.
 * Uses Next.js' built-in `ImageResponse` (no extra dependency).
 *
 * NOTE: This route lives outside the `/api/*` namespace because the Emergent
 *       Kubernetes ingress proxies `/api/*` to a separate backend service.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadWeekStats, T } from '@/lib/share/weekStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORANGE = '#F97316';
const PINK = '#EC4899';
const NAVY = '#0F172A';
const CREAM = '#FFFBEB';
const GREEN = '#10B981';
const RED = '#EF4444';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  const url = new URL(request.url);
  const langParam = (url.searchParams.get('lang') || 'tr').toLowerCase();
  const lang: 'tr' | 'en' = langParam === 'en' ? 'en' : 'tr';

  let stats;
  try {
    stats = await loadWeekStats(userId, lang);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[share/week] failed to load stats', err);
    return new Response('failed to render share card', { status: 500 });
  }

  const weekDayNames =
    lang === 'tr'
      ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const maxNet = Math.max(stats.targetCalories * 1.4, ...stats.days.map((d) => d.net), 1);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${PINK} 100%)`,
          padding: '40px 56px',
          fontFamily: 'sans-serif',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ORANGE,
                fontSize: '44px',
                fontWeight: 900,
                marginRight: '20px',
                boxShadow: '6px 6px 0 rgba(0,0,0,0.18)',
              }}
            >
              F
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Fitto
              </span>
              <span style={{ fontSize: '20px', opacity: 0.85, marginTop: '2px' }}>
                {T(lang, 'AI Beslenme & Fitness Koçu', 'AI Nutrition & Fitness Coach')}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span style={{ fontSize: '20px', opacity: 0.85 }}>{stats.rangeLabel}</span>
            <span style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              @{stats.username}
            </span>
          </div>
        </div>

        {/* Hero stat */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', opacity: 0.9 }}>
              {T(lang, 'Bu hafta hedefte geçen gün', 'On-target days this week')}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
              <span style={{ fontSize: '120px', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px' }}>
                {stats.daysOnTarget}
              </span>
              <span style={{ fontSize: '52px', fontWeight: 700, opacity: 0.85, marginLeft: '6px' }}>
                / {Math.max(stats.daysLogged, 1)}
              </span>
            </div>
            <span style={{ fontSize: '20px', marginTop: '4px', opacity: 0.9 }}>
              {T(lang, 'gün', 'days')} · {stats.adherencePct}% {T(lang, 'uyum', 'adherence')}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '14px',
            }}
          >
            <StatPill
              label={T(lang, 'Ort. net kalori', 'Avg net kcal')}
              value={`${stats.avgNet.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kcal`}
            />
            <StatPill
              label={T(lang, 'Toplam yakılan', 'Total burned')}
              value={`${stats.totalBurned.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kcal`}
            />
            <StatPill
              label={T(lang, 'Günlük hedef', 'Daily target')}
              value={`${stats.targetCalories.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kcal`}
            />
          </div>
        </div>

        {/* Mini bar chart */}
        <div
          style={{
            background: CREAM,
            borderRadius: '24px',
            padding: '20px 32px 16px',
            display: 'flex',
            flexDirection: 'column',
            color: NAVY,
            boxShadow: '6px 6px 0 rgba(0,0,0,0.18)',
            height: '140px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '24px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700 }}>
              {T(lang, 'Günlük Net Kalori', 'Daily Net Calories')}
            </span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>
              {T(lang, 'yeşil = hedefte', 'green = on target')}
            </span>
          </div>
          <div
            style={{
              height: '72px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            {stats.days.map((d, i) => {
              const heightPct = Math.max(0.06, Math.min(1, d.net / maxNet));
              const barHeightPx = Math.round(heightPct * 60);
              return (
                <div
                  key={d.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '72px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${barHeightPx}px`,
                      background:
                        d.consumed === 0
                          ? '#E5E7EB'
                          : d.onTarget
                            ? GREEN
                            : d.net > stats.targetCalories
                              ? RED
                              : ORANGE,
                      borderRadius: '10px 10px 4px 4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '12px',
                      paddingTop: '4px',
                    }}
                  >
                    {d.consumed > 0 ? Math.round(d.net) : ''}
                  </div>
                  <span style={{ fontSize: '13px', marginTop: '6px', opacity: 0.7 }}>
                    {weekDayNames[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 700, opacity: 0.95 }}>
            {T(lang, 'Sen de takibe başla →', 'Start tracking too →')}
          </span>
          <span style={{ fontSize: '22px', fontWeight: 800 }}>fitto.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        background: 'rgba(255,255,255,0.18)',
        borderRadius: '14px',
        padding: '10px 18px',
        minWidth: '260px',
      }}
    >
      <span style={{ fontSize: '16px', opacity: 0.85 }}>{label}</span>
      <span style={{ fontSize: '28px', fontWeight: 800 }}>{value}</span>
    </div>
  );
}
