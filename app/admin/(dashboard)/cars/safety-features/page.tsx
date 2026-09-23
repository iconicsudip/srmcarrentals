"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface SafetyFeature extends LookupRow {
  name: string;
  icon?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  icon: z.string().max(60).optional().or(z.literal("")),
});

export default function SafetyFeaturesPage() {
  return (
    <LookupManager<SafetyFeature>
      title="Safety Features"
      description="Manage the safety feature list customers see on car detail pages (e.g. ABS, Airbags)."
      basePath="/cars/safety-features"
      queryKey={["cars", "safety-features"]}
      entityLabel="safety feature"
      searchPlaceholder="Search safety features..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Dual Airbags" },
        { name: "icon", label: "Icon name", placeholder: "lucide icon name (optional)" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Icon", cell: (row) => row.icon ?? "—" },
      ]}
    />
  );
}
