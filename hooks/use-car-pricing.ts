"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export interface CarPricingDto {
  dailyPrice: string;
  includedKmPerDay: number;
  extraKmPrice: string;
  extraHourPrice: string;
  hourlyPrice: string | null;
  minHourlyBookingHours: number | null;
  gracePeriodMinutes: number;
  extraHourRoundingMode: "EXACT_HOUR" | "ROUND_UP";
}

export function useCarPricing(carId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["cars", "pricing", carId],
    queryFn: () => api.get<CarPricingDto | null>(`/cars/${carId}/pricing`),
    enabled,
  });
}

export function useSaveCarPricing(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put<CarPricingDto>(`/cars/${carId}/pricing`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars", "pricing", carId] }),
  });
}
