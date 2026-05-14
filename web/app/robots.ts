import type { MetadataRoute } from 'next';

const SITE = 'https://lifecodenutrition.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/checkout/success', '/login'],
      },
      // Be explicit for the big crawlers so there's no ambiguity
      { userAgent: 'Googlebot',        allow: '/' },
      { userAgent: 'Bingbot',          allow: '/' },
      { userAgent: 'DuckDuckBot',      allow: '/' },
      { userAgent: 'Slurp',            allow: '/' }, // Yahoo
      { userAgent: 'YandexBot',        allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
