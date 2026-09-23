"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

export interface AdminUserDto {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: string; label: string };
}

const KEY = ["admin-users"] as const;

export function useAdminUsers(params: { page: number; limit: number; search?: string; roles?: string[] }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
      if (params.search) q.set("search", params.search);
      if (params.roles?.length) q.set("roles", params.roles.join(","));
      return api.get<PaginatedResult<AdminUserDto>>(`/users?${q.toString()}`);
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<AdminUserDto>("/users", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch<AdminUserDto>(`/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
