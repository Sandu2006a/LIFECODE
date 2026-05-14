import type { MetadataRoute } from 'next';

const SITE = 'https://lifecodenutrition.com';

const STATIC_PATHS = [
  { path: '/',                     priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/about',                priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/science',              priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/ingredients',          priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/pricing',              priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/ecosystem',            priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/lifecode-comparison',  priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/contact',              priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/login',                priority: 0.4, changeFrequency: 'yearly' as const },
  { path: '/privacy',              priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms',                priority: 0.3, changeFrequency: 'yearly' as const },
];

// Known product slugs — keep this list in sync with /app/products/[slug]
const PRODUCT_SLUGS = ['morning-pack', 'recovery-pack', 'essentials'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries = STATIC_PATHS.map((s) => ({
    url: `${SITE}${s.path}`,
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));
  const productEntries = PRODUCT_SLUGS.map((slug) => ({
    url: `${SITE}/products/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [...staticEntries, ...productEntries];
}
