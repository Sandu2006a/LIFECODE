import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

export const PLANS = {
  essentials: {
    name: 'Essentials',
    mode: 'payment' as const,
    price_id: process.env.STRIPE_ESSENTIALS_PRICE_ID ?? '',
    product_type: 'essentials_box',
    access_level: 'basic',
  },
  protocol: {
    name: 'Protocol',
    mode: 'subscription' as const,
    price_id: process.env.STRIPE_PROTOCOL_PRICE_ID ?? '',
    product_type: 'protocol_subscription',
    access_level: 'protocol',
  },
} as const;

export type PlanKey = keyof typeof PLANS;
