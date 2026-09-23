"use client";

import * as React from "react";
import {
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { FinanceNav } from "@/components/admin/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentItem {
  id: string;
  provider: string;
  paymentType: string;
  amount: number | string;
  currency: string;
  status: string;
  providerPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    customer: { firstName: string; lastName: string; phone: string; email: string };
    car: { name: string };
  };
}

export default function FinancePaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Manual payment modal state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [manualForm, setManualForm] = React.useState({
    bookingId: "",
    amount: "",
    provider: "CASH",
    paymentType: "FULL",
    providerPaymentId: "",
  });

  const fetchPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/finance/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load payments");
      const json = await res.json();
      setPayments(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.bookingId || !manualForm.amount) {
      toast.error("Booking ID and Amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          amount: parseFloat(manualForm.amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to record payment");
      }
      toast.success("Payment recorded successfully");
      setIsDialogOpen(false);
      setManualForm({
        bookingId: "",
        amount: "",
        provider: "CASH",
        paymentType: "FULL",
        providerPaymentId: "",
      });
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "REFUNDED":
        return <Badge variant="info">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor transactions, customer invoices, revenue settlements, and tax compliance.
        </p>
      </div>

      <FinanceNav />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Inflow Records
            </CardTitle>
            <CreditCard className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed transactions</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Settlement Providers
            </CardTitle>
            <ArrowUpRight className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Razorpay / Cash</div>
            <p className="text-xs text-muted-foreground mt-1">Active payment channels</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Payment Health
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Settlement completion rate</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Auto Reconciliation
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Instant</div>
            <p className="text-xs text-muted-foreground mt-1">Webhooks synchronized</p>
          </CardContent>
        </Card>
      </div>

      {/* Action / Filter bar */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Payment Transactions</CardTitle>
            <CardDescription>
              Real-time payment journal detailing payment channels, customer names, and booking links.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPayments()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Manual Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="bookingId">Booking ID or Reference</Label>
                    <Input
                      id="bookingId"
                      placeholder="e.g. cly..."
                      value={manualForm.bookingId}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, bookingId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g. 5000"
                      value={manualForm.amount}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Provider</Label>
                      <Select
                        value={manualForm.provider}
                        onValueChange={(val) =>
                          setManualForm({ ...manualForm, provider: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="POS">POS / Card</SelectItem>
                          <SelectItem value="UPI">UPI Direct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Payment Type</Label>
                      <Select
                        value={manualForm.paymentType}
                        onValueChange={(val) =>
                          setManualForm({ ...manualForm, paymentType: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL">Full Payment</SelectItem>
                          <SelectItem value="ADVANCE">Advance Deposit</SelectItem>
                          <SelectItem value="SECURITY_DEPOSIT">Security Deposit</SelectItem>
                          <SelectItem value="REMAINING">Balance Remaining</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="providerPaymentId">Reference / Transaction Number</Label>
                    <Input
                      id="providerPaymentId"
                      placeholder="Optional receipt / txn reference"
                      value={manualForm.providerPaymentId}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, providerPaymentId: e.target.value })
                      }
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : "Record Payment"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search reference, customer, txn..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <a
                          href={`/admin/bookings/${p.booking?.id}`}
                          className="text-primary hover:underline"
                        >
                          {p.booking?.bookingReference || p.id.slice(0, 8)}
                        </a>
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {p.booking?.car?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {p.booking?.customer?.firstName} {p.booking?.customer?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.booking?.customer?.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {p.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{p.paymentType.toLowerCase()}</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {p.providerPaymentId || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div>
              Showing page {page} of {totalPages} ({total} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
