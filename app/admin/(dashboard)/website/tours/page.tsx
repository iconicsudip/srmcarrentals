"use client";

import { z } from "zod";

import { useLookupOptions } from "@/hooks/use-lookup-options";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface TourRow extends LookupRow {
  name: string;
  slug: string;
  durationDays: number;
  durationNights: number;
  startingPrice: string;
  category?: { name: string };
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).optional(),
  durationDays: z.coerce.number().int().positive(),
  durationNights: z.coerce.number().int().nonnegative(),
  description: z.string().max(1000).optional().or(z.literal("")),
  keyExperiences: z.array(z.string()).optional(),
  assignedCarId: z.string().optional().or(z.literal("")),
  startingPrice: z.coerce.number().nonnegative(),
  sortOrder: z.coerce.number().int().optional(),
});

export default function ToursPage() {
  const categories = useLookupOptions<{ id: string; name: string }>("/website/tour-categories", "name");
  const cars = useLookupOptions<{ id: string; name: string }>("/cars", "name");

  return (
    <LookupManager<TourRow>
      title="Tours"
      description="Curated tour packages shown in the 'Go Beyond The Drive' section."
      basePath="/website/tours"
      queryKey={["website", "tours"]}
      entityLabel="tour"
      searchPlaceholder="Search tours..."
      formSchema={formSchema}
      createDefaultValues={{ rating: 5, sortOrder: 0, keyExperiences: [], durationNights: 0, durationDays: 1 }}
      getEditDefaultValues={(row) => ({
        name: row.name,
        categoryId: (row as unknown as { categoryId: string }).categoryId,
        imageUrl: (row as unknown as { imageUrl?: string }).imageUrl ?? "",
        rating: Number((row as unknown as { rating?: string }).rating ?? 5),
        durationDays: row.durationDays,
        durationNights: row.durationNights,
        description: (row as unknown as { description?: string }).description ?? "",
        keyExperiences: (row as unknown as { keyExperiences?: string[] }).keyExperiences ?? [],
        assignedCarId: (row as unknown as { assignedCarId?: string }).assignedCarId ?? "",
        startingPrice: Number(row.startingPrice),
        sortOrder: (row as unknown as { sortOrder?: number }).sortOrder ?? 0,
      })}
      fields={[
        { name: "name", label: "Tour Name", placeholder: "e.g. Royal Rajasthan Heritage Circuit" },
        { name: "categoryId", label: "Category", type: "select", selectOptions: categories.options },
        { name: "imageUrl", label: "Image URL", type: "url" },
        { name: "rating", label: "Rating (0-5)", type: "number" },
        { name: "durationDays", label: "Duration (Days)", type: "number" },
        { name: "durationNights", label: "Duration (Nights)", type: "number" },
        { name: "description", label: "Description", type: "textarea", placeholder: "A short evocative quote/summary" },
        { name: "keyExperiences", label: "Key Experiences", type: "tags", description: "Comma separated" },
        {
          name: "assignedCarId",
          label: "Assigned Car",
          type: "select",
          selectOptions: cars.options,
          placeholder: "Optional",
        },
        { name: "startingPrice", label: "Starting Price (₹)", type: "number" },
        { name: "sortOrder", label: "Sort Order", type: "number" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Category", cell: (row) => row.category?.name ?? "—" },
        { header: "Duration", cell: (row) => `${row.durationDays}D / ${row.durationNights}N` },
        { header: "Price", cell: (row) => `₹${Number(row.startingPrice).toLocaleString("en-IN")}` },
      ]}
    />
  );
}
