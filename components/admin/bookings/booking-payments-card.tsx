"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PaymentRow {
  id: string;
  provider: string;
  paymentType: string;
  amount: string | number;
  status: string;
  providerPaymentId: string | null;
  paidAt: string | null;
  refunds?: { id: string; amount: string | number; status: string; reason: string | null; providerRefundId: string | null; processedAt: string | null }[];
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const ACTIVE = ["REQUESTED", "PROCESSING", "COMPLETED"];

/** Payments made on a booking, with a Refund action (through Razorpay, or recorded manually). */
export function BookingPaymentsCard({ bookingId, payments, canRefund = true }: { bookingId: string; payments: PaymentRow[]; canRefund?: boolean }) {
  const queryClient = useQueryClient();
  const [target, setTarget] = React.useState<PaymentRow | null>(null);
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("Booking cancelled");
  const [manual, setManual] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // One real payment can appear twice (webhook events) — show it once and pool its refunds.
  const rows = payments.filter((p, i) => !p.providerPaymentId || payments.findIndex((x) => x.providerPaymentId === p.providerPaymentId) === i);
  const sameMoney = (p: PaymentRow) => (p.providerPaymentId ? payments.filter((x) => x.providerPaymentId === p.providerPaymentId) : [p]);
  const refundsOf = (p: PaymentRow) => sameMoney(p).flatMap((x) => x.refunds ?? []);
  const remainingOf = (p: PaymentRow) =>
    Math.max(0, Number(p.amount) - refundsOf(p).filter((r) => ACTIVE.includes(r.status)).reduce((s, r) => s + Number(r.amount), 0));

  const open = (p: PaymentRow) => {
    setTarget(p);
    setAmount(String(remainingOf(p)));
    setManual(false);
  };

  async function submit() {
    if (!target) return;
    setBusy(true);
    try {
      await api.post("/finance/refunds", { paymentId: target.id, amount: Number(amount), reason, manual });
      toast.success(manual ? "Manual refund recorded" : "Refund sent to Razorpay — the customer gets it in 5–7 working days");
      setTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments &amp; Refunds</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No payment received yet.</p>
          ) : (
            rows.map((p) => {
              const remaining = remainingOf(p);
              return (
                <div key={p.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{inr(Number(p.amount))}</div>
                      <div className="text-muted-foreground text-xs">
                        {p.provider} · {p.paymentType === "ADVANCE" ? "Advance" : p.paymentType === "PARTIAL" ? "Partial" : "Full"}
                        {p.paidAt ? ` · ${new Date(p.paidAt).toLocaleString("en-IN")}` : ""}
                      </div>
                    </div>
                    <Badge variant={p.status === "PAID" ? "success" : p.status === "REFUNDED" ? "secondary" : "outline"}>{p.status}</Badge>
                  </div>

                  {refundsOf(p).map((r) => (
                    <div key={r.id} className="text-muted-foreground mt-2 flex items-center justify-between border-t pt-2 text-xs">
                      <span>
                        Refund {inr(Number(r.amount))} · {r.reason ?? "—"}
                        {r.providerRefundId ? ` · ${r.providerRefundId}` : ""}
                      </span>
                      <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "FAILED" ? "destructive" : "warning"}>{r.status}</Badge>
                    </div>
                  ))}

                  {canRefund && (p.status === "PAID" || p.status === "PARTIALLY_PAID") && remaining > 0 && (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => open(p)}>
                      <Undo2 className="mr-1.5 size-3.5" /> Refund
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund payment</DialogTitle>
            <DialogDescription>
              {target ? `Up to ${inr(remainingOf(target))} can be refunded on this payment.` : ""} Online payments are returned through Razorpay to the customer&apos;s original payment method.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Refund amount (₹)</Label>
              <Input id="refund-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Reason</Label>
              <Input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="mt-0.5" />
              <span>I already paid this back myself (cash / UPI) — only record it, don&apos;t send money through Razorpay.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy || !Number(amount)}>
              {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null} {manual ? "Record refund" : "Refund via Razorpay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
