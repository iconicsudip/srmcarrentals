"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";
import { COUNTRIES, INDIA_CITIES, INDIA_STATES } from "@/lib/geo/india";

interface CityRow extends LookupRow {
  name: string;
  state: string;
  country: string;
}

const formSchema = z.object({
  kind: z.literal("CITY").default("CITY"),
  country: z.string().min(1, "Select a country"),
  state: z.string().min(1, "Select a state"),
  name: z.string().min(1, "Select a city").max(120),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

/** Cities where cars are available. Pickup & drop locations are added under Locations. */
export default function CitiesPage() {
  return (
    <LookupManager<CityRow>
      title="Cities"
      description="Cities where you operate. Assign cars to a city (Car → Locations tab) and all of that city's pickup & drop locations become available automatically."
      basePath="/locations"
      queryKey={["locations", "cities"]}
      extraParams={{ kind: "CITY" }}
      entityLabel="city"
      searchPlaceholder="Search cities..."
      formSchema={formSchema}
      createDefaultValues={{ kind: "CITY", country: "India" }}
      fields={[
        { name: "country", label: "Country", type: "select", placeholder: "Select country", selectOptions: COUNTRIES.map((c) => ({ label: c, value: c })) },
        { name: "state", label: "State", type: "select", placeholder: "Select state", clears: ["name"], selectOptions: INDIA_STATES.map((s) => ({ label: s, value: s })) },
        {
          name: "name",
          label: "City",
          type: "select",
          placeholder: "Select state first",
          selectOptions: (v) => (INDIA_CITIES[String(v.state ?? "")] ?? []).map((c) => ({ label: c, value: c })),
        },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
      ]}
      columns={[
        { header: "City", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "State", cell: (row) => row.state },
        { header: "Country", cell: (row) => row.country },
      ]}
    />
  );
}
