"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Undo2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { FinanceNav } from "@/components/admin/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

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
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

interface SmartLink {
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
  updatedAt: string;
}

interface DiagnosticsData {
  enabled: boolean;
  mode: "test" | "live";
  hasKeyId: boolean;
  hasKeySecret: boolean;
  hasWebhookSecret: boolean;
  keyIdMasked: string | null;
  webhookUrl: string;
}

export default function RazorpayHubPage() {
  const [links, setLinks] = React.useState<SmartLink[]>([]);
  const [diagnostics, setDiagnostics] = React.useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("links");

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Create Smart Link Modal
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    purpose: "Booking Advance Payment",
    amount: "2500",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingReference: "",
    expireInMinutes: "1440", // 24 hours
    allowPartial: false,
    notifySms: true,
    notifyEmail: true,
  });

  // QR Code Modal
  const [qrOpen, setQrOpen] = React.useState(false);
  const [activeQrLink, setActiveQrLink] = React.useState<SmartLink | null>(null);

  // Dynamic Handover QR State
  const [handoverAmount, setHandoverAmount] = React.useState("3000");
  const [handoverPurpose, setHandoverPurpose] = React.useState("Refundable Security Deposit");
  const [handoverRef, setHandoverRef] = React.useState("");
  const [handoverCustomer, setHandoverCustomer] = React.useState("");

  // Instant Refund State
  const [refundPaymentId, setRefundPaymentId] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundReason, setRefundReason] = React.useState("Security Deposit Release - Vehicle Inspected Clean");
  const [refunding, setRefunding] = React.useState(false);

  // Copied State
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Load Data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [linksRes, diagRes] = await Promise.all([
        apiFetch<{ links: SmartLink[] }>(
          `/finance/razorpay/smart-links?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`,
          { skipAuthRedirect: true },
        ),
        apiFetch<DiagnosticsData>("/finance/razorpay/diagnostics", { skipAuthRedirect: true }),
      ]);
      setLinks(linksRes.links || []);
      setDiagnostics(diagRes);
    } catch {
      // graceful fallback
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Test Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        mode: string;
        keyId: string;
      }>("/finance/razorpay/diagnostics", { method: "POST" });

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to test Razorpay connection");
    } finally {
      setTestingConnection(false);
    }
  };

  // Create Smart Link
  const handleCreateSmartLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error("Please fill in customer name and a valid amount.");
      return;
    }

    setCreating(true);
    try {
      const newLink = await apiFetch<SmartLink>("/finance/razorpay/smart-links", {
        method: "POST",
        body: {
          ...form,
          amount: Number(form.amount),
          expireInMinutes: Number(form.expireInMinutes) || undefined,
        },
      });

      toast.success(`Smart Payment Link generated: ₹${newLink.amount}`);
      setCreateOpen(false);
      setForm({
        purpose: "Booking Advance Payment",
        amount: "2500",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        bookingReference: "",
        expireInMinutes: "1440",
        allowPartial: false,
        notifySms: true,
        notifyEmail: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create smart link");
    } finally {
      setCreating(false);
    }
  };

  // Copy Link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Payment Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // WhatsApp Share
  const handleWhatsAppShare = (link: SmartLink) => {
    const text = encodeURIComponent(
      `Namaste ${link.customerName},\n\nHere is your official secure payment link for SRM Car Rentals (${link.purpose}):\n\nPay ₹${link.amount} online: ${link.shortUrl}\n\n${
        link.bookingReference ? `Booking Ref: ${link.bookingReference}\n\n` : ""
      }UPI, Google Pay, PhonePe, Debit/Credit Card, and NetBanking accepted.\n\nSRM Car Rentals Udaipur\nPhone: +91 94141 64680`,
    );

    const phoneClean = (link.customerPhone || "").replace(/[^0-9]/g, "");
    const waUrl = phoneClean
      ? `https://wa.me/${phoneClean.startsWith("91") ? phoneClean : "91" + phoneClean}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(waUrl, "_blank");
  };

  // Sync Status
  const handleSyncStatus = async (id: string) => {
    try {
      const updated = await apiFetch<SmartLink>(`/finance/razorpay/smart-links/${id}`, {
        method: "POST",
        body: { action: "sync" },
      });
      toast.success(`Status updated: ${updated.status}`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to sync status");
    }
  };

  // Cancel Link
  const handleCancelLink = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this payment link?")) return;
    try {
      await apiFetch(`/finance/razorpay/smart-links/${id}`, { method: "DELETE" });
      toast.success("Payment link cancelled.");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel payment link");
    }
  };

  // Instant Refund Trigger
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPaymentId.trim() || !refundAmount || Number(refundAmount) <= 0) {
      toast.error("Please enter a valid Payment ID and refund amount.");
      return;
    }

    setRefunding(true);
    try {
      await apiFetch("/finance/refunds", {
        method: "POST",
        body: {
          paymentId: refundPaymentId.trim(),
          amount: Number(refundAmount),
          reason: refundReason,
        },
      });
      toast.success(`Refund of ₹${refundAmount} processed successfully!`);
      setRefundPaymentId("");
      setRefundAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate refund");
    } finally {
      setRefunding(false);
    }
  };

  // Metrics
  const totalCollected = links
    .filter((l) => l.status === "PAID")
    .reduce((sum, l) => sum + l.amount, 0);
  const activePending = links.filter((l) => l.status === "ISSUED").length;
  const paidCount = links.filter((l) => l.status === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Razorpay Hub & Smart Links</h1>
            {diagnostics && (
              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  diagnostics.mode === "live"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-orange-500/30 bg-orange-500/10 text-orange-500"
                }`}
              >
                {diagnostics.mode === "live" ? "Live Mode" : "Test Sandbox"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create instant Smart Payment Links, generate handover UPI QR codes, collect deposits, and manage refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="text-xs"
          >
            {testingConnection ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-1.5 size-3.5 text-emerald-500" />
            )}
            Test Connection
          </Button>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
          >
            <Plus className="mr-1.5 size-4" /> Create Smart Link
          </Button>
        </div>
      </div>

      <FinanceNav />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Links Created</span>
            <Zap className="size-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-black">{links.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Digital payment requests issued</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Collected</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-500">{formatInr(totalCollected)}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">{paidCount} successfully paid link{paidCount === 1 ? "" : "s"}</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Pending / Active Links</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-500">{activePending}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting customer payment</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Gateway Engine</span>
            <CreditCard className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-base font-bold truncate">
            {diagnostics?.hasKeyId ? (
              <span className="text-emerald-500 flex items-center gap-1.5">
                <Check className="size-4" /> Ready ({diagnostics.mode.toUpperCase()})
              </span>
            ) : (
              <span className="text-orange-500 flex items-center gap-1.5">
                <AlertCircle className="size-4" /> Setup Required
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <Link href="/admin/settings/payment" className="underline hover:text-foreground">
              Configure API keys →
            </Link>
          </p>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60 p-1">
          <TabsTrigger value="links" className="text-xs font-semibold">
            Smart Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs font-semibold">
            Dynamic UPI QR
          </TabsTrigger>
          <TabsTrigger value="refunds" className="text-xs font-semibold">
            Instant Refunds
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs font-semibold">
            Gateway Diagnostics
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SMART PAYMENT LINKS */}
        <TabsContent value="links" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer, phone, email, purpose, booking ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ISSUED">Active / Issued</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
                <RefreshCw className="size-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Purpose & Ref</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created / Expires</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                        <span className="mt-2 block">Loading smart links...</span>
                      </td>
                    </tr>
                  ) : links.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Zap className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-foreground">No Smart Payment Links Found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click &quot;Create Smart Link&quot; to issue your first payment request via Razorpay.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setCreateOpen(true)}
                          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        >
                          <Plus className="mr-1 size-3.5" /> Create Smart Link
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    links.map((link) => (
                      <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            {link.purpose}
                          </div>
                          {link.bookingReference ? (
                            <Link
                              href={`/admin/bookings?search=${link.bookingReference}`}
                              className="text-[11px] text-orange-500 hover:underline font-medium inline-block mt-0.5"
                            >
                              Booking: {link.bookingReference}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Ad-hoc collection</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold">{link.customerName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {link.customerPhone || link.customerEmail || "No contact specified"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-black text-sm">{formatInr(link.amount)}</div>
                          {link.allowPartial && (
                            <span className="text-[10px] text-muted-foreground">Partial allowed</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              link.status === "PAID"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : link.status === "ISSUED"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                : link.status === "CANCELLED"
                                ? "border-red-500/30 bg-red-500/10 text-red-500"
                                : "border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {link.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-muted-foreground">
                          <div>{formatDate(link.createdAt)}</div>
                          {link.expiresAt && link.status === "ISSUED" && (
                            <div className="text-[10px] text-amber-500">Exp: {formatDate(link.expiresAt)}</div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1">
                          {/* Copy Link */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copy Payment Link"
                            onClick={() => handleCopyLink(link.shortUrl, link.id)}
                            className="size-7"
                          >
                            {copiedId === link.id ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>

                          {/* WhatsApp Share */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Share on WhatsApp"
                            onClick={() => handleWhatsAppShare(link)}
                            className="size-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <MessageSquare className="size-3.5" />
                          </Button>

                          {/* Show QR Code */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Scannable QR Code"
                            onClick={() => {
                              setActiveQrLink(link);
                              setQrOpen(true);
                            }}
                            className="size-7 text-primary hover:bg-primary/10"
                          >
                            <QrCode className="size-3.5" />
                          </Button>

                          {/* Live Status Sync */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Sync live status from Razorpay"
                            onClick={() => handleSyncStatus(link.id)}
                            className="size-7"
                          >
                            <RefreshCw className="size-3.5" />
                          </Button>

                          {/* Cancel Link */}
                          {link.status === "ISSUED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cancel Payment Link"
                              onClick={() => handleCancelLink(link.id)}
                              className="size-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: DYNAMIC UPI QR GENERATOR */}
        <TabsContent value="qr" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-6 p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <QrCode className="size-5 text-orange-500" /> Handover UPI QR Generator
                </CardTitle>
                <CardDescription>
                  Generate an instant scannable UPI QR code for airport & doorstep delivery executives.
                  Customers scan with Google Pay, PhonePe, or Paytm to pay ₹0 upfront charges or refundable deposits.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Payment Purpose</Label>
                  <Select value={handoverPurpose} onValueChange={setHandoverPurpose}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Refundable Security Deposit">Refundable Security Deposit (₹3,000–₹5,000)</SelectItem>
                      <SelectItem value="Rental Trip Balance">Rental Trip Balance / Handover Settlement</SelectItem>
                      <SelectItem value="Extra Km / Extension Charges">Extra Km / Trip Extension</SelectItem>
                      <SelectItem value="Fuel / Fastag / Toll Dues">Fuel Shortage / Fastag Tolls</SelectItem>
                      <SelectItem value="Damage Settlement">Vehicle Inspection Settlement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={handoverAmount}
                      onChange={(e) => setHandoverAmount(e.target.value)}
                      className="mt-1 text-xs"
                      placeholder="e.g. 3000"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Booking Reference</Label>
                    <Input
                      value={handoverRef}
                      onChange={(e) => setHandoverRef(e.target.value)}
                      className="mt-1 text-xs uppercase"
                      placeholder="e.g. SRM-2026-X821"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Customer Name</Label>
                  <Input
                    value={handoverCustomer}
                    onChange={(e) => setHandoverCustomer(e.target.value)}
                    className="mt-1 text-xs"
                    placeholder="e.g. Rohan Sharma"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      toast.success("UPI QR Code updated for handover!");
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                  >
                    Refresh Scannable QR Code
                  </Button>
                </div>
              </div>
            </Card>

            {/* QR Visual Card */}
            <Card className="lg:col-span-6 p-6 flex flex-col items-center justify-center text-center bg-card/60">
              <div className="rounded-2xl border-2 border-orange-500/30 bg-white p-4 shadow-xl">
                {/* QR Code image generated dynamically using QuickChart QR API */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `upi://pay?pa=srmcarrentals@razorpay&pn=SRM%20Car%20Rentals&am=${handoverAmount}&cu=INR&tn=${encodeURIComponent(
                      `${handoverPurpose} ${handoverRef}`.trim(),
                    )}`,
                  )}`}
                  alt="Dynamic UPI QR Code"
                  className="size-48 rounded-lg"
                />
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {handoverPurpose}
                </span>
                <div className="mt-1 text-3xl font-black">{formatInr(Number(handoverAmount) || 0)}</div>
                {handoverCustomer && (
                  <p className="text-xs text-muted-foreground mt-0.5">Renter: {handoverCustomer}</p>
                )}
                {handoverRef && (
                  <p className="text-xs text-muted-foreground">Ref: {handoverRef}</p>
                )}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  <Printer className="size-3.5 mr-1.5" /> Print QR Card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `upi://pay?pa=srmcarrentals@razorpay&pn=SRM%20Car%20Rentals&am=${handoverAmount}&cu=INR&tn=${handoverPurpose}`,
                    );
                    toast.success("UPI Payment URI copied!");
                  }}
                  className="text-xs"
                >
                  <Copy className="size-3.5 mr-1.5" /> Copy UPI URI
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: INSTANT REFUNDS */}
        <TabsContent value="refunds" className="space-y-4">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Undo2 className="size-5 text-emerald-500" /> Instant Razorpay Refund Engine
              </CardTitle>
              <CardDescription>
                Initiate full or partial refunds for security deposits or cancelled bookings directly via Razorpay API.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleProcessRefund} className="space-y-4 max-w-xl">
              <div>
                <Label className="text-xs font-semibold">Razorpay Payment ID *</Label>
                <Input
                  required
                  placeholder="e.g. pay_Oih8K1L09m..."
                  value={refundPaymentId}
                  onChange={(e) => setRefundPaymentId(e.target.value)}
                  className="mt-1 text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Found on the Payments or Transactions tab under Provider Payment ID.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Refund Amount (₹) *</Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 3000"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Reason for Refund</Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security Deposit Release - Vehicle Inspected Clean">
                      Security Deposit Release (Vehicle Inspected Clean)
                    </SelectItem>
                    <SelectItem value="Customer Cancellation Policy Refund">
                      Customer Cancellation Policy Refund
                    </SelectItem>
                    <SelectItem value="Trip Adjustment / Early Handover Credit">
                      Trip Adjustment / Early Handover Credit
                    </SelectItem>
                    <SelectItem value="Duplicate / Accidental Payment Refund">
                      Duplicate / Accidental Payment Refund
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={refunding}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {refunding ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" /> Processing Refund...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Undo2 className="size-4" /> Issue Instant Refund
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 4: GATEWAY DIAGNOSTICS & WEBHOOKS */}
        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" /> Gateway Connectivity Status
              </CardTitle>
              <CardDescription className="mt-1">
                Live verification of your Razorpay API keys and environment configuration.
              </CardDescription>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-semibold text-xs">Active Environment</div>
                    <div className="text-[11px] text-muted-foreground">Test sandbox or live merchant account</div>
                  </div>
                  <Badge variant="outline" className="font-bold text-xs uppercase">
                    {diagnostics?.mode || "TEST"} MODE
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-semibold text-xs">Key ID Status</div>
                    <div className="text-[11px] text-muted-foreground">{diagnostics?.keyIdMasked || "Not configured"}</div>
                  </div>
                  {diagnostics?.hasKeyId ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10">
                      Missing
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-semibold text-xs">Key Secret Status</div>
                    <div className="text-[11px] text-muted-foreground">Required for signing orders & refunds</div>
                  </div>
                  {diagnostics?.hasKeySecret ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10">
                      Missing
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button asChild variant="outline" className="text-xs">
                  <Link href="/admin/settings/payment">Edit Keys in Settings →</Link>
                </Button>
                <Button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  {testingConnection ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Test Razorpay API
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="size-5 text-orange-500" /> Razorpay Webhook Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Receive live automated updates for payments, payment links, and refunds.
              </CardDescription>

              <div className="mt-5 space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Your Webhook Endpoint URL</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      readOnly
                      value={diagnostics?.webhookUrl || "https://srmcarrentals.com/api/v1/payments/razorpay/webhook"}
                      className="text-xs font-mono bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (diagnostics?.webhookUrl) {
                          navigator.clipboard.writeText(diagnostics.webhookUrl);
                          toast.success("Webhook URL copied to clipboard!");
                        }
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Paste this URL into Razorpay Dashboard &gt; Settings &gt; Webhooks.
                  </p>
                </div>

                <div className="rounded-lg border p-3 space-y-2 text-xs">
                  <div className="font-semibold text-foreground">Subscribed Webhook Events:</div>
                  <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      <code>payment_link.paid</code> - Automatically confirms booking & marks Smart Link as paid
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      <code>payment.captured</code> - Confirms instant reservation
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      <code>refund.processed</code> - Updates security deposit refund record
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs"
                >
                  <a href="https://dashboard.razorpay.com/#/access/webhooks" target="_blank" rel="noopener noreferrer">
                    Open Razorpay Webhook Settings <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE SMART LINK MODAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="size-5 text-orange-500" /> Create Smart Payment Link
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate a shareable payment link via Razorpay. Can be sent via WhatsApp, SMS, or QR code.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSmartLink} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Payment Purpose / Description *</Label>
              <Select
                value={form.purpose}
                onValueChange={(val) => setForm({ ...form, purpose: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Booking Advance Payment">Booking Advance Payment</SelectItem>
                  <SelectItem value="Refundable Security Deposit">Refundable Security Deposit</SelectItem>
                  <SelectItem value="Rental Trip Balance Settlement">Rental Trip Balance Settlement</SelectItem>
                  <SelectItem value="Trip Extension & Extra Km">Trip Extension & Extra Km</SelectItem>
                  <SelectItem value="Traffic Challan & Toll Recovery">Traffic Challan & Toll Recovery</SelectItem>
                  <SelectItem value="Fuel Shortage Charges">Fuel Shortage Charges</SelectItem>
                  <SelectItem value="Custom Car Rental Invoice">Custom Car Rental Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Amount (₹) *</Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 3500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Expiry Duration</Label>
                <Select
                  value={form.expireInMinutes}
                  onValueChange={(val) => setForm({ ...form, expireInMinutes: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes (Instant Hold)</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                    <SelectItem value="1440">24 Hours (1 Day)</SelectItem>
                    <SelectItem value="4320">3 Days</SelectItem>
                    <SelectItem value="10080">7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 border-t pt-3">
              <div className="font-semibold text-xs">Customer Details</div>

              <div>
                <Label className="text-xs text-muted-foreground">Customer Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">WhatsApp / Phone</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="rohan@example.com"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Associated Booking Reference (Optional)</Label>
                <Input
                  placeholder="e.g. SRM-2026-X821"
                  value={form.bookingReference}
                  onChange={(e) => setForm({ ...form, bookingReference: e.target.value.toUpperCase() })}
                  className="mt-1 text-xs uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold">Razorpay Native SMS/Email Alerts</span>
                <p className="text-[11px] text-muted-foreground">Send payment link notifications automatically</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notifySms}
                    onChange={(e) => setForm({ ...form, notifySms: e.target.checked })}
                    className="accent-orange-500"
                  />
                  <span>SMS</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notifyEmail}
                    onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })}
                    className="accent-orange-500"
                  />
                  <span>Email</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                {creating ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Generating Link...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-3.5" /> Generate & Share Link
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR CODE POPUP MODAL */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-center gap-2">
              <QrCode className="size-5 text-orange-500" /> Scannable Payment QR Code
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customer can scan with Google Pay, PhonePe, Paytm, or BHIM UPI
            </DialogDescription>
          </DialogHeader>

          {activeQrLink && (
            <div className="flex flex-col items-center py-3">
              <div className="rounded-2xl border-2 border-orange-500/30 bg-white p-3 shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    activeQrLink.shortUrl,
                  )}`}
                  alt="Payment QR"
                  className="size-44"
                />
              </div>

              <div className="mt-3">
                <div className="font-bold text-sm text-foreground">{activeQrLink.purpose}</div>
                <div className="text-2xl font-black text-orange-500 mt-0.5">
                  {formatInr(activeQrLink.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{activeQrLink.customerName}</p>
                {activeQrLink.bookingReference && (
                  <p className="text-[11px] text-muted-foreground">Booking: {activeQrLink.bookingReference}</p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(activeQrLink.shortUrl, activeQrLink.id)}
                  className="flex-1 text-xs"
                >
                  <Copy className="size-3.5 mr-1.5" /> Copy Link
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleWhatsAppShare(activeQrLink)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <MessageSquare className="size-3.5 mr-1.5" /> WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
