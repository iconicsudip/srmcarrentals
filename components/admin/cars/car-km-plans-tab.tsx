"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { DEFAULT_KM_PLANS, normalizeKmPlans, resolveCarKmPlans, type KmPlansConfig } from "@/lib/pricing/km-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface CarPricingDto {
  dailyPrice: string | number;
  includedKmPerDay: number;
  extraKmPrice: string | number;
  hourlyPrice: string | number | null;
}

/** KM plans for ONE car: daily (24h) + hourly price for each of the three KM allowances. */
export function CarKmPlansTab({ carId, pricing }: { carId: string; pricing?: CarPricingDto | null }) {
  const [config, setConfig] = React.useState<KmPlansConfig>(DEFAULT_KM_PLANS);
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api
      .get<KmPlansConfig>("/pricing/km-plans")
      .then((c) => setConfig(normalizeKmPlans(c)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const mine = config.prices[carId] ?? {};

  const setTier = (i: number, km: number) =>
    setConfig((c) => {
      const tiers = [...c.tiers] as KmPlansConfig["tiers"];
      tiers[i] = Math.max(0, Math.round(km) || 0);
      return { ...c, tiers };
    });

  const setPrice = (km: number, key: "daily" | "hourly", value: string) =>
    setConfig((c) => {
      const byKm = { ...(c.prices[carId] ?? {}) };
      const entry = { ...(byKm[String(km)] ?? {}) };
      const n = Number(value);
      if (value === "" || !Number.isFinite(n) || n <= 0) delete entry[key];
      else entry[key] = n;
      if (entry.daily == null && entry.hourly == null) delete byKm[String(km)];
      else byKm[String(km)] = entry;
      return { ...c, prices: { ...c.prices, [carId]: byKm } };
    });

  async function save() {
    if (config.tiers.some((t) => t < 1) || new Set(config.tiers).size !== 3) {
      toast.error("Enter three different KM values");
      return;
    }
    setSaving(true);
    try {
      // Re-read the saved config so other cars' prices edited meanwhile aren't overwritten.
      const fresh = normalizeKmPlans(await api.get<KmPlansConfig>("/pricing/km-plans"));
      const next: KmPlansConfig = { tiers: config.tiers, prices: { ...fresh.prices, [carId]: config.prices[carId] ?? {} } };
      const saved = await api.put<KmPlansConfig>("/pricing/km-plans", next);
      setConfig(normalizeKmPlans(saved));
      toast.success("KM plans saved — live within a minute");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const calc = pricing
    ? resolveCarKmPlans(
        {
          id: carId,
          dailyPrice: Number(pricing.dailyPrice),
          hourlyPrice: pricing.hourlyPrice ? Number(pricing.hourlyPrice) : null,
          includedKmPerDay: pricing.includedKmPerDay,
          extraKmPrice: Number(pricing.extraKmPrice),
        },
        { tiers: config.tiers, prices: {} },
      )
    : null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">KM plans &amp; prices</CardTitle>
          <CardDescription>
            Price per 24 hours and per hour for each KM allowance. Leave a box empty to use the calculated price shown in grey
            (24h price + extra KM × extra-KM rate).
          </CardDescription>
        </div>
        <Button type="button" onClick={save} disabled={saving || !loaded}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save KM plans
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded ? (
          <Skeleton className="h-40 w-full" />
        ) : !calc ? (
          <p className="text-muted-foreground text-sm">Set this car&apos;s base price first (Locations &amp; Pricing → 24 Hour Pricing), then its KM plans appear here.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {config.tiers.map((km, i) => {
              const cur = mine[String(km)];
              return (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <div className="space-y-1.5">
                    <Label>Plan {i + 1}{i === 1 ? " (recommended)" : ""} — KM per 24 hours</Label>
                    <div className="relative">
                      <Input type="number" min={1} value={km} onChange={(e) => setTier(i, Number(e.target.value))} className="pr-10" />
                      <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">km</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price per 24 hours (₹)</Label>
                    <Input type="number" min={0} placeholder={String(calc[i]!.dailyPrice)} value={cur?.daily ?? ""} onChange={(e) => setPrice(km, "daily", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price per hour (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder={calc[i]!.hourlyPrice != null ? String(calc[i]!.hourlyPrice) : "—"}
                      value={cur?.hourly ?? ""}
                      onChange={(e) => setPrice(km, "hourly", e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-muted-foreground text-xs">The three KM amounts are the same for every car — changing them here changes them for all cars.</p>
      </CardContent>
    </Card>
  );
}
