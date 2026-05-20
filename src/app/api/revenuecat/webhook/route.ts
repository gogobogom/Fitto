/**
 * RevenueCat → Supabase entitlement webhook.
 *
 * RevenueCat posts subscription lifecycle events here. We verify the bearer
 * token and upsert the canonical row into `public.subscriptions`. The
 * service-role Supabase client (`supabaseAdmin`) bypasses RLS for this
 * specific server route.
 *
 * Logging:
 *   • event type
 *   • app_user_id-derived UUID validity
 *   • upsert success / failure (no PII / no payload)
 * Logging payload contents, tokens, secrets, or emails is forbidden.
 *
 * Configure the webhook in the RevenueCat dashboard:
 *   URL:           https://<your-host>/api/revenuecat/webhook
 *   Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// RevenueCat webhook event types we care about. Anything else still returns
// 200 (so RC doesn't retry) but is treated as a no-op.
const ACTIVATING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'TRANSFER',
  'NON_RENEWING_PURCHASE',
]);

const DEACTIVATING_EVENTS = new Set([
  'CANCELLATION',
  'EXPIRATION',
  'SUBSCRIPTION_PAUSED',
  'BILLING_ISSUE',
]);

// UUID v4 (and other versions) shape — we only persist app_user_id values
// that look like proper Supabase auth UUIDs.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RevenueCatEvent {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  expiration_at_ms?: number | null;
  entitlement_ids?: string[] | null;
  product_id?: string | null;
}

interface RevenueCatPayload {
  event?: RevenueCatEvent;
  api_version?: string;
}

function authorize(req: Request): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization');
  if (!header) return false;
  // Constant-time-ish compare via length + char-by-char.
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < header.length; i++) {
    mismatch |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(req: Request): Promise<NextResponse> {
  // 1. AuthZ
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Parse safely
  let payload: RevenueCatPayload;
  try {
    payload = (await req.json()) as RevenueCatPayload;
  } catch {
    return NextResponse.json({ error: 'malformed_body' }, { status: 400 });
  }

  const event = payload?.event;
  if (!event || typeof event.type !== 'string') {
    return NextResponse.json({ error: 'missing_event' }, { status: 400 });
  }

  const eventType = event.type;
  const userId = (event.app_user_id ?? event.original_app_user_id ?? '').trim();

  // 3. Only handle events we know about; otherwise 200 no-op so RC doesn't
  //    retry forever.
  const isActivating = ACTIVATING_EVENTS.has(eventType);
  const isDeactivating = DEACTIVATING_EVENTS.has(eventType);
  if (!isActivating && !isDeactivating) {
    console.log(`[rc-webhook] noop event: ${eventType}`);
    return NextResponse.json({ ok: true, handled: false });
  }

  // 4. Only persist for valid Supabase-auth UUIDs (RevenueCat may send
  //    anonymous IDs like `$RCAnonymousID:…` which we cannot map to a row).
  if (!UUID_RE.test(userId)) {
    console.log(`[rc-webhook] ignored event ${eventType} for non-uuid user`);
    return NextResponse.json({ ok: true, handled: false });
  }

  const expiresAtIso =
    typeof event.expiration_at_ms === 'number' && event.expiration_at_ms > 0
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

  try {
    const { error } = await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: userId,
        plan_type: isActivating ? 'premium' : 'free',
        status: isActivating ? 'active' : 'inactive',
        started_at: new Date().toISOString(),
        expires_at: expiresAtIso,
        auto_renew: isActivating,
        ai_requests_limit: isActivating ? 1000 : 10,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.error(`[rc-webhook] upsert failed for event ${eventType}`);
      return NextResponse.json({ error: 'upsert_failed' }, { status: 500 });
    }

    console.log(
      `[rc-webhook] applied ${eventType} → ${isActivating ? 'premium/active' : 'free/inactive'}`,
    );
    return NextResponse.json({ ok: true, handled: true });
  } catch {
    console.error(`[rc-webhook] unexpected error for event ${eventType}`);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

// Reject all other methods so probes / scans get a clear 405 instead of
// hitting the POST path with an empty body.
export function GET(): NextResponse {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
