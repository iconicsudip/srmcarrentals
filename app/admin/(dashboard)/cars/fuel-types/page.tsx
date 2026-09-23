"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface FuelType extends LookupRow {
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export default function FuelTypesPage() {
  return (
    <LookupManager<FuelType>
      title="Car Fuel Type"
      description="Manage fuel types such as Petrol, Diesel, Electric, and Hybrid."
      basePath="/cars/fuel-types"
      queryKey={["cars", "fuel-types"]}
      entityLabel="fuel type"
      searchPlaceholder="Search fuel types..."
      formSchema={formSchema}
      fields={[{ name: "name", label: "Name", placeholder: "e.g. Petrol" }]}
      columns={[{ header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> }]}
    />
  );
}
