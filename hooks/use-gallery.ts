"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";

export interface GalleryImageDto {
  id: string;
  imageUrl: string;
  caption: string | null;
  link: string | null;
  sortOrder: number;
  status: "ACTIVE" | "INACTIVE";
}

const GALLERY_KEY = ["website", "gallery"] as const;

export function useGalleryImages() {
  return useQuery({
    queryKey: GALLERY_KEY,
    queryFn: () => api.get<PaginatedResult<GalleryImageDto>>("/website/gallery?limit=100"),
  });
}

export function useUploadGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("folder", "gallery");
      const uploadResponse = await fetch("/api/v1/uploads", { method: "POST", body: uploadForm, credentials: "include" });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      const { url } = (await uploadResponse.json()) as { url: string };

      return api.post<GalleryImageDto>("/website/gallery", { imageUrl: url });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<GalleryImageDto, "caption" | "link" | "status">> }) =>
      api.patch<GalleryImageDto>(`/website/gallery/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/website/gallery/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}
