"use client";

import * as React from "react";
import { Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    enableWhatsApp: true,
    provider: "DIRECT_LINK", // "DIRECT_LINK" | "META_CLOUD_API"
    businessPhoneNumber: "+91 9414551250",
    phoneId: "",
    wabaId: "",
    metaAccessToken: "",
    autoSendVoucherOnHold: true,
    autoSendDriverDetails: true,
    welcomeMessageTemplate: "Hello! Welcome to SRM Car Rentals Udaipur. How can we assist your journey today?",
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.whatsapp", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.whatsapp", {
        method: "PUT",
        body: form,
      });
      toast.success("WhatsApp channel configuration updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update WhatsApp settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Manage WhatsApp Business integration, live chat support numbers, and automated voucher dispatches.</p>
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
                  <CardTitle className="text-base font-semibold">WhatsApp Business Channel</CardTitle>
                  <CardDescription>Primary communication channel for booking hold alerts and customer concierge.</CardDescription>
                </div>
                <Switch
                  checked={form.enableWhatsApp}
                  onCheckedChange={(checked) => setForm({ ...form, enableWhatsApp: checked })}
                />
              </div>
            </CardHeader>
            {form.enableWhatsApp && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">Official WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      value={form.businessPhoneNumber}
                      onChange={(e) => setForm({ ...form, businessPhoneNumber: e.target.value })}
                      placeholder="+91 9414551250"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Target recipient for website instant booking links and floating chat buttons.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channelMode">Integration Mode</Label>
                    <select
                      id="channelMode"
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="DIRECT_LINK">Direct Click-to-Chat (wa.me Links)</option>
                      <option value="META_CLOUD_API">Meta Official WhatsApp Cloud API</option>
                    </select>
                  </div>
                </div>

                {form.provider === "META_CLOUD_API" && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="text-sm font-semibold">Meta Cloud API Credentials</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phoneId">WhatsApp Phone Number ID</Label>
                        <Input
                          id="phoneId"
                          value={form.phoneId}
                          onChange={(e) => setForm({ ...form, phoneId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wabaId">WhatsApp Business Account ID (WABA ID)</Label>
                        <Input
                          id="wabaId"
                          value={form.wabaId}
                          onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="metaToken">Permanent System User Access Token</Label>
                        <Input
                          id="metaToken"
                          type="password"
                          value={form.metaAccessToken}
                          onChange={(e) => setForm({ ...form, metaAccessToken: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Auto-Dispatch Voucher on Hold</Label>
                      <p className="text-xs text-muted-foreground">Deliver automated WhatsApp reservation voucher when 15-min hold begins.</p>
                    </div>
                    <Switch
                      checked={form.autoSendVoucherOnHold}
                      onCheckedChange={(checked) => setForm({ ...form, autoSendVoucherOnHold: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Send Driver Contact & Vehicle Number</Label>
                      <p className="text-xs text-muted-foreground">Automatically notify customer when a driver or vehicle delivery executive is assigned.</p>
                    </div>
                    <Switch
                      checked={form.autoSendDriverDetails}
                      onCheckedChange={(checked) => setForm({ ...form, autoSendDriverDetails: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome">Floating Widget Default Welcome Text</Label>
                  <Textarea
                    id="welcome"
                    rows={2}
                    value={form.welcomeMessageTemplate}
                    onChange={(e) => setForm({ ...form, welcomeMessageTemplate: e.target.value })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save WhatsApp Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
