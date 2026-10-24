"use client";

import * as React from "react";
import { Bot, Loader2, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { SiteFileLinks } from "@/components/admin/seo/site-file-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface State {
  content: string;
  isDefault: boolean;
  defaultContent: string;
}

const SNIPPETS: { label: string; text: string }[] = [
  { label: "Block a folder", text: "Disallow: /private/" },
  { label: "Block an AI bot", text: "User-agent: GPTBot\nDisallow: /" },
  { label: "Allow a bot", text: "User-agent: Googlebot\nAllow: /" },
  { label: "Sitemap line", text: "Sitemap: {SITE_URL}/sitemap.xml" },
];

export default function RobotsPage() {
  const [state, setState] = React.useState<State | null>(null);
  const [text, setText] = React.useState("");
  const [loadError, setLoadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState("");
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const area = React.useRef<HTMLTextAreaElement>(null);

  const loadPreview = React.useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/robots.txt?t=${Date.now()}`, { cache: "no-store" });
      setPreview(res.ok ? await res.text() : `Could not load /robots.txt (${res.status})`);
    } catch {
      setPreview("Could not load /robots.txt");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  React.useEffect(() => {
    apiFetch<State>("/seo/robots-txt", { skipAuthRedirect: true })
      .then((s) => {
        setState(s);
        setText(s.content);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load robots.txt"));
    void loadPreview();
  }, [loadPreview]);

  const dirty = state ? text !== state.content : false;

  async function save() {
    setSaving(true);
    try {
      const next = await apiFetch<State>("/seo/robots-txt", { method: "PUT", body: { content: text } });
      setState(next);
      setText(next.content);
      toast.success("robots.txt saved — live now");
      void loadPreview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm("Replace the text with the default robots.txt?")) return;
    try {
      const next = await apiFetch<State>("/seo/robots-txt", { method: "DELETE" });
      setState(next);
      setText(next.content);
      toast.success("Back to the default");
      void loadPreview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function insert(snippet: string) {
    const el = area.current;
    const at = el ? el.selectionStart : text.length;
    const before = text.slice(0, at);
    const after = text.slice(at);
    const glue = before && !before.endsWith("\n") ? "\n" : "";
    setText(`${before}${glue}${snippet}\n${after}`);
    el?.focus();
  }

  const lines = text.split("\n").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bot className="size-6 text-sky-500" /> Robots.txt
            {state && <Badge variant={state.isDefault ? "outline" : "success"}>{state.isDefault ? "Default" : "Customised"}</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm">Edit the file exactly as search engines read it.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={!state || (state.isDefault && !dirty)}>
            <RotateCcw className="mr-2 size-4" /> Reset to default
          </Button>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Save changes
          </Button>
        </div>
      </div>

      <SeoNav />
      <SiteFileLinks />

      {loadError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</div>}
      {!state && !loadError && (
        <div className="text-muted-foreground flex items-center justify-center py-16">
          <Loader2 className="text-primary mr-2 size-5 animate-spin" /> Loading…
        </div>
      )}

      {state && (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editor</CardTitle>
              <CardDescription>
                <span className="font-mono">User-agent</span> names a crawler (<span className="font-mono">*</span> = all), then <span className="font-mono">Allow</span> / <span className="font-mono">Disallow</span> list the paths.
                Write <span className="font-mono">{"{SITE_URL}"}</span> for your site address — it is filled in automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {SNIPPETS.map((s) => (
                  <Button key={s.label} type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => insert(s.text)}>
                    + {s.label}
                  </Button>
                ))}
              </div>
              <textarea
                ref={area}
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                wrap="off"
                aria-label="robots.txt"
                className="border-input bg-background focus-visible:ring-ring min-h-[520px] w-full resize-y rounded-md border p-3 font-mono text-[13px] leading-6 outline-none focus-visible:ring-2"
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>{lines} lines</span>
                {dirty && <span className="text-amber-600">Unsaved changes</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Live file</CardTitle>
                <CardDescription>What /robots.txt shows right now</CardDescription>
              </div>
              <Button type="button" variant="outline" size="icon" className="size-8" onClick={loadPreview} aria-label="Refresh">
                <RefreshCw className={`size-3.5 ${previewLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/40 max-h-[560px] overflow-auto rounded-md p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{preview || "…"}</pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
