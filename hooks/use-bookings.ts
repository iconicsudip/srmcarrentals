"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

export interface BookingListItem {
  id: string;
  bookingReference: string;
  status: string;
  pickupDateTime: string;
  dropDateTime: string;
  car: { name: string; brand: { name: string }; model: { name: string } };
  customer: { firstName: string; lastName: string; email: string; phone: string };
  driver: { firstName: string; lastName: string } | null;
  pricingSnapshot: { grandTotal: string } | null;
}

export interface BookingDetail extends BookingListItem {
  pickupLocation: { name: string } | null;
  dropLocation: { name: string } | null;
  pickupAirport: { name: string; code: string } | null;
  dropAirport: { name: string; code: string } | null;
  pickupIsAirport: boolean;
  dropIsAirport: boolean;
  estimatedKm: string | null;
  actualKm: string | null;
  actualPickupAt: string | null;
  actualDropAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  car: BookingListItem["car"] & { id: string; slug: string; images: { url: string }[] };
  customer: BookingListItem["customer"] & { id: string };
  pricingSnapshot: {
    dailyPrice: string;
    extraHourPrice: string;
    rentalPrice: string;
    extraHourCharge: string;
    extraKmCharge: string;
    airportPickupCharge: string;
    airportDropCharge: string;
    seasonalAdjustment: string;
    servicesTotal: string;
    insuranceCharge: string;
    discount: string;
    couponCode: string | null;
    subtotal: string;
    taxPercentage: string;
    taxAmount: string;
    grandTotal: string;
  } | null;
}

const KEY = ["bookings"] as const;

export function useBookingList(params: { page: number; limit: number; status?: string; search?: string; carId?: string }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
      if (params.status) q.set("status", params.status);
      if (params.search) q.set("search", params.search);
      if (params.carId) q.set("carId", params.carId);
      return api.get<PaginatedResult<BookingListItem>>(`/bookings?${q.toString()}`);
    },
    placeholderData: (prev) => prev,
    enabled: params.carId !== "",
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<BookingDetail>(`/bookings/${id}`),
    enabled: !!id,
  });
}

function useBookingAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
      api.post<BookingDetail>(`/bookings/${id}/${action}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useConfirmBooking = () => useBookingAction("confirm");
export const useCancelBooking = () => useBookingAction("cancel");
export const useAssignDriverToBooking = () => useBookingAction("assign-driver");
export const useStartTrip = () => useBookingAction("start-trip");
export const useCompleteTrip = () => useBookingAction("complete-trip");
