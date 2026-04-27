import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Access level mapping
function accessLevelForPlan(plan: string, status: string): { level: string; active: boolean } {
  if (status !== 'active' && status !== 'trialing') {
    return { level: plan === 'essentials' ? 'basic' : 'locked', active: false };
  }
  if (plan === 'protocol') return { level: 'protocol', active: true };
  if (plan === 'elite_lab') return { level: 'elite_lab', active: true };
  if (plan === 'essentials') return { level: 'basic', active: true };
  return { level: 'locked', active: false };
}

async function upsertAppAccess(userId: string, plan: string, status: string, reason?: string) {
  const { level, active } = accessLevelForPlan(plan, status);
  await supabase.from('app_access').upsert({
    user_id: userId,
    access_level: level,
    is_active: active,
    reason: reason ?? status,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook sig error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Checkout completed ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan ?? 'essentials';
        const productType = session.metadata?.product_type ?? 'essentials_box';

        // Upsert order
        await supabase.from('orders').upsert({
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          user_id: userId || null,
          product_type: productType,
          amount_total: session.amount_total,
          currency: session.currency,
          status: 'paid',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_checkout_session_id' });

        if (!userId) break;

        // Update stripe_customer_id on any existing subscription
        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '',
            stripe_subscription_id: subscriptionId,
            plan,
            status: 'active',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_subscription_id' });
          await upsertAppAccess(userId, plan, 'active');
        } else {
          // One-time (essentials)
          await upsertAppAccess(userId, plan, 'active', 'one_time_purchase');
        }
        break;
      }

      // ── Subscription created / updated ──────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const plan = sub.metadata?.plan ?? 'protocol';
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        await upsertAppAccess(userId, plan, sub.status);
        break;
      }

      // ── Subscription deleted (canceled) ─────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase.from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);

        await upsertAppAccess(userId, 'protocol', 'canceled', 'subscription_canceled');
        break;
      }

      // ── Payment succeeded ────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;
        if (!subId) break;

        await supabase.from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);

        // Restore access
        const { data: sub } = await supabase.from('subscriptions')
          .select('user_id, plan').eq('stripe_subscription_id', subId).maybeSingle();
        if (sub) await upsertAppAccess(sub.user_id, sub.plan, 'active');
        break;
      }

      // ── Payment failed ───────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;
        if (!subId) break;

        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);

        const { data: sub } = await supabase.from('subscriptions')
          .select('user_id, plan').eq('stripe_subscription_id', subId).maybeSingle();
        if (sub) await upsertAppAccess(sub.user_id, sub.plan, 'past_due', 'payment_failed');
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
