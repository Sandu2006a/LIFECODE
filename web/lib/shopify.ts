// Shopify Storefront API client.
//
// Headless integration: our Next.js front-end stays as the marketing site,
// Shopify owns products + checkout + inventory + payments.
//
// Required env vars (server-side):
//   SHOPIFY_STORE_DOMAIN      e.g. "lifecode-store.myshopify.com"
//   SHOPIFY_STOREFRONT_TOKEN  the unauthenticated Storefront API token
//
// Public flag (so we can switch checkout between Stripe and Shopify):
//   NEXT_PUBLIC_SHOPIFY_ENABLED = "true" → use Shopify checkout
//                                anything else → keep current Stripe flow
//
// Setup steps in Shopify Admin:
//   1) Add products (one per SKU). Note the product HANDLE (URL slug).
//   2) Settings → Apps and sales channels → Develop apps → Create app
//   3) Configure Storefront API access. Required scopes:
//        - unauthenticated_read_product_listings
//        - unauthenticated_read_product_inventory
//        - unauthenticated_write_checkouts  (for cart/checkout creation)
//   4) Install app → copy the Storefront API access token

const API_VERSION = '2025-01';

function getEnv() {
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || '').trim();
  const token  = (process.env.SHOPIFY_STOREFRONT_TOKEN || '').trim();
  if (!domain || !token) {
    throw new Error('Shopify not configured: SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN must be set');
  }
  return { domain, token };
}

export function isShopifyEnabled(): boolean {
  return !!(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_TOKEN);
}

async function storefront<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { domain, token } = getEnv();
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    // GraphQL queries can be POST; we tag with a Cache-Control so the edge
    // can re-validate product data periodically.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Shopify Storefront HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e: any) => e.message).join('; ')}`);
  }
  return json.data as T;
}

// ── Types ─────────────────────────────────────────────────────────

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage?: { url: string; altText?: string } | null;
  variants: ShopifyVariant[];
};

export type ShopifyVariant = {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
};

// ── Queries ───────────────────────────────────────────────────────

const PRODUCT_QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      featuredImage { url altText }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price { amount currencyCode }
            availableForSale
          }
        }
      }
    }
  }
`;

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefront<{ product: any | null }>(PRODUCT_QUERY, { handle });
  if (!data.product) return null;
  return {
    id: data.product.id,
    handle: data.product.handle,
    title: data.product.title,
    description: data.product.description,
    featuredImage: data.product.featuredImage,
    variants: (data.product.variants?.edges || []).map((e: any) => e.node),
  };
}

// ── Cart create → returns hosted Shopify checkout URL ─────────────

const CART_CREATE = `
  mutation CartCreate($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) {
      cart {
        id
        checkoutUrl
      }
      userErrors { message field }
    }
  }
`;

export type CartLine = { merchandiseId: string; quantity: number };

export async function createCart(
  lines: CartLine[],
  options?: { email?: string },
): Promise<{ cartId: string; checkoutUrl: string }> {
  const data = await storefront<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: { message: string }[];
    };
  }>(CART_CREATE, {
    lines,
    buyerIdentity: options?.email ? { email: options.email } : undefined,
  });
  if (data.cartCreate.userErrors?.length) {
    throw new Error(data.cartCreate.userErrors.map(e => e.message).join('; '));
  }
  if (!data.cartCreate.cart) {
    throw new Error('Shopify cartCreate returned no cart');
  }
  return {
    cartId:       data.cartCreate.cart.id,
    checkoutUrl:  data.cartCreate.cart.checkoutUrl,
  };
}

// ── Helper: build checkout URL from product handles ───────────────
//
// Typical usage:
//   const url = await checkoutFromHandles([
//     { handle: 'daily-morning-essentials', quantity: 1 },
//     { handle: 'daily-after-training-repair', quantity: 1 },
//   ]);
//   res.redirect(url)
//
// Uses the FIRST variant of each product (good enough when products have a
// single variant, which is the common case for SaaS-style supplement boxes).

export async function checkoutFromHandles(
  items: { handle: string; quantity: number }[],
  options?: { email?: string },
): Promise<string> {
  const lines: CartLine[] = [];
  for (const it of items) {
    const product = await getProduct(it.handle);
    if (!product) throw new Error(`Shopify product not found: ${it.handle}`);
    const variant = product.variants[0];
    if (!variant) throw new Error(`Shopify product has no variants: ${it.handle}`);
    lines.push({ merchandiseId: variant.id, quantity: Math.max(1, it.quantity) });
  }
  const { checkoutUrl } = await createCart(lines, options);
  return checkoutUrl;
}
