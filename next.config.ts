import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  eslint: {
    dirs: ["app", "src"],
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
