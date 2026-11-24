import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // No caching, whichever service hosts the app: nothing is kept in memory between requests ...
  cacheMaxMemorySize: 0,
  experimental: {
    // ... and the browser's in-app navigation cache is switched off for dynamic pages
    staleTimes: { dynamic: 0 },
    authInterrupts: true,
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "@radix-ui/react-select"],
    // Keep sharp/libvips memory bounded on a 512 MB server so concurrent /_next/image requests don't OOM or stall.
    imgOptConcurrency: 1,
    imgOptOperationCache: false,
    imgOptSequentialRead: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Light on memory so it fits a small (512 MB) server: AVIF encoding is the heaviest option, so only WebP is made,
    // and fewer sizes are generated (each extra size is another resize that has to fit in memory).
    formats: ["image/webp"],
    deviceSizes: [480, 768, 1200, 1920],
    imageSizes: [96, 192, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        // Pages and API responses are never stored by browsers, CDNs or proxies. Exempt: hashed /_next/static files, resized /_next/image
        // copies, static /images assets, app icons and uploaded photos — they can safely be cached (and must be, to load fast and avoid Render 429 bursts)
        source: "/((?!_next/static|_next/image|api/v1/uploads/images|images/|icon\\.png|apple-icon\\.png|favicon\\.ico).*)",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/:icon(icon\\.png|apple-icon\\.png|favicon\\.ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
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
