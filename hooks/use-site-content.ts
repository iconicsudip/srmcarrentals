"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export function useSiteSetting<T>(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => api.get<T>(`/settings/${key}`),
    retry: false,
  });
}

export function useSaveSiteSetting<T>(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: T) => api.put<T>(`/settings/${key}`, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", key] }),
  });
}
