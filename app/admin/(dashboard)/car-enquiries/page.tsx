"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CarEnquiry, CarEnquiryStatus } from "@/lib/car-enquiry/types";

const STATUSES: CarEnquiryStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"];

const STATUS_STYLE: Record<CarEnquiryStatus, string> = {
  NEW: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  CONTACTED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function CarEnquiriesPage() {
  const [rows, setRows] = React.useState<CarEnquiry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<CarEnquiryStatus | "ALL">("ALL");

  const load = React.useCallback(async () => {
    try {
      setRows(await apiFetch<CarEnquiry[]>("/car-enquiries"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: CarEnquiryStatus) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await apiFetch(`/car-enquiries/${id}`, { method: "PATCH", body: { status } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    try {
      await apiFetch(`/car-enquiries/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Enquiry deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const visible = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Car Enquiries</h1>
        <p className="text-sm text-muted-foreground">
          Entries submitted through the “Book on WhatsApp” form on car cards.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", ...STATUSES] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className="text-xs"
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? `All (${rows.length})` : `${s} (${rows.filter((r) => r.status === s).length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading enquiries…
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No enquiries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((row) => (
            <Card key={row.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{row.carName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("en-IN")} · Ref {row.id}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[row.status]}`}>
                    {row.status}
                  </Badge>
                </div>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                  {(
                    [
                      ["Name", row.name],
                      ["Mobile", row.phone],
                      ["Email", row.email],
                      ["Pickup", row.pickupAt ? new Date(row.pickupAt).toLocaleString("en-IN") : undefined],
                      ["Drop", row.dropAt ? new Date(row.dropAt).toLocaleString("en-IN") : undefined],
                      ["Location", row.pickupLocation],
                      ["Notes", row.notes],
                    ] as [string, string | undefined][]
                  )
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label} className={label === "Notes" ? "sm:col-span-2" : undefined}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                        <dd className="break-words font-medium">
                          {label === "Mobile" ? (
                            <a href={`tel:${value}`} className="text-orange-600 hover:underline">
                              {value}
                            </a>
                          ) : (
                            value
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>

                <div className="flex items-center justify-between border-t pt-3">
                  <select
                    value={row.status}
                    onChange={(e) => setStatus(row.id, e.target.value as CarEnquiryStatus)}
                    className="h-8 rounded-md border bg-background px-2 text-xs outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-red-500 hover:bg-red-500/10"
                    onClick={() => remove(row.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
