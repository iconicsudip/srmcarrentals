"use client";

import * as React from "react";
import {
  Globe,
  Save,
  Search,
  Share2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GlobalSeoPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    metaTitle: "SRM Car Rentals | Premium Luxury & Self-Drive Car Hire India",
    metaDescription:
      "Rent premium luxury sedans, SUVs, and chauffeur-driven cars across top Indian cities. Guaranteed best rates, instant airport transfers, and 24/7 road assistance.",
    metaKeywords: "car rental india, luxury self-drive cars, airport taxi, srm car rentals, hire suv",
    canonicalUrl: "https://srmcarrentals.in",
    robotsMeta: "INDEX_FOLLOW",
    ogTitle: "SRM Car Rentals — The Gold Standard of Car Hire in India",
    ogDescription:
      "Explore India with pristine self-drive fleets and executive chauffeur services. Instant online bookings.",
    ogImage: "/og-image.jpg",
    twitterCard: "summary_large_image",
  });

  const fetchGlobalSeo = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/seo/metadata?entityType=HOMEPAGE");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setForm({
            metaTitle: json.data.metaTitle || form.metaTitle,
            metaDescription: json.data.metaDescription || form.metaDescription,
            metaKeywords: json.data.metaKeywords || form.metaKeywords,
            canonicalUrl: json.data.canonicalUrl || form.canonicalUrl,
            robotsMeta: json.data.robotsMeta || "INDEX_FOLLOW",
            ogTitle: json.data.ogTitle || form.ogTitle,
            ogDescription: json.data.ogDescription || form.ogDescription,
            ogImage: json.data.ogImage || form.ogImage,
            twitterCard: json.data.twitterCard || "summary_large_image",
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load global SEO");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGlobalSeo();
  }, [fetchGlobalSeo]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/seo/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "HOMEPAGE",
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to save global SEO defaults");
      toast.success("Global SEO metadata updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save global SEO defaults");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Control organic search engine indexing, Open Graph social share snippets, and canonical URLs.
        </p>
      </div>

      <SeoNav />

      {/* Google SERP Live Preview */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-sky-500" />
              <CardTitle className="text-base font-semibold">Google Search Snippet Preview</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Live SERP Simulation
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-white dark:bg-zinc-950 p-4 space-y-1.5 font-sans max-w-2xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                SRM Car Rentals
              </span>
              <span>›</span>
              <span className="truncate">{form.canonicalUrl}</span>
            </div>
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
              {form.metaTitle || "Page Title Preview"}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {form.metaDescription || "Provide a meta description to preview how your listing appears in search results."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meta Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Homepage & Global Meta Tags</CardTitle>
            <CardDescription>
              Primary title tags, search descriptions, and robot indexing instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="metaTitle">SEO Meta Title</Label>
                <span className="text-xs text-muted-foreground">
                  {form.metaTitle.length}/60 recommended chars
                </span>
              </div>
              <Input
                id="metaTitle"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <span className="text-xs text-muted-foreground">
                  {form.metaDescription.length}/160 recommended chars
                </span>
              </div>
              <Textarea
                id="metaDescription"
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={form.canonicalUrl}
                  onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                  placeholder="https://srmcarrentals.in"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="robotsMeta">Robots Directive</Label>
                <Select
                  value={form.robotsMeta}
                  onValueChange={(val) => setForm({ ...form, robotsMeta: val })}
                >
                  <SelectTrigger id="robotsMeta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDEX_FOLLOW">index, follow (Standard)</SelectItem>
                    <SelectItem value="NOINDEX_FOLLOW">noindex, follow</SelectItem>
                    <SelectItem value="INDEX_NOFOLLOW">index, nofollow</SelectItem>
                    <SelectItem value="NOINDEX_NOFOLLOW">noindex, nofollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metaKeywords">Keywords (comma separated)</Label>
              <Input
                id="metaKeywords"
                value={form.metaKeywords}
                onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing (Open Graph) */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="size-4 text-primary" />
              <CardTitle className="text-lg">Social Media Sharing (Open Graph / Twitter Cards)</CardTitle>
            </div>
            <CardDescription>
              Custom visual card styling when links are shared on WhatsApp, Facebook, LinkedIn, or X.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  value={form.ogTitle}
                  onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={form.ogImage}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="/og-image.jpg or CDN link"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ogDescription">OG Description</Label>
              <Textarea
                id="ogDescription"
                rows={2}
                value={form.ogDescription}
                onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="size-4" />
            {saving ? "Saving Changes..." : "Save SEO Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
