/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large video files served from /public
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
};

export default nextConfig;
