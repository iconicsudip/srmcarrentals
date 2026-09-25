"use client";

import * as React from "react";
import Link from "next/link";
import { Car, CarFront, Compass, Layers, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeneralSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [services, setServices] = React.useState({
    cars: true,
    taxi: true,
    tours: true,
  });

  const [form, setForm] = React.useState({
    siteName: "SRM Car Rentals",
    tagline: "Premier Self-Drive & Chauffeur Mobility in Rajasthan",
    defaultCurrency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour",
    businessHours: "08:00 AM – 10:00 PM (Daily)",
    autoConfirmBookings: false,
    requireDrivingLicense: true,
    minRentalHours: 4,
    maxAdvanceBookingDays: 90,
  });

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<Record<string, any>>("/settings/system.general", { skipAuthRedirect: true }).catch(() => null),
      apiFetch<Record<string, any>>("/settings/system.services", { skipAuthRedirect: true }).catch(() => null),
    ])
      .then(([generalData, servicesData]) => {
        if (!cancelled) {
          if (generalData && typeof generalData === "object") {
            setForm((prev) => ({ ...prev, ...generalData }));
          }
          if (servicesData && typeof servicesData === "object") {
            setServices({
              cars: servicesData.cars ?? true,
              taxi: servicesData.taxi ?? true,
              tours: servicesData.tours ?? true,
            });
          }
        }
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
    setSaving(true);
    try {
      await apiFetch("/settings/system.general", {
        method: "PUT",
        body: form,
      });
      toast.success("General settings updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Manage global platform configurations, operational defaults, and regional rules.</p>
      </div>

      <SettingsNav />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Branding & Platform Identity</CardTitle>
              <CardDescription>Primary site title, tagline, and regional time settings.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site / Platform Name</Label>
                <Input
                  id="siteName"
                  value={form.siteName}
                  onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency Code</Label>
                <Input
                  id="currency"
                  value={form.defaultCurrency}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={form.currencySymbol}
                  onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessHours">Standard Business Hours</Label>
                <Input
                  id="businessHours"
                  value={form.businessHours}
                  onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Rental Policy Rules</CardTitle>
              <CardDescription>Operational constraints for self-drive and chauffeur rentals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minRentalHours">Minimum Rental Duration (Hours)</Label>
                  <Input
                    id="minRentalHours"
                    type="number"
                    min={1}
                    value={form.minRentalHours}
                    onChange={(e) => setForm({ ...form, minRentalHours: Number(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAdvanceDays">Maximum Advance Booking (Days)</Label>
                  <Input
                    id="maxAdvanceDays"
                    type="number"
                    min={1}
                    value={form.maxAdvanceBookingDays}
                    onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: Number(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Require Valid Driving License</Label>
                  <p className="text-xs text-muted-foreground">Enforce LMV driving license verification prior to vehicle handover.</p>
                </div>
                <Switch
                  checked={form.requireDrivingLicense}
                  onCheckedChange={(checked) => setForm({ ...form, requireDrivingLicense: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-Confirm Paid Reservations</Label>
                  <p className="text-xs text-muted-foreground">Automatically change booking status to Confirmed when payment succeeds.</p>
                </div>
                <Switch
                  checked={form.autoConfirmBookings}
                  onCheckedChange={(checked) => setForm({ ...form, autoConfirmBookings: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save General Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
