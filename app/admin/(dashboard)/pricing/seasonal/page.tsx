"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface SeasonalPricingRow extends LookupRow {
  name: string;
  startDate: string;
  endDate: string;
  adjustmentType: string;
  adjustmentValue: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  adjustmentType: z.enum(["FIXED_INCREASE", "PERCENTAGE_INCREASE", "FIXED_DISCOUNT", "PERCENTAGE_DISCOUNT"]),
  adjustmentValue: z.coerce.number().nonnegative(),
  appliesToAll: z.boolean(),
});

export default function SeasonalPricingPage() {
  return (
    <LookupManager<SeasonalPricingRow>
      title="Seasonal Pricings"
      description="Date-range pricing adjustments (e.g. a 20% Christmas increase) applied automatically by the pricing engine."
      basePath="/pricing/seasonal"
      queryKey={["pricing", "seasonal"]}
      entityLabel="seasonal pricing rule"
      searchPlaceholder="Search rules..."
      formSchema={formSchema}
      createDefaultValues={{ appliesToAll: true, adjustmentType: "PERCENTAGE_INCREASE" }}
      getEditDefaultValues={(row) => ({
        name: row.name,
        startDate: row.startDate.slice(0, 10),
        endDate: row.endDate.slice(0, 10),
        adjustmentType: row.adjustmentType,
        adjustmentValue: Number(row.adjustmentValue),
        appliesToAll: (row as unknown as { appliesToAll: boolean }).appliesToAll,
      })}
      fields={[
        { name: "name", label: "Season Name", placeholder: "e.g. Christmas Season" },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "endDate", label: "End Date", type: "date" },
        {
          name: "adjustmentType",
          label: "Adjustment Type",
          type: "select",
          selectOptions: [
            { label: "Fixed Increase", value: "FIXED_INCREASE" },
            { label: "Percentage Increase", value: "PERCENTAGE_INCREASE" },
            { label: "Fixed Discount", value: "FIXED_DISCOUNT" },
            { label: "Percentage Discount", value: "PERCENTAGE_DISCOUNT" },
          ],
        },
        { name: "adjustmentValue", label: "Adjustment Value", type: "number", description: "A % (e.g. 20) or a flat ₹ amount, depending on type." },
        { name: "appliesToAll", label: "Applies to All Cars", type: "switch" },
      ]}
      columns={[
        { header: "Season", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Dates", cell: (row) => `${row.startDate.slice(0, 10)} → ${row.endDate.slice(0, 10)}` },
        {
          header: "Adjustment",
          cell: (row) =>
            `${row.adjustmentType.includes("DISCOUNT") ? "-" : "+"}${row.adjustmentValue}${row.adjustmentType.includes("PERCENTAGE") ? "%" : "₹"}`,
        },
      ]}
    />
  );
}
