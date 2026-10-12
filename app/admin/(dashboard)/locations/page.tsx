"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";
import { useLookupOptions } from "@/hooks/use-lookup-options";

interface LocationRow extends LookupRow {
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  dropCharge?: string | number | null;
}

const formSchema = z.object({
  kind: z.literal("POINT").default("POINT"),
  name: z.string().min(1, "Name is required").max(120),
  city: z.string().min(1, "Select a city"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  serviceRadiusKm: z.coerce.number().positive().optional(),
  dropCharge: z.coerce.number().nonnegative().optional().default(0),
});

/** Pickup / drop locations only. Cities are managed under Locations & Pricing → Cities. */
export default function LocationsPage() {
  const cities = useLookupOptions<{ id: string; name: string }>("/locations", "name", { kind: "CITY" });

  return (
    <LookupManager<LocationRow>
      title="Locations"
      description="Pickup & drop locations inside a city. Cars are made available per city (see Cities), so every location of a city is offered automatically."
      basePath="/locations"
      queryKey={["locations", "points"]}
      extraParams={{ kind: "POINT" }}
      entityLabel="location"
      searchPlaceholder="Search locations..."
      formSchema={formSchema}
      createDefaultValues={{ kind: "POINT", dropCharge: 0 }}
      fields={[
        { name: "name", label: "Location Name", placeholder: "e.g. Udaipur Railway Station" },
        {
          name: "city",
          label: "City",
          type: "select",
          placeholder: cities.options.length ? "Select city" : "Add a city first (Cities page)",
          selectOptions: cities.options.map((c) => ({ label: c.label, value: c.label })),
        },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        { name: "serviceRadiusKm", label: "Service Radius (KM)", type: "number", placeholder: "Optional" },
        { name: "dropCharge", label: "Default drop-off charge (₹)", type: "number", placeholder: "0 (Free drop-off)", description: "Used when no price is set for the pickup → drop pair in Pickup → Drop Charges." },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "City", cell: (row) => row.city },
        {
          header: "Drop Fee",
          cell: (row) => (row.dropCharge && Number(row.dropCharge) > 0 ? `₹${Number(row.dropCharge).toLocaleString("en-IN")}` : "Free"),
        },
      ]}
    />
  );
}
