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
  Code2,
  Bot,
  Compass,
  FileCode,
  Plus,
  Trash2,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  Laptop,
  Smartphone,
  ShieldCheck,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface PageOption {
  path: string;
  title: string;
  group: string;
  entityType?: string;
  entityId?: string;
  isDynamic: boolean;
  slug?: string;
}

interface SeoFormData {
  path: string;
  entityType?: string;
  entityId?: string;

  // Meta Tags
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robotsMeta: string;

  // Social / Open Graph / Twitter
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterCreator?: string;

  // Schema.org Structured Data
  schemaType: "AutoRental" | "Product" | "LocalBusiness" | "FAQPage" | "Article" | "BreadcrumbList" | "Organization" | "Custom";
  customSchemaJson?: string;
  enableStructuredData: boolean;

  // AEO (Answer Engine Optimization)
  aeoEnabled: boolean;
  aiDirectAnswer: string;
  entityDefinition: string;
  keyTakeaways: string[];
  faqPairs: { question: string; answer: string }[];
  aiBotDirectives: {
    allowGPTBot: boolean;
    allowPerplexityBot: boolean;
    allowClaudeBot: boolean;
    allowGoogleExtended: boolean;
  };

  // Sitemap & Indexation
  inSitemap: boolean;
  sitemapPriority: number;
  sitemapChangeFreq: string;
}

export default function DynamicSeoCommandCenter() {
  const [pages, setPages] = React.useState<PageOption[]>([]);
  const [selectedPath, setSelectedPath] = React.useState<string>("/");
  const [loadingPages, setLoadingPages] = React.useState(true);
  const [loadingSeo, setLoadingSeo] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile">("desktop");

  // Custom page dialog
  const [isAddPageOpen, setIsAddPageOpen] = React.useState(false);
  const [newPagePath, setNewPagePath] = React.useState("");
  const [newPageTitle, setNewPageTitle] = React.useState("");

  // Robots config dialog
  const [isRobotsOpen, setIsRobotsOpen] = React.useState(false);
  const [robotsConfig, setRobotsConfig] = React.useState<any>(null);
  const [savingRobots, setSavingRobots] = React.useState(false);

  // Form State
  const [form, setForm] = React.useState<SeoFormData>({
    path: "/",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    robotsMeta: "INDEX_FOLLOW",
    ogTitle: "",
    ogDescription: "",
    ogImage: "/og-image.jpg",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterCreator: "@srmcarrentals",
    schemaType: "Organization",
    enableStructuredData: true,
    aeoEnabled: true,
    aiDirectAnswer: "",
    entityDefinition: "",
    keyTakeaways: [],
    faqPairs: [],
    aiBotDirectives: {
      allowGPTBot: true,
      allowPerplexityBot: true,
      allowClaudeBot: true,
      allowGoogleExtended: true,
    },
    inSitemap: true,
    sitemapPriority: 0.8,
    sitemapChangeFreq: "daily",
  });

  // Load all discoverable pages
  const fetchPages = React.useCallback(async () => {
    setLoadingPages(true);
    try {
      const res = await fetch("/api/v1/seo/pages");
      if (!res.ok) throw new Error("Failed to load discoverable pages");
      const json = await res.json();
      setPages(json.data?.pages || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load pages list");
    } finally {
      setLoadingPages(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Load SEO profile whenever selectedPath changes
  const fetchPageSeo = React.useCallback(async (path: string, pageMeta?: PageOption) => {
    setLoadingSeo(true);
    try {
      const params = new URLSearchParams({ path });
      if (pageMeta?.entityType) params.set("entityType", pageMeta.entityType);
      if (pageMeta?.entityId) params.set("entityId", pageMeta.entityId);

      const res = await fetch(`/api/v1/seo/dynamic-page?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load page SEO profile");
      const json = await res.json();
      if (json.data) {
        setForm({
          ...json.data,
          path,
          entityType: pageMeta?.entityType || json.data.entityType,
          entityId: pageMeta?.entityId || json.data.entityId,
          keyTakeaways: Array.isArray(json.data.keyTakeaways) ? json.data.keyTakeaways : [],
          faqPairs: Array.isArray(json.data.faqPairs) ? json.data.faqPairs : [],
          aiBotDirectives: json.data.aiBotDirectives || {
            allowGPTBot: true,
            allowPerplexityBot: true,
            allowClaudeBot: true,
            allowGoogleExtended: true,
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load SEO profile");
    } finally {
      setLoadingSeo(false);
    }
  }, []);

  React.useEffect(() => {
    const pageMeta = pages.find((p) => p.path === selectedPath);
    fetchPageSeo(selectedPath, pageMeta);
  }, [selectedPath, pages, fetchPageSeo]);

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/seo/dynamic-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save dynamic SEO settings");
      toast.success(`SEO & AEO settings for "${selectedPath}" saved successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save dynamic SEO settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomPage = async () => {
    if (!newPagePath) {
      toast.error("Path is required");
      return;
    }
    let p = newPagePath.trim();
    if (!p.startsWith("/")) p = "/" + p;
    try {
      const res = await fetch("/api/v1/seo/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: p, title: newPageTitle || p }),
      });
      if (!res.ok) throw new Error("Failed to add page");
      toast.success(`Page ${p} registered for dynamic SEO`);
      setIsAddPageOpen(false);
      setNewPagePath("");
      setNewPageTitle("");
      await fetchPages();
      setSelectedPath(p);
    } catch (err: any) {
      toast.error(err.message || "Failed to add page");
    }
  };

  // Add FAQ pair
  const handleAddFaq = () => {
    setForm({
      ...form,
      faqPairs: [...form.faqPairs, { question: "", answer: "" }],
    });
  };

  const handleUpdateFaq = (index: number, field: "question" | "answer", val: string) => {
    const updated = [...form.faqPairs];
    if (updated[index]) {
      updated[index][field] = val;
      setForm({ ...form, faqPairs: updated });
    }
  };

  const handleRemoveFaq = (index: number) => {
    setForm({
      ...form,
      faqPairs: form.faqPairs.filter((_, i) => i !== index),
    });
  };

  // Add Key Takeaway
  const handleAddTakeaway = () => {
    setForm({
      ...form,
      keyTakeaways: [...form.keyTakeaways, ""],
    });
  };

  const handleUpdateTakeaway = (index: number, val: string) => {
    const updated = [...form.keyTakeaways];
    updated[index] = val;
    setForm({ ...form, keyTakeaways: updated });
  };

  const handleRemoveTakeaway = (index: number) => {
    setForm({
      ...form,
      keyTakeaways: form.keyTakeaways.filter((_, i) => i !== index),
    });
  };

  // Fetch robots.txt configuration
  const handleOpenRobots = async () => {
    try {
      const res = await fetch("/api/v1/seo/robots-config");
      if (res.ok) {
        const json = await res.json();
        setRobotsConfig(json.data);
      }
    } catch {
      // fallback
    }
    setIsRobotsOpen(true);
  };

  const handleSaveRobots = async () => {
    if (!robotsConfig) return;
    setSavingRobots(true);
    try {
      const res = await fetch("/api/v1/seo/robots-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(robotsConfig),
      });
      if (!res.ok) throw new Error("Failed to save robots configuration");
      toast.success("Robots.txt directives & AI bot rules updated");
      setIsRobotsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save robots config");
    } finally {
      setSavingRobots(false);
    }
  };

  const selectedPageObj = pages.find((p) => p.path === selectedPath);

  // Computed JSON-LD preview
  const generatedJsonLd = React.useMemo(() => {
    if (form.schemaType === "Custom" && form.customSchemaJson) {
      try {
        return JSON.stringify(JSON.parse(form.customSchemaJson), null, 2);
      } catch {
        return form.customSchemaJson;
      }
    }
    if (form.schemaType === "FAQPage" && form.faqPairs.length > 0) {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: form.faqPairs.map((p) => ({
            "@type": "Question",
            name: p.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: p.answer,
            },
          })),
        },
        null,
        2
      );
    }
    if (form.schemaType === "AutoRental") {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "AutoRental",
          name: form.metaTitle || "SRM Luxury Car Rentals",
          description: form.metaDescription,
          url: form.canonicalUrl,
          image: form.ogImage,
          priceRange: "₹₹₹",
          telephone: "+91-9876543210",
        },
        null,
        2
      );
    }
    if (form.schemaType === "LocalBusiness") {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "AutomotiveBusiness",
          name: form.metaTitle || "SRM Car Rentals",
          description: form.metaDescription,
          url: form.canonicalUrl,
          telephone: "+91-9876543210",
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": form.schemaType,
        name: form.metaTitle || "SRM Car Rentals",
        description: form.metaDescription,
        url: form.canonicalUrl,
      },
      null,
      2
    );
  }, [form.schemaType, form.customSchemaJson, form.faqPairs, form.metaTitle, form.metaDescription, form.canonicalUrl, form.ogImage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dynamic SEO & AEO Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Configure dynamic Meta Tags, Schema.org JSON-LD, Answer Engine Optimization (Perplexity/ChatGPT), Robots directives, and XML Sitemaps for any page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenRobots}
            className="gap-1.5"
          >
            <Bot className="size-3.5 text-sky-500" />
            Robots.txt & AI Bots
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/admin/seo/sitemap" className="gap-1.5">
              <Compass className="size-3.5 text-emerald-500" />
              Sitemap Stats
            </a>
          </Button>
        </div>
      </div>

      <SeoNav />

      {/* DYNAMIC PAGE SELECTOR BAR */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-muted/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <Label htmlFor="pagePicker" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Page for SEO Customization
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedPath}
                  onValueChange={(val) => setSelectedPath(val)}
                  disabled={loadingPages}
                >
                  <SelectTrigger id="pagePicker" className="w-full md:w-[480px] bg-background font-medium">
                    <SelectValue placeholder="Select a page to optimize..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[360px]">
                    {pages.map((p) => (
                      <SelectItem key={p.path} value={p.path}>
                        <span className="text-xs font-semibold text-muted-foreground mr-2">[{p.group}]</span>
                        <span className="font-medium">{p.title}</span>
                        <span className="font-mono text-xs text-muted-foreground ml-2">({p.path})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                      <Plus className="size-3.5" />
                      Add Custom URL
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Register Custom Page for Dynamic SEO</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="newPath">Page URL Path</Label>
                        <Input
                          id="newPath"
                          placeholder="/promotions/summer-special"
                          value={newPagePath}
                          onChange={(e) => setNewPagePath(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="newTitle">Page Title / Label</Label>
                        <Input
                          id="newTitle"
                          placeholder="Summer Road Trip Special"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPageOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCustomPage}>Add Page</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Selected Page Overview Chips */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center text-xs">
              <Badge variant="outline" className="gap-1 bg-background">
                <span className="text-muted-foreground">Type:</span> {selectedPageObj?.group || "Custom"}
              </Badge>
              <Badge variant={form.inSitemap ? "success" : "secondary"}>
                {form.inSitemap ? "Indexed in Sitemap" : "Excluded from Sitemap"}
              </Badge>
              <Badge variant={form.aeoEnabled ? "default" : "outline"} className="gap-1">
                <Sparkles className="size-3 text-amber-400" />
                AEO {form.aeoEnabled ? "Active" : "Disabled"}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {form.schemaType} Schema
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN SEO STUDIO TABS */}
      <form onSubmit={handleSaveSeo} className="space-y-6">
        <Tabs defaultValue="meta" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="meta" className="gap-1.5 text-xs font-semibold py-2">
              <Globe className="size-3.5" />
              Meta Tags & SERP
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 text-xs font-semibold py-2">
              <Share2 className="size-3.5" />
              Social & OG Cards
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-1.5 text-xs font-semibold py-2">
              <Code2 className="size-3.5" />
              Schema.org (JSON-LD)
            </TabsTrigger>
            <TabsTrigger value="aeo" className="gap-1.5 text-xs font-semibold py-2">
              <Sparkles className="size-3.5 text-amber-500" />
              AEO & AI Search
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="gap-1.5 text-xs font-semibold py-2">
              <Compass className="size-3.5" />
              Sitemap & Indexing
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: META TAGS & LIVE SERP PREVIEW */}
          <TabsContent value="meta" className="space-y-6 pt-4">
            {/* Live Google Search Simulation */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="size-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold">
                    Live Google Search Result Preview
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    type="button"
                    variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Laptop className="size-3" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="size-3" />
                    Mobile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`rounded-lg border border-border bg-white dark:bg-zinc-950 p-4 space-y-1 font-sans shadow-sm ${
                    previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="size-4 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold">
                      S
                    </div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      SRM Car Rentals
                    </span>
                    <span>›</span>
                    <span className="truncate">{form.canonicalUrl}</span>
                  </div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                    {form.metaTitle || `${selectedPath} | SRM Car Rentals`}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {form.metaDescription || "Please provide a meta description for this page."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Page Meta Tags</CardTitle>
                <CardDescription>
                  Search engine title, snippet description, and indexing rules for {selectedPath}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="metaTitle">Meta Title Tag</Label>
                    <span
                      className={`text-xs ${
                        form.metaTitle.length > 60 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {form.metaTitle.length}/60 chars (Recommended 50-60)
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
                    <Label htmlFor="metaDesc">Meta Description</Label>
                    <span
                      className={`text-xs ${
                        form.metaDescription.length > 160 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {form.metaDescription.length}/160 chars (Recommended 140-160)
                    </span>
                  </div>
                  <Textarea
                    id="metaDesc"
                    rows={3}
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="canonicalUrl">Canonical URL Override</Label>
                    <Input
                      id="canonicalUrl"
                      value={form.canonicalUrl}
                      onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                      placeholder="https://srmcarrentals.in/path"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="robotsMeta">Robots Meta Tag</Label>
                    <Select
                      value={form.robotsMeta}
                      onValueChange={(val) => setForm({ ...form, robotsMeta: val })}
                    >
                      <SelectTrigger id="robotsMeta">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDEX_FOLLOW">index, follow (Standard SEO)</SelectItem>
                        <SelectItem value="NOINDEX_FOLLOW">noindex, follow (Hide but crawl links)</SelectItem>
                        <SelectItem value="INDEX_NOFOLLOW">index, nofollow (Index without link equity)</SelectItem>
                        <SelectItem value="NOINDEX_NOFOLLOW">noindex, nofollow (Strictly block)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metaKeywords">Keywords (Comma Separated)</Label>
                  <Input
                    id="metaKeywords"
                    value={form.metaKeywords}
                    onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                    placeholder="self drive car, luxury rentals, airport pickup"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SOCIAL & OPEN GRAPH */}
          <TabsContent value="social" className="space-y-6 pt-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Share2 className="size-4 text-primary" />
                  <CardTitle className="text-base">Open Graph & Social Share Card</CardTitle>
                </div>
                <CardDescription>
                  Custom appearance when this page link is shared on WhatsApp, iMessage, Facebook, or X.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ogTitle">Open Graph Title</Label>
                    <Input
                      id="ogTitle"
                      value={form.ogTitle}
                      onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ogType">Open Graph Type</Label>
                    <Select
                      value={form.ogType}
                      onValueChange={(val) => setForm({ ...form, ogType: val })}
                    >
                      <SelectTrigger id="ogType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">website (Standard page)</SelectItem>
                        <SelectItem value="article">article (Blog / Guide)</SelectItem>
                        <SelectItem value="product">product (Vehicle / Package)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ogDesc">Open Graph Description</Label>
                  <Textarea
                    id="ogDesc"
                    rows={2}
                    value={form.ogDescription}
                    onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ogImage">Open Graph Image URL</Label>
                    <Input
                      id="ogImage"
                      value={form.ogImage}
                      onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                      placeholder="/og-image.jpg or CDN link"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="twitterCard">Twitter Card Type</Label>
                    <Select
                      value={form.twitterCard}
                      onValueChange={(val) => setForm({ ...form, twitterCard: val })}
                    >
                      <SelectTrigger id="twitterCard">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary_large_image">summary_large_image (Big visual banner)</SelectItem>
                        <SelectItem value="summary">summary (Compact thumbnail)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SCHEMA.ORG STRUCTURED DATA */}
          <TabsContent value="schema" className="space-y-6 pt-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="size-4 text-emerald-500" />
                    <div>
                      <CardTitle className="text-base">Schema.org JSON-LD Structured Data</CardTitle>
                      <CardDescription>
                        Generate Google Rich Snippets, Star Ratings, and Entity Knowledge Graph tags.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Enable Schema</Label>
                    <Switch
                      checked={form.enableStructuredData}
                      onCheckedChange={(checked) => setForm({ ...form, enableStructuredData: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="schemaType">Structured Data Schema Type</Label>
                    <Select
                      value={form.schemaType}
                      onValueChange={(val: any) => setForm({ ...form, schemaType: val })}
                    >
                      <SelectTrigger id="schemaType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AutoRental">AutoRental (Car Rental Service)</SelectItem>
                        <SelectItem value="LocalBusiness">LocalBusiness / AutomotiveBusiness</SelectItem>
                        <SelectItem value="Product">Product (Car Specification)</SelectItem>
                        <SelectItem value="FAQPage">FAQPage (Accordion Q&A Snippets)</SelectItem>
                        <SelectItem value="Article">Article / BlogPosting</SelectItem>
                        <SelectItem value="Organization">Organization (Brand / Headquarters)</SelectItem>
                        <SelectItem value="BreadcrumbList">BreadcrumbList (Navigation)</SelectItem>
                        <SelectItem value="Custom">Custom Raw JSON-LD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <a
                      href="https://search.google.com/test/rich-results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1.5"
                    >
                      <span>Test with Google Rich Results Tool</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {form.schemaType === "Custom" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="customSchema">Custom JSON-LD Markup</Label>
                    <Textarea
                      id="customSchema"
                      rows={10}
                      font-mono
                      className="font-mono text-xs"
                      placeholder='{ "@context": "https://schema.org", "@type": "AutoRental", ... }'
                      value={form.customSchemaJson || ""}
                      onChange={(e) => setForm({ ...form, customSchemaJson: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Generated JSON-LD Payload Preview</Label>
                    <pre className="p-4 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800">
                      {generatedJsonLd}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: AEO (ANSWER ENGINE OPTIMIZATION & AI OVERVIEWS) */}
          <TabsContent value="aeo" className="space-y-6 pt-4">
            <Card className="border-border/60 shadow-sm border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-base">Answer Engine Optimization (AEO)</CardTitle>
                      <CardDescription>
                        Optimize content structure for Perplexity, ChatGPT Search, Gemini, and Google AI Overviews.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">AEO Active</Label>
                    <Switch
                      checked={form.aeoEnabled}
                      onCheckedChange={(checked) => setForm({ ...form, aeoEnabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="aiDirectAnswer" className="font-semibold text-xs">
                      Direct Conversational Answer / AI Snippet
                    </Label>
                    <Badge variant="outline" className="text-[10px]">
                      LLM Citation Target
                    </Badge>
                  </div>
                  <Textarea
                    id="aiDirectAnswer"
                    rows={3}
                    placeholder="2-3 sentence factual, high-authority statement answering what this page offers and how customers book..."
                    value={form.aiDirectAnswer}
                    onChange={(e) => setForm({ ...form, aiDirectAnswer: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This snippet is prioritized by AI search bots when answering user prompts like "Where to rent a car in [City]?"
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entityDef" className="font-semibold text-xs">
                    Core Entity Definition
                  </Label>
                  <Input
                    id="entityDef"
                    placeholder="e.g. Mahindra Thar 4x4 Automatic Diesel SUV rental in Bangalore"
                    value={form.entityDefinition}
                    onChange={(e) => setForm({ ...form, entityDefinition: e.target.value })}
                  />
                </div>

                {/* FAQ Pairs for Direct Answers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-xs">Conversational Q&A Pairs</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Extracted as direct answers in Google AI summaries and ChatGPT answers.
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddFaq} className="gap-1.5">
                      <Plus className="size-3.5" />
                      Add Q&A Pair
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {form.faqPairs.map((faq, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder="Question (e.g. Can I pickup this car at the airport?)"
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                            className="font-medium text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFaq(idx)}
                            className="h-8 text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Concise factual answer..."
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-xs">Key Takeaways & Authority Bullets</Label>
                      <p className="text-[11px] text-muted-foreground">
                        High-density bullet points designed for AI summarization engines.
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddTakeaway} className="gap-1.5">
                      <Plus className="size-3.5" />
                      Add Bullet
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {form.keyTakeaways.map((takeaway, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. Free cancellation up to 24 hours prior to trip start."
                          value={takeaway}
                          onChange={(e) => handleUpdateTakeaway(idx, e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTakeaway(idx)}
                          className="h-8 text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: SITEMAP & INDEXING */}
          <TabsContent value="sitemap" className="space-y-6 pt-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-emerald-500" />
                  <CardTitle className="text-base">Sitemap Inclusion & Priority</CardTitle>
                </div>
                <CardDescription>
                  Configure how search engine crawlers treat {selectedPath} in /sitemap.xml.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="font-medium text-sm">Include in XML Sitemap</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, this URL is published to /sitemap.xml for Google and Bing.
                    </p>
                  </div>
                  <Switch
                    checked={form.inSitemap}
                    onCheckedChange={(checked) => setForm({ ...form, inSitemap: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sitemapPriority">Crawl Priority (0.1 to 1.0)</Label>
                    <Select
                      value={form.sitemapPriority.toString()}
                      onValueChange={(val) => setForm({ ...form, sitemapPriority: parseFloat(val) })}
                    >
                      <SelectTrigger id="sitemapPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1.0 (Highest - Homepage / Main Catalog)</SelectItem>
                        <SelectItem value="0.9">0.9 (Very High - Key Fleet Models)</SelectItem>
                        <SelectItem value="0.8">0.8 (High - City Hubs / Airports)</SelectItem>
                        <SelectItem value="0.7">0.7 (Standard - Categories / Tours)</SelectItem>
                        <SelectItem value="0.5">0.5 (Medium - Blog Articles / Info)</SelectItem>
                        <SelectItem value="0.3">0.3 (Low - Terms / Policies)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sitemapFreq">Change Frequency</Label>
                    <Select
                      value={form.sitemapChangeFreq}
                      onValueChange={(val) => setForm({ ...form, sitemapChangeFreq: val })}
                    >
                      <SelectTrigger id="sitemapFreq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">always</SelectItem>
                        <SelectItem value="hourly">hourly</SelectItem>
                        <SelectItem value="daily">daily (Recommended for cars / pricing)</SelectItem>
                        <SelectItem value="weekly">weekly (Locations / guides)</SelectItem>
                        <SelectItem value="monthly">monthly</SelectItem>
                        <SelectItem value="yearly">yearly (Legal policies)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PERSISTENT SAVE ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl border border-border bg-card/90 backdrop-blur p-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Target: <strong className="text-foreground">{selectedPath}</strong></span>
          </div>
          <Button type="submit" disabled={saving || loadingSeo} className="gap-2">
            <Save className="size-4" />
            {saving ? "Saving All SEO & AEO Settings..." : "Save Page SEO Profile"}
          </Button>
        </div>
      </form>

      {/* ROBOTS.TXT & AI BOT CONFIGURATION MODAL */}
      <Dialog open={isRobotsOpen} onOpenChange={setIsRobotsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="size-5 text-sky-500" />
              Robots.txt & AI Crawler Management
            </DialogTitle>
          </DialogHeader>
          {robotsConfig && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <Label className="font-semibold text-xs">Default Disallowed URL Paths</Label>
                <Input
                  value={robotsConfig.defaultDisallow?.join(", ") || ""}
                  onChange={(e) =>
                    setRobotsConfig({
                      ...robotsConfig,
                      defaultDisallow: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="/admin, /api, /checkout"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paths blocked for all standard search crawlers.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-xs">AI & LLM Search Engine Crawlers</Label>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {robotsConfig.aiBots?.map((bot: any, idx: number) => (
                    <div key={bot.userAgent} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-xs">{bot.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {bot.description} ({bot.userAgent})
                        </div>
                      </div>
                      <Switch
                        checked={bot.allowed}
                        onCheckedChange={(checked) => {
                          const updated = [...robotsConfig.aiBots];
                          updated[idx].allowed = checked;
                          setRobotsConfig({ ...robotsConfig, aiBots: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsRobotsOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleSaveRobots} disabled={savingRobots}>
                  {savingRobots ? "Saving..." : "Apply Robots.txt Rules"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
