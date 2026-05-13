/**
 * musiclesslife-checkout v9.2
 * King_darkM | thedarkgalaxy.com
 * 
 * Stripe Checkout + Customer Portal Worker
 * Handles: /checkout/session, /checkout/portal, /checkout/webhook
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,stripe-signature',
};

const PRICES = {
  pro:      { monthly: 'price_1TRIp0EKPQEJ05U2y0BJQb3h', yearly: 'price_1TRIp7EKPQEJ05U2GuXOinRc' },
  pro_plus: { monthly: 'price_1TRIpEEKPQEJ05U2V6NBVslt', yearly: 'price_1TRIpKEKPQEJ05U2ym130GMY' },
  pro_max:  { monthly: 'price_1TRIpPEKPQEJ05U2Y86qEzZ4', yearly: 'price_1TRIpWEKPQEJ05U2rqwCOqGK' },
};

const LINKS = {
  pro:      { monthly: 'https://buy.stripe.com/test_7sY4gz7Mx0KY4oK6k3gnK06', yearly: 'https://buy.stripe.com/test_8x2bJ13wh51ecVgbEngnK07' },
  pro_plus: { monthly: 'https://buy.stripe.com/test_14A8wP2sd0KYdZk5fZgnK08', yearly: 'https://buy.stripe.com/test_dRm3cvc2Naly8F0gYHgnK09' },
  pro_max:  { monthly: 'https://buy.stripe.com/test_eVqbJ14AleBO7AW9wfgnK0a', yearly: 'https://buy.stripe.com/test_6oUaEXfeZgJW08ugYHgnK0b' },
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean).pop() ?? '';

    const SK = env.STRIPE_SECRET_KEY;
    const WH_SECRET = env.STRIPE_WEBHOOK_SECRET;
    const SB_URL = env.SUPABASE_URL ?? 'https://siimuzrjiobhxftntppr.supabase.co';
    const SB_ANON = env.SUPABASE_ANON_KEY;
    const TURN_SECRET = env.TURNSTILE_SECRET_KEY;

    // Health check
    if (path === 'health') {
      return ok({ v: '9.2', worker: 'musiclesslife-checkout', status: 'active', mode: 'test' });
    }

    // Turnstile verify
    if (path === 'turnstile' && request.method === 'POST') {
      const { token, ip } = await request.json().catch(() => ({}));
      if (!token) return ok({ success: false, error: 'No token' }, 400);
      const form = new FormData();
      form.append('secret', TURN_SECRET);
      form.append('response', token);
      if (ip) form.append('remoteip', ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
      const d = await r.json();
      return ok({ success: d.success });
    }

    // Payment Links (fast, no Stripe API call)
    if (path === 'links') {
      return ok({ links: LINKS, prices: PRICES });
    }

    // Create Checkout Session
    if (path === 'session' && request.method === 'POST') {
      const { plan = 'pro', billing = 'monthly', email = '', user_id = '' } = await request.json().catch(() => ({}));
      const priceId = PRICES[plan]?.[billing];
      if (!priceId) return ok({ error: `Invalid plan: ${plan}/${billing}` }, 400);

      const body = new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `https://thedarkgalaxy.com/musiclesslife?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://thedarkgalaxy.com/pricing?checkout=cancelled`,
        allow_promotion_codes: 'true',
      });
      if (email) body.set('customer_email', email);
      if (user_id) {
        body.set('metadata[user_id]', user_id);
        body.set('subscription_data[metadata][plan_id]', plan);
        body.set('subscription_data[metadata][user_id]', user_id);
      }

      const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!r.ok) {
        // Fallback to payment link
        const fb = new URL(LINKS[plan]?.[billing] ?? LINKS.pro.monthly);
        if (email) fb.searchParams.set('prefilled_email', email);
        return ok({ url: fb.toString(), type: 'payment_link_fallback', plan, billing });
      }

      const session = await r.json();
      return ok({ url: session.url, session_id: session.id, type: 'checkout_session', plan, billing });
    }

    // Customer Portal
    if (path === 'portal' && request.method === 'POST') {
      const token = request.headers.get('Authorization')?.slice(7) ?? '';
      if (!token) return ok({ error: 'Authentication required' }, 401);

      // Verify JWT
      const userResp = await fetch(`${SB_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SB_ANON },
      });
      if (!userResp.ok) return ok({ error: 'Invalid token' }, 401);
      const user = await userResp.json();

      // Get Stripe customer ID
      const profileResp = await fetch(`${SB_URL}/rest/v1/musiclesslife_profiles?id=eq.${user.id}&select=stripe_customer_id`, {
        headers: { 'Authorization': `Bearer ${SB_ANON}`, 'apikey': SB_ANON },
      });
      const profiles = await profileResp.json();
      const custId = profiles[0]?.stripe_customer_id;
      if (!custId) return ok({ error: 'No Stripe customer. Please subscribe first.', upgrade_url: 'https://thedarkgalaxy.com/pricing' }, 404);

      const portalBody = new URLSearchParams({
        customer: custId,
        return_url: 'https://thedarkgalaxy.com/profile',
      });
      const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: portalBody.toString(),
      });
      const portal = await r.json();
      return ok({ url: portal.url });
    }

    // Stripe Webhook
    if (path === 'webhook' && request.method === 'POST') {
      const rawBody = await request.text();
      const sig = request.headers.get('stripe-signature') ?? '';

      if (!await verifyStripeSignature(rawBody, sig, WH_SECRET)) {
        return new Response('Invalid signature', { status: 401 });
      }

      const event = JSON.parse(rawBody);
      console.log('[checkout-wh]', event.type, event.id);

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data.object, SB_URL, SB_ANON, SK, env.DB);
          break;
        case 'customer.subscription.updated':
          await handleSubUpdate(event.data.object, SB_URL, SB_ANON);
          break;
        case 'customer.subscription.deleted':
          await handleSubDelete(event.data.object, SB_URL, SB_ANON);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object, SB_URL, SB_ANON);
          break;
        case 'invoice.payment_failed':
          console.log('[checkout-wh] Payment failed for customer:', event.data.object.customer);
          break;
      }

      return ok({ received: true, type: event.type });
    }

    return ok({ error: 'Not found', endpoints: ['health', 'links', 'session', 'portal', 'webhook', 'turnstile'] }, 404);
  },
};

// ── Helpers ──────────────────────────────────────────────────────────

async function handleCheckoutComplete(session, SB_URL, SB_ANON, SK, DB) {
  const userId = session.metadata?.user_id;
  const custId = session.customer;
  const subId = session.subscription;
  if (!userId || !subId) return;

  // Get subscription details from Stripe
  const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { 'Authorization': `Bearer ${SK}` },
  });
  const sub = await subResp.json();
  const plan = sub.items?.data[0]?.price?.metadata?.plan_id ?? 'pro';
  const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
  const periodStart = new Date(sub.current_period_start * 1000).toISOString();

  // Update Supabase profile
  await supaFetch('PATCH', `/rest/v1/musiclesslife_profiles?id=eq.${userId}`, {
    plan,
    plan_name: plan,
    stripe_customer_id: custId,
    stripe_subscription_id: subId,
    plan_expires_at: periodEnd,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, SB_URL, SB_ANON);

  // Update D1 if available
  if (DB) {
    await DB.prepare(`
      INSERT OR REPLACE INTO subscriptions (id, user_id, plan, status, started_at, expires_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?, datetime('now'))
    `).bind(subId, userId, plan, periodStart, periodEnd).run();
  }

  console.log(`[checkout-wh] ${userId} → ${plan} expires ${periodEnd}`);
}

async function handleSubUpdate(sub, SB_URL, SB_ANON) {
  const custId = sub.customer;
  const profiles = await supaFetch('GET', `/rest/v1/musiclesslife_profiles?stripe_customer_id=eq.${custId}&select=id`, undefined, SB_URL, SB_ANON);
  const userId = profiles[0]?.id;
  if (!userId) return;

  const isActive = ['active', 'trialing'].includes(sub.status);
  const plan = isActive ? (sub.items?.data[0]?.price?.metadata?.plan_id ?? 'pro') : 'free';

  await supaFetch('PATCH', `/rest/v1/musiclesslife_profiles?id=eq.${userId}`, {
    plan,
    plan_name: plan,
    stripe_subscription_id: sub.id,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, SB_URL, SB_ANON);
}

async function handleSubDelete(sub, SB_URL, SB_ANON) {
  const custId = sub.customer;
  const profiles = await supaFetch('GET', `/rest/v1/musiclesslife_profiles?stripe_customer_id=eq.${custId}&select=id`, undefined, SB_URL, SB_ANON);
  const userId = profiles[0]?.id;
  if (!userId) return;

  await supaFetch('PATCH', `/rest/v1/musiclesslife_profiles?id=eq.${userId}`, {
    plan: 'free',
    plan_name: 'free',
    stripe_subscription_id: null,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  }, SB_URL, SB_ANON);
}

async function handleInvoicePaid(invoice, SB_URL, SB_ANON) {
  const custId = invoice.customer;
  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null;
  if (!periodEnd) return;
  const profiles = await supaFetch('GET', `/rest/v1/musiclesslife_profiles?stripe_customer_id=eq.${custId}&select=id`, undefined, SB_URL, SB_ANON);
  const userId = profiles[0]?.id;
  if (!userId) return;
  await supaFetch('PATCH', `/rest/v1/musiclesslife_profiles?id=eq.${userId}`, {
    plan_expires_at: periodEnd,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, SB_URL, SB_ANON);
}

async function supaFetch(method, path, body, SB_URL, SB_ANON) {
  const r = await fetch(`${SB_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SB_ANON}`,
      'apikey': SB_ANON,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

async function verifyStripeSignature(payload, header, secret) {
  try {
    const parts = Object.fromEntries(header.split(',').map(s => s.split('=')));
    const { t, v1 } = parts;
    if (!t || !v1) return false;
    if (Math.abs(Date.now() / 1000 - parseInt(t)) > 300) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const buf = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === v1;
  } catch { return false; }
}

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
