"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface ChauffeurServiceRow extends LookupRow {
  name: string;
  category: string;
  startingPrice: string;
  pricingUnit: "PER_TRIP" | "PER_KM";
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional().or(z.literal("")),
  idealFor: z.string().max(300).optional().or(z.literal("")),
  capacityLabel: z.string().max(120).optional().or(z.literal("")),
  features: z.array(z.string()).optional(),
  pricePerKm: z.coerce.number().nonnegative().optional(),
  startingPrice: z.coerce.number().nonnegative(),
  pricingUnit: z.enum(["PER_TRIP", "PER_KM"]),
  badge: z.string().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
});

export default function ChauffeurServicesPage() {
  return (
    <LookupManager<ChauffeurServiceRow>
      title="Chauffeur Services"
      description="Chauffeur-driven service tiers shown in the 'Arrive In Comfort' section (priced per trip/km, not by the day)."
      basePath="/website/chauffeur-services"
      queryKey={["website", "chauffeur-services"]}
      entityLabel="chauffeur service"
      searchPlaceholder="Search services..."
      formSchema={formSchema}
      createDefaultValues={{ pricingUnit: "PER_TRIP", sortOrder: 0, features: [] }}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Executive Sedan" },
        { name: "category", label: "Category", placeholder: "e.g. Sedan, SUV, Premium, Airport Transfer" },
        { name: "imageUrl", label: "Image URL", type: "url" },
        { name: "idealFor", label: "Ideal For", placeholder: "e.g. City tours, airport runs" },
        { name: "capacityLabel", label: "Capacity Label", placeholder: "e.g. Up to 4 Passengers · 2 Bags" },
        { name: "features", label: "Features", type: "tags", description: "Comma separated, e.g. AC Climate Control, Chauffeur in Uniform" },
        {
          name: "pricingUnit",
          label: "Pricing Unit",
          type: "select",
          selectOptions: [
            { label: "Per Trip", value: "PER_TRIP" },
            { label: "Per KM", value: "PER_KM" },
          ],
        },
        { name: "startingPrice", label: "Starting Price (₹)", type: "number" },
        { name: "pricePerKm", label: "Price per KM (₹)", type: "number" },
        { name: "badge", label: "Badge", placeholder: "e.g. Premium (optional)" },
        { name: "sortOrder", label: "Sort Order", type: "number" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Category", cell: (row) => row.category },
        {
          header: "Starting Price",
          cell: (row) => `₹${Number(row.startingPrice).toLocaleString("en-IN")} / ${row.pricingUnit === "PER_KM" ? "km" : "trip"}`,
        },
      ]}
    />
  );
}
