"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

/** Fetches up to 100 active rows of a lookup entity and maps them to
 * { label, value } pairs for a <Select>. Used across the Car form's many
 * dropdowns (brand, model, category, colors, features, ...). */
export function useLookupOptions<T extends { id: string }>(
  basePath: string,
  labelKey: keyof T,
  extraParams?: Record<string, string>,
) {
  const query = useQuery({
    queryKey: ["lookup-options", basePath, extraParams],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100", status: "ACTIVE", ...extraParams });
      return api.get<PaginatedResult<T>>(`${basePath}?${params.toString()}`);
    },
  });

  const options = (query.data?.data ?? []).map((row) => ({
    label: String(row[labelKey]),
    value: row.id,
  }));

  return { ...query, options, rows: query.data?.data ?? [] };
}
