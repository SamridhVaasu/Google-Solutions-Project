/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Handle browser-only modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    };
    
    // Don't try to bundle external browser scripts
    config.externals = [
      ...(config.externals || []), 
      { canvas: "canvas" }
    ];
    
    return config;
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_OLAMAPS_PROJECT_ID: process.env.NEXT_PUBLIC_OLAMAPS_PROJECT_ID,
    NEXT_PUBLIC_OLAMAPS_CLIENT_ID: process.env.NEXT_PUBLIC_OLAMAPS_CLIENT_ID,
    // Don't expose client secret in client-side code
  },
};

module.exports = nextConfig;