"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { PaginatedResult } from "@srm/types";

import { api } from "@/lib/api-client";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Brand {
  id: string;
  name: string;
}

interface Model extends LookupRow {
  name: string;
  slug: string;
  brandId: string;
  brand?: Brand;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  brandId: z.string().min(1, "Select a brand"),
});

export default function ModelsPage() {
  const { data: brandsResult } = useQuery({
    queryKey: ["cars", "brands", "all"],
    queryFn: () => api.get<PaginatedResult<Brand>>("/cars/brands?limit=100&status=ACTIVE"),
  });

  const brandOptions = (brandsResult?.data ?? []).map((b) => ({ label: b.name, value: b.id }));

  return (
    <LookupManager<Model>
      title="Models"
      description="Manage car models, each linked to a brand."
      basePath="/cars/models"
      queryKey={["cars", "models"]}
      entityLabel="model"
      searchPlaceholder="Search models..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Innova Crysta" },
        { name: "brandId", label: "Brand", type: "select", placeholder: "Select a brand", selectOptions: brandOptions },
      ]}
      getEditDefaultValues={(row) => ({ name: row.name, brandId: row.brandId })}
      columns={[
        { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
        { header: "Brand", cell: (row) => row.brand?.name ?? "—" },
      ]}
    />
  );
}
