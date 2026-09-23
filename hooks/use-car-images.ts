"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiRequestError } from "@/lib/api-client";

export interface CarImageDto {
  id: string;
  carId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
}

function imagesKey(carId: string) {
  return ["cars", "images", carId] as const;
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiRequestError(response.status, body);
  }
  return response.json() as Promise<T>;
}

export function useCarImages(carId: string) {
  return useQuery({
    queryKey: imagesKey(carId),
    queryFn: async () => {
      const response = await fetch(`/api/v1/cars/${carId}/images`, { credentials: "include" });
      return parseJsonOrThrow<CarImageDto[]>(response);
    },
    enabled: !!carId,
  });
}

export function useUploadCarImage(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/v1/cars/${carId}/images`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      return parseJsonOrThrow<CarImageDto>(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imagesKey(carId) }),
  });
}

export function useUpdateCarImage(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, data }: { imageId: string; data: { altText?: string; isFeatured?: boolean } }) => {
      const response = await fetch(`/api/v1/cars/${carId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      return parseJsonOrThrow<CarImageDto>(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imagesKey(carId) }),
  });
}

export function useDeleteCarImage(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/v1/cars/${carId}/images/${imageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiRequestError(response.status, body);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: imagesKey(carId) }),
  });
}

export function useReorderCarImages(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: string[]) => {
      const response = await fetch(`/api/v1/cars/${carId}/images/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
        credentials: "include",
      });
      return parseJsonOrThrow<CarImageDto[]>(response);
    },
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: imagesKey(carId) });
      const previous = queryClient.getQueryData<CarImageDto[]>(imagesKey(carId));
      if (previous) {
        const byId = new Map(previous.map((img) => [img.id, img]));
        queryClient.setQueryData(
          imagesKey(carId),
          order.map((id, index) => ({ ...byId.get(id)!, sortOrder: index })),
        );
      }
      return { previous };
    },
    onError: (_err, _order, context) => {
      if (context?.previous) queryClient.setQueryData(imagesKey(carId), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: imagesKey(carId) }),
  });
}
