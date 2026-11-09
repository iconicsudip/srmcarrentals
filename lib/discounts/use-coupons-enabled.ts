"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api-client";

let cached: boolean | null = null;

/** Whether discount codes are switched on (Admin → Settings → General). On until the admin turns them off. */
export function useCouponsEnabled(): boolean {
  const [enabled, setEnabled] = React.useState<boolean>(cached ?? true);
  React.useEffect(() => {
    if (cached !== null) return;
    apiFetch<{ couponsEnabled?: boolean }>("/settings/system.discounts", { skipAuthRedirect: true })
      .then((s) => {
        cached = s?.couponsEnabled !== false;
        setEnabled(cached);
      })
      .catch(() => {
        cached = true; // nothing saved yet → on
      });
  }, []);
  return enabled;
}
