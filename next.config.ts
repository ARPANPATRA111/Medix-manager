import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Suppress source map warnings in development - using empty turbopack config for Next.js 16
  turbopack: {},
};

export default nextConfig;
