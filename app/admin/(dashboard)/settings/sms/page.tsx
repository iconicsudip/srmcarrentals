"use client";

import * as React from "react";
import { Loader2, MessageSquare, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmsSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    enableSms: true,
    provider: "MSG91",
    apiKey: "",
    senderId: "SRMCAR",
    dltEntityId: "",
    bookingTemplateId: "",
    otpTemplateId: "",
    handoverTemplateId: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.sms", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.sms", {
        method: "PUT",
        body: form,
      });
      toast.success("SMS gateway configuration saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure transactional SMS gateways, DLT template identifiers, and customer phone alerts.</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">SMS Dispatch Gateway</CardTitle>
                  <CardDescription>Transmit reservation hold vouchers and OTP verification codes via SMS.</CardDescription>
                </div>
                <Switch
                  checked={form.enableSms}
                  onCheckedChange={(checked) => setForm({ ...form, enableSms: checked })}
                />
              </div>
            </CardHeader>
            {form.enableSms && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="provider">SMS Gateway Provider</Label>
                    <select
                      id="provider"
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="MSG91">MSG91 (India DLT Certified)</option>
                      <option value="Fast2SMS">Fast2SMS (Quick OTP)</option>
                      <option value="Twilio">Twilio Global SMS</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Gateway API / Auth Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      placeholder="••••••••••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderId">Registered Sender ID (Header)</Label>
                    <Input
                      id="senderId"
                      value={form.senderId}
                      onChange={(e) => setForm({ ...form, senderId: e.target.value.toUpperCase() })}
                      placeholder="SRMCAR"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dltEntityId">Govt DLT Principal Entity ID</Label>
                    <Input
                      id="dltEntityId"
                      value={form.dltEntityId}
                      onChange={(e) => setForm({ ...form, dltEntityId: e.target.value })}
                      placeholder="e.g. 1701159876543210123"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold">DLT Approved Template IDs</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="tplBooking">Reservation Template ID</Label>
                      <Input
                        id="tplBooking"
                        value={form.bookingTemplateId}
                        onChange={(e) => setForm({ ...form, bookingTemplateId: e.target.value })}
                        placeholder="170716123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tplOtp">Phone OTP Template ID</Label>
                      <Input
                        id="tplOtp"
                        value={form.otpTemplateId}
                        onChange={(e) => setForm({ ...form, otpTemplateId: e.target.value })}
                        placeholder="170716123456790"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tplHandover">Handover PIN Template ID</Label>
                      <Input
                        id="tplHandover"
                        value={form.handoverTemplateId}
                        onChange={(e) => setForm({ ...form, handoverTemplateId: e.target.value })}
                        placeholder="170716123456791"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save SMS Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
