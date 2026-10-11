"use client";

import * as React from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { DEFAULT_SITE_TEXT, siteTextSchema, type SiteText } from "@/modules/settings/site-content.schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SECTION_META: Record<string, { title: string; description: string }> = {
  header: { title: "Header", description: "Navigation labels and the Book Now button." },
  hero: { title: "Hero extras", description: "Pickup-points card and the stats strip under the headline." },
  philosophy: { title: "About card", description: "Caption card on the photo and the button beside the story." },
  sections: { title: "Section headings", description: "Badge, title and subtitle of each homepage section." },
  categoryCards: { title: "Category cards", description: "The three big cards (Self Drive, Chauffeur Taxi, Tours)." },
  fleet: { title: "Fleet showcase", description: "Button and caption labels in the fleet spotlight." },
  footer: { title: "Footer", description: "Call-to-action band, offices title and copyright text." },
  floatingWhatsApp: { title: "Floating WhatsApp chat", description: "Texts and the 'looking for' options in the chat popup." },
  bookingWidget: { title: "Booking widget", description: "Tabs, buttons, notices and the trust strip." },
  errors: { title: "Error pages", description: "Texts on the 404 page." },
};

const humanize = (k: string) =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/(\d+)/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());

type Json = string | number | boolean | Json[] | { [k: string]: Json };

/** Lists the admin can add to / remove from, keyed by path, with the blank row to add. */
const ARRAY_TEMPLATES: Record<string, Json> = {
  "hero.stats": { source: "custom", value: "", label: "" },
};

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "hero.stats.source": [
    { value: "cars", label: "Number of cars (automatic)" },
    { value: "cities", label: "Number of pickup cities (automatic)" },
    { value: "locations", label: "Number of pickup locations (automatic)" },
    { value: "custom", label: "Custom text (type below)" },
  ],
};

const pathKey = (path: (string | number)[]) => path.filter((p) => typeof p === "string").join(".");

function setIn(obj: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head as number] = setIn(copy[head as number] as Json, rest, value);
    return copy;
  }
  return { ...(obj as Record<string, Json>), [head as string]: setIn((obj as Record<string, Json>)[head as string]!, rest, value) };
}

function FieldTree({ value, path, onChange }: { value: Json; path: (string | number)[]; onChange: (path: (string | number)[], v: Json) => void }) {
  if (typeof value === "string" && SELECT_OPTIONS[pathKey(path)]) {
    return (
      <div className="space-y-1.5">
        <Label>{humanize(String(path[path.length - 1]))}</Label>
        <select
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
        >
          {SELECT_OPTIONS[pathKey(path)]!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (typeof value === "string") {
    const label = humanize(String(path[path.length - 1]));
    const long = value.length > 70 || /subtitle|message|note|detail|copyright/i.test(String(path[path.length - 1]));
    return (
      <div className={`space-y-1.5 ${long ? "sm:col-span-2" : ""}`}>
        <Label>{label}</Label>
        {long ? <Textarea rows={2} value={value} onChange={(e) => onChange(path, e.target.value)} /> : <Input value={value} onChange={(e) => onChange(path, e.target.value)} />}
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <div className="space-y-1.5">
        <Label>{humanize(String(path[path.length - 1]))}</Label>
        <Input type="number" step="0.1" value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </div>
    );
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) {
      return (
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{humanize(String(path[path.length - 1]))} (one per line)</Label>
          <Textarea rows={4} value={(value as string[]).join("\n")} onChange={(e) => onChange(path, e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))} />
        </div>
      );
    }
    const template = ARRAY_TEMPLATES[pathKey(path)];
    return (
      <div className="space-y-3 sm:col-span-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              <span>
                #{i + 1}{" "}
                {typeof item === "object" && item && ("title" in item || "label" in item)
                  ? `— ${String((item as Record<string, Json>).title ?? (item as Record<string, Json>).label)}`
                  : ""}
              </span>
              {template && (
                <button
                  type="button"
                  onClick={() => onChange(path, value.filter((_, j) => j !== i))}
                  className="text-red-600 normal-case hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldTree value={item} path={[...path, i]} onChange={onChange} />
            </div>
          </div>
        ))}
        {template && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(path, [...value, template])}>
            + Add item
          </Button>
        )}
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <>
        {Object.entries(value).map(([k, v]) =>
          typeof v === "object" && !Array.isArray(v) ? (
            <div key={k} className="space-y-3 rounded-lg border p-4 sm:col-span-2">
              <div className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{humanize(k)}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldTree value={v as Json} path={[...path, k]} onChange={onChange} />
              </div>
            </div>
          ) : (
            <FieldTree key={k} value={v as Json} path={[...path, k]} onChange={onChange} />
          ),
        )}
      </>
    );
  }
  return null;
}

export default function SiteTextPage() {
  const [data, setData] = React.useState<SiteText>(DEFAULT_SITE_TEXT);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<unknown>("/settings/homepage.text", { skipAuthRedirect: true })
      .then((stored) => {
        const parsed = siteTextSchema.safeParse(stored);
        if (!cancelled && parsed.success) setData(parsed.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (path: (string | number)[], v: Json) => setData((prev) => setIn(prev as unknown as Json, path, v) as unknown as SiteText);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/settings/homepage.text", { method: "PUT", body: data });
      toast.success("Website text saved — live within a minute");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Text & Labels</h1>
          <p className="text-sm text-muted-foreground">
            Every heading, button label and caption outside the main content blocks. Changes go live within a minute.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setData(DEFAULT_SITE_TEXT)}>
            <RotateCcw className="mr-1.5 size-4" /> Reset to defaults
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save changes
          </Button>
        </div>
      </div>

      {Object.entries(data).map(([key, value]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base">{SECTION_META[key]?.title ?? humanize(key)}</CardTitle>
            {SECTION_META[key]?.description && <CardDescription>{SECTION_META[key]!.description}</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FieldTree value={value as unknown as Json} path={[key]} onChange={update} />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save changes
        </Button>
      </div>
    </div>
  );
}
