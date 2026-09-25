"use client";

import * as React from "react";
import { AlertCircle, Car, CarFront, CheckCircle2, Compass, Eye, Layers, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailableServicesConfig } from "@/modules/settings/site-content.schemas";

export default function AvailableServicesSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [services, setServices] = React.useState<AvailableServicesConfig>({
    cars: true,
    taxi: true,
    tours: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<AvailableServicesConfig>("/settings/system.services", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          setServices({
            cars: data.cars ?? true,
            taxi: data.taxi ?? true,
            tours: data.tours ?? true,
          });
        }
      })
      .catch(() => {
        // Fallback to default enabled
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Safety check: at least one service must remain enabled
    if (!services.cars && !services.taxi && !services.tours) {
      toast.error("At least one service must be enabled so customers have booking options.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/settings/system.services", {
        method: "PUT",
        body: services,
      });
      toast.success("Available services updated successfully! Website will dynamically reflect these changes.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update available services");
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Number(services.cars) + Number(services.taxi) + Number(services.tours);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Services</h1>
        <p className="text-sm text-muted-foreground">
          Control which mobility services (Self-Drive Cars, Taxi / Chauffeur, Royal Tours) are active and visible across the customer website.
        </p>
      </div>

      <SettingsNav />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading service configurations...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {/* Main Services Control */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Layers className="size-4 text-orange-500" />
                    Customer-Facing Services
                  </CardTitle>
                  <CardDescription>
                    Toggle any service ON or OFF. Disabled services are automatically hidden from website navigation, hero booking widget, category cards, and homepage sections.
                  </CardDescription>
                </div>
                <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                  {enabledCount} of 3 Active
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service 1: Self Drive Cars */}
              <div className={`flex items-start justify-between rounded-xl border p-4 transition-all ${
                services.cars
                  ? "border-orange-500/30 bg-orange-500/[0.03]"
                  : "border-border/60 bg-muted/30 opacity-70"
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                    <Car className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="service-cars" className="text-sm font-bold cursor-pointer">
                        Self Drive Cars
                      </Label>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        /cars & /car/[slug]
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      Enables the self-drive car catalog, interactive vehicle booking engine, 24h daily/hourly pricing calculators, fleet showcase sections, and self-drive search filters.
                    </p>
                  </div>
                </div>
                <Switch
                  id="service-cars"
                  checked={services.cars}
                  onCheckedChange={(checked) => setServices({ ...services, cars: checked })}
                />
              </div>

              {/* Service 2: Taxi / Chauffeur */}
              <div className={`flex items-start justify-between rounded-xl border p-4 transition-all ${
                services.taxi
                  ? "border-orange-500/30 bg-orange-500/[0.03]"
                  : "border-border/60 bg-muted/30 opacity-70"
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                    <CarFront className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="service-taxi" className="text-sm font-bold cursor-pointer">
                        Taxi & Chauffeur Services
                      </Label>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        /car-rental
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      Enables executive chauffeur rides, city transfers, airport pick & drop packages, wedding car hire, and direct WhatsApp chauffeur dispatch options.
                    </p>
                  </div>
                </div>
                <Switch
                  id="service-taxi"
                  checked={services.taxi}
                  onCheckedChange={(checked) => setServices({ ...services, taxi: checked })}
                />
              </div>

              {/* Service 3: Royal Tours */}
              <div className={`flex items-start justify-between rounded-xl border p-4 transition-all ${
                services.tours
                  ? "border-orange-500/30 bg-orange-500/[0.03]"
                  : "border-border/60 bg-muted/30 opacity-70"
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                    <Compass className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="service-tours" className="text-sm font-bold cursor-pointer">
                        Royal Tours & Expeditions
                      </Label>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        /tours & /tours/[slug]
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      Enables curated Rajasthan holiday packages, heritage city tours, safari adventures, day trips, and customized travel itineraries.
                    </p>
                  </div>
                </div>
                <Switch
                  id="service-tours"
                  checked={services.tours}
                  onCheckedChange={(checked) => setServices({ ...services, tours: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Website Impact Preview */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="size-3.5 text-orange-500" />
                Live Dynamic Website Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border p-3 space-y-1.5 bg-background">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Navigation Bar</span>
                  {enabledCount > 0 ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3.5 text-red-500" />
                  )}
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Header displays: {[
                    services.cars ? "Self Drive" : null,
                    services.taxi ? "Taxi" : null,
                    services.tours ? "Tours" : null,
                  ].filter(Boolean).join(", ") || "None"}
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1.5 bg-background">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Booking Engine</span>
                  {services.cars || services.taxi ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Hero tabs active: {[
                    services.cars ? "Self Drive" : null,
                    services.taxi ? "Taxi" : null,
                  ].filter(Boolean).join(", ") || "Standard Form"}
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1.5 bg-background">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Homepage Sections</span>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Sections rendered: {[
                    services.cars ? "Fleet & Brands" : null,
                    services.taxi ? "Chauffeur" : null,
                    services.tours ? "Tours Grid" : null,
                  ].filter(Boolean).join(", ") || "Corporate/About"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={saving} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Available Services
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
