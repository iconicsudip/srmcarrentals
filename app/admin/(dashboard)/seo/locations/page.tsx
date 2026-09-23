"use client";

import * as React from "react";
import {
  MapPin,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
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

interface LocationItem {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
  } | null;
}

export default function LocationsSeoPage() {
  const [locations, setLocations] = React.useState<LocationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Edit Modal
  const [editingLoc, setEditingLoc] = React.useState<LocationItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    robotsMeta: "INDEX_FOLLOW",
  });

  const fetchLocations = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/locations?limit=100");
      if (!res.ok) throw new Error("Failed to load locations");
      const json = await res.json();
      setLocations(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLoc(loc);
    const existing = loc.seoMetadata;
    setForm({
      metaTitle:
        existing?.metaTitle ||
        `Car Rental in ${loc.name}, ${loc.city} | Best Rates SRM Rentals`,
      metaDescription:
        existing?.metaDescription ||
        `Rent luxury and self-drive cars in ${loc.name}, ${loc.city}. Doorstep delivery, verified sanitized fleet, 24/7 breakdown assistance.`,
      metaKeywords:
        existing?.metaKeywords ||
        `car rental in ${loc.city.toLowerCase()}, self drive ${loc.name.toLowerCase()}, hire car ${loc.city.toLowerCase()}`,
      canonicalUrl:
        existing?.canonicalUrl || `https://srmcarrentals.in/locations/${loc.slug}`,
      robotsMeta: existing?.robotsMeta || "INDEX_FOLLOW",
    });
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/seo/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "LOCATION",
          entityId: editingLoc.id,
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to save location SEO");
      toast.success(`SEO metadata for ${editingLoc.name} saved successfully`);
      setEditingLoc(null);
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to save location SEO");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocations = locations.filter((l) =>
    search
      ? l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Optimize local search presence and geotagged search listings for city hubs and branches.
        </p>
      </div>

      <SeoNav />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">City & Branch Locations SEO</CardTitle>
            <CardDescription>
              Local search keywords, geotag titles, and canonical links per service city.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search city, branch..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLocations()}
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
                  <TableHead>Location / Branch</TableHead>
                  <TableHead>City & State</TableHead>
                  <TableHead>URL Slug</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading locations...
                    </TableCell>
                  </TableRow>
                ) : filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No locations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-semibold text-sm">
                        {loc.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {loc.city}, {loc.state}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        /locations/{loc.slug}
                      </TableCell>
                      <TableCell className="text-xs max-w-[280px] truncate">
                        {loc.seoMetadata?.metaTitle || (
                          <span className="text-muted-foreground italic">
                            Auto Template ({loc.city})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 h-8 text-xs text-primary"
                          onClick={() => handleOpenEdit(loc)}
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
      <Dialog open={Boolean(editingLoc)} onOpenChange={(open) => !open && setEditingLoc(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Local SEO: {editingLoc?.name} ({editingLoc?.city})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSeo} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="locTitle">Meta Title</Label>
              <Input
                id="locTitle"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locDesc">Meta Description</Label>
              <Textarea
                id="locDesc"
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locKeywords">Target Local Keywords</Label>
              <Input
                id="locKeywords"
                value={form.metaKeywords}
                onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locCanonical">Canonical URL</Label>
              <Input
                id="locCanonical"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingLoc(null)}
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
