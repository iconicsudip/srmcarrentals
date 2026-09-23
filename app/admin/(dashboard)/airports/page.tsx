"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface AirportRow extends LookupRow {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  code: z.string().min(3, "Airport code is required").max(4),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export default function AirportsPage() {
  return (
    <LookupManager<AirportRow>
      title="Airports"
      description="Airports available for pickup/drop with airport transfer pricing."
      basePath="/airports"
      queryKey={["airports"]}
      entityLabel="airport"
      searchPlaceholder="Search airports..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Airport Name", placeholder: "e.g. Kempegowda International Airport" },
        { name: "code", label: "Airport Code", placeholder: "e.g. BLR" },
        { name: "city", label: "City" },
        { name: "state", label: "State" },
        { name: "country", label: "Country", placeholder: "India" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Code", cell: (row) => row.code },
        { header: "City", cell: (row) => row.city },
      ]}
    />
  );
}
