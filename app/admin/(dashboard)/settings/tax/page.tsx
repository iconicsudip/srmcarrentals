"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    gstPercentage: 18,
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 18,
    sacCode: "996601", // SAC for Rental of commercial vehicles with or without operator
    pricesIncludeTax: false,
    applyTaxToDeliveryCharges: true,
    applyTaxToInsurance: true,
    applyTaxToExtraServices: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.tax", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          setForm((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
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
      await apiFetch("/settings/system.tax", {
        method: "PUT",
        body: form,
      });
      toast.success("Tax calculation parameters updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update tax settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure GST rates, SAC codes, and taxation behavior on car rental bookings.</p>
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
              <CardTitle className="text-base font-semibold">Goods & Services Tax (GST) Slabs</CardTitle>
              <CardDescription>Default Indian GST percentage applied during live pricing calculation.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gst">Total Standard GST (%)</Label>
                <Input
                  id="gst"
                  type="number"
                  step="0.01"
                  value={form.gstPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setForm({
                      ...form,
                      gstPercentage: val,
                      cgstPercentage: val / 2,
                      sgstPercentage: val / 2,
                      igstPercentage: val,
                    });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sac">Service Accounting Code (SAC)</Label>
                <Input
                  id="sac"
                  value={form.sacCode}
                  onChange={(e) => setForm({ ...form, sacCode: e.target.value })}
                  placeholder="996601"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cgst">Intrastate CGST (%)</Label>
                <Input
                  id="cgst"
                  type="number"
                  step="0.01"
                  value={form.cgstPercentage}
                  onChange={(e) => setForm({ ...form, cgstPercentage: Number(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sgst">Intrastate SGST (%)</Label>
                <Input
                  id="sgst"
                  type="number"
                  step="0.01"
                  value={form.sgstPercentage}
                  onChange={(e) => setForm({ ...form, sgstPercentage: Number(e.target.value) || 0 })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tax Application Rules</CardTitle>
              <CardDescription>Control how tax applies to ancillary rental components and add-ons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Prices Displayed Include Tax</Label>
                  <p className="text-xs text-muted-foreground">If enabled, vehicle base rate already includes GST. Otherwise, GST is added at checkout.</p>
                </div>
                <Switch
                  checked={form.pricesIncludeTax}
                  onCheckedChange={(checked) => setForm({ ...form, pricesIncludeTax: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Apply GST to Airport & Delivery Fees</Label>
                  <p className="text-xs text-muted-foreground">Calculate 18% GST on doorstep handover and terminal delivery charges.</p>
                </div>
                <Switch
                  checked={form.applyTaxToDeliveryCharges}
                  onCheckedChange={(checked) => setForm({ ...form, applyTaxToDeliveryCharges: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Apply GST to Protection Plans</Label>
                  <p className="text-xs text-muted-foreground">Include comprehensive insurance & roadside protection in taxable subtotal.</p>
                </div>
                <Switch
                  checked={form.applyTaxToInsurance}
                  onCheckedChange={(checked) => setForm({ ...form, applyTaxToInsurance: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Tax Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
