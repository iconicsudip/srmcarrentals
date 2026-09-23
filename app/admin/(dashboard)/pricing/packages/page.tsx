"use client";

import { z } from "zod";

import { useLookupOptions } from "@/hooks/use-lookup-options";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface RentalPackageRow extends LookupRow {
  name: string;
  slug: string;
  durationHours: number;
  includedKm: number;
  basePrice: string;
  scope: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  durationHours: z.coerce.number().int().positive(),
  includedKm: z.coerce.number().int().nonnegative(),
  basePrice: z.coerce.number().nonnegative(),
  extraKmPrice: z.coerce.number().nonnegative(),
  extraHourPrice: z.coerce.number().nonnegative(),
  scope: z.enum(["ALL_CARS", "SPECIFIC_CARS", "CAR_CATEGORY", "CAR_TYPE"]),
  carCategoryId: z.string().optional().or(z.literal("")),
  carTypeId: z.string().optional().or(z.literal("")),
});

export default function RentalPackagesPage() {
  const categories = useLookupOptions<{ id: string; name: string }>("/cars/categories", "name");
  const carTypes = useLookupOptions<{ id: string; name: string }>("/cars/types", "name");

  return (
    <LookupManager<RentalPackageRow>
      title="Rental Packages"
      description="Bundled duration packages (e.g. a 48-hour Weekend Package) that can be assigned to all cars, a category, a type, or specific cars."
      basePath="/pricing/packages"
      queryKey={["pricing", "packages"]}
      entityLabel="rental package"
      searchPlaceholder="Search packages..."
      formSchema={formSchema}
      createDefaultValues={{ scope: "ALL_CARS" }}
      getEditDefaultValues={(row) => ({
        name: row.name,
        durationHours: row.durationHours,
        includedKm: row.includedKm,
        basePrice: Number(row.basePrice),
        extraKmPrice: Number((row as unknown as { extraKmPrice: string }).extraKmPrice),
        extraHourPrice: Number((row as unknown as { extraHourPrice: string }).extraHourPrice),
        scope: row.scope,
        carCategoryId: (row as unknown as { carCategoryId?: string }).carCategoryId ?? "",
        carTypeId: (row as unknown as { carTypeId?: string }).carTypeId ?? "",
      })}
      fields={[
        { name: "name", label: "Package Name", placeholder: "e.g. Weekend Package" },
        { name: "durationHours", label: "Duration (Hours)", type: "number", placeholder: "e.g. 48" },
        { name: "includedKm", label: "Included KM", type: "number" },
        { name: "basePrice", label: "Base Price (₹)", type: "number" },
        { name: "extraKmPrice", label: "Extra KM Price (₹)", type: "number" },
        { name: "extraHourPrice", label: "Extra Hour Price (₹)", type: "number" },
        {
          name: "scope",
          label: "Applies To",
          type: "select",
          selectOptions: [
            { label: "All Cars", value: "ALL_CARS" },
            { label: "Specific Car Category", value: "CAR_CATEGORY" },
            { label: "Specific Car Type", value: "CAR_TYPE" },
            { label: "Specific Cars (manage via car list)", value: "SPECIFIC_CARS" },
          ],
        },
        { name: "carCategoryId", label: "Car Category", type: "select", selectOptions: categories.options, placeholder: "Only if scope = Category" },
        { name: "carTypeId", label: "Car Type", type: "select", selectOptions: carTypes.options, placeholder: "Only if scope = Type" },
      ]}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Duration", cell: (row) => `${row.durationHours}h` },
        { header: "Included KM", cell: (row) => `${row.includedKm} km` },
        { header: "Base Price", cell: (row) => `₹${Number(row.basePrice).toLocaleString("en-IN")}` },
        { header: "Scope", cell: (row) => row.scope.replace(/_/g, " ") },
      ]}
    />
  );
}
