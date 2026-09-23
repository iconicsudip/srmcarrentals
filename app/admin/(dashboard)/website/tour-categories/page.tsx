"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface TourCategoryRow extends LookupRow {
  name: string;
  slug: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export default function TourCategoriesPage() {
  return (
    <LookupManager<TourCategoryRow>
      title="Tour Categories"
      description="Group tours by region, e.g. Rajasthan Heritage, Jaisalmer Thar."
      basePath="/website/tour-categories"
      queryKey={["website", "tour-categories"]}
      entityLabel="tour category"
      searchPlaceholder="Search categories..."
      formSchema={formSchema}
      fields={[{ name: "name", label: "Name", placeholder: "e.g. Udaipur & Mewar" }]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Slug", cell: (row) => <span className="text-muted-foreground">{row.slug}</span> },
      ]}
    />
  );
}
