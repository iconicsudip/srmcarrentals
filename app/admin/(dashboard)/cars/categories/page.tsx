"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Category extends LookupRow {
  name: string;
  slug: string;
  description?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function CarCategoriesPage() {
  return (
    <LookupManager<Category>
      title="Car Category"
      description="Manage car categories such as Economy, Luxury, and SUV."
      basePath="/cars/categories"
      queryKey={["cars", "categories"]}
      entityLabel="category"
      searchPlaceholder="Search categories..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Luxury" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
        { name: "imageUrl", label: "Image URL", type: "url", placeholder: "https://..." },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Slug", cell: (row) => <span className="text-muted-foreground">{row.slug}</span> },
      ]}
    />
  );
}
