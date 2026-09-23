"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { DashboardOverview } from "@/modules/analytics/analytics.service";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => api.get<DashboardOverview>("/analytics/overview"),
  });
}
