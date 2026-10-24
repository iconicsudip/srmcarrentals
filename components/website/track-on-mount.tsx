"use client";

import * as React from "react";

import { trackEvent } from "@/lib/tracking/events";

type Params = Parameters<typeof trackEvent>[1];

/** Fires one marketing event when the page opens. `once` (e.g. a booking reference) stops a refresh from counting twice. */
export function TrackOnMount({ event, params, once }: { event: Parameters<typeof trackEvent>[0]; params?: Params; once?: string }) {
  React.useEffect(() => {
    if (once) {
      try {
        const key = `tracked:${event}:${once}`;
        if (window.sessionStorage.getItem(key)) return;
        window.sessionStorage.setItem(key, "1");
      } catch {
        /* storage blocked — fire anyway */
      }
    }
    // The tags load just after the page does, so give them a moment.
    const t = window.setTimeout(() => trackEvent(event, params), 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
