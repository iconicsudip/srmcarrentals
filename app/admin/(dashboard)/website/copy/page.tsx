"use client";

import * as React from "react";
import { Loader2, RotateCcw, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { COPY } from "@/lib/copy/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const GROUP_TITLES: Record<string, string> = {
  checkout: "Checkout page",
  carpage: "Car detail page",
  booking: "Car booking panel",
  quickbook: "Mobile booking bar",
  gallery: "Car photo gallery",
  cart: "Cart page",
  cartdrawer: "Cart drawer",
  errors: "Error pages",
};

export default function PageCopyAdmin() {
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, string>>("/settings/homepage.copy", { skipAuthRedirect: true })
      .then((v) => !cancelled && v && typeof v === "object" && setOverrides(v))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, [string, string][]>();
    for (const [key, entry] of Object.entries(COPY)) {
      if (q && !key.toLowerCase().includes(q) && !entry.default.toLowerCase().includes(q) && !(overrides[key] ?? "").toLowerCase().includes(q)) continue;
      map.set(entry.group, [...(map.get(entry.group) ?? []), [key, entry.default]]);
    }
    return [...map.entries()];
  }, [query, overrides]);

  const changed = Object.values(overrides).filter((v) => v?.trim()).length;

  async function save() {
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(overrides).filter(([k, v]) => v?.trim() && COPY[k] && v.trim() !== COPY[k]!.default));
      await apiFetch("/settings/homepage.copy", { method: "PUT", body: clean });
      setOverrides(clean);
      toast.success("Page copy saved — live within a minute");
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
          <h1 className="text-2xl font-bold tracking-tight">Page Copy</h1>
          <p className="text-sm text-muted-foreground">
            Edit any text on the checkout, car detail, cart and error pages. Leave a field empty to keep the original. Use{" "}
            <code className="rounded bg-muted px-1">{"{name}"}</code>-style placeholders exactly as shown. {changed} customised.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOverrides({})}>
            <RotateCcw className="mr-1.5 size-4" /> Clear all
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save changes
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search text…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {groups.map(([group, entries]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base">{GROUP_TITLES[group] ?? group}</CardTitle>
            <CardDescription>{entries.length} texts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {entries.map(([key, def]) => {
              const long = def.length > 60;
              const common = {
                value: overrides[key] ?? "",
                placeholder: def,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setOverrides((p) => ({ ...p, [key]: e.target.value })),
              };
              return (
                <div key={key} className={`space-y-1 ${long ? "sm:col-span-2" : ""}`}>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">{key}</span>
                    {overrides[key]?.trim() && <span className="font-semibold text-orange-600">customised</span>}
                  </div>
                  {long ? <Textarea rows={2} {...common} /> : <Input {...common} />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      {groups.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No texts match “{query}”.</p>}
    </div>
  );
}
