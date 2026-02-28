/** @type {import('next').NextConfig} */
const nextConfig = {
  // A clean, minimal config now that the PWA plugin is removed.
  // This allows Next.js to use its default compiler without conflicts.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
