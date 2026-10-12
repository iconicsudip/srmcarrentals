"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface SeoForm {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robotsMeta: string;
  ogImage: string;
}

const EMPTY: SeoForm = { metaTitle: "", metaDescription: "", metaKeywords: "", canonicalUrl: "", robotsMeta: "INDEX_FOLLOW", ogImage: "" };

/** Page-wise SEO (Google title / description / keywords / sharing image) for one car's page. */
export function CarSeoTab({ carId, carName, slug }: { carId: string; carName: string; slug: string }) {
  const [form, setForm] = React.useState<SeoForm>(EMPTY);
  const [loaded, setLoaded] = React.useState(false);
  const [base, setBase] = React.useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    // The live website reads the page profile stored under this path (same store as SEO → Page-wise SEO).
    api
      .get<Record<string, unknown> & { _saved?: boolean }>(`/seo/dynamic-page?path=${encodeURIComponent(`/car/${slug}`)}&entityType=CAR&entityId=${carId}`)
      .then((m) => {
        if (!m?._saved) return; // nothing saved yet → keep the boxes empty (automatic text is used)
        setBase(m);
        setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(m).filter(([k, v]) => k in EMPTY && typeof v === "string")) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [carId, slug]);

  const set = (patch: Partial<SeoForm>) => setForm((f) => ({ ...f, ...patch }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = `${origin}/car/${slug}`;
  const shownTitle = form.metaTitle || `Rent ${carName} | SRM Car Rentals`;
  const shownDesc = form.metaDescription || `Hire ${carName} on self-drive with transparent pricing and doorstep delivery.`;

  async function save() {
    setSaving(true);
    try {
      await api.post("/seo/dynamic-page", {
        enableStructuredData: false,
        aeoEnabled: false,
        inSitemap: true,
        sitemapPriority: 0.8,
        sitemapChangeFreq: "weekly",
        ...(base ?? {}),
        path: `/car/${slug}`,
        entityType: "CAR",
        entityId: carId,
        ...form,
        ogTitle: form.metaTitle,
        ogDescription: form.metaDescription,
        ogType: "website",
        twitterCard: "summary_large_image",
      });
      toast.success("Car SEO saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save SEO");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Page SEO for this car</CardTitle>
          <CardDescription>What Google and social apps show for {carName}. Leave a box empty to use the automatic text.</CardDescription>
        </div>
        <Button type="button" onClick={save} disabled={saving || !loaded}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save SEO
        </Button>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">Meta title <span className="text-muted-foreground text-xs">({form.metaTitle.length}/60)</span></Label>
                <Input id="seo-title" value={form.metaTitle} maxLength={120} onChange={(e) => set({ metaTitle: e.target.value })} placeholder={`Rent ${carName} | SRM Car Rentals`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-desc">Meta description <span className="text-muted-foreground text-xs">({form.metaDescription.length}/160)</span></Label>
                <Textarea id="seo-desc" rows={3} value={form.metaDescription} maxLength={320} onChange={(e) => set({ metaDescription: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-keywords">Keywords (comma separated)</Label>
                <Input id="seo-keywords" value={form.metaKeywords} onChange={(e) => set({ metaKeywords: e.target.value })} placeholder={`${carName.toLowerCase()} rental, self drive ${carName.toLowerCase()}`} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="seo-canonical">Canonical URL</Label>
                  <Input id="seo-canonical" value={form.canonicalUrl} onChange={(e) => set({ canonicalUrl: e.target.value })} placeholder={pageUrl} />
                </div>
                <div className="space-y-1.5">
                  <Label>Search engines</Label>
                  <Select value={form.robotsMeta} onValueChange={(v) => set({ robotsMeta: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDEX_FOLLOW">Index &amp; follow (recommended)</SelectItem>
                      <SelectItem value="NOINDEX_FOLLOW">Hide from Google, follow links</SelectItem>
                      <SelectItem value="INDEX_NOFOLLOW">Index, don&apos;t follow links</SelectItem>
                      <SelectItem value="NOINDEX_NOFOLLOW">Hide completely</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sharing image (WhatsApp / Facebook) — optional, defaults to the car photo</Label>
                <ImageUploadField value={form.ogImage} onChange={(url) => set({ ogImage: url })} folder="cms" />
              </div>
            </div>

            <div className="h-fit rounded-lg border p-4">
              <div className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Google preview</div>
              <div className="text-xs text-green-700">{pageUrl}</div>
              <div className="mt-0.5 line-clamp-2 text-lg leading-snug text-blue-700">{shownTitle}</div>
              <div className="text-muted-foreground mt-1 line-clamp-3 text-sm">{shownDesc}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
