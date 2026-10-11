"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { useCarList } from "@/hooks/use-cars";
import { DEFAULT_KM_PLANS, normalizeKmPlans, resolveCarKmPlans, type KmPlansConfig } from "@/lib/pricing/km-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface CarRow {
  id: string;
  name: string;
  brand: { name: string };
  pricing: {
    dailyPrice: string;
    includedKmPerDay: number;
    extraKmPrice: string;
    hourlyPrice: string | null;
  } | null;
}

export default function KmPlansPage() {
  const { data, isLoading } = useCarList<CarRow>({ page: 1, limit: 100 });
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

  const setTier = (i: number, km: number) =>
    setConfig((c) => {
      const tiers = [...c.tiers] as KmPlansConfig["tiers"];
      tiers[i] = Math.max(0, Math.round(km) || 0);
      return { ...c, tiers };
    });

  const setPrice = (carId: string, km: number, key: "daily" | "hourly", value: string) =>
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
      const saved = await api.put<KmPlansConfig>("/pricing/km-plans", config);
      setConfig(normalizeKmPlans(saved));
      toast.success("KM plans saved — live within a minute");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KM Plans</h1>
          <p className="text-muted-foreground text-sm">
            The same three KM allowances for every car, with a daily (24h) and hourly price per car. Leave a price empty to use the calculated one.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !loaded}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">KM per 24 hours</CardTitle>
          <CardDescription>Applies to all cars on the website cards, car pages and bookings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {config.tiers.map((km, i) => (
            <div key={i} className="space-y-1.5">
              <Label>Plan {i + 1}{i === 1 ? " (recommended)" : ""}</Label>
              <div className="relative">
                <Input type="number" min={1} value={km} onChange={(e) => setTier(i, Number(e.target.value))} className="pr-10" />
                <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">km</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prices per car</CardTitle>
          <CardDescription>
            Daily = price per 24 hours · Hourly = price per hour. Placeholders show what is charged when left empty
            (24h price + extra KM × extra-KM rate).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                <th className="py-2 pr-3 font-semibold">Car</th>
                {config.tiers.map((km) => (
                  <th key={km} className="px-2 py-2 font-semibold">
                    {km} km <span className="font-normal normal-case">(daily · hourly)</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading || !loaded ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="py-2">
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                (data?.data ?? []).map((car) => {
                  const calc = car.pricing
                    ? resolveCarKmPlans(
                        {
                          id: car.id,
                          dailyPrice: Number(car.pricing.dailyPrice),
                          hourlyPrice: car.pricing.hourlyPrice ? Number(car.pricing.hourlyPrice) : null,
                          includedKmPerDay: car.pricing.includedKmPerDay,
                          extraKmPrice: Number(car.pricing.extraKmPrice),
                        },
                        { tiers: config.tiers, prices: {} },
                      )
                    : null;
                  return (
                    <tr key={car.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{car.name}</div>
                        <div className="text-muted-foreground text-xs">{car.brand?.name}</div>
                      </td>
                      {config.tiers.map((km, i) => {
                        const cur = config.prices[car.id]?.[String(km)];
                        return (
                          <td key={km} className="px-2 py-2">
                            {calc ? (
                              <div className="flex gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  aria-label={`${car.name} ${km} km daily price`}
                                  className="h-8 w-24"
                                  placeholder={String(calc[i]!.dailyPrice)}
                                  value={cur?.daily ?? ""}
                                  onChange={(e) => setPrice(car.id, km, "daily", e.target.value)}
                                />
                                <Input
                                  type="number"
                                  min={0}
                                  aria-label={`${car.name} ${km} km hourly price`}
                                  className="h-8 w-20"
                                  placeholder={calc[i]!.hourlyPrice != null ? String(calc[i]!.hourlyPrice) : "—"}
                                  value={cur?.hourly ?? ""}
                                  onChange={(e) => setPrice(car.id, km, "hourly", e.target.value)}
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">No pricing set</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
