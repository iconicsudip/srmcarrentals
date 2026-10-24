"use client";

import * as React from "react";
import { BarChart3, CheckCircle2, Copy, ExternalLink, Loader2, Megaphone, Save, Search, Unplug } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { cleanGaId, cleanPixelId, parseSearchConsoleCode } from "@/lib/tracking/ids";
import { trackingConfigSchema, type TrackingConfig } from "@/modules/settings/site-content.schemas";
import { SiteFileLinks } from "@/components/admin/seo/site-file-links";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface GoogleStatus {
  configured: boolean;
  clientEmail: string;
  siteUrl: string;
}

interface Totals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface KeyRow extends Totals {
  key: string;
}
interface Report {
  range: { start: string; end: string };
  totals: Totals;
  previous: Totals;
  daily: { date: string; clicks: number; impressions: number }[];
  queries: KeyRow[];
  pages: KeyRow[];
}

const EVENT_LABELS: { key: keyof TrackingConfig["metaPixel"]["events"]; label: string; hint: string }[] = [
  { key: "viewContent", label: "View car", hint: "Someone opens a car page" },
  { key: "addToCart", label: "Add to cart", hint: "A car is added to the cart" },
  { key: "initiateCheckout", label: "Start checkout", hint: "Someone reaches checkout" },
  { key: "purchase", label: "Purchase", hint: "A booking is paid (with its value)" },
  { key: "contact", label: "Contact", hint: "Someone taps WhatsApp or Call" },
];

const fmt = (n: number) => n.toLocaleString("en-IN");
const change = (now: number, prev: number, invert = false) => {
  if (!prev) return null;
  const pct = ((now - prev) / prev) * 100;
  return { pct, good: invert ? pct <= 0 : pct >= 0 };
};

function Stat({ label, value, delta }: { label: string; value: string; delta: ReturnType<typeof change> }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-1 text-xs font-medium ${delta.good ? "text-emerald-600" : "text-red-600"}`}>
          {delta.pct >= 0 ? "↑" : "↓"} {Math.abs(delta.pct).toFixed(1)}% vs previous period
        </div>
      )}
    </div>
  );
}

function LineChart({ data }: { data: { date: string; clicks: number }[] }) {
  if (data.length < 2) return <div className="text-muted-foreground py-10 text-center text-sm">Not enough data for a chart yet.</div>;
  const w = 720;
  const h = 180;
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - (v / max) * (h - 12) - 4;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.clicks).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" role="img" aria-label="Clicks per day">
      <path d={`${line} L${w},${h} L0,${h} Z`} className="fill-emerald-500/10" />
      <path d={line} fill="none" strokeWidth="2.5" className="stroke-emerald-600" strokeLinejoin="round" />
      <text x="0" y={h + 16} className="fill-muted-foreground text-[11px]">{data[0]!.date.slice(5)}</text>
      <text x={w} y={h + 16} textAnchor="end" className="fill-muted-foreground text-[11px]">{data[data.length - 1]!.date.slice(5)}</text>
      <text x={w} y="12" textAnchor="end" className="fill-muted-foreground text-[11px]">max {fmt(max)}</text>
    </svg>
  );
}

function KeyTable({ title, rows, short }: { title: string; rows: KeyRow[]; short?: boolean }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{short ? "Page" : "Query"}</th>
              <th className="px-3 py-2 text-right font-medium">Clicks</th>
              <th className="px-3 py-2 text-right font-medium">Impr.</th>
              <th className="px-3 py-2 text-right font-medium">Pos.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-3 py-6 text-center">No data yet</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="max-w-[260px] truncate px-3 py-2" title={r.key}>{short ? r.key.replace(/^https?:\/\/[^/]+/, "") || "/" : r.key}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.clicks)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.impressions)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [cfg, setCfg] = React.useState<TrackingConfig>(() => trackingConfigSchema.parse({}));
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [google, setGoogle] = React.useState<GoogleStatus>({ configured: false, clientEmail: "", siteUrl: "" });
  const [siteUrl, setSiteUrl] = React.useState("");
  const [keyJson, setKeyJson] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [report, setReport] = React.useState<Report | null>(null);
  const [reportError, setReportError] = React.useState("");
  const [days, setDays] = React.useState(28);
  const [reportLoading, setReportLoading] = React.useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  React.useEffect(() => {
    Promise.all([
      apiFetch<unknown>("/settings/integrations.tracking", { skipAuthRedirect: true }).catch(() => null),
      apiFetch<GoogleStatus>("/integrations/google", { skipAuthRedirect: true }).catch(() => null),
    ])
      .then(([tracking, status]) => {
        const parsed = trackingConfigSchema.safeParse(tracking ?? {});
        if (parsed.success) setCfg(parsed.data);
        if (status) {
          setGoogle(status);
          setSiteUrl(status.siteUrl);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadReport = React.useCallback(async (d: number) => {
    setReportLoading(true);
    setReportError("");
    try {
      setReport(await apiFetch<Report>(`/integrations/google/search-console?days=${d}`));
    } catch (e) {
      setReport(null);
      setReportError(e instanceof Error ? e.message : "Could not load Search Console data");
    } finally {
      setReportLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (google.configured && google.siteUrl) void loadReport(days);
  }, [google.configured, google.siteUrl, days, loadReport]);

  const set = (patch: Partial<TrackingConfig>) => setCfg((c) => ({ ...c, ...patch }));

  async function saveTracking() {
    setSaving(true);
    try {
      const next: TrackingConfig = {
        ...cfg,
        searchConsole: { verification: parseSearchConsoleCode(cfg.searchConsole.verification) },
        googleAnalytics: { measurementId: cleanGaId(cfg.googleAnalytics.measurementId) },
        metaPixel: { ...cfg.metaPixel, pixelId: cleanPixelId(cfg.metaPixel.pixelId) },
      };
      if (cfg.googleAnalytics.measurementId.trim() && !next.googleAnalytics.measurementId) {
        toast.error("Google Analytics ID should look like G-XXXXXXXXXX");
        return;
      }
      if (cfg.metaPixel.pixelId.trim() && !next.metaPixel.pixelId) {
        toast.error("Meta Pixel ID should be a number (about 15 digits)");
        return;
      }
      await apiFetch("/settings/integrations.tracking", { method: "PUT", body: next });
      setCfg(next);
      toast.success("Saved — live on the website now");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function connectGoogle() {
    setConnecting(true);
    try {
      const status = await apiFetch<GoogleStatus>("/integrations/google", { method: "PUT", body: { siteUrl, ...(keyJson.trim() ? { serviceAccountJson: keyJson } : {}) } });
      setGoogle(status);
      setKeyJson("");
      toast.success("Saved");
      if (status.configured && status.siteUrl) void loadReport(days);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectGoogle() {
    if (!confirm("Disconnect Google? The saved key will be deleted.")) return;
    try {
      setGoogle(await apiFetch<GoogleStatus>("/integrations/google", { method: "DELETE" }));
      setReport(null);
      setSiteUrl("");
      toast.success("Disconnected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast.success("Copied"), () => {});

  if (loading) {
    return (
      <div className="space-y-6">
        <SettingsNav />
        <div className="text-muted-foreground flex items-center justify-center py-20">
          <Loader2 className="text-primary mr-2 size-5 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  const code = parseSearchConsoleCode(cfg.searchConsole.verification);
  const pixelOk = Boolean(cleanPixelId(cfg.metaPixel.pixelId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-sm">Connect Google Search Console, Google Analytics and the Meta (Facebook) Pixel to the website.</p>
        </div>
        <Button onClick={saveTracking} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Save changes
        </Button>
      </div>

      <SettingsNav />

      {/* ───────── Search Console ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4" /> Google Search Console
            {code && <Badge variant="success">Verification tag on</Badge>}
          </CardTitle>
          <CardDescription>Prove you own the site to Google, then see how it performs in Google search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gsc-code">1. Verification code</Label>
              <Input
                id="gsc-code"
                value={cfg.searchConsole.verification}
                onChange={(e) => set({ searchConsole: { verification: e.target.value } })}
                placeholder='Paste the code, or the whole <meta name="google-site-verification" …> tag'
              />
              <p className="text-muted-foreground text-xs">
                In Search Console choose <b>Add property → URL prefix → HTML tag</b>, copy the tag here, press <b>Save changes</b>, then click Verify in Google.
              </p>
              {code && <p className="text-xs text-emerald-700">Code detected: <span className="font-mono">{code}</span></p>}
            </div>
            <div className="space-y-2">
              <Label>2. Submit your sitemap</Label>
              <div className="flex gap-2">
                <Input readOnly value={`${origin}/sitemap.xml`} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => copy(`${origin}/sitemap.xml`)} aria-label="Copy sitemap URL">
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                In Search Console open <b>Sitemaps</b>, enter <span className="font-mono">sitemap.xml</span> and press Submit.{" "}
                <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5 hover:underline">
                  Open Search Console <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </div>

          <SiteFileLinks />

          <div className="rounded-lg border border-dashed p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="size-4" /> Search performance in this dashboard
                  {google.configured && <Badge variant="success">Connected</Badge>}
                </div>
                <p className="text-muted-foreground text-xs">Optional. Needs a Google service account that has been added to your Search Console property.</p>
              </div>
              {google.configured && (
                <Button type="button" variant="outline" size="sm" onClick={disconnectGoogle}>
                  <Unplug className="mr-1.5 size-3.5" /> Disconnect
                </Button>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gsc-site">Search Console property</Label>
                <Input id="gsc-site" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://srmcarrentals.in/  or  sc-domain:srmcarrentals.in" />
                <p className="text-muted-foreground text-xs">Exactly as it appears in the Search Console property picker.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gsc-key">Service account key (JSON)</Label>
                <Textarea
                  id="gsc-key"
                  rows={3}
                  value={keyJson}
                  onChange={(e) => setKeyJson(e.target.value)}
                  placeholder={google.configured ? `Saved for ${google.clientEmail} — paste a new key only to replace it` : "Paste the whole contents of the downloaded .json key file"}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" onClick={connectGoogle} disabled={connecting || (!keyJson.trim() && !siteUrl.trim())}>
                {connecting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />} {google.configured ? "Update" : "Connect"}
              </Button>
              <details className="text-muted-foreground text-xs">
                <summary className="cursor-pointer">How do I get the key?</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>In Google Cloud Console create a project and enable the <b>Google Search Console API</b>.</li>
                  <li>Create a <b>service account</b>, then add a <b>JSON key</b> and download it.</li>
                  <li>In Search Console → Settings → Users and permissions, add the service account&apos;s email as a user.</li>
                  <li>Paste the property and the JSON above and press Connect.</li>
                </ol>
              </details>
            </div>

            {google.configured && (
              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-muted-foreground text-xs">{report ? `${report.range.start} → ${report.range.end}` : ""}</div>
                  <div className="flex gap-1">
                    {[7, 28, 90].map((d) => (
                      <Button key={d} type="button" size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
                        {d} days
                      </Button>
                    ))}
                  </div>
                </div>
                {reportLoading && (
                  <div className="text-muted-foreground flex items-center py-6 text-sm">
                    <Loader2 className="mr-2 size-4 animate-spin" /> Loading from Google…
                  </div>
                )}
                {reportError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reportError}</div>}
                {report && !reportLoading && (
                  <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Stat label="Total clicks" value={fmt(report.totals.clicks)} delta={change(report.totals.clicks, report.previous.clicks)} />
                      <Stat label="Impressions" value={fmt(report.totals.impressions)} delta={change(report.totals.impressions, report.previous.impressions)} />
                      <Stat label="Average CTR" value={`${(report.totals.ctr * 100).toFixed(1)}%`} delta={change(report.totals.ctr, report.previous.ctr)} />
                      <Stat label="Average position" value={report.totals.position ? report.totals.position.toFixed(1) : "–"} delta={change(report.totals.position, report.previous.position, true)} />
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 text-sm font-semibold">Clicks per day</div>
                      <LineChart data={report.daily} />
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <KeyTable title="Top search queries" rows={report.queries} />
                      <KeyTable title="Top pages" rows={report.pages} short />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ───────── Google Analytics ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4" /> Google Analytics 4
            {cleanGaId(cfg.googleAnalytics.measurementId) && <Badge variant="success">On</Badge>}
          </CardTitle>
          <CardDescription>Visitor, channel and device reports. Leave empty to switch it off.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-1.5">
          <Label htmlFor="ga-id">Measurement ID</Label>
          <Input id="ga-id" value={cfg.googleAnalytics.measurementId} onChange={(e) => set({ googleAnalytics: { measurementId: e.target.value } })} placeholder="G-XXXXXXXXXX" />
          <p className="text-muted-foreground text-xs">Analytics → Admin → Data streams → your web stream.</p>
        </CardContent>
      </Card>

      {/* ───────── Meta Pixel ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="size-4" /> Meta Pixel (Facebook &amp; Instagram ads)
            {cfg.metaPixel.enabled && pixelOk && <Badge variant="success">On</Badge>}
          </CardTitle>
          <CardDescription>Measure and retarget visitors from your Meta ads. Page views are always sent; choose which actions to report as well.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch id="px-on" checked={cfg.metaPixel.enabled} onCheckedChange={(v) => set({ metaPixel: { ...cfg.metaPixel, enabled: v } })} />
            <Label htmlFor="px-on">Enable Meta Pixel on the website</Label>
          </div>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="px-id">Pixel ID</Label>
            <Input id="px-id" value={cfg.metaPixel.pixelId} onChange={(e) => set({ metaPixel: { ...cfg.metaPixel, pixelId: e.target.value } })} placeholder="123456789012345" inputMode="numeric" />
            <p className="text-muted-foreground text-xs">
              Meta Events Manager → Data sources → your Pixel.{" "}
              {cfg.metaPixel.enabled && !pixelOk && cfg.metaPixel.pixelId && <span className="text-red-600">That does not look like a Pixel ID.</span>}
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="size-4 text-emerald-600" /> Actions to report
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_LABELS.map((ev) => (
                <label key={ev.key} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                  <Switch
                    checked={cfg.metaPixel.events[ev.key]}
                    onCheckedChange={(v) => set({ metaPixel: { ...cfg.metaPixel, events: { ...cfg.metaPixel.events, [ev.key]: v } } })}
                  />
                  <span>
                    <span className="block text-sm font-medium">{ev.label}</span>
                    <span className="text-muted-foreground text-xs">{ev.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">Check it works with Meta&apos;s &ldquo;Pixel Helper&rdquo; browser extension or Events Manager → Test events.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={saveTracking} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Save changes
        </Button>
      </div>
    </div>
  );
}
