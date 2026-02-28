import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false, // Redirects /search/ to /search automatically
  // 1. Keep this for now to ensure your builds succeed while you fix types
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. Optimized Image Configuration
  images: {
    // If Next.js native optimization still causes issues, set this to true
    // unoptimized: true, 
    
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**", // Restricts to your storage buckets
      },
      {
        protocol: "https://",
        hostname: "lh3.googleusercontent.com", // For Google Auth profile pics
      },
    ],
  },
  
  // 3. Security: Hide the tech stack from bot scanners
  poweredByHeader: false,
};

export default nextConfig;
