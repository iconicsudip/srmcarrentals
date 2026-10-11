"use client";

import * as React from "react";
import { RefreshCw, Star } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  source: z.enum(["manual", "google"]).optional(),
});

function SyncReviewsButton() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [last, setLast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setResult(null);
    fetch("/api/v1/website/reviews/sync")
      .then((r) => r.json())
      .then((j) => {
        const d = j?.data ?? j;
        setText((d?.sources ?? []).join("\n"));
        setLast(d?.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString("en-IN") : null);
      })
      .catch(() => {});
  }, [open]);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const sources = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const res = await fetch("/api/v1/website/reviews/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sources, mode: "full" }),
      });
      const json = await res.json();
      const d = json?.data ?? json;
      if (!res.ok) {
        setResult(json?.message ?? d?.error ?? "Import failed");
        toast.error("Import failed");
      } else {
        const msg = `Imported ${d.imported} reviews (${d.fetched} fetched, ${d.skippedWithoutText} without text) using ${d.requests} API requests.${
          d.errors?.length ? " Problems: " + d.errors.join(" | ") : ""
        }`;
        setResult(msg);
        toast.success(`Imported ${d.imported} Google reviews`);
      }
    } catch {
      toast.error("Network error — could not reach the import endpoint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="flex items-center gap-2">
        <RefreshCw className="size-4" /> Import Google Reviews
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Google reviews</DialogTitle>
            <DialogDescription>
              Reviews are saved in your database — the website never calls Google per visit. New reviews are fetched automatically every Saturday; use this to import older reviews or refresh right now.{last ? ` Last sync: ${last}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"https://www.google.com/maps/place/SRM+Car+Rentals…\nhttps://maps.app.goo.gl/…"}
          />
          {result && <p className="text-sm text-muted-foreground">{result}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={handleSync} disabled={loading || !text.trim()}>
              {loading ? "Importing…" : "Import all reviews"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
      createDefaultValues={{ rating: 5, sortOrder: 0, source: "google" }}
      headerActions={<SyncReviewsButton />}
      fields={[
        { name: "customerName", label: "Customer Name", placeholder: "e.g. Priya Sharma" },
        { name: "location", label: "Location", placeholder: "e.g. Mumbai, India" },
        { name: "avatarUrl", label: "Avatar URL", type: "url", placeholder: "https://... (optional)" },
        { name: "rating", label: "Rating (1-5)", type: "number" },
        { name: "quote", label: "Quote", type: "textarea", placeholder: "What the customer said" },
        { name: "bookedItem", label: "Booked Item", placeholder: "e.g. BMW 3 Series Gran Limousine" },
        {
          name: "source",
          label: "Review source",
          type: "select",
          selectOptions: [
            { label: "Google review (shows the Google badge)", value: "google" },
            { label: "Direct / other", value: "manual" },
          ],
          description: "Pick Google to add a Google review by hand — copy the name, stars and text from your Google listing.",
        },
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
