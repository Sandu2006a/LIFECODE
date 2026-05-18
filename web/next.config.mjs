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
        source: '/:path*',
        headers: [
          // Hint to Cloudflare that this is a normal HTML page (not bot-API)
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
          { key: 'Vary', value: 'Accept-Encoding' },
          // Permissions-Policy that Cloudflare's bot detector recognizes
          { key: 'Permissions-Policy', value: 'interest-cohort=()' },
          // Allow framing from same origin (some captive portals embed)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
