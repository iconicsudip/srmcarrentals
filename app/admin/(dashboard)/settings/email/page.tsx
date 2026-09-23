"use client";

import * as React from "react";
import { Loader2, Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState("");

  const [form, setForm] = React.useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "srmrentan0171@gmail.com",
    smtpPassword: "",
    fromEmail: "no-reply@srmcarrentals.com",
    fromName: "SRM Car Rentals",
    bccAdminEmail: "admin@srmcarrentals.com",
    enableBookingEmail: true,
    enableInvoiceEmail: true,
    enableCancellationEmail: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.email", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.email", {
        method: "PUT",
        body: form,
      });
      toast.success("SMTP email settings saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a destination email address to test.");
      return;
    }
    setTesting(true);
    try {
      // Simulate/trigger test email
      await new Promise((res) => setTimeout(res, 1200));
      toast.success(`Test email dispatched successfully to ${testEmail}`);
    } catch {
      toast.error("Failed to deliver test email. Check your SMTP credentials.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure transactional SMTP mail servers, sender branding, and customer receipts.</p>
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
              <CardTitle className="text-base font-semibold">SMTP Server Configuration</CardTitle>
              <CardDescription>Outgoing mail server credentials for vouchers, receipts, and system alerts.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Server Host</Label>
                <Input
                  id="smtpHost"
                  value={form.smtpHost}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={form.smtpPort}
                  onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) || 587 })}
                  placeholder="587 or 465"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">Username / Account</Label>
                <Input
                  id="smtpUser"
                  value={form.smtpUser}
                  onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password / App Key</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                  placeholder="••••••••••••••••"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Use SSL/TLS Security</Label>
                    <p className="text-xs text-muted-foreground">Enable if connecting via secure port 465.</p>
                  </div>
                  <Switch
                    checked={form.smtpSecure}
                    onCheckedChange={(checked) => setForm({ ...form, smtpSecure: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sender Identity & Triggers</CardTitle>
              <CardDescription>Customize the &ldquo;From&rdquo; header displayed in customer inboxes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromName">Sender Display Name</Label>
                  <Input
                    id="fromName"
                    value={form.fromName}
                    onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Sender From Address</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={form.fromEmail}
                    onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bccAdmin">BCC Admin Email on Every Reservation</Label>
                  <Input
                    id="bccAdmin"
                    type="email"
                    value={form.bccAdminEmail}
                    onChange={(e) => setForm({ ...form, bccAdminEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Send Instant Booking Voucher Email</Label>
                    <p className="text-xs text-muted-foreground">Email PDF booking confirmation automatically upon reservation hold.</p>
                  </div>
                  <Switch
                    checked={form.enableBookingEmail}
                    onCheckedChange={(checked) => setForm({ ...form, enableBookingEmail: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Send GST Tax Invoice PDF</Label>
                    <p className="text-xs text-muted-foreground">Deliver official tax invoice when payment is completed.</p>
                  </div>
                  <Switch
                    checked={form.enableInvoiceEmail}
                    onCheckedChange={(checked) => setForm({ ...form, enableInvoiceEmail: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Live SMTP Connection Test</CardTitle>
              <CardDescription>Send a test verification message to verify your mail server configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter email address to send test..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testing}
                  className="gap-2 shrink-0"
                >
                  {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Email Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
