"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanySettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    legalName: "SRM Car Rentals Private Limited",
    tradeName: "SRM Car Rentals",
    cin: "U63030RJ2020PTC070123",
    gstin: "08AABCS1429B1Z8",
    pan: "AABCS1429B",
    email: "srmrentan0171@gmail.com",
    phone: "+91 9414551250",
    emergencyPhone: "+91 9414551250",
    addressLine1: "Shop No. 111, Shreyansh Complex, Opp. Daya Nasta Centre",
    addressLine2: "University Road, 100 Ft. Corner",
    city: "Udaipur",
    state: "Rajasthan",
    pincode: "313001",
    googleMapsUrl: "https://maps.google.com/?q=Udaipur",
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.company", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.company", {
        method: "PUT",
        body: form,
      });
      toast.success("Company profile updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update company settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Manage legal registration details, tax identifiers, and official headquarters contact info.</p>
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
              <CardTitle className="text-base font-semibold">Legal Entity & Registration</CardTitle>
              <CardDescription>Company legal name, corporate identifiers, and tax registrations printed on booking vouchers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalName">Registered Company Name</Label>
                <Input
                  id="legalName"
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade / Brand Name</Label>
                <Input
                  id="tradeName"
                  value={form.tradeName}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN Number</Label>
                <Input
                  id="gstin"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">Company PAN</Label>
                <Input
                  id="pan"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cin">CIN (Corporate Identity Number)</Label>
                <Input
                  id="cin"
                  value={form.cin}
                  onChange={(e) => setForm({ ...form, cin: e.target.value.toUpperCase() })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Headquarters & Contact Details</CardTitle>
              <CardDescription>Official business address, support phone numbers, and emergency helpline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Concierge Desk Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">24/7 Roadside Helpline</Label>
                  <Input
                    id="emergencyPhone"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Official Support Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Area / Landmark)</Label>
                <Input
                  id="addressLine2"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code</Label>
                  <Input
                    id="pincode"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapsUrl">Google Maps Link</Label>
                <Input
                  id="mapsUrl"
                  value={form.googleMapsUrl}
                  onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Company Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
