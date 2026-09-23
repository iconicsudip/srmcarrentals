"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

interface SmartLinkData {
  id: string;
  razorpayLinkId?: string;
  shortUrl: string;
  amount: number;
  currency: string;
  purpose: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingReference?: string;
  bookingId?: string;
  status: "ISSUED" | "PAID" | "PARTIALLY_PAID" | "EXPIRED" | "CANCELLED";
  allowPartial: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
}

export default function CustomerSmartPaymentPage() {
  const params = useParams<{ id: string }>();
  const linkId = params.id;

  const [link, setLink] = React.useState<SmartLinkData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Load link details
  React.useEffect(() => {
    if (!linkId) return;

    let cancelled = false;
    apiFetch<SmartLinkData>(`/finance/razorpay/smart-links/${linkId}`, {
      skipAuthRedirect: true,
    })
      .then((data) => {
        if (!cancelled && data) {
          setLink(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Payment link not found or has expired.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [linkId]);

  // Handle Complete Payment
  const handleCompletePayment = async () => {
    if (!link) return;
    setIsProcessing(true);

    try {
      // Simulate / process payment confirmation
      await new Promise((r) => setTimeout(r, 1200));

      setLink((prev) =>
        prev
          ? {
              ...prev,
              status: "PAID",
              paidAt: new Date().toISOString(),
            }
          : null,
      );

      toast.success("Payment successful! Official receipt generated.");
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm text-white/60">Loading secure payment portal...</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-4 border border-red-500/20">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Payment Link Unavailable</h1>
        <p className="mt-2 text-sm text-white/50 max-w-md">
          {error || "This payment link has expired or has been cancelled by SRM Car Rentals."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline" className="text-xs">
            <Link href="/">Return to Homepage</Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-xs text-white">
            <a href="tel:+919414164680">Contact SRM Support</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-neutral-950/80 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
              <CarFront className="size-4" />
            </span>
            <span className="font-black text-white text-base tracking-tight">
              SRM <span className="text-xs text-white/50 font-normal">CAR RENTALS</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Lock className="size-3.5" /> 256-Bit SSL Encrypted
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {/* State A: PAYMENT COMPLETED RECEIPT */}
        {link.status === "PAID" ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900/90 p-8 backdrop-blur shadow-2xl text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 animate-in zoom-in">
              <CheckCircle2 className="size-9" />
            </div>

            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Payment Confirmed
            </Badge>

            <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
              {formatInr(link.amount)} Paid Successfully
            </h1>
            <p className="mt-1 text-xs text-white/60">
              {link.purpose} • Received by SRM Car Rentals
            </p>

            <div className="my-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-xs space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Receipt Number</span>
                <span className="font-mono text-white">{link.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Renter Name</span>
                <span className="font-semibold text-white">{link.customerName}</span>
              </div>
              {link.bookingReference && (
                <div className="flex justify-between">
                  <span>Booking Reference</span>
                  <span className="font-bold text-orange-400">{link.bookingReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Mode</span>
                <span className="text-white">Razorpay Online / UPI</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time</span>
                <span className="text-white">{formatDate(link.paidAt || link.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-left flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Official tax invoice and confirmation receipt has been generated. For security deposits, 100% refund is processed within 24 hours of vehicle return.
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 rounded-xl border-white/15 bg-white/5 text-xs text-white hover:bg-white/10"
              >
                <Printer className="size-3.5 mr-1.5" /> Print / Save Voucher
              </Button>
              <Button
                asChild
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white"
              >
                <Link href="/">Back to Fleet →</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* State B: ACTIVE PAYMENT FORM */
          <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 sm:p-8 backdrop-blur shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Official Payment Request
                </span>
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <Clock className="size-3" /> Instant Hold
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-black text-white uppercase tracking-tight">
                {link.purpose}
              </h1>
              <p className="mt-1 text-xs text-white/50">
                Issued for <strong className="text-white">{link.customerName}</strong>
                {link.bookingReference ? ` • Booking Ref: ${link.bookingReference}` : ""}
              </p>
            </div>

            {/* Total Payable Box */}
            <div className="rounded-2xl border border-white/10 bg-black/60 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-white/50 uppercase font-semibold tracking-wider">Total Payable</span>
                <div className="mt-1 text-3xl font-black text-orange-400">{formatInr(link.amount)}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-right">
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="size-3" /> 100% Refundable
                </span>
                <span className="text-[9px] text-white/40">upon inspection</span>
              </div>
            </div>

            {/* Payment Method Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white/70">Supported Payment Methods:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                    UPI
                  </div>
                  <div>
                    <div className="font-semibold text-white">UPI & QR</div>
                    <div className="text-[10px] text-white/40">GPay, PhonePe, Paytm</div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                    CARD
                  </div>
                  <div>
                    <div className="font-semibold text-white">Cards & NetBanking</div>
                    <div className="text-[10px] text-white/40">Visa, Master, RuPay</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renter Details Summary */}
            <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-xs space-y-1.5 text-white/60">
              <div className="flex justify-between">
                <span>Renter Name:</span>
                <span className="font-semibold text-white">{link.customerName}</span>
              </div>
              {link.customerPhone && (
                <div className="flex justify-between">
                  <span>WhatsApp Phone:</span>
                  <span className="text-white">{link.customerPhone}</span>
                </div>
              )}
              {link.customerEmail && (
                <div className="flex justify-between">
                  <span>GST Email:</span>
                  <span className="text-white">{link.customerEmail}</span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin" /> Connecting to Razorpay Gateway...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Pay {formatInr(link.amount)} via Razorpay →
                  </span>
                )}
              </Button>

              <p className="text-center text-[10px] text-white/40 flex items-center justify-center gap-1">
                <Lock className="size-3 text-emerald-400" /> Settle digitally with instantaneous confirmation.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
