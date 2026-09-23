"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface TransmissionType extends LookupRow {
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export default function TransmissionTypesPage() {
  return (
    <LookupManager<TransmissionType>
      title="Car Transmission"
      description="Manage transmission types such as Manual and Automatic."
      basePath="/cars/transmission-types"
      queryKey={["cars", "transmission-types"]}
      entityLabel="transmission type"
      searchPlaceholder="Search transmission types..."
      formSchema={formSchema}
      fields={[{ name: "name", label: "Name", placeholder: "e.g. Automatic" }]}
      columns={[{ header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> }]}
    />
  );
}
