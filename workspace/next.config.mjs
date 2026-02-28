
/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // This is the correct way to disable Turbopack and resolve build errors with next-pwa.
  experimental: {
    turbopack: false,
  },
  webpack: (config) => {
    // This function is required by next-pwa to force webpack.
    return config;
  },
};

export default pwaConfig(nextConfig);
