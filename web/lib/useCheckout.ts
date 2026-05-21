'use client';

import { useState } from 'react';

// Feature flag — wired from env. Both Stripe and Shopify routes are present;
// this picks which backend handles "Buy" clicks.
//   NEXT_PUBLIC_SHOPIFY_ENABLED = "true" → Shopify checkout URL
//   anything else                       → existing Stripe checkout session
const SHOPIFY_ENABLED = process.env.NEXT_PUBLIC_SHOPIFY_ENABLED === 'true';

// Product handles in Shopify. Override via env if your Shopify products
// use different slugs (the value after /products/ in the Shopify URL).
const HANDLE_MORNING  = process.env.NEXT_PUBLIC_SHOPIFY_HANDLE_MORNING  || 'daily-morning-essentials';
const HANDLE_RECOVERY = process.env.NEXT_PUBLIC_SHOPIFY_HANDLE_RECOVERY || 'daily-after-training-repair';

export type CheckoutPlan =
  | 'essentials'    // legacy Stripe one-time
  | 'protocol'      // legacy Stripe subscription
  | 'morning'       // Shopify: just the Morning Pak
  | 'recovery'      // Shopify: just the Recovery Pak
  | 'bundle';       // Shopify: both packs

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function go(plan: CheckoutPlan, email: string, fullName?: string) {
    setLoading(true);
    setError(null);

    try {
      // Path A: Shopify (when flag is on AND the plan is a Shopify SKU)
      if (SHOPIFY_ENABLED && (plan === 'morning' || plan === 'recovery' || plan === 'bundle')) {
        const items =
          plan === 'morning'  ? [{ handle: HANDLE_MORNING,  quantity: 1 }] :
          plan === 'recovery' ? [{ handle: HANDLE_RECOVERY, quantity: 1 }] :
                                [{ handle: HANDLE_MORNING,  quantity: 1 },
                                 { handle: HANDLE_RECOVERY, quantity: 1 }];

        const res = await fetch('/api/shopify/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, email }),
        });
        const json = await res.json();
        if (!res.ok || !json.url) throw new Error(json.error || 'Checkout failed');
        window.location.href = json.url;
        return;
      }

      // Path B: Stripe (legacy)
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email, full_name: fullName }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Checkout failed');
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || 'Checkout error');
    } finally {
      setLoading(false);
    }
  }

  return { go, loading, error, shopifyEnabled: SHOPIFY_ENABLED };
}
