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
  const router = useRouter();
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
      // Call backend to complete payment and confirm booking
      const res = await apiFetch<SmartLinkData>(`/finance/razorpay/smart-links/${linkId}`, {
        method: "POST",
        body: { action: "complete" },
        skipAuthRedirect: true,
      });

      setLink(res || {
        ...link,
        status: "PAID",
        paidAt: new Date().toISOString(),
      });

      toast.success("Payment verified! Official reservation voucher updated.");

      if (link.bookingReference) {
        setTimeout(() => {
          router.push(`/booking/${link.bookingReference}?payment_status=completed`);
        }, 1200);
      }
    } catch {
      toast.error("Payment processing failed. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm text-neutral-600 font-medium">Loading secure payment portal...</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-200">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-950">Payment Link Unavailable</h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-md">
          {error || "This payment link has expired or has been cancelled by SRM Car Rentals."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline" className="text-xs rounded-xl border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50">
            <Link href="/">Return to Homepage</Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold rounded-xl shadow-md shadow-orange-500/20">
            <a href="tel:+919414164680">Contact SRM Support</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      {/* Top Header */}
      <header className="border-b border-neutral-200/90 bg-white/80 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600">
              <CarFront className="size-4" />
            </span>
            <span className="font-black text-neutral-950 text-base tracking-tight">
              SRM <span className="text-xs text-neutral-500 font-medium">CAR RENTALS</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <Lock className="size-3.5" /> 256-Bit SSL Encrypted
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {/* State A: PAYMENT COMPLETED RECEIPT */}
        {link.status === "PAID" ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4 animate-in zoom-in">
              <CheckCircle2 className="size-9" />
            </div>

            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Payment Confirmed
            </Badge>

            <h1 className="mt-2 text-2xl font-black text-neutral-950 tracking-tight">
              {formatInr(link.amount)} Paid Successfully
            </h1>
            <p className="mt-1 text-xs text-neutral-600">
              {link.purpose} • Received by SRM Car Rentals
            </p>

            <div className="my-6 rounded-2xl border border-neutral-200 bg-neutral-50/90 p-4 text-left text-xs space-y-2 text-neutral-600">
              <div className="flex justify-between">
                <span>Receipt Number</span>
                <span className="font-mono text-neutral-950 font-bold">{link.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Renter Name</span>
                <span className="font-semibold text-neutral-950">{link.customerName}</span>
              </div>
              {link.bookingReference && (
                <div className="flex justify-between">
                  <span>Booking Reference</span>
                  <span className="font-bold text-orange-600">{link.bookingReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Mode</span>
                <span className="text-neutral-950 font-medium">Razorpay Online / UPI</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time</span>
                <span className="text-neutral-950">{formatDate(link.paidAt || link.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 text-left flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">
                Official tax invoice and confirmation receipt has been generated. For security deposits, 100% refund is processed within 24 hours of vehicle return.
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 rounded-xl border-neutral-200 bg-white text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                <Printer className="size-3.5 mr-1.5" /> Print / Save Voucher
              </Button>
              {link.bookingReference ? (
                <Button
                  asChild
                  className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20"
                >
                  <Link href={`/booking/${link.bookingReference}?payment_status=completed`}>
                    View Booking Voucher →
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20"
                >
                  <Link href="/">Back to Fleet →</Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* State B: ACTIVE PAYMENT FORM */
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-500/20">
                  Official Payment Request
                </span>
                <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                  <Clock className="size-3 text-orange-500" /> Instant Hold
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-black text-neutral-950 uppercase tracking-tight">
                {link.purpose}
              </h1>
              <p className="mt-1 text-xs text-neutral-600">
                Issued for <strong className="text-neutral-950">{link.customerName}</strong>
                {link.bookingReference ? ` • Booking Ref: ${link.bookingReference}` : ""}
              </p>
            </div>

            {/* Total Payable Box */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/90 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total Payable</span>
                <div className="mt-1 text-3xl font-black text-orange-600">{formatInr(link.amount)}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-right">
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" /> 100% Refundable
                </span>
                <span className="text-[9px] text-neutral-500">upon inspection</span>
              </div>
            </div>

            {/* Payment Method Badges */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700">Supported Payment Methods:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-neutral-200 bg-white p-3 flex items-center gap-2.5 shadow-sm">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-black text-[10px] border border-orange-200">
                    UPI
                  </div>
                  <div>
                    <div className="font-bold text-neutral-950">UPI & QR</div>
                    <div className="text-[10px] text-neutral-500">GPay, PhonePe, Paytm</div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-3 flex items-center gap-2.5 shadow-sm">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-black text-[10px] border border-blue-200">
                    CARD
                  </div>
                  <div>
                    <div className="font-bold text-neutral-950">Cards & NetBanking</div>
                    <div className="text-[10px] text-neutral-500">Visa, Master, RuPay</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renter Details Summary */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-xs space-y-1.5 text-neutral-600">
              <div className="flex justify-between">
                <span>Renter Name:</span>
                <span className="font-bold text-neutral-950">{link.customerName}</span>
              </div>
              {link.customerPhone && (
                <div className="flex justify-between">
                  <span>WhatsApp Phone:</span>
                  <span className="font-semibold text-neutral-950">{link.customerPhone}</span>
                </div>
              )}
              {link.customerEmail && (
                <div className="flex justify-between">
                  <span>GST Email:</span>
                  <span className="font-semibold text-neutral-950">{link.customerEmail}</span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
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

              <p className="text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1 font-medium">
                <Lock className="size-3 text-emerald-600" /> Settle digitally with instantaneous confirmation.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
