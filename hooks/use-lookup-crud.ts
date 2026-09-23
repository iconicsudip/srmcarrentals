"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

export interface LookupListParams {
  page: number;
  limit: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  extraParams?: Record<string, string>;
}

function buildQueryString(params: LookupListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.extraParams) {
    for (const [key, value] of Object.entries(params.extraParams)) {
      if (value) query.set(key, value);
    }
  }
  return query.toString();
}

/** Generic TanStack Query hooks over any of the /cars/* lookup endpoints
 * (Brands, Models, Colors, Seats, ... — anything built on lib/http/lookup-crud.ts). */
export function useLookupList<T>(basePath: string, queryKey: string[], params: LookupListParams) {
  return useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => api.get<PaginatedResult<T>>(`${basePath}?${buildQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export function useCreateLookup<T>(basePath: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<T>(basePath, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useUpdateLookup<T>(basePath: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<T>(`${basePath}/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteLookup(basePath: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`${basePath}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
