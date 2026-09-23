"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface InsuranceRow extends LookupRow {
  name: string;
  pricingType: "FIXED" | "PERCENTAGE" | "DAILY";
  fixedPrice?: string | null;
  percentagePrice?: string | null;
  dailyPrice?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  pricingType: z.enum(["FIXED", "PERCENTAGE", "DAILY"]),
  fixedPrice: z.coerce.number().nonnegative().optional(),
  percentagePrice: z.coerce.number().nonnegative().optional(),
  dailyPrice: z.coerce.number().nonnegative().optional(),
});

export default function InsurancesPage() {
  return (
    <LookupManager<InsuranceRow>
      title="Insurances"
      description="Insurance add-ons customers can select at checkout."
      basePath="/services/insurances"
      queryKey={["services", "insurances"]}
      entityLabel="insurance option"
      searchPlaceholder="Search insurance options..."
      formSchema={formSchema}
      createDefaultValues={{ pricingType: "FIXED" }}
      fields={[
        { name: "name", label: "Insurance Name", placeholder: "e.g. Zero Depreciation Cover" },
        { name: "description", label: "Description", type: "textarea" },
        {
          name: "pricingType",
          label: "Pricing Type",
          type: "select",
          selectOptions: [
            { label: "Fixed Price", value: "FIXED" },
            { label: "Percentage of Rental", value: "PERCENTAGE" },
            { label: "Daily Price", value: "DAILY" },
          ],
        },
        { name: "fixedPrice", label: "Fixed Price (₹)", type: "number", placeholder: "If pricing type = Fixed" },
        { name: "percentagePrice", label: "Percentage (%)", type: "number", placeholder: "If pricing type = Percentage" },
        { name: "dailyPrice", label: "Daily Price (₹)", type: "number", placeholder: "If pricing type = Daily" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Type", cell: (row) => row.pricingType },
        {
          header: "Price",
          cell: (row) =>
            row.pricingType === "FIXED"
              ? `₹${Number(row.fixedPrice ?? 0)}`
              : row.pricingType === "PERCENTAGE"
                ? `${Number(row.percentagePrice ?? 0)}%`
                : `₹${Number(row.dailyPrice ?? 0)}/day`,
        },
      ]}
    />
  );
}
