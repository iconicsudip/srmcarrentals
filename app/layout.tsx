import type { Metadata } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SRM Car Rentals",
    template: "%s | SRM Car Rentals",
  },
  description: "Self-drive and chauffeur-driven car rentals across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
