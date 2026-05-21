import { NextRequest, NextResponse } from 'next/server';
import { isShopifyEnabled, checkoutFromHandles } from '@/lib/shopify';

// POST body:
//   { items: [{ handle: "daily-morning-essentials", quantity: 1 }, ...], email?: "x@y.com" }
//
// Response:
//   { url: "https://lifecode-store.myshopify.com/cart/c/abc123..." }   ← redirect here
//   { error: "..." }                                                    ← 4xx/5xx

export async function POST(req: NextRequest) {
  try {
    if (!isShopifyEnabled()) {
      return NextResponse.json(
        { error: 'Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const items = Array.isArray(body.items) ? body.items : [];
    const email: string | undefined = typeof body.email === 'string' ? body.email : undefined;

    if (items.length === 0) {
      return NextResponse.json({ error: 'items[] required' }, { status: 400 });
    }

    // Sanitize
    const cleaned = items
      .map((i: any) => ({
        handle: String(i.handle || '').trim().toLowerCase(),
        quantity: Math.max(1, parseInt(String(i.quantity)) || 1),
      }))
      .filter((i: any) => i.handle.length > 0);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'no valid product handles' }, { status: 400 });
    }

    const checkoutUrl = await checkoutFromHandles(cleaned, { email });
    return NextResponse.json({ url: checkoutUrl });
  } catch (err: any) {
    console.error('[shopify/checkout]', err?.message);
    return NextResponse.json({ error: err?.message || 'checkout error' }, { status: 500 });
  }
}
