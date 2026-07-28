import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Smaller client bundles (especially lucide)
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Pi 2GB: don't ship browser source maps
  productionBrowserSourceMaps: false,
  // Compress responses
  compress: true,
  poweredByHeader: false,
  // Allow LAN access in dev
  allowedDevOrigins: [
    "192.168.1.19",
    "localhost",
    "127.0.0.1",
  ],
  // Prefer fewer concurrent static workers on low-RAM machines
  ...(isProd
    ? {
        // Avoid generating unused image optimization pipelines on Pi kiosk
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
