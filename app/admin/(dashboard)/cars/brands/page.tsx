"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Brand extends LookupRow {
  name: string;
  slug: string;
  logoUrl?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function BrandsPage() {
  return (
    <LookupManager<Brand>
      title="Brands"
      description="Manage the car brands customers can filter and search by."
      basePath="/cars/brands"
      queryKey={["cars", "brands"]}
      entityLabel="brand"
      searchPlaceholder="Search brands..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Toyota" },
        { name: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://..." },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Slug", cell: (row) => <span className="text-muted-foreground">{row.slug}</span> },
      ]}
    />
  );
}
