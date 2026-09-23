"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface SeatOption extends LookupRow {
  count: number;
  label?: string | null;
}

const formSchema = z.object({
  count: z.coerce.number().int().positive("Must be a positive number"),
  label: z.string().max(60).optional().or(z.literal("")),
});

export default function SeatsPage() {
  return (
    <LookupManager<SeatOption>
      title="Seats"
      description="Seat-count options selectable when creating a car."
      basePath="/cars/seats"
      queryKey={["cars", "seats"]}
      entityLabel="seat option"
      hasSearch={false}
      formSchema={formSchema}
      createDefaultValues={{ count: 4, label: "" }}
      fields={[
        { name: "count", label: "Seats", type: "number", placeholder: "e.g. 5" },
        { name: "label", label: "Label", placeholder: "e.g. 5 Seater" },
      ]}
      columns={[
        { header: "Seats", cell: (row) => <span className="font-medium">{row.count}</span> },
        { header: "Label", cell: (row) => row.label ?? "—" },
      ]}
    />
  );
}
