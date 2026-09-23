"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface Color extends LookupRow {
  name: string;
  hexCode?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  hexCode: z
    .string()
    .regex(/^#?[0-9a-fA-F]{3,8}$/u, "Use a hex color like #FF0000")
    .optional()
    .or(z.literal("")),
});

export default function ColorsPage() {
  return (
    <LookupManager<Color>
      title="Colors"
      description="Manage the color palette available for cars."
      basePath="/cars/colors"
      queryKey={["cars", "colors"]}
      entityLabel="color"
      searchPlaceholder="Search colors..."
      formSchema={formSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Pearl White" },
        { name: "hexCode", label: "Hex Code", placeholder: "#FFFFFF" },
      ]}
      columns={[
        {
          header: "Color",
          cell: (row) => (
            <div className="flex items-center gap-2">
              {row.hexCode && (
                <span
                  className="border-border size-4 rounded-full border"
                  style={{ backgroundColor: row.hexCode }}
                />
              )}
              <span className="font-medium">{row.name}</span>
            </div>
          ),
        },
        { header: "Hex", cell: (row) => <span className="text-muted-foreground">{row.hexCode ?? "—"}</span> },
      ]}
    />
  );
}
