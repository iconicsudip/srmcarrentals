"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface CarTypeRow extends LookupRow {
  name: string;
  slug: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export default function CarTypesPage() {
  return (
    <LookupManager<CarTypeRow>
      title="Car Types"
      description="Manage car types such as Sedan, SUV, Hatchback, and Convertible."
      basePath="/cars/types"
      queryKey={["cars", "types"]}
      entityLabel="car type"
      searchPlaceholder="Search car types..."
      formSchema={formSchema}
      fields={[{ name: "name", label: "Name", placeholder: "e.g. SUV" }]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Slug", cell: (row) => <span className="text-muted-foreground">{row.slug}</span> },
      ]}
    />
  );
}
