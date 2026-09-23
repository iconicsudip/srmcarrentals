"use client";

import { z } from "zod";

import { useLookupOptions } from "@/hooks/use-lookup-options";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface AirportChargeRow extends LookupRow {
  pickupCharge: string;
  dropCharge: string;
  roundTripCharge?: string | null;
  airport?: { name: string; code: string };
  location?: { name: string };
}

const formSchema = z.object({
  airportId: z.string().min(1, "Airport is required"),
  locationId: z.string().min(1, "Location is required"),
  pickupCharge: z.coerce.number().nonnegative(),
  dropCharge: z.coerce.number().nonnegative(),
  roundTripCharge: z.coerce.number().nonnegative().optional(),
});

export default function AirportChargesPage() {
  const airports = useLookupOptions<{ id: string; name: string; code: string }>("/airports", "name");
  const locations = useLookupOptions<{ id: string; name: string }>("/locations", "name");

  return (
    <LookupManager<AirportChargeRow>
      title="Airport Charges"
      description="Pickup/drop charges for a specific airport <-> location pair (e.g. BLR Airport → Whitefield)."
      basePath="/airports/charges"
      queryKey={["airports", "charges"]}
      entityLabel="airport charge"
      hasSearch={false}
      hasStatus={false}
      formSchema={formSchema}
      getEditDefaultValues={(row) => ({
        airportId: (row as unknown as { airportId: string }).airportId,
        locationId: (row as unknown as { locationId: string }).locationId,
        pickupCharge: Number(row.pickupCharge),
        dropCharge: Number(row.dropCharge),
        roundTripCharge: row.roundTripCharge ? Number(row.roundTripCharge) : undefined,
      })}
      fields={[
        { name: "airportId", label: "Airport", type: "select", selectOptions: airports.options },
        { name: "locationId", label: "Location", type: "select", selectOptions: locations.options },
        { name: "pickupCharge", label: "Pickup Charge (₹)", type: "number" },
        { name: "dropCharge", label: "Drop Charge (₹)", type: "number" },
        { name: "roundTripCharge", label: "Round Trip Charge (₹)", type: "number", placeholder: "Optional" },
      ]}
      columns={[
        {
          header: "Route",
          cell: (row) => (
            <span className="font-medium">
              {row.airport?.name} ({row.airport?.code}) → {row.location?.name}
            </span>
          ),
        },
        { header: "Pickup", cell: (row) => `₹${Number(row.pickupCharge).toLocaleString("en-IN")}` },
        { header: "Drop", cell: (row) => `₹${Number(row.dropCharge).toLocaleString("en-IN")}` },
      ]}
    />
  );
}
