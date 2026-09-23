"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface CylinderOption extends LookupRow {
  count: number;
  label?: string | null;
}

const formSchema = z.object({
  count: z.coerce.number().int().positive("Must be a positive number"),
  label: z.string().max(60).optional().or(z.literal("")),
});

export default function CylindersPage() {
  return (
    <LookupManager<CylinderOption>
      title="Cylinders"
      description="Engine cylinder-count options selectable when creating a car."
      basePath="/cars/cylinders"
      queryKey={["cars", "cylinders"]}
      entityLabel="cylinder option"
      hasSearch={false}
      formSchema={formSchema}
      createDefaultValues={{ count: 4, label: "" }}
      fields={[
        { name: "count", label: "Cylinders", type: "number", placeholder: "e.g. 4" },
        { name: "label", label: "Label", placeholder: "e.g. 4 Cylinder" },
      ]}
      columns={[
        { header: "Cylinders", cell: (row) => <span className="font-medium">{row.count}</span> },
        { header: "Label", cell: (row) => row.label ?? "—" },
      ]}
    />
  );
}
