"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Feature extends LookupRow {
  name: string;
  icon?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  icon: z.string().max(60).optional().or(z.literal("")),
});

export default function FeaturesPage() {
  return (
    <LookupManager<Feature>
      title="Features"
      description="Manage the feature list customers see on car detail pages (e.g. Bluetooth, Sunroof)."
      basePath="/cars/features"
      queryKey={["cars", "features"]}
      entityLabel="feature"
      searchPlaceholder="Search features..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Bluetooth" },
        { name: "icon", label: "Icon name", placeholder: "lucide icon name (optional)" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Icon", cell: (row) => row.icon ?? "—" },
      ]}
    />
  );
}
