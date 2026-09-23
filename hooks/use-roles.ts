"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export interface PermissionDto {
  id: string;
  key: string;
  group: string;
  description: string | null;
}

export interface RoleDto {
  id: string;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: PermissionDto }[];
  _count: { users: number };
}

const ROLES_KEY = ["roles"] as const;
const PERMISSIONS_KEY = ["permissions"] as const;

export function useRoles() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: () => api.get<RoleDto[]>("/roles") });
}

export function usePermissions() {
  return useQuery({ queryKey: PERMISSIONS_KEY, queryFn: () => api.get<PermissionDto[]>("/permissions") });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; label: string; description?: string; permissionKeys: string[] }) =>
      api.post<RoleDto>("/roles", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { label?: string; description?: string; permissionKeys?: string[] } }) =>
      api.patch<RoleDto>(`/roles/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}
