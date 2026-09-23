"use client";

import * as React from "react";
import { BellRing, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    alertOnNewBooking: true,
    alertOnCancellation: true,
    alertOnPaymentReceived: true,
    alertOnRefundRequest: true,
    alertOnLowAvailability: true,
    inAppSoundAlerts: true,
    staffAlertEmail: "admin@srmcarrentals.com",
    staffAlertPhone: "+91 9414551250",
    lowInventoryThreshold: 2,
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.notifications", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.notifications", {
        method: "PUT",
        body: form,
      });
      toast.success("Notification preferences saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure internal staff notifications, operational sound alerts, and dispatch triggers.</p>
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
              <CardTitle className="text-base font-semibold">Staff Alert Channels</CardTitle>
              <CardDescription>Target inbox and SMS/WhatsApp endpoints for real-time fleet activity.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Staff Notification Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={form.staffAlertEmail}
                  onChange={(e) => setForm({ ...form, staffAlertEmail: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffPhone">Duty Manager Mobile Number</Label>
                <Input
                  id="staffPhone"
                  type="tel"
                  value={form.staffAlertPhone}
                  onChange={(e) => setForm({ ...form, staffAlertPhone: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Operational Event Triggers</CardTitle>
              <CardDescription>Select which critical booking lifecycle events trigger instant staff alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">New Self-Drive Reservation Hold</Label>
                  <p className="text-xs text-muted-foreground">Alert staff when a customer initiates a 15-minute hold on a car.</p>
                </div>
                <Switch
                  checked={form.alertOnNewBooking}
                  onCheckedChange={(checked) => setForm({ ...form, alertOnNewBooking: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Booking Cancellation Alerts</Label>
                  <p className="text-xs text-muted-foreground">Notify duty desk immediately when a reservation is released or cancelled.</p>
                </div>
                <Switch
                  checked={form.alertOnCancellation}
                  onCheckedChange={(checked) => setForm({ ...form, alertOnCancellation: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Payment Successful & Security Deposit Settlements</Label>
                  <p className="text-xs text-muted-foreground">Notify finance desk upon gateway capture or cash collection at pickup.</p>
                </div>
                <Switch
                  checked={form.alertOnPaymentReceived}
                  onCheckedChange={(checked) => setForm({ ...form, alertOnPaymentReceived: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Security Deposit Refund Requests</Label>
                  <p className="text-xs text-muted-foreground">Alert when completed trip inspection triggers deposit refund processing.</p>
                </div>
                <Switch
                  checked={form.alertOnRefundRequest}
                  onCheckedChange={(checked) => setForm({ ...form, alertOnRefundRequest: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">In-App Audio Chime</Label>
                  <p className="text-xs text-muted-foreground">Play alert sound in admin dashboard when new orders arrive live.</p>
                </div>
                <Switch
                  checked={form.inAppSoundAlerts}
                  onCheckedChange={(checked) => setForm({ ...form, inAppSoundAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Notification Preferences
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
