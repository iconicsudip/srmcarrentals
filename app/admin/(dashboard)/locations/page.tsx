"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface LocationRow extends LookupRow {
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  dropCharge?: string | number | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  serviceRadiusKm: z.coerce.number().positive().optional(),
  dropCharge: z.coerce.number().nonnegative().optional().default(0),
});

export default function LocationsPage() {
  return (
    <LookupManager<LocationRow>
      title="Locations"
      description="Pickup/drop locations customers can select during booking."
      basePath="/locations"
      queryKey={["locations"]}
      entityLabel="location"
      searchPlaceholder="Search locations..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Location Name", placeholder: "e.g. Whitefield" },
        { name: "city", label: "City" },
        { name: "state", label: "State" },
        { name: "country", label: "Country", placeholder: "India" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        { name: "serviceRadiusKm", label: "Service Radius (KM)", type: "number", placeholder: "Optional" },
        { name: "dropCharge", label: "Drop-off Charge (₹)", type: "number", placeholder: "0 (Free drop-off)" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "City", cell: (row) => row.city },
        { header: "State", cell: (row) => row.state },
        {
          header: "Drop Fee",
          cell: (row) =>
            row.dropCharge && Number(row.dropCharge) > 0
              ? `₹${Number(row.dropCharge).toLocaleString("en-IN")}`
              : "Free",
        },
      ]}
    />
  );
}
