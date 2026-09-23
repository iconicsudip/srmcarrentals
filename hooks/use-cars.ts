"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

const CARS_KEY = ["cars"] as const;

export interface CarListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  brandId?: string;
  categoryId?: string;
  carTypeId?: string;
}

function toQueryString(params: CarListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.brandId) query.set("brandId", params.brandId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.carTypeId) query.set("carTypeId", params.carTypeId);
  return query.toString();
}

export function useCarList<T>(params: CarListParams) {
  return useQuery({
    queryKey: [...CARS_KEY, "list", params],
    queryFn: () => api.get<PaginatedResult<T>>(`/cars?${toQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export function useCar<T>(id: string | undefined) {
  return useQuery({
    queryKey: [...CARS_KEY, "detail", id],
    queryFn: () => api.get<T>(`/cars/${id}`),
    enabled: !!id,
  });
}

export function useCreateCar<T>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<T>("/cars", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARS_KEY }),
  });
}

export function useUpdateCar<T>(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch<T>(`/cars/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARS_KEY }),
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/cars/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARS_KEY }),
  });
}
