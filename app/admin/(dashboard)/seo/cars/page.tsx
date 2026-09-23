"use client";

import * as React from "react";
import {
  Car,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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

interface CarItem {
  id: string;
  name: string;
  slug: string;
  category?: { name: string };
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
  } | null;
}

export default function CarsSeoPage() {
  const [cars, setCars] = React.useState<CarItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // SEO Edit Modal
  const [editingCar, setEditingCar] = React.useState<CarItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    robotsMeta: "INDEX_FOLLOW",
  });

  const fetchCars = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cars?limit=100");
      if (!res.ok) throw new Error("Failed to load cars");
      const json = await res.json();
      setCars(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleOpenEdit = (car: CarItem) => {
    setEditingCar(car);
    const existing = car.seoMetadata;
    setForm({
      metaTitle:
        existing?.metaTitle ||
        `Rent ${car.name} in India | SRM Luxury Car Rentals`,
      metaDescription:
        existing?.metaDescription ||
        `Hire ${car.name} with best daily and weekly rates. Available for self-drive or chauffeur driven bookings across top cities.`,
      metaKeywords:
        existing?.metaKeywords ||
        `${car.name.toLowerCase()} rental, hire ${car.name.toLowerCase()}, luxury car rental`,
      canonicalUrl:
        existing?.canonicalUrl || `https://srmcarrentals.in/cars/${car.slug}`,
      robotsMeta: existing?.robotsMeta || "INDEX_FOLLOW",
    });
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/seo/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "CAR",
          entityId: editingCar.id,
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to update car SEO");
      toast.success(`SEO metadata for ${editingCar.name} saved successfully`);
      setEditingCar(null);
      fetchCars();
    } catch (err: any) {
      toast.error(err.message || "Failed to update car SEO");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCars = cars.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Optimize search engine indexing, SERP titles, and canonical tags for vehicle models.
        </p>
      </div>

      <SeoNav />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Car Fleet SEO Metadata</CardTitle>
            <CardDescription>
              Tailor meta titles and descriptions for individual car detail pages.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search car model..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCars()}
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
                  <TableHead>Car Model</TableHead>
                  <TableHead>Slug / URL</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead>Robots</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading cars catalog...
                    </TableCell>
                  </TableRow>
                ) : filteredCars.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No cars found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCars.map((car) => {
                    const hasCustomSeo = Boolean(car.seoMetadata?.metaTitle);
                    return (
                      <TableRow key={car.id}>
                        <TableCell className="font-semibold text-sm">
                          {car.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          /cars/{car.slug}
                        </TableCell>
                        <TableCell className="text-xs max-w-[280px] truncate">
                          {car.seoMetadata?.metaTitle || (
                            <span className="text-muted-foreground italic">
                              Default Template ({car.name})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={hasCustomSeo ? "success" : "outline"} className="text-xs">
                            {car.seoMetadata?.robotsMeta || "INDEX_FOLLOW"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 text-xs text-primary"
                            onClick={() => handleOpenEdit(car)}
                          >
                            <Edit2 className="size-3.5" />
                            Edit SEO
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit SEO Modal */}
      <Dialog open={Boolean(editingCar)} onOpenChange={(open) => !open && setEditingCar(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit SEO for {editingCar?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSeo} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="carTitle">Meta Title</Label>
                <span className="text-xs text-muted-foreground">
                  {form.metaTitle.length}/60 chars
                </span>
              </div>
              <Input
                id="carTitle"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="carDesc">Meta Description</Label>
                <span className="text-xs text-muted-foreground">
                  {form.metaDescription.length}/160 chars
                </span>
              </div>
              <Textarea
                id="carDesc"
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="carKeywords">Meta Keywords</Label>
              <Input
                id="carKeywords"
                value={form.metaKeywords}
                onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="carCanonical">Canonical URL</Label>
              <Input
                id="carCanonical"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCar(null)}
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
