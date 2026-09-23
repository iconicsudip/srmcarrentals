"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface SteeringType extends LookupRow {
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export default function SteeringTypesPage() {
  return (
    <LookupManager<SteeringType>
      title="Car Steering"
      description="Manage steering types such as Power Steering and Manual Steering."
      basePath="/cars/steering-types"
      queryKey={["cars", "steering-types"]}
      entityLabel="steering type"
      searchPlaceholder="Search steering types..."
      formSchema={formSchema}
      fields={[{ name: "name", label: "Name", placeholder: "e.g. Power Steering" }]}
      columns={[{ header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> }]}
    />
  );
}
