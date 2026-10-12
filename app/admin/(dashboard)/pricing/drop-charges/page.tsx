"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { normalizeRouteCharges, routeKey, type RouteCharges } from "@/lib/pricing/location-routes";
import { useLookupOptions } from "@/hooks/use-lookup-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Loc = { id: string; name: string; city?: string; dropCharge?: number | string };

export default function DropChargesPage() {
  const locations = useLookupOptions<Loc>("/locations", "name", { kind: "POINT" });
  const [routes, setRoutes] = React.useState<RouteCharges>({});
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.get<RouteCharges>("/pricing/location-routes").then((r) => setRoutes(normalizeRouteCharges(r))).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const rows = [...locations.rows].sort((a, b) => (a.city ?? "").localeCompare(b.city ?? "") || a.name.localeCompare(b.name));

  const set = (from: string, to: string, value: string) =>
    setRoutes((r) => {
      const next = { ...r };
      const n = Number(value);
      if (value === "" || !Number.isFinite(n) || n < 0) delete next[routeKey(from, to)];
      else next[routeKey(from, to)] = n;
      return next;
    });

  async function save() {
    setSaving(true);
    try {
      setRoutes(normalizeRouteCharges(await api.put<RouteCharges>("/pricing/location-routes", routes)));
      toast.success("Pickup → drop charges saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pickup → Drop Charges</h1>
          <p className="text-muted-foreground text-sm">
            The charge for every combination of pickup location and drop location — in the same city or a different city. Leave a box empty to use the drop
            location&apos;s own drop charge (shown in grey).
          </p>
        </div>
        <Button onClick={save} disabled={saving || !loaded}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save charges
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Charge matrix (₹)</CardTitle>
          <CardDescription>Rows are the pickup location, columns are the drop location.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!loaded || locations.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="bg-background sticky left-0 py-2 pr-3 font-semibold">Pickup ↓ / Drop →</th>
                  {rows.map((to) => (
                    <th key={to.id} className="px-1.5 py-2 font-semibold">
                      <div>{to.name}</div>
                      <div className="font-normal">{to.city}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((from) => (
                  <tr key={from.id} className="border-b last:border-0">
                    <td className="bg-background sticky left-0 py-2 pr-3">
                      <div className="font-medium">{from.name}</div>
                      <div className="text-muted-foreground text-xs">{from.city}</div>
                    </td>
                    {rows.map((to) => (
                      <td key={to.id} className="px-1.5 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-24"
                          aria-label={`${from.name} to ${to.name}`}
                          placeholder={String(Number(to.dropCharge ?? 0))}
                          value={routes[routeKey(from.id, to.id)] ?? ""}
                          onChange={(e) => set(from.id, to.id, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
