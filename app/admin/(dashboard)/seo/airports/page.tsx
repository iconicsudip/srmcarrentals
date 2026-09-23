"use client";

import * as React from "react";
import {
  Plane,
  Search,
  RefreshCw,
  Edit2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AirportItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
  } | null;
}

export default function AirportsSeoPage() {
  const [airports, setAirports] = React.useState<AirportItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Edit Modal
  const [editingAirport, setEditingAirport] = React.useState<AirportItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    robotsMeta: "INDEX_FOLLOW",
  });

  const fetchAirports = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/airports?limit=100");
      if (!res.ok) throw new Error("Failed to load airports");
      const json = await res.json();
      setAirports(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load airports");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

  const handleOpenEdit = (airport: AirportItem) => {
    setEditingAirport(airport);
    const existing = airport.seoMetadata;
    setForm({
      metaTitle:
        existing?.metaTitle ||
        `${airport.name} (${airport.code}) Car Rental & Airport Taxi | SRM Rentals`,
      metaDescription:
        existing?.metaDescription ||
        `Book seamless airport car hire and chauffeur pickups directly at ${airport.name} (${airport.code}), ${airport.city}. Flight tracking and on-time pickup guaranteed.`,
      metaKeywords:
        existing?.metaKeywords ||
        `${airport.code.toLowerCase()} car rental, airport taxi ${airport.city.toLowerCase()}, ${airport.name.toLowerCase()} cab hire`,
      canonicalUrl:
        existing?.canonicalUrl ||
        `https://srmcarrentals.in/airports/${airport.code.toLowerCase()}`,
      robotsMeta: existing?.robotsMeta || "INDEX_FOLLOW",
    });
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAirport) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/seo/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "AIRPORT",
          entityId: editingAirport.id,
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to save airport SEO");
      toast.success(`SEO metadata for ${editingAirport.name} saved successfully`);
      setEditingAirport(null);
      fetchAirports();
    } catch (err: any) {
      toast.error(err.message || "Failed to save airport SEO");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAirports = airports.filter((a) =>
    search
      ? a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.city.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Airport transfer search rankings, flight arrival keywords, and terminal pickup landing pages.
        </p>
      </div>

      <SeoNav />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Airport Hubs SEO</CardTitle>
            <CardDescription>
              Custom meta snippets and keywords for airport terminal pickup pages.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search IATA, city, airport..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAirports()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IATA Code</TableHead>
                  <TableHead>Airport Name</TableHead>
                  <TableHead>City & State</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading airports...
                    </TableCell>
                  </TableRow>
                ) : filteredAirports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No airports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAirports.map((airport) => (
                    <TableRow key={airport.id}>
                      <TableCell className="font-mono font-bold text-primary">
                        {airport.code}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {airport.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {airport.city}, {airport.state}
                      </TableCell>
                      <TableCell className="text-xs max-w-[280px] truncate">
                        {airport.seoMetadata?.metaTitle || (
                          <span className="text-muted-foreground italic">
                            Auto Template ({airport.code})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 h-8 text-xs text-primary"
                          onClick={() => handleOpenEdit(airport)}
                        >
                          <Edit2 className="size-3.5" />
                          Edit SEO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editingAirport)}
        onOpenChange={(open) => !open && setEditingAirport(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit Airport SEO: {editingAirport?.code} — {editingAirport?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSeo} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="airportTitle">Meta Title</Label>
              <Input
                id="airportTitle"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="airportDesc">Meta Description</Label>
              <Textarea
                id="airportDesc"
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="airportKeywords">Flight & Airport Keywords</Label>
              <Input
                id="airportKeywords"
                value={form.metaKeywords}
                onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="airportCanonical">Canonical URL</Label>
              <Input
                id="airportCanonical"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAirport(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save SEO"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
