"use client";

import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface PageRow extends LookupRow {
  title: string;
  slug: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  slug: z.string().max(180).optional().or(z.literal("")),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export default function CmsPagesPage() {
  return (
    <LookupManager<PageRow>
      title="Pages"
      description="Static informational pages (About Us, Contact, FAQ, legal) — linked from the site header/footer."
      basePath="/cms/pages"
      queryKey={["cms", "pages"]}
      entityLabel="page"
      searchPlaceholder="Search pages..."
      hasStatus={false}
      formSchema={formSchema}
      createDefaultValues={{ status: "DRAFT" }}
      getEditDefaultValues={(row) => ({
        title: row.title,
        slug: row.slug,
        content: (row as unknown as { content: string }).content,
        status: (row as unknown as { status: "DRAFT" | "PUBLISHED" }).status,
      })}
      fields={[
        { name: "title", label: "Title", placeholder: "e.g. About Us" },
        { name: "slug", label: "Slug", placeholder: "auto-generated from title if left blank" },
        { name: "content", label: "Content", type: "textarea", description: "Plain text — separate paragraphs with a blank line." },
        {
          name: "status",
          label: "Status",
          type: "select",
          selectOptions: [
            { label: "Draft", value: "DRAFT" },
            { label: "Published", value: "PUBLISHED" },
          ],
        },
      ]}
      columns={[
        { header: "Title", cell: (row) => <span className="font-medium">{row.title}</span> },
        { header: "Slug", cell: (row) => <span className="text-muted-foreground">/{row.slug}</span> },
        {
          header: "Status",
          cell: (row) => {
            const status = (row as unknown as { status: "DRAFT" | "PUBLISHED" }).status;
            return <Badge variant={status === "PUBLISHED" ? "success" : "muted"}>{status}</Badge>;
          },
        },
      ]}
    />
  );
}
