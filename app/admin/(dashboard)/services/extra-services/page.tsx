"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface ExtraServiceRow extends LookupRow {
  name: string;
  price: string;
  pricingType: "PER_BOOKING" | "PER_DAY" | "PER_HOUR";
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().nonnegative(),
  pricingType: z.enum(["PER_BOOKING", "PER_DAY", "PER_HOUR"]),
});

export default function ExtraServicesPage() {
  return (
    <LookupManager<ExtraServiceRow>
      title="Extra Services"
      description="Add-on services like Child Seat, GPS, WiFi, or an Additional Driver."
      basePath="/services/extra-services"
      queryKey={["services", "extra-services"]}
      entityLabel="extra service"
      searchPlaceholder="Search extra services..."
      formSchema={formSchema}
      createDefaultValues={{ pricingType: "PER_BOOKING" }}
      fields={[
        { name: "name", label: "Service Name", placeholder: "e.g. Child Seat" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "price", label: "Price (₹)", type: "number" },
        {
          name: "pricingType",
          label: "Pricing Type",
          type: "select",
          selectOptions: [
            { label: "Per Booking", value: "PER_BOOKING" },
            { label: "Per Day", value: "PER_DAY" },
            { label: "Per Hour", value: "PER_HOUR" },
          ],
        },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Price", cell: (row) => `₹${Number(row.price).toLocaleString("en-IN")}` },
        { header: "Pricing", cell: (row) => row.pricingType.replace(/_/g, " ") },
      ]}
    />
  );
}
