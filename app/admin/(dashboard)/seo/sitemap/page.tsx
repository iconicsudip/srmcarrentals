"use client";

import * as React from "react";
import {
  Compass,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  FileCode,
  Globe,
  Radio,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SitemapStats {
  totalUrls: number;
  staticRoutesCount: number;
  carsCount: number;
  locationsCount: number;
  airportsCount: number;
  blogsCount: number;
  pagesCount: number;
  lastGenerated: string;
  sitemapUrl: string;
  robotsUrl: string;
}

export default function SitemapManagementPage() {
  const [stats, setStats] = React.useState<SitemapStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pinging, setPinging] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/seo/sitemap");
      if (!res.ok) throw new Error("Failed to load sitemap stats");
      const json = await res.json();
      setStats(json.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load sitemap stats");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePingSearchBots = async () => {
    setPinging(true);
    try {
      const res = await fetch("/api/v1/seo/sitemap", { method: "POST" });
      if (!res.ok) throw new Error("Failed to ping search engines");
      const json = await res.json();
      toast.success(json.data?.message || "Search bots notified successfully");
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to ping search engines");
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Monitor XML sitemap generation, crawler indexation, and notify search engine webmasters.
        </p>
      </div>

      <SeoNav />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Indexed URLs
            </CardTitle>
            <Compass className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUrls ?? "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Live pages in sitemap.xml</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Sitemap Status
            </CardTitle>
            <CheckCircle2 className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">Valid</div>
            <p className="text-xs text-muted-foreground mt-1">Standard XML 0.9 protocol</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Search Bot Ping
            </CardTitle>
            <Radio className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enabled</div>
            <p className="text-xs text-muted-foreground mt-1">Google & Bing notified on update</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Robots.txt Directive
            </CardTitle>
            <FileCode className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Permissive</div>
            <p className="text-xs text-muted-foreground mt-1">Admin excluded, public allowed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sitemap Breakdown */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Indexed Entities Breakdown</CardTitle>
            <CardDescription>
              Dynamic entities automatically aggregated into the sitemap stream.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">Active Fleet Cars</span>
                <Badge variant="outline" className="font-mono">{stats?.carsCount ?? 0} URLs</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">Pickup & City Hubs</span>
                <Badge variant="outline" className="font-mono">{stats?.locationsCount ?? 0} URLs</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">Airport Transfer Terminals</span>
                <Badge variant="outline" className="font-mono">{stats?.airportsCount ?? 0} URLs</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">Published Blog Posts</span>
                <Badge variant="outline" className="font-mono">{stats?.blogsCount ?? 0} URLs</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">CMS Content Pages</span>
                <Badge variant="outline" className="font-mono">{stats?.pagesCount ?? 0} URLs</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium">Core Static Routes</span>
                <Badge variant="outline" className="font-mono">{stats?.staticRoutesCount ?? 0} URLs</Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handlePingSearchBots}
                disabled={pinging || loading}
                className="w-full gap-2"
              >
                <Send className="size-4" />
                {pinging ? "Notifying Bots..." : "Rebuild & Ping Search Engines"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Console & Endpoints */}
        <Card className="border-border/60 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg">Webmaster Endpoints & Feeds</CardTitle>
            <CardDescription>
              Direct endpoints accessible by search engine bots (Googlebot, Bingbot).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">XML Sitemap</span>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>Open Feed</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border border-border">
                https://srmcarrentals.in/sitemap.xml
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Robots.txt Feed</span>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>Open Robots</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border border-border">
                https://srmcarrentals.in/robots.txt
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Google Search Console Verification:</p>
              <p>
                To register your sitemap, copy the XML URL above and paste it into Google Search Console under Sitemaps &gt; Add a new sitemap.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
