import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS, PlanKey } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-zeta-lyart-53.vercel.app';

export async function POST(req: NextRequest) {
  try {
    const { plan, email, full_name } = await req.json() as {
      plan: PlanKey;
      email: string;
      full_name?: string;
    };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }

    const planConfig = PLANS[plan];

    // Find or create Supabase user profile by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const userId = profile?.id ?? null;

    // Find or create Stripe customer
    let customerId: string | undefined;
    if (userId) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();
      customerId = sub?.stripe_customer_id ?? undefined;
    }

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: email.toLowerCase(),
        name: full_name ?? undefined,
        metadata: { user_id: userId ?? '' },
      });
      customerId = customer.id;
    }

    // Build line items — use price_id if set, otherwise use price_data
    const lineItems = planConfig.price_id
      ? [{ price: planConfig.price_id, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: planConfig.name },
              unit_amount: plan === 'essentials' ? 9900 : 4900,
              ...(planConfig.mode === 'subscription'
                ? { recurring: { interval: 'month' as const } }
                : {}),
            },
            quantity: 1,
          },
        ];

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: planConfig.mode,
      line_items: lineItems,
      success_url: `${BASE}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE}/pricing`,
      customer_email: customerId ? undefined : email.toLowerCase(),
      metadata: {
        user_id: userId ?? '',
        plan,
        product_type: planConfig.product_type,
      },
      subscription_data:
        planConfig.mode === 'subscription'
          ? { metadata: { user_id: userId ?? '', plan } }
          : undefined,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('create-session error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
