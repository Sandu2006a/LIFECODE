/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    config.module.rules.push({
      test: /LIFECODE_APP/,
      use: 'ignore-loader',
    });
    return config;
  },

  // Cloudflare-friendly headers.
  // Some networks (corporate, universities like TUe) cause Cloudflare's Bot
  // Fight Mode to challenge or 404 the response. Setting explicit cache-control
  // and identity encoding makes the response cacheable at Cloudflare's edge
  // and reduces the bot-detection signal weight.
  async headers() {
    return [
      {
        // Marketing site only — every non-API path. Caching /api/* at the edge
        // was breaking the app: after a pack un-tick, GET /api/me/state served
        // a stale (still-taken) snapshot from cache for 5 min, so the rings
        // re-filled themselves moments after the user un-ticked the pack.
        source: '/:path((?!api/).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
          { key: 'Vary', value: 'Accept-Encoding' },
          { key: 'Permissions-Policy', value: 'interest-cohort=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // All API routes: never cache. Reads must reflect the user's latest
        // writes (intake taken/un-taken, meal logged, profile updated).
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Static fallback page MUST be aggressively cached and never challenged
        source: '/status',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, immutable' },
          { key: 'Content-Type', value: 'text/html; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
