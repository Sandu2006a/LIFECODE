/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
  // Exclude design handoff files from compilation
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
};

export default nextConfig;
