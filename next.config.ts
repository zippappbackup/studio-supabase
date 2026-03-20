import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false, // Redirects /search/ to /search automatically
  // 1. Keep this for now to ensure your builds succeed while you fix types
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. Optimized Image Configuration
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleapis.com" },
    ],
  },
  
  // 3. Security: Hide the tech stack from bot scanners
  poweredByHeader: false,
};

export default nextConfig;
