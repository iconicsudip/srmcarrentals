"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Capacity extends LookupRow {
  label: string;
  luggageCapacity?: string | null;
}

const formSchema = z.object({
  label: z.string().min(1, "Label is required").max(120),
  luggageCapacity: z.string().max(60).optional().or(z.literal("")),
});

export default function CarCapacityPage() {
  return (
    <LookupManager<Capacity>
      title="Car Capacity"
      description="Manage passenger/luggage capacity descriptors selectable on a car."
      basePath="/cars/capacity"
      queryKey={["cars", "capacity"]}
      entityLabel="capacity"
      searchPlaceholder="Search capacities..."
      formSchema={formSchema}
      fields={[
        { name: "label", label: "Label", placeholder: "e.g. 5 Adults + 2 Bags" },
        { name: "luggageCapacity", label: "Luggage Capacity", placeholder: "e.g. 2 large bags" },
      ]}
      columns={[
        { header: "Label", cell: (row) => <span className="font-medium">{row.label}</span> },
        { header: "Luggage", cell: (row) => row.luggageCapacity ?? "—" },
      ]}
    />
  );
}
