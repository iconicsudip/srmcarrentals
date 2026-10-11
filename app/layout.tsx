import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { UpdatePrompt } from "@/components/update-prompt";
import { getBuildId } from "@/lib/version/build-id";

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
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <UpdatePrompt buildId={getBuildId()} />
      </body>
    </html>
  );
}
