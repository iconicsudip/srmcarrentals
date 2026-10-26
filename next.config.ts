import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "@radix-ui/react-select"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Serve images as they are. Vercel's image optimizer is metered; once the free quota is used it answers
    // "402 payment required" and every picture disappears. Uploaded photos are already compressed when saved.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [60, 75, 80, 92],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
