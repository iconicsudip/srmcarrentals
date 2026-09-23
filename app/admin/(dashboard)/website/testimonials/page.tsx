"use client";

import * as React from "react";
import { RefreshCw, Star } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";
import { Button } from "@/components/ui/button";

interface TestimonialRow extends LookupRow {
  customerName: string;
  location?: string | null;
  rating: number;
  quote: string;
  bookedItem?: string | null;
  source?: string;
}

const formSchema = z.object({
  customerName: z.string().min(1, "Name is required").max(120),
  location: z.string().max(120).optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().min(1, "Quote is required").max(1000),
  bookedItem: z.string().max(160).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
});

function SyncReviewsButton() {
  const [loading, setLoading] = React.useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/website/reviews/sync", { method: "POST" });
      const data = await res.json() as { synced?: number; total?: number; error?: string; message?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed");
      } else if (data.synced === 0) {
        toast.info(data.message ?? "No new reviews to sync");
      } else {
        toast.success(`Synced ${data.synced} Google review${data.synced === 1 ? "" : "s"} from ${data.total} fetched`);
      }
    } catch {
      toast.error("Network error — could not reach sync endpoint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing…" : "Sync Google Reviews"}
    </Button>
  );
}

export default function TestimonialsPage() {
  return (
    <LookupManager<TestimonialRow>
      title="Testimonials"
      description="Customer reviews shown in the 'Driven By Trust' section on the homepage."
      basePath="/website/testimonials"
      queryKey={["website", "testimonials"]}
      entityLabel="testimonial"
      searchPlaceholder="Search testimonials..."
      formSchema={formSchema}
      createDefaultValues={{ rating: 5, sortOrder: 0 }}
      headerActions={<SyncReviewsButton />}
      fields={[
        { name: "customerName", label: "Customer Name", placeholder: "e.g. Priya Sharma" },
        { name: "location", label: "Location", placeholder: "e.g. Mumbai, India" },
        { name: "avatarUrl", label: "Avatar URL", type: "url", placeholder: "https://... (optional)" },
        { name: "rating", label: "Rating (1-5)", type: "number" },
        { name: "quote", label: "Quote", type: "textarea", placeholder: "What the customer said" },
        { name: "bookedItem", label: "Booked Item", placeholder: "e.g. BMW 3 Series Gran Limousine" },
        { name: "sortOrder", label: "Sort Order", type: "number" },
      ]}
      columns={[
        { header: "Customer", cell: (row) => <span className="font-medium">{row.customerName}</span> },
        {
          header: "Rating",
          cell: (row) => (
            <span className="flex items-center gap-1">
              <Star className="fill-warning text-warning size-3.5" /> {row.rating}
            </span>
          ),
        },
        {
          header: "Source",
          cell: (row) => (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.source === "google" ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/50"}`}>
              {row.source === "google" ? "Google" : "Manual"}
            </span>
          ),
        },
        { header: "Quote", cell: (row) => <span className="line-clamp-1 max-w-xs text-sm">{row.quote}</span> },
      ]}
    />
  );
}
