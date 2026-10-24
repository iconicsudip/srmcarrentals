"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/tracking/events";

type Win = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

/** The tags report the first page load themselves; this reports every later in-app page change. */
export function RouteTracker() {
  const pathname = usePathname();
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const w = window as Win;
    try {
      w.fbq?.("track", "PageView");
      w.gtag?.("event", "page_view", { page_path: pathname });
    } catch {
      /* ignore */
    }
  }, [pathname]);

  // WhatsApp and call links count as a "Contact" action
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href") ?? "";
      if (/^(https?:\/\/(wa\.me|api\.whatsapp\.com)|tel:)/i.test(href)) trackEvent("Contact");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
