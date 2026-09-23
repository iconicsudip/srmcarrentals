"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface DoorOption extends LookupRow {
  count: number;
  label?: string | null;
}

const formSchema = z.object({
  count: z.coerce.number().int().positive("Must be a positive number"),
  label: z.string().max(60).optional().or(z.literal("")),
});

export default function DoorsPage() {
  return (
    <LookupManager<DoorOption>
      title="Doors"
      description="Door-count options selectable when creating a car."
      basePath="/cars/doors"
      queryKey={["cars", "doors"]}
      entityLabel="door option"
      hasSearch={false}
      formSchema={formSchema}
      createDefaultValues={{ count: 4, label: "" }}
      fields={[
        { name: "count", label: "Doors", type: "number", placeholder: "e.g. 4" },
        { name: "label", label: "Label", placeholder: "e.g. 4 Door" },
      ]}
      columns={[
        { header: "Doors", cell: (row) => <span className="font-medium">{row.count}</span> },
        { header: "Label", cell: (row) => row.label ?? "—" },
      ]}
    />
  );
}
