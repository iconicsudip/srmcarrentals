"use client";

import * as React from "react";
import { CreditCard, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    enablePayOnPickup: true,
    enableRazorpay: true,
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
    enableCashfree: false,
    cashfreeAppId: "",
    cashfreeSecretKey: "",
    enableStripe: false,
    stripePublishableKey: "",
    stripeSecretKey: "",
    defaultSecurityDeposit: 3000,
    depositRefundWindowHours: 24,
    allowUpiOnPickup: true,
    allowCashOnPickup: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<Record<string, any>>("/settings/system.payment", { skipAuthRedirect: true })
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
      await apiFetch("/settings/system.payment", {
        method: "PUT",
        body: form,
      });
      toast.success("Payment gateway settings updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure payment gateways, Pay-on-Pickup options, and security deposit handling.</p>
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
                  <CardTitle className="text-base font-semibold">Pay on Pickup / Vehicle Handover</CardTitle>
                  <CardDescription>Allow customers to reserve cars with ₹0 upfront payment and settle at vehicle delivery.</CardDescription>
                </div>
                <Switch
                  checked={form.enablePayOnPickup}
                  onCheckedChange={(checked) => setForm({ ...form, enablePayOnPickup: checked })}
                />
              </div>
            </CardHeader>
            {form.enablePayOnPickup && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Accept UPI / QR on Handover</Label>
                      <p className="text-xs text-muted-foreground">Driver/executive presents dynamic merchant UPI QR.</p>
                    </div>
                    <Switch
                      checked={form.allowUpiOnPickup}
                      onCheckedChange={(checked) => setForm({ ...form, allowUpiOnPickup: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Accept Cash on Handover</Label>
                      <p className="text-xs text-muted-foreground">Physical cash collection upon vehicle delivery.</p>
                    </div>
                    <Switch
                      checked={form.allowCashOnPickup}
                      onCheckedChange={(checked) => setForm({ ...form, allowCashOnPickup: checked })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Default Security Deposit (₹)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      value={form.defaultSecurityDeposit}
                      onChange={(e) => setForm({ ...form, defaultSecurityDeposit: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refundWindow">Deposit Release Window (Hours after trip)</Label>
                    <Input
                      id="refundWindow"
                      type="number"
                      value={form.depositRefundWindowHours}
                      onChange={(e) => setForm({ ...form, depositRefundWindowHours: Number(e.target.value) || 24 })}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Razorpay Gateway */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Razorpay Online Gateway</CardTitle>
                  <CardDescription>Primary Indian payment gateway supporting UPI, Credit/Debit cards, and NetBanking.</CardDescription>
                </div>
                <Switch
                  checked={form.enableRazorpay}
                  onCheckedChange={(checked) => setForm({ ...form, enableRazorpay: checked })}
                />
              </div>
            </CardHeader>
            {form.enableRazorpay && (
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeyId">Key ID</Label>
                  <Input
                    id="razorpayKeyId"
                    value={form.razorpayKeyId}
                    onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
                    placeholder="rzp_live_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                  <Input
                    id="razorpayKeySecret"
                    type="password"
                    value={form.razorpayKeySecret}
                    onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="razorpayWebhook">Webhook Secret (for payment verification callbacks)</Label>
                  <Input
                    id="razorpayWebhook"
                    type="password"
                    value={form.razorpayWebhookSecret}
                    onChange={(e) => setForm({ ...form, razorpayWebhookSecret: e.target.value })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Cashfree & Stripe Gateway Accordion / Cards */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Cashfree Payments (Fallback Gateway)</CardTitle>
                  <CardDescription>Zero-redirection payments and auto-refund payouts.</CardDescription>
                </div>
                <Switch
                  checked={form.enableCashfree}
                  onCheckedChange={(checked) => setForm({ ...form, enableCashfree: checked })}
                />
              </div>
            </CardHeader>
            {form.enableCashfree && (
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="cashfreeAppId">App ID</Label>
                  <Input
                    id="cashfreeAppId"
                    value={form.cashfreeAppId}
                    onChange={(e) => setForm({ ...form, cashfreeAppId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashfreeSecretKey">Secret Key</Label>
                  <Input
                    id="cashfreeSecretKey"
                    type="password"
                    value={form.cashfreeSecretKey}
                    onChange={(e) => setForm({ ...form, cashfreeSecretKey: e.target.value })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Payment Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
